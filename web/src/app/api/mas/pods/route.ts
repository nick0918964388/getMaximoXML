/**
 * GET /api/mas/pods
 * List all MAS Manage pods in the configured namespace.
 * Accepts optional ?podPrefix= query param to override config.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedK8sClient } from '@/lib/mas/config-reader';
import { listMasPods } from '@/lib/mas/pod-manager';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { client, config } = await getAuthenticatedK8sClient();
    const podPrefix = request.nextUrl.searchParams.get('podPrefix') || config.podPrefix;
    const pods = await listMasPods(client, config.namespace, podPrefix);

    return NextResponse.json({ success: true, data: pods });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list pods',
      },
      { status: 500 }
    );
  }
}
