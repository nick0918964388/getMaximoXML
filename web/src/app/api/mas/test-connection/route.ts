/**
 * MAS Test Connection API
 * POST: Test connection to OCP cluster and find mxinst pod
 */

import { NextResponse } from 'next/server';
import {
  MasApiResponse,
  MasTestConnectionResult,
} from '@/lib/mas/types';
import { testConnection } from '@/lib/mas/k8s-client';
import { getAuthenticatedK8sClient } from '@/lib/mas/config-reader';
import { deriveMasStem } from '@/lib/mas/pod-manager-types';

/**
 * POST /api/mas/test-connection
 * Tests the connection to the configured OCP cluster
 */
export async function POST(): Promise<NextResponse<MasApiResponse<MasTestConnectionResult>>> {
  try {
    const { client, config } = await getAuthenticatedK8sClient();

    // Test connection always targets the maxinst pod
    const mxinstPrefix = `${deriveMasStem(config.podPrefix)}maxinst-`;

    const result = await testConnection(
      client,
      config.namespace,
      mxinstPrefix
    );

    return NextResponse.json({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (error: unknown) {
    let message = 'Connection test failed';
    if (error instanceof Error) {
      message = error.message;
    }
    const k8sError = error as { statusCode?: number; body?: unknown };
    if (k8sError.statusCode) {
      const body = typeof k8sError.body === 'object' && k8sError.body !== null
        ? JSON.stringify(k8sError.body)
        : String(k8sError.body ?? '');
      message = `HTTP ${k8sError.statusCode}: ${message} ${body}`;
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
