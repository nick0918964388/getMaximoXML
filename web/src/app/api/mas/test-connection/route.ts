/**
 * MAS Test Connection API
 * POST: Test connection to OCP cluster and find mxinst pod
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  MasConfig,
  MasApiResponse,
  MasTestConnectionResult,
} from '@/lib/mas/types';
import { decrypt } from '@/lib/mas/crypto';
import { createK8sClient, testConnection } from '@/lib/mas/k8s-client';

const CONFIG_FILE = path.join(process.cwd(), '.mas-config', 'config.json');

/**
 * Read config from file
 */
async function readConfig(): Promise<MasConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as MasConfig;
  } catch {
    return null;
  }
}

/**
 * POST /api/mas/test-connection
 * Tests the connection to the configured OCP cluster
 */
export async function POST(): Promise<NextResponse<MasApiResponse<MasTestConnectionResult>>> {
  try {
    // Read configuration
    const config = await readConfig();

    if (!config || !config.encryptedToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'MAS configuration not found. Please configure the connection first.',
        },
        { status: 400 }
      );
    }

    // Decrypt the token
    let token: string;
    try {
      token = decrypt(config.encryptedToken);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to decrypt token. The encryption key may have changed.',
        },
        { status: 500 }
      );
    }

    // Create K8s client and test connection
    const client = createK8sClient({
      clusterUrl: config.ocpClusterUrl,
      token,
      namespace: config.namespace,
      skipTLSVerify: true,
    });

    const result = await testConnection(
      client,
      config.namespace,
      config.podPrefix
    );

    return NextResponse.json({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      },
      { status: 500 }
    );
  }
}
