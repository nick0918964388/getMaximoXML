import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import type { MasK8sConnectionOptions, MasPodInfo } from '../types';

// Mock the @kubernetes/client-node module
vi.mock('@kubernetes/client-node', () => {
  const mockKubeConfig = {
    loadFromOptions: vi.fn(),
    makeApiClient: vi.fn(),
  };

  const mockCoreV1Api = {
    listNamespacedPod: vi.fn(),
  };

  const mockExec = {
    exec: vi.fn(),
  };

  const mockCp = {
    cpToPod: vi.fn(),
  };

  return {
    KubeConfig: vi.fn(() => mockKubeConfig),
    CoreV1Api: vi.fn(() => mockCoreV1Api),
    Exec: vi.fn(() => mockExec),
    Cp: vi.fn(() => mockCp),
    __mockKubeConfig: mockKubeConfig,
    __mockCoreV1Api: mockCoreV1Api,
    __mockExec: mockExec,
    __mockCp: mockCp,
  };
});

// Import after mocking
import * as k8s from '@kubernetes/client-node';

const mockKubeConfig = (k8s as unknown as { __mockKubeConfig: ReturnType<typeof vi.fn> }).__mockKubeConfig;
const mockCoreV1Api = (k8s as unknown as { __mockCoreV1Api: ReturnType<typeof vi.fn> }).__mockCoreV1Api;
const mockExec = (k8s as unknown as { __mockExec: ReturnType<typeof vi.fn> }).__mockExec;
const mockCp = (k8s as unknown as { __mockCp: ReturnType<typeof vi.fn> }).__mockCp;

