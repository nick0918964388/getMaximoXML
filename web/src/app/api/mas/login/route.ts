/**
 * MAS OCP Login API
 * POST: Login to OCP using username/password and get token
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { MasApiResponse, MasConfig } from '@/lib/mas/types';
import { encrypt, isEncrypted } from '@/lib/mas/crypto';
import { getTokenViaRequestHeader } from '@/lib/mas/ocp-auth';
import { getMasEnvConfig } from '@/lib/mas/env';

const CONFIG_DIR = path.join(process.cwd(), '.mas-config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Login request schema
 * Username/password can be empty if using env credentials
 */
const LoginRequestSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  ocpClusterUrl: z.string().url().optional(),
  namespace: z.string().optional(),
  podPrefix: z.string().optional(),
  dbcTargetPath: z.string().optional(),
  maximoBaseUrl: z.string().optional(),
});

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

/**
 * Write config to file
 */
async function writeConfig(config: MasConfig): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * POST /api/mas/login
 * Login to OCP using username/password
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<MasApiResponse<{ message: string }>>> {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = LoginRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;
    const envConfig = getMasEnvConfig();

    // Use provided values or fall back to environment variables
    const ocpClusterUrl = input.ocpClusterUrl || envConfig.ocpClusterUrl;
    const namespace = input.namespace || envConfig.namespace;
    const podPrefix = input.podPrefix || envConfig.podPrefix;
    const dbcTargetPath = input.dbcTargetPath || envConfig.dbcTargetPath;

    // Use provided credentials or fall back to environment variables
    const username = input.username || envConfig.username;
    const password = input.password || envConfig.password;

    if (!ocpClusterUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'OCP cluster URL is required. Set MAS_OCP_CLUSTER_URL in .env.local or provide it in the request.',
        },
        { status: 400 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username and password are required. Set MAS_OCP_USERNAME and MAS_OCP_PASSWORD in .env.local or provide them in the request.',
        },
        { status: 400 }
      );
    }

    // Login to OCP and get token
    let token: string;
    try {
      token = await getTokenViaRequestHeader(ocpClusterUrl, username, password);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `OCP login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 401 }
      );
    }

    // Encrypt the token
    let encryptedToken = token;
    if (!isEncrypted(token)) {
      encryptedToken = encrypt(token);
    }

    // Save configuration (including encrypted credentials for auto re-auth)
    const config: MasConfig = {
      ocpClusterUrl,
      namespace,
      podPrefix,
      dbcTargetPath,
      encryptedToken,
      encryptedUsername: encrypt(username),
      encryptedPassword: encrypt(password),
      ...(input.maximoBaseUrl ? { maximoBaseUrl: input.maximoBaseUrl } : {}),
    };

    await writeConfig(config);

    return NextResponse.json({
      success: true,
      data: { message: 'Login successful! Configuration saved.' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    );
  }
}
