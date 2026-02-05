/**
 * MAS Import API
 * POST: Execute DBC import with SSE streaming for progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  MasConfig,
  MasImportRequestSchema,
  MasImportStatus,
} from '@/lib/mas/types';
import { decrypt } from '@/lib/mas/crypto';
import {
  createK8sClient,
  findMxinstPod,
  copyContentToPod,
  runDbcScript,
  MasK8sClient,
} from '@/lib/mas/k8s-client';
import type { MasPodInfo } from '@/lib/mas/types';

const CONFIG_FILE = path.join(process.cwd(), '.mas-config', 'config.json');

/**
 * Read config from file
 */
async function readConfig(): Promise<MasConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as MasConfig;
  } catch {
    return null;
  }
}

/**
 * Create SSE event string
 */
function createSSEEvent(
  type: 'status' | 'output' | 'error' | 'complete',
  data: {
    status?: MasImportStatus;
    podName?: string;
    message?: string;
    error?: string;
  }
): string {
  return `data: ${JSON.stringify({ type, data })}\n\n`;
}

/**
 * POST /api/mas/import
 * Executes DBC import with SSE streaming
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parseResult = MasImportRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: parseResult.error.issues.map((e) => e.message).join(', '),
      },
      { status: 400 }
    );
  }

  const { dbcContent, dbcFilename } = parseResult.data;

  // Read configuration
  const config = await readConfig();
  if (!config || !config.encryptedToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'MAS configuration not found. Please configure the connection first.',
      },
      { status: 400 }
    );
  }

  // Decrypt token
  let token: string;
  try {
    token = decrypt(config.encryptedToken);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to decrypt token. The encryption key may have changed.',
      },
      { status: 500 }
    );
  }

  // Create readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (
        type: 'status' | 'output' | 'error' | 'complete',
        data: {
          status?: MasImportStatus;
          podName?: string;
          message?: string;
          error?: string;
        }
      ) => {
        controller.enqueue(encoder.encode(createSSEEvent(type, data)));
      };

      let client: MasK8sClient | null = null;
      let podInfo: MasPodInfo | null = null;

      try {
        // Step 1: Connecting
        send('status', { status: 'connecting', message: 'Connecting to OCP cluster...' });

        client = createK8sClient({
          clusterUrl: config.ocpClusterUrl,
          token,
          namespace: config.namespace,
          skipTLSVerify: true,
        });

        // Step 2: Finding pod
        send('status', { status: 'finding-pod', message: 'Finding mxinst pod...' });

        podInfo = await findMxinstPod(client, config.namespace, config.podPrefix);
        send('status', {
          status: 'finding-pod',
          podName: podInfo.name,
          message: `Found pod: ${podInfo.name}`,
        });

        // Step 3: Uploading DBC file
        send('status', {
          status: 'uploading',
          podName: podInfo.name,
          message: `Uploading ${dbcFilename} to ${config.dbcTargetPath}/...`,
        });

        const remotePath = `${config.dbcTargetPath}/${dbcFilename}`;
        await copyContentToPod(client, podInfo, dbcContent, remotePath);

        send('status', {
          status: 'uploading',
          podName: podInfo.name,
          message: `Uploaded ${dbcFilename} successfully`,
        });

        // Step 4: Executing runscriptfile.sh
        send('status', {
          status: 'executing',
          podName: podInfo.name,
          message: `Executing runscriptfile.sh -f${dbcFilename}...`,
        });

        const result = await runDbcScript(
          client,
          podInfo,
          dbcFilename,
          config.dbcTargetPath,
          (output) => {
            send('output', { message: output });
          }
        );

        if (result.success) {
          send('complete', {
            status: 'completed',
            podName: podInfo.name,
            message: 'DBC import completed successfully!',
          });
        } else {
          send('error', {
            status: 'failed',
            podName: podInfo.name,
            error: result.error || 'Script execution failed',
          });
        }
      } catch (error) {
        send('error', {
          status: 'failed',
          podName: podInfo?.name,
          error: error instanceof Error ? error.message : 'Import failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
