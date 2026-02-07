/**
 * GET /api/mas/deployments
 * List all MAS Manage deployments in the configured namespace.
 * Accepts optional ?podPrefix= query param to override config.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedK8sClient } from '@/lib/mas/config-reader';
import { listMasDeployments } from '@/lib/mas/pod-manager';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { client, config } = await getAuthenticatedK8sClient();
    const podPrefix = request.nextUrl.searchParams.get('podPrefix') || config.podPrefix;
    const deployments = await listMasDeployments(client, config.namespace, podPrefix);

    return NextResponse.json({ success: true, data: deployments });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list deployments',
      },
      { status: 500 }
    );
  }
}
