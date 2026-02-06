/**
 * MAS Import API
 * POST: Execute DBC import with SSE streaming for progress
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  MasImportRequestSchema,
  MasImportStatus,
} from '@/lib/mas/types';
import {
  findMxinstPod,
  copyContentToPod,
  runDbcScript,
  MasK8sClient,
} from '@/lib/mas/k8s-client';
import type { MasPodInfo } from '@/lib/mas/types';
import { getMasEnvConfig } from '@/lib/mas/env';
import { getAuthenticatedK8sClient } from '@/lib/mas/config-reader';
import { deriveMasStem } from '@/lib/mas/pod-manager-types';

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

  // Authenticate and get K8s client
  let authenticatedResult;
  try {
    authenticatedResult = await getAuthenticatedK8sClient();
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 500 }
    );
  }

  const { client: k8sClient, config } = authenticatedResult;

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

      const client: MasK8sClient | null = k8sClient;
      let podInfo: MasPodInfo | null = null;
      const envConfig = getMasEnvConfig();
      const importTimeout = envConfig.importTimeout;

      // Use new path config or fall back to legacy dbcTargetPath
      // Strip trailing slash to avoid double-slash in paths
      const dbcUploadPath = (config.dbcUploadPath || envConfig.dbcUploadPath || config.dbcTargetPath).replace(/\/+$/, '');
      const dbcScriptPath = config.dbcScriptPath || envConfig.dbcScriptPath;

      // DBC import always targets the maxinst pod.
      // Derive the stem from the user's podPrefix (e.g. "mas-masw-all" → "mas-masw-")
      // then append "maxinst-" to get the correct prefix for findMxinstPod.
      const mxinstPrefix = `${deriveMasStem(config.podPrefix)}maxinst-`;

      try {
        // Step 1: Connecting
        send('status', { status: 'connecting', message: 'Connected to OCP cluster' });

        // Step 2: Finding pod
        send('status', { status: 'finding-pod', message: `Finding maxinst pod (prefix: ${mxinstPrefix})...` });

        podInfo = await findMxinstPod(client, config.namespace, mxinstPrefix);
        send('status', {
          status: 'finding-pod',
          podName: podInfo.name,
          message: `Found pod: ${podInfo.name}`,
        });

        // Step 3: Uploading DBC file
        send('status', {
          status: 'uploading',
          podName: podInfo.name,
          message: `Uploading ${dbcFilename} to ${dbcUploadPath}/...`,
        });

        const remotePath = `${dbcUploadPath}/${dbcFilename}`;
        await copyContentToPod(client, podInfo, dbcContent, remotePath);

        send('status', {
          status: 'uploading',
          podName: podInfo.name,
          message: `Uploaded ${dbcFilename} successfully`,
        });

        // Step 4: Executing runscriptfile.sh from script path
        const timeoutMinutes = Math.round(importTimeout / 60000);
        send('status', {
          status: 'executing',
          podName: podInfo.name,
          message: `Executing runscriptfile.sh -f${dbcFilename}... (timeout: ${timeoutMinutes} min)`,
        });

        const result = await runDbcScript(
          client,
          podInfo,
          dbcFilename,
          dbcUploadPath,
          dbcScriptPath,
          (output) => {
            send('output', { message: output });
          },
          { timeout: importTimeout }
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
