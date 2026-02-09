/**
 * GET /api/mas/pods/[name]/logs
 * Stream pod logs via Server-Sent Events.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedK8sClient } from '@/lib/mas/config-reader';
import { streamPodLogs } from '@/lib/mas/pod-manager';
import { isMasResource, isValidMasPodPrefix } from '@/lib/mas/pod-manager-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
): Promise<Response> {
  const podName = params.name;

  const searchParams = request.nextUrl.searchParams;
  const container = searchParams.get('container') ?? undefined;
  const tailLines = parseInt(searchParams.get('tailLines') ?? '200', 10);
  const timestamps = searchParams.get('timestamps') !== 'false';
  const previous = searchParams.get('previous') === 'true';

  let authenticatedClient;
  try {
    authenticatedClient = await getAuthenticatedK8sClient();
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 500 }
    );
  }

  const { client, config } = authenticatedClient;

  // Allow caller to override podPrefix (e.g. MAS management uses a different stem)
  const rawPodPrefix = searchParams.get('podPrefix') || config.podPrefix;

  // Security: reject arbitrary podPrefix values
  if (!isValidMasPodPrefix(rawPodPrefix)) {
    return NextResponse.json(
      { success: false, error: 'Invalid pod prefix.' },
      { status: 400 }
    );
  }

  const podPrefix = rawPodPrefix;

  // Security: reject non-MAS pod names
  if (!isMasResource(podName, podPrefix)) {
    return NextResponse.json(
      { success: false, error: `"${podName}" is not a recognized MAS pod.` },
      { status: 400 }
    );
  }
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let abortController: AbortController | null = null;

      try {
        abortController = await streamPodLogs(
          client,
          config.namespace,
          podName,
          { container, follow: true, tailLines, timestamps, previous },
          (line) => {
            const event = `data: ${JSON.stringify({ type: 'log', data: line })}\n\n`;
            controller.enqueue(encoder.encode(event));
          }
        );

        // Listen for client disconnect
        request.signal.addEventListener('abort', () => {
          abortController?.abort();
          controller.close();
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Log streaming failed';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', data: msg })}\n\n`)
        );
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