describe('MAS K8s Client', () => {
  const testOptions: MasK8sConnectionOptions = {
    clusterUrl: 'https://api.ocp.example.com:6443',
    token: 'test-token-abc123',
    namespace: 'mas-inst1-manage',
    skipTLSVerify: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (mockKubeConfig.makeApiClient as Mock).mockReturnValue(mockCoreV1Api);
  });

  describe('createK8sClient', () => {
    it('should create a K8s client with correct configuration', async () => {
      const { createK8sClient } = await import('../k8s-client');

      const client = createK8sClient(testOptions);

      expect(k8s.KubeConfig).toHaveBeenCalled();
      expect(mockKubeConfig.loadFromOptions).toHaveBeenCalledWith({
        clusters: [
          {
            name: 'ocp-cluster',
            server: testOptions.clusterUrl,
            skipTLSVerify: true,
          },
        ],
        users: [
          {
            name: 'sa-user',
            token: testOptions.token,
          },
        ],
        contexts: [
          {
            name: 'ocp-context',
            cluster: 'ocp-cluster',
            user: 'sa-user',
            namespace: testOptions.namespace,
          },
        ],
        currentContext: 'ocp-context',
      });
      expect(client).toBeDefined();
    });

    it('should use skipTLSVerify=true by default', async () => {
      const { createK8sClient } = await import('../k8s-client');

      createK8sClient({
        clusterUrl: testOptions.clusterUrl,
        token: testOptions.token,
        namespace: testOptions.namespace,
      });

      expect(mockKubeConfig.loadFromOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          clusters: expect.arrayContaining([
            expect.objectContaining({ skipTLSVerify: true }),
          ]),
        })
      );
    });
  });

  describe('findMxinstPod', () => {
    it('should find the running mxinst pod by prefix', async () => {
      const { createK8sClient, findMxinstPod } = await import('../k8s-client');

      const mockPodList = {
        body: {
          items: [
            {
              metadata: { name: 'mas-masw-manage-maxinst-7d8f9b-abc12', namespace: 'mas-inst1-manage' },
              status: { phase: 'Running' },
              spec: { containers: [{ name: 'maxinst' }] },
            },
            {
              metadata: { name: 'some-other-pod-xyz', namespace: 'mas-inst1-manage' },
              status: { phase: 'Running' },
              spec: { containers: [{ name: 'container1' }] },
            },
          ],
        },
      };

      (mockCoreV1Api.listNamespacedPod as Mock).mockResolvedValue(mockPodList);

      const client = createK8sClient(testOptions);
      const pod = await findMxinstPod(client, testOptions.namespace, 'mas-masw-manage-maxinst-');

      expect(mockCoreV1Api.listNamespacedPod).toHaveBeenCalledWith(testOptions.namespace);
      expect(pod).toEqual({
        name: 'mas-masw-manage-maxinst-7d8f9b-abc12',
        namespace: 'mas-inst1-manage',
        status: 'Running',
        containerName: 'maxinst',
      });
    });

    it('should throw error if no running pod is found', async () => {
      const { createK8sClient, findMxinstPod } = await import('../k8s-client');

      const mockPodList = {
        body: {
          items: [
            {
              metadata: { name: 'mas-masw-manage-maxinst-7d8f9b-abc12', namespace: 'mas-inst1-manage' },
              status: { phase: 'Pending' }, // Not running
              spec: { containers: [{ name: 'maxinst' }] },
            },
          ],
        },
      };

      (mockCoreV1Api.listNamespacedPod as Mock).mockResolvedValue(mockPodList);

      const client = createK8sClient(testOptions);
      await expect(findMxinstPod(client, testOptions.namespace, 'mas-masw-manage-maxinst-')).rejects.toThrow(
        'No running mxinst pod found'
      );
    });

    it('should throw error if namespace has no pods', async () => {
      const { createK8sClient, findMxinstPod } = await import('../k8s-client');

      const mockPodList = { body: { items: [] } };
      (mockCoreV1Api.listNamespacedPod as Mock).mockResolvedValue(mockPodList);

      const client = createK8sClient(testOptions);
      await expect(findMxinstPod(client, testOptions.namespace, 'mas-masw-manage-maxinst-')).rejects.toThrow(
        'No running mxinst pod found'
      );
    });

    it('should handle API errors', async () => {
      const { createK8sClient, findMxinstPod } = await import('../k8s-client');

      (mockCoreV1Api.listNamespacedPod as Mock).mockRejectedValue(new Error('Unauthorized'));

      const client = createK8sClient(testOptions);
      await expect(findMxinstPod(client, testOptions.namespace, 'mas-masw-manage-maxinst-')).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('copyFileToPod', () => {
    it('should copy a file to the pod', async () => {
      const { createK8sClient, copyFileToPod } = await import('../k8s-client');

      (mockCp.cpToPod as Mock).mockResolvedValue(undefined);

      const client = createK8sClient(testOptions);
      const podInfo: MasPodInfo = {
        name: 'mas-masw-manage-maxinst-7d8f9b-abc12',
        namespace: 'mas-inst1-manage',
        status: 'Running',
        containerName: 'maxinst',
      };

      await expect(
        copyFileToPod(client, podInfo, '/local/file.dbc', '/opt/IBM/SMP/maximo/tools/maximo/dbc/file.dbc')
      ).resolves.not.toThrow();

      expect(k8s.Cp).toHaveBeenCalled();
    });

    it('should handle copy errors', async () => {
      const { createK8sClient, copyFileToPod } = await import('../k8s-client');

      (mockCp.cpToPod as Mock).mockRejectedValue(new Error('Permission denied'));

      const client = createK8sClient(testOptions);
      const podInfo: MasPodInfo = {
        name: 'test-pod',
        namespace: 'mas-inst1-manage',
        status: 'Running',
        containerName: 'maxinst',
      };

      await expect(
        copyFileToPod(client, podInfo, '/local/file.dbc', '/remote/file.dbc')
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('execInPod', () => {
    it('should execute command in pod and return output', async () => {
      const { createK8sClient, execInPod } = await import('../k8s-client');

      (mockExec.exec as Mock).mockImplementation(
        async (
          _ns: string,
          _pod: string,
          _container: string,
          _cmd: string[],
          stdout: { write: (data: string) => void },
          _stderr: unknown,
          _stdin: unknown,
          _tty: boolean,
          statusCallback: (status: { status: string }) => void
        ) => {
          stdout.write('Processing script file...\n');
          stdout.write('Creating table ZZ_MYFORM...\n');
          stdout.write('Script completed successfully.\n');
          statusCallback({ status: 'Success' });
        }
      );

      const client = createK8sClient(testOptions);
      const podInfo: MasPodInfo = {
        name: 'mas-masw-manage-maxinst-7d8f9b-abc12',
        namespace: 'mas-inst1-manage',
        status: 'Running',
        containerName: 'maxinst',
      };

      const result = await execInPod(
        client,
        podInfo,
        ['./runscriptfile.sh', '-fZZ_MYFORM_dbc.dbc'],
        () => {} // onOutput callback
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Processing script file');
      expect(result.output).toContain('Script completed successfully');
    });

    it('should handle command execution failure', async () => {
      const { createK8sClient, execInPod } = await import('../k8s-client');

      (mockExec.exec as Mock).mockImplementation(
        async (
          _ns: string,
          _pod: string,
          _container: string,
          _cmd: string[],
          stdout: { write: (data: string) => void },
          stderr: { write: (data: string) => void },
          _stdin: unknown,
          _tty: boolean,
          statusCallback: (status: { status: string; message?: string }) => void
        ) => {
          stdout.write('Processing script file...\n');
          stderr.write('Error: Table already exists\n');
          statusCallback({ status: 'Failure', message: 'Exit code 1' });
        }
      );

      const client = createK8sClient(testOptions);
      const podInfo: MasPodInfo = {
        name: 'test-pod',
        namespace: 'mas-inst1-manage',
        status: 'Running',
        containerName: 'maxinst',
      };

      const result = await execInPod(client, podInfo, ['./runscriptfile.sh', '-ftest.dbc'], () => {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error: Table already exists');
    });

    it('should call onOutput callback for each output chunk', async () => {
      const { createK8sClient, execInPod } = await import('../k8s-client');

      const outputChunks: string[] = [];
      (mockExec.exec as Mock).mockImplementation(
        async (
          _ns: string,
          _pod: string,
          _container: string,
          _cmd: string[],
          stdout: { write: (data: string) => void },
          _stderr: unknown,
          _stdin: unknown,
          _tty: boolean,
          statusCallback: (status: { status: string }) => void
        ) => {
          stdout.write('Line 1\n');
          stdout.write('Line 2\n');
          statusCallback({ status: 'Success' });
        }
      );

      const client = createK8sClient(testOptions);
      const podInfo: MasPodInfo = {
        name: 'test-pod',
        namespace: 'mas-inst1-manage',
        status: 'Running',
        containerName: 'maxinst',
      };

      await execInPod(client, podInfo, ['echo', 'test'], (chunk) => outputChunks.push(chunk));

      expect(outputChunks).toContain('Line 1\n');
      expect(outputChunks).toContain('Line 2\n');
    });
  });

  describe('testConnection', () => {
    it('should return success when connection works and pod is found', async () => {
      const { createK8sClient, testConnection } = await import('../k8s-client');

      const mockPodList = {
        body: {
          items: [
            {
              metadata: { name: 'mas-masw-manage-maxinst-abc123', namespace: 'mas-inst1-manage' },
              status: { phase: 'Running' },
              spec: { containers: [{ name: 'maxinst' }] },
            },
          ],
        },
      };

      (mockCoreV1Api.listNamespacedPod as Mock).mockResolvedValue(mockPodList);

      const client = createK8sClient(testOptions);
      const result = await testConnection(client, testOptions.namespace, 'mas-masw-manage-maxinst-');

      expect(result.success).toBe(true);
      expect(result.podName).toBe('mas-masw-manage-maxinst-abc123');
      expect(result.message).toContain('Connected');
    });

    it('should return failure when API call fails', async () => {
      const { createK8sClient, testConnection } = await import('../k8s-client');

      (mockCoreV1Api.listNamespacedPod as Mock).mockRejectedValue(new Error('Connection refused'));

      const client = createK8sClient(testOptions);
      const result = await testConnection(client, testOptions.namespace, 'mas-masw-manage-maxinst-');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection refused');
    });

    it('should return failure when no mxinst pod is found', async () => {
      const { createK8sClient, testConnection } = await import('../k8s-client');

      const mockPodList = { body: { items: [] } };
      (mockCoreV1Api.listNamespacedPod as Mock).mockResolvedValue(mockPodList);

      const client = createK8sClient(testOptions);
      const result = await testConnection(client, testOptions.namespace, 'mas-masw-manage-maxinst-');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No running mxinst pod found');
    });
  });
});
