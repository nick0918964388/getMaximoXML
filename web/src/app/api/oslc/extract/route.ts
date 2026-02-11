/**
 * OSLC Extract API
 * POST: Convert a metadata selection into DBC operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractMetadataToDbc } from '@/lib/oslc/metadata-extractor';
import type { MetadataSelection, SerializableSelection } from '@/lib/oslc/types';

/**
 * Deserialize the selection from JSON transport format back to Maps
 */
function deserializeSelection(input: SerializableSelection): MetadataSelection {
  return {
    objects: new Map(input.objects.map((e) => [e.key, e.value])),
    domains: new Map(input.domains.map((e) => [e.key, e.value])),
    apps: new Map(input.apps.map((e) => [e.key, e.value])),
    modules: new Map(input.modules.map((e) => [e.key, e.value])),
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as SerializableSelection;
    const selection = deserializeSelection(body);
    const result = extractMetadataToDbc(selection);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}
