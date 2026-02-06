/**
 * MAS K8s Client Module
 * Handles communication with OCP/Kubernetes for DBC import
 */

import * as k8s from '@kubernetes/client-node';
import { Writable } from 'stream';
import type {
  MasK8sConnectionOptions,
  MasPodInfo,
  MasTestConnectionResult,
} from './types';

/**
 * Create a proper Writable stream that collects data
 */
function createCollectorStream(
  collector: string[],
  onData?: (data: string) => void
): Writable {
  return new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      const str = chunk.toString();
      collector.push(str);
      if (onData) onData(str);
      callback();
    },
  });
}

/**
 * K8s client wrapper with configuration
 */
export interface MasK8sClient {
  kubeConfig: k8s.KubeConfig;
  coreApi: k8s.CoreV1Api;
  appsApi: k8s.AppsV1Api;
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
  const appsApi = kc.makeApiClient(k8s.AppsV1Api);

  return {
    kubeConfig: kc,
    coreApi,
    appsApi,
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

    const stdoutStream = createCollectorStream(stdout);
    const stderrStream = createCollectorStream(stderr);

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
 * Exec options
 */
export interface ExecOptions {
  /** Timeout in milliseconds (default: 300000 = 5 minutes) */
  timeout?: number;
}

/** Default exec timeout: 5 minutes */
const DEFAULT_EXEC_TIMEOUT = 300000;

/**
 * Execute a command in a pod and stream output
 */
export async function execInPod(
  client: MasK8sClient,
  podInfo: MasPodInfo,
  command: string[],
  onOutput: (output: string) => void,
  options?: ExecOptions
): Promise<ExecResult> {
  const exec = new k8s.Exec(client.kubeConfig);
  const timeout = options?.timeout ?? DEFAULT_EXEC_TIMEOUT;

  return new Promise((resolve) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    let isResolved = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const resolveOnce = (result: ExecResult) => {
      if (isResolved) return;
      isResolved = true;
      if (timeoutId) clearTimeout(timeoutId);
      resolve(result);
    };

    // Set timeout
    timeoutId = setTimeout(() => {
      resolveOnce({
        success: false,
        output: stdout.join(''),
        error: `Command timed out after ${timeout / 1000} seconds`,
      });
    }, timeout);

    const stdoutStream = createCollectorStream(stdout, onOutput);
    const stderrStream = createCollectorStream(stderr, onOutput);

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
            resolveOnce({
              success: true,
              output: stdout.join(''),
            });
          } else {
            resolveOnce({
              success: false,
              output: stdout.join(''),
              error: stderr.join('') || status.message || 'Command execution failed',
            });
          }
        }
      )
      .catch((error) => {
        resolveOnce({
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
 * @param client K8s client
 * @param podInfo Pod information
 * @param dbcFilename DBC filename (e.g., "myfile.dbc")
 * @param dbcUploadPath Path where the DBC file was uploaded (not used in command, just for reference)
 * @param dbcScriptPath Path where runscriptfile.sh is located (e.g., "/opt/IBM/SMP/maximo/tools/maximo/internal")
 * @param onOutput Callback for output streaming
 * @param options Execution options (timeout, etc.)
 */
export async function runDbcScript(
  client: MasK8sClient,
  podInfo: MasPodInfo,
  dbcFilename: string,
  _dbcUploadPath: string,
  dbcScriptPath: string,
  onOutput: (output: string) => void,
  options?: ExecOptions
): Promise<ExecResult> {
  // Remove .dbc extension from filename
  // e.g., "myfile.dbc" -> "myfile"
  const scriptName = dbcFilename.replace(/\.dbc$/i, '');

  // Change to the script directory and run runscriptfile.sh
  // Syntax: ./runscriptfile.sh -f<scriptname> (no path, no .dbc extension)
  const command = [
    'sh',
    '-c',
    `cd ${dbcScriptPath} && ./runscriptfile.sh -f${scriptName}`,
  ];

  return execInPod(client, podInfo, command, onOutput, options);
}
