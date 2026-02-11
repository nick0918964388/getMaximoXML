/**
 * OSLC Relationships API
 * GET: List relationships for an object
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedOslcClient } from '@/lib/oslc/config-reader';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const objectName = searchParams.get('objectName');
    const pageSize = Number(searchParams.get('pageSize')) || 100;
    const pageNum = Number(searchParams.get('pageNum')) || 1;

    if (!objectName) {
      return NextResponse.json(
        { success: false, error: 'objectName query parameter is required' },
        { status: 400 }
      );
    }

    const { client } = await getAuthenticatedOslcClient();
    const result = await client.listRelationships(objectName, { pageSize, pageNum });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list relationships' },
      { status: 500 }
    );
  }
}
