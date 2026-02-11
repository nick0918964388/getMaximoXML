/**
 * OSLC Object Detail API
 * GET: Get object attributes, relationships, and indexes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedOslcClient } from '@/lib/oslc/config-reader';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
): Promise<NextResponse> {
  try {
    const objectName = params.name;
    const { client } = await getAuthenticatedOslcClient();

    const [attributes, relationships, indexes] = await Promise.all([
      client.listAttributes(objectName, { pageSize: 500 }),
      client.listRelationships(objectName, { pageSize: 500 }),
      client.listIndexes(objectName, { pageSize: 100 }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        attributes: attributes.member,
        relationships: relationships.member,
        indexes: indexes.member,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get object detail' },
      { status: 500 }
    );
  }
}
