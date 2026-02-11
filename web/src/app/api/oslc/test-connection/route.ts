/**
 * OSLC Test Connection API
 * POST: Test connectivity to the OSLC endpoint
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedOslcClient } from '@/lib/oslc/config-reader';

export async function POST(): Promise<NextResponse> {
  try {
    const { client } = await getAuthenticatedOslcClient();
    const connected = await client.testConnection();
    return NextResponse.json({
      success: true,
      data: { connected },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Connection test failed' },
      { status: 500 }
    );
  }
}
