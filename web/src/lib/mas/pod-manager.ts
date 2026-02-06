/**
 * MAS Pod/Deployment Management Operations
 * K8s operations for listing pods, deployments, scaling, and log streaming.
 */

import * as k8s from '@kubernetes/client-node';
import { Writable } from 'stream';
import type { MasK8sClient } from './k8s-client';
import {
  type MasManagedPodInfo,
  type MasDeploymentInfo,
  type PodLogOptions,
  isMasResource,
  formatAge,
  PREVIOUS_REPLICAS_ANNOTATION,
} from './pod-manager-types';

/**
 * Middleware options to override Content-Type for PATCH operations.
 * @kubernetes/client-node v1.4.0 defaults to application/json-patch+json,
 * but we use strategic merge patch (partial object) format.
 */
const MERGE_PATCH_OPTIONS = {
  middleware: [{
    pre: async (context: { setHeaderParam: (key: string, value: string) => void }) => {
      context.setHeaderParam('Content-Type', 'application/strategic-merge-patch+json');
      return context;
    },
    post: async (response: unknown) => response,
  }],
};

// =============================================================================
// Pod Operations
// =============================================================================

/**
 * List all MAS Manage pods in the given namespace.
 * Filters to only known MAS prefixes derived from podPrefix.
 */
export async function listMasPods(
  client: MasK8sClient,
  namespace: string,
  podPrefix?: string
): Promise<MasManagedPodInfo[]> {
  const response = await client.coreApi.listNamespacedPod({ namespace });
  const pods = response.items;

  return pods
    .filter((pod) => {
      const name = pod.metadata?.name ?? '';
      return isMasResource(name, podPrefix);
    })
    .map((pod) => {
      const containerStatuses = pod.status?.containerStatuses ?? [];
      const totalRestarts = containerStatuses.reduce(
        (sum, cs) => sum + (cs.restartCount ?? 0),
        0
      );
      const allReady = containerStatuses.length > 0 &&
        containerStatuses.every((cs) => cs.ready);

      return {
        name: pod.metadata?.name ?? '',
        namespace: pod.metadata?.namespace ?? namespace,
        status: pod.status?.phase ?? 'Unknown',
        ready: allReady,
        restarts: totalRestarts,
        age: formatAge(
          pod.metadata?.creationTimestamp
            ? new Date(pod.metadata.creationTimestamp as unknown as string).toISOString()
            : new Date().toISOString()
        ),
        createdAt: pod.metadata?.creationTimestamp
          ? new Date(pod.metadata.creationTimestamp as unknown as string).toISOString()
          : new Date().toISOString(),
        containers: containerStatuses.map((cs) => ({
          name: cs.name,
          ready: cs.ready ?? false,
          restartCount: cs.restartCount ?? 0,
          state: cs.state
            ? Object.keys(cs.state)[0] ?? 'unknown'
            : 'unknown',
        })),
        labels: (pod.metadata?.labels as Record<string, string>) ?? {},
      };
    });
}

// =============================================================================
// Deployment Operations
// =============================================================================

/**
 * List all MAS Manage deployments in the given namespace.
 */
export async function listMasDeployments(
  client: MasK8sClient,
  namespace: string,
  podPrefix?: string
): Promise<MasDeploymentInfo[]> {
  const response = await client.appsApi.listNamespacedDeployment({ namespace });
  const deployments = response.items;

  return deployments
    .filter((dep) => {
      const name = dep.metadata?.name ?? '';
      return isMasResource(name, podPrefix);
    })
    .map((dep) => {
      const annotations = (dep.metadata?.annotations as Record<string, string>) ?? {};
      const prevAnnotation = annotations[PREVIOUS_REPLICAS_ANNOTATION];

      return {
        name: dep.metadata?.name ?? '',
        namespace: dep.metadata?.namespace ?? namespace,
        replicas: dep.spec?.replicas ?? 0,
        readyReplicas: dep.status?.readyReplicas ?? 0,
        availableReplicas: dep.status?.availableReplicas ?? 0,
        age: formatAge(
          dep.metadata?.creationTimestamp
            ? new Date(dep.metadata.creationTimestamp as unknown as string).toISOString()
            : new Date().toISOString()
        ),
        createdAt: dep.metadata?.creationTimestamp
          ? new Date(dep.metadata.creationTimestamp as unknown as string).toISOString()
          : new Date().toISOString(),
        previousReplicas: prevAnnotation ? parseInt(prevAnnotation, 10) : undefined,
      };
    });
}

/**
 * Scale a MAS deployment to the given replica count.
 * When scaling to 0, saves the current replica count in an annotation.
 * Rejects non-MAS deployment names for security.
 */
export async function scaleDeployment(
  client: MasK8sClient,
  namespace: string,
  name: string,
  replicas: number,
  podPrefix?: string
): Promise<{ previous: number; current: number }> {
  if (!isMasResource(name, podPrefix)) {
    throw new Error(`"${name}" is not a recognized MAS deployment.`);
  }

  // Read current state
  const deployment = await client.appsApi.readNamespacedDeployment({
    name,
    namespace,
  });
  const currentReplicas = deployment.spec?.replicas ?? 0;

  // When scaling to 0, save previous replicas in annotation
  if (replicas === 0 && currentReplicas > 0) {
    await client.appsApi.patchNamespacedDeployment({
      name,
      namespace,
      body: {
        metadata: {
          annotations: {
            [PREVIOUS_REPLICAS_ANNOTATION]: String(currentReplicas),
          },
        },
      },
    }, MERGE_PATCH_OPTIONS);
  }

  // Patch the scale
  await client.appsApi.patchNamespacedDeploymentScale({
    name,
    namespace,
    body: { spec: { replicas } },
  }, MERGE_PATCH_OPTIONS);

  return { previous: currentReplicas, current: replicas };
}

// =============================================================================
// Log Streaming
// =============================================================================

/**
 * Stream pod logs via k8s.Log.
 * Returns an AbortController to stop the stream.
 */
export async function streamPodLogs(
  client: MasK8sClient,
  namespace: string,
  podName: string,
  options: PodLogOptions,
  onLine: (line: string) => void
): Promise<AbortController> {
  const log = new k8s.Log(client.kubeConfig);

  const stream = new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      const text = chunk.toString();
      // Split by newlines and emit each line
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.length > 0) {
          onLine(line);
        }
      }
      callback();
    },
  });

  const abortController = await log.log(
    namespace,
    podName,
    options.container ?? '',
    stream,
    {
      follow: options.follow ?? true,
      tailLines: options.tailLines ?? 100,
      timestamps: options.timestamps ?? true,
      previous: options.previous ?? false,
    }
  );

  return abortController;
}
