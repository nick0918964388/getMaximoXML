/**
 * POST /api/mas/deployments/[name]/scale
 * Scale a MAS deployment to the given replica count.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedK8sClient } from '@/lib/mas/config-reader';
import { scaleDeployment } from '@/lib/mas/pod-manager';
import { isMasResource } from '@/lib/mas/pod-manager-types';

const ScaleRequestSchema = z.object({
  replicas: z.number().int().min(0).max(10),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
): Promise<Response> {
  const deploymentName = params.name;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parseResult = ScaleRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: parseResult.error.issues.map((e) => e.message).join(', '),
      },
      { status: 400 }
    );
  }

  const { replicas } = parseResult.data;

  try {
    const { client, config } = await getAuthenticatedK8sClient();

    // Allow caller to override podPrefix (e.g. MAS management uses a different stem)
    const podPrefix = request.nextUrl.searchParams.get('podPrefix') || config.podPrefix;

    // Security: reject non-MAS deployment names
    if (!isMasResource(deploymentName, podPrefix)) {
      return NextResponse.json(
        { success: false, error: `"${deploymentName}" is not a recognized MAS deployment.` },
        { status: 400 }
      );
    }

    const result = await scaleDeployment(client, config.namespace, deploymentName, replicas, podPrefix);

    return NextResponse.json({
      success: true,
      data: { previous: result.previous, new: result.current },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scale deployment',
      },
      { status: 500 }
    );
  }
}
