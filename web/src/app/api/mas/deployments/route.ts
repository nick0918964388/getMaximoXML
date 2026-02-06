/**
 * GET /api/mas/deployments
 * List all MAS Manage deployments in the configured namespace.
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedK8sClient } from '@/lib/mas/config-reader';
import { listMasDeployments } from '@/lib/mas/pod-manager';

export async function GET(): Promise<Response> {
  try {
    const { client, config } = await getAuthenticatedK8sClient();
    const deployments = await listMasDeployments(client, config.namespace, config.podPrefix);

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
