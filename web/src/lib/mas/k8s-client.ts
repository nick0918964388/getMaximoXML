/**
 * MAS K8s Client Module
 * Handles communication with OCP/Kubernetes for DBC import
 */

import * as k8s from '@kubernetes/client-node';
import type { Writable } from 'stream';
import type {
  MasK8sConnectionOptions,
  MasPodInfo,
  MasTestConnectionResult,
} from './types';

/**
 * K8s client wrapper with configuration
 */
export interface MasK8sClient {
  kubeConfig: k8s.KubeConfig;
  coreApi: k8s.CoreV1Api;
}

/**
 * Exec result from pod command execution
 */
export interface ExecResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Create a K8s client with the provided connection options
 */
export function createK8sClient(options: MasK8sConnectionOptions): MasK8sClient {
  const kc = new k8s.KubeConfig();

  kc.loadFromOptions({
    clusters: [
      {
        name: 'ocp-cluster',
        server: options.clusterUrl,
        skipTLSVerify: options.skipTLSVerify ?? true,
      },
    ],
    users: [
      {
        name: 'sa-user',
        token: options.token,
      },
    ],
    contexts: [
      {
        name: 'ocp-context',
        cluster: 'ocp-cluster',
        user: 'sa-user',
        namespace: options.namespace,
      },
    ],
    currentContext: 'ocp-context',
  });

  const coreApi = kc.makeApiClient(k8s.CoreV1Api);

  return {
    kubeConfig: kc,
    coreApi,
  };
}

/**
 * Find the running mxinst pod by name prefix
 * @throws Error if no running pod is found
 */
export async function findMxinstPod(
  client: MasK8sClient,
  namespace: string,
  podPrefix: string
): Promise<MasPodInfo> {
  const response = await client.coreApi.listNamespacedPod({ namespace });
  const pods = response.items;

  const mxinstPod = pods.find(
    (pod) =>
      pod.metadata?.name?.startsWith(podPrefix) &&
      pod.status?.phase === 'Running'
  );

  if (!mxinstPod || !mxinstPod.metadata?.name) {
    throw new Error(
      `No running mxinst pod found with prefix "${podPrefix}" in namespace "${namespace}"`
    );
  }

  const containerName =
    mxinstPod.spec?.containers?.[0]?.name || 'maxinst';

  return {
    name: mxinstPod.metadata.name,
    namespace: mxinstPod.metadata.namespace || namespace,
    status: mxinstPod.status?.phase || 'Unknown',
    containerName,
  };
}

/**
 * Copy a file to a pod
 * Note: This uses the Cp class from @kubernetes/client-node
 */
export async function copyFileToPod(
  client: MasK8sClient,
  podInfo: MasPodInfo,
  localPath: string,
  remotePath: string
): Promise<void> {
  const cp = new k8s.Cp(client.kubeConfig);

  await cp.cpToPod(
    podInfo.namespace,
    podInfo.name,
    podInfo.containerName,
    localPath,
    remotePath
  );
}

/**
 * Copy file content (as string) to a pod
 * Creates a temporary file and copies it
 */
export async function copyContentToPod(
  client: MasK8sClient,
  podInfo: MasPodInfo,
  content: string,
  remotePath: string
): Promise<void> {
  // For server-side execution, we'll use exec with echo/cat to write the file
  // This avoids needing to create local temp files
  const exec = new k8s.Exec(client.kubeConfig);

  // Use base64 encoding to safely transfer the content
  const base64Content = Buffer.from(content, 'utf-8').toString('base64');

  return new Promise((resolve, reject) => {
    // Use sh -c to pipe base64 decode to the target file
    const command = ['sh', '-c', `echo '${base64Content}' | base64 -d > ${remotePath}`];

    const stdout: string[] = [];
    const stderr: string[] = [];

    const stdoutStream: Writable = {
      write: (data: string | Buffer) => {
        stdout.push(data.toString());
        return true;
      },
    } as Writable;

    const stderrStream: Writable = {
      write: (data: string | Buffer) => {
        stderr.push(data.toString());
        return true;
      },
    } as Writable;

    exec
      .exec(
        podInfo.namespace,
        podInfo.name,
        podInfo.containerName,
        command,
        stdoutStream,
        stderrStream,
        null,
        false,
        (status) => {
          if (status.status === 'Success') {
            resolve();
          } else {
            reject(new Error(stderr.join('') || status.message || 'Failed to copy content to pod'));
          }
        }
      )
      .catch(reject);
  });
}

/**
 * Execute a command in a pod and stream output
 */
export async function execInPod(
  client: MasK8sClient,
  podInfo: MasPodInfo,
  command: string[],
  onOutput: (output: string) => void
): Promise<ExecResult> {
  const exec = new k8s.Exec(client.kubeConfig);

  return new Promise((resolve) => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const stdoutStream: Writable = {
      write: (data: string | Buffer) => {
        const str = data.toString();
        stdout.push(str);
        onOutput(str);
        return true;
      },
    } as Writable;

    const stderrStream: Writable = {
      write: (data: string | Buffer) => {
        const str = data.toString();
        stderr.push(str);
        onOutput(str);
        return true;
      },
    } as Writable;

    exec
      .exec(
        podInfo.namespace,
        podInfo.name,
        podInfo.containerName,
        command,
        stdoutStream,
        stderrStream,
        null,
        false,
        (status) => {
          if (status.status === 'Success') {
            resolve({
              success: true,
              output: stdout.join(''),
            });
          } else {
            resolve({
              success: false,
              output: stdout.join(''),
              error: stderr.join('') || status.message || 'Command execution failed',
            });
          }
        }
      )
      .catch((error) => {
        resolve({
          success: false,
          output: stdout.join(''),
          error: error.message || 'Failed to execute command',
        });
      });
  });
}

/**
 * Test connection to the OCP cluster and find mxinst pod
 */
export async function testConnection(
  client: MasK8sClient,
  namespace: string,
  podPrefix: string
): Promise<MasTestConnectionResult> {
  try {
    const podInfo = await findMxinstPod(client, namespace, podPrefix);

    return {
      success: true,
      message: `Connected successfully! Found pod: ${podInfo.name}`,
      podName: podInfo.name,
      podStatus: podInfo.status,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute runscriptfile.sh with the DBC file
 */
export async function runDbcScript(
  client: MasK8sClient,
  podInfo: MasPodInfo,
  dbcFilename: string,
  dbcBasePath: string,
  onOutput: (output: string) => void
): Promise<ExecResult> {
  // Change to the DBC tools directory and run the script
  const command = [
    'sh',
    '-c',
    `cd ${dbcBasePath} && ./runscriptfile.sh -f${dbcFilename}`,
  ];

  return execInPod(client, podInfo, command, onOutput);
}
