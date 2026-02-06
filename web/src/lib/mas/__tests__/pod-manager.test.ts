/**
 * Tests for MAS pod/deployment management operations
 * All K8s calls are mocked.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock @kubernetes/client-node before imports
vi.mock('@kubernetes/client-node', () => {
  const Log = vi.fn();
  return {
    Log,
    KubeConfig: vi.fn(),
    CoreV1Api: vi.fn(),
    AppsV1Api: vi.fn(),
  };
});

import type { MasK8sClient } from '../k8s-client';
import { listMasPods, listMasDeployments, scaleDeployment } from '../pod-manager';
import { PREVIOUS_REPLICAS_ANNOTATION } from '../pod-manager-types';

function createMockClient(): MasK8sClient {
  return {
    kubeConfig: {} as MasK8sClient['kubeConfig'],
    coreApi: {
      listNamespacedPod: vi.fn(),
    } as unknown as MasK8sClient['coreApi'],
    appsApi: {
      listNamespacedDeployment: vi.fn(),
      readNamespacedDeployment: vi.fn(),
      patchNamespacedDeployment: vi.fn(),
      patchNamespacedDeploymentScale: vi.fn(),
    } as unknown as MasK8sClient['appsApi'],
  };
}

describe('listMasPods', () => {
  let client: MasK8sClient;

  beforeEach(() => {
    client = createMockClient();
  });

  it('should list only MAS pods filtered by prefixes', async () => {
    const mockPods = {
      items: [
        {
          metadata: {
            name: 'mas-masw-manage-all-abc123',
            namespace: 'mas-ns',
            creationTimestamp: new Date('2026-02-04T00:00:00Z'),
            labels: { app: 'maximo' },
          },
          status: {
            phase: 'Running',
            containerStatuses: [
              {
                name: 'maximo',
                ready: true,
                restartCount: 0,
                state: { running: { startedAt: '2026-02-04T00:00:00Z' } },
              },
            ],
          },
        },
        {
          metadata: {
            name: 'nginx-pod-xyz',
            namespace: 'mas-ns',
            creationTimestamp: new Date('2026-02-04T00:00:00Z'),
            labels: {},
          },
          status: { phase: 'Running', containerStatuses: [] },
        },
        {
          metadata: {
            name: 'mas-masw-manage-ui-def456',
            namespace: 'mas-ns',
            creationTimestamp: new Date('2026-02-05T00:00:00Z'),
            labels: { app: 'maximo-ui' },
          },
          status: {
            phase: 'Pending',
            containerStatuses: [
              {
                name: 'ui',
                ready: false,
                restartCount: 2,
                state: { waiting: { reason: 'CrashLoopBackOff' } },
              },
            ],
          },
        },
      ],
    };

    (client.coreApi.listNamespacedPod as ReturnType<typeof vi.fn>).mockResolvedValue(mockPods);

    const pods = await listMasPods(client, 'mas-ns');

    expect(pods).toHaveLength(2);
    expect(pods[0].name).toBe('mas-masw-manage-all-abc123');
    expect(pods[0].status).toBe('Running');
    expect(pods[0].ready).toBe(true);
    expect(pods[0].restarts).toBe(0);
    expect(pods[0].containers).toHaveLength(1);
    expect(pods[0].containers[0].name).toBe('maximo');
    expect(pods[0].containers[0].state).toBe('running');

    expect(pods[1].name).toBe('mas-masw-manage-ui-def456');
    expect(pods[1].status).toBe('Pending');
    expect(pods[1].ready).toBe(false);
    expect(pods[1].restarts).toBe(2);
    expect(pods[1].containers[0].state).toBe('waiting');
  });

  it('should return empty array when no MAS pods found', async () => {
    (client.coreApi.listNamespacedPod as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          metadata: { name: 'other-pod', namespace: 'mas-ns', creationTimestamp: new Date(), labels: {} },
          status: { phase: 'Running', containerStatuses: [] },
        },
      ],
    });

    const pods = await listMasPods(client, 'mas-ns');
    expect(pods).toHaveLength(0);
  });
});

describe('listMasDeployments', () => {
  let client: MasK8sClient;

  beforeEach(() => {
    client = createMockClient();
  });

  it('should list only MAS deployments filtered by prefixes', async () => {
    const mockDeployments = {
      items: [
        {
          metadata: {
            name: 'mas-masw-manage-maxinst-deploy',
            namespace: 'mas-ns',
            creationTimestamp: new Date('2026-02-01T00:00:00Z'),
            annotations: {},
          },
          spec: { replicas: 1 },
          status: { readyReplicas: 1, availableReplicas: 1 },
        },
        {
          metadata: {
            name: 'unrelated-deployment',
            namespace: 'mas-ns',
            creationTimestamp: new Date(),
            annotations: {},
          },
          spec: { replicas: 3 },
          status: { readyReplicas: 3, availableReplicas: 3 },
        },
        {
          metadata: {
            name: 'mas-masw-manage-all-deploy',
            namespace: 'mas-ns',
            creationTimestamp: new Date('2026-01-15T00:00:00Z'),
            annotations: { [PREVIOUS_REPLICAS_ANNOTATION]: '2' },
          },
          spec: { replicas: 0 },
          status: { readyReplicas: 0, availableReplicas: 0 },
        },
      ],
    };

    (client.appsApi.listNamespacedDeployment as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeployments);

    const deployments = await listMasDeployments(client, 'mas-ns');

    expect(deployments).toHaveLength(2);
    expect(deployments[0].name).toBe('mas-masw-manage-maxinst-deploy');
    expect(deployments[0].replicas).toBe(1);
    expect(deployments[0].readyReplicas).toBe(1);
    expect(deployments[0].previousReplicas).toBeUndefined();

    expect(deployments[1].name).toBe('mas-masw-manage-all-deploy');
    expect(deployments[1].replicas).toBe(0);
    expect(deployments[1].previousReplicas).toBe(2);
  });
});

describe('scaleDeployment', () => {
  let client: MasK8sClient;

  beforeEach(() => {
    client = createMockClient();
  });

  it('should save previous replicas annotation when scaling to 0', async () => {
    (client.appsApi.readNamespacedDeployment as ReturnType<typeof vi.fn>).mockResolvedValue({
      metadata: { name: 'mas-masw-manage-all-deploy', namespace: 'mas-ns', annotations: {} },
      spec: { replicas: 2 },
    });
    (client.appsApi.patchNamespacedDeployment as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (client.appsApi.patchNamespacedDeploymentScale as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await scaleDeployment(client, 'mas-ns', 'mas-masw-manage-all-deploy', 0);

    expect(result.previous).toBe(2);
    expect(result.current).toBe(0);

    // Should have patched annotation with merge patch options
    expect(client.appsApi.patchNamespacedDeployment).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'mas-masw-manage-all-deploy',
        namespace: 'mas-ns',
        body: {
          metadata: {
            annotations: { [PREVIOUS_REPLICAS_ANNOTATION]: '2' },
          },
        },
      }),
      // Second arg: options with middleware to set Content-Type
      expect.objectContaining({
        middleware: expect.arrayContaining([
          expect.objectContaining({ pre: expect.any(Function) }),
        ]),
      })
    );

    // Should have scaled with merge patch options
    expect(client.appsApi.patchNamespacedDeploymentScale).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'mas-masw-manage-all-deploy',
        namespace: 'mas-ns',
        body: { spec: { replicas: 0 } },
      }),
      expect.objectContaining({
        middleware: expect.arrayContaining([
          expect.objectContaining({ pre: expect.any(Function) }),
        ]),
      })
    );
  });

  it('should scale to requested replicas when not scaling to 0', async () => {
    (client.appsApi.readNamespacedDeployment as ReturnType<typeof vi.fn>).mockResolvedValue({
      metadata: { name: 'mas-masw-manage-all-deploy', namespace: 'mas-ns', annotations: {} },
      spec: { replicas: 1 },
    });
    (client.appsApi.patchNamespacedDeploymentScale as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await scaleDeployment(client, 'mas-ns', 'mas-masw-manage-all-deploy', 3);

    expect(result.previous).toBe(1);
    expect(result.current).toBe(3);

    // Should NOT have patched annotations (not scaling to 0)
    expect(client.appsApi.patchNamespacedDeployment).not.toHaveBeenCalled();
  });

  it('should reject non-MAS deployment names', async () => {
    await expect(
      scaleDeployment(client, 'mas-ns', 'nginx-deployment', 0)
    ).rejects.toThrow('not a recognized MAS');
  });

  it('should scale deployment with exact base name (no hash suffix)', async () => {
    // Real MAS deployment names are like "mas-masw-manage-all" without hash
    (client.appsApi.readNamespacedDeployment as ReturnType<typeof vi.fn>).mockResolvedValue({
      metadata: { name: 'mas-masw-manage-all', namespace: 'mas-ns', annotations: {} },
      spec: { replicas: 1 },
    });
    (client.appsApi.patchNamespacedDeployment as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (client.appsApi.patchNamespacedDeploymentScale as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await scaleDeployment(client, 'mas-ns', 'mas-masw-manage-all', 0);

    expect(result.previous).toBe(1);
    expect(result.current).toBe(0);
    expect(client.appsApi.patchNamespacedDeploymentScale).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'mas-masw-manage-all',
        body: { spec: { replicas: 0 } },
      }),
      expect.objectContaining({ middleware: expect.any(Array) })
    );
  });

  it('should scale deployment with custom podPrefix and exact base name', async () => {
    // User has podPrefix "mas-masw-maxinst-", deployment name "mas-masw-all"
    (client.appsApi.readNamespacedDeployment as ReturnType<typeof vi.fn>).mockResolvedValue({
      metadata: { name: 'mas-masw-all', namespace: 'mas-ns', annotations: {} },
      spec: { replicas: 2 },
    });
    (client.appsApi.patchNamespacedDeployment as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (client.appsApi.patchNamespacedDeploymentScale as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await scaleDeployment(client, 'mas-ns', 'mas-masw-all', 0, 'mas-masw-maxinst-');

    expect(result.previous).toBe(2);
    expect(result.current).toBe(0);
  });
});
