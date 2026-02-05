/**
 * MAS Configuration API
 * GET: Retrieve current configuration (without sensitive token)
 * PUT: Update configuration (encrypts token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  MasConfig,
  MasConfigInputSchema,
  DEFAULT_MAS_CONFIG,
  MasApiResponse,
} from '@/lib/mas/types';
import { encrypt, isEncrypted } from '@/lib/mas/crypto';

// Config file location (in the project root, outside of public folders)
const CONFIG_DIR = path.join(process.cwd(), '.mas-config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

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
 * Write config to file
 */
async function writeConfig(config: MasConfig): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * GET /api/mas/config
 * Returns the current configuration (with token masked)
 */
export async function GET(): Promise<NextResponse<MasApiResponse<Partial<MasConfig>>>> {
  try {
    const config = await readConfig();

    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          ...DEFAULT_MAS_CONFIG,
          encryptedToken: '',
        },
      });
    }

    // Return config but indicate if token is set (don't return actual token)
    return NextResponse.json({
      success: true,
      data: {
        ocpClusterUrl: config.ocpClusterUrl,
        namespace: config.namespace,
        podPrefix: config.podPrefix,
        dbcTargetPath: config.dbcTargetPath,
        // Indicate if token is configured without exposing it
        encryptedToken: config.encryptedToken ? '***configured***' : '',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mas/config
 * Updates the configuration (encrypts token before storing)
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<MasApiResponse<{ message: string }>>> {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = MasConfigInputSchema.safeParse(body);
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

    // Encrypt the token if it's not already encrypted
    let encryptedToken = input.token;
    if (!isEncrypted(input.token)) {
      encryptedToken = encrypt(input.token);
    }

    const config: MasConfig = {
      ocpClusterUrl: input.ocpClusterUrl,
      namespace: input.namespace,
      podPrefix: input.podPrefix,
      dbcTargetPath: input.dbcTargetPath,
      encryptedToken,
    };

    await writeConfig(config);

    return NextResponse.json({
      success: true,
      data: { message: 'Configuration saved successfully' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mas/config
 * Removes the configuration file
 */
export async function DELETE(): Promise<NextResponse<MasApiResponse<{ message: string }>>> {
  try {
    await fs.unlink(CONFIG_FILE);
    return NextResponse.json({
      success: true,
      data: { message: 'Configuration deleted successfully' },
    });
  } catch (error) {
    // If file doesn't exist, that's fine
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({
        success: true,
        data: { message: 'Configuration was already empty' },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete configuration',
      },
      { status: 500 }
    );
  }
}
