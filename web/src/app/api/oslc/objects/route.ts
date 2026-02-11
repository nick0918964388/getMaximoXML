/**
 * OSLC Objects API
 * GET: List objects with search and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedOslcClient } from '@/lib/oslc/config-reader';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const pageSize = Number(searchParams.get('pageSize')) || 50;
    const pageNum = Number(searchParams.get('pageNum')) || 1;

    const { client } = await getAuthenticatedOslcClient();
    const result = await client.listObjects({ search, pageSize, pageNum });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list objects' },
      { status: 500 }
    );
  }
}
