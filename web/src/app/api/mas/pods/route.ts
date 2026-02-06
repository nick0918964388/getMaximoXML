/**
 * GET /api/mas/pods
 * List all MAS Manage pods in the configured namespace.
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedK8sClient } from '@/lib/mas/config-reader';
import { listMasPods } from '@/lib/mas/pod-manager';

export async function GET(): Promise<Response> {
  try {
    const { client, config } = await getAuthenticatedK8sClient();
    const pods = await listMasPods(client, config.namespace, config.podPrefix);

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
