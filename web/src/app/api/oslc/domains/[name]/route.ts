/**
 * OSLC Domain Detail API
 * GET: Get domain with its values
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedOslcClient } from '@/lib/oslc/config-reader';
import type { OslcDomainWithValues, OslcMaxDomain } from '@/lib/oslc/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
): Promise<NextResponse> {
  try {
    const domainId = params.name;
    const { client } = await getAuthenticatedOslcClient();

    // First get the domain metadata to know its type
    const domains = await client.listDomains({ search: domainId, pageSize: 1 });
    const domain = domains.member.find((d: OslcMaxDomain) => d.domainid === domainId);

    if (!domain) {
      return NextResponse.json(
        { success: false, error: `Domain ${domainId} not found` },
        { status: 404 }
      );
    }

    const result: OslcDomainWithValues = { ...domain };

    // Fetch values based on domain type
    switch (domain.domaintype) {
      case 'SYNONYM': {
        const vals = await client.getSynonymValues(domainId);
        result.synonymValues = vals.member;
        break;
      }
      case 'ALN': {
        const vals = await client.getAlnValues(domainId);
        result.alnValues = vals.member;
        break;
      }
      case 'NUMERIC': {
        const vals = await client.getNumericValues(domainId);
        result.numericValues = vals.member;
        break;
      }
      // TABLE and CROSSOVER domains: info is part of domain metadata
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get domain detail' },
      { status: 500 }
    );
  }
}
