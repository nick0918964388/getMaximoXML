/**
 * OSLC Configuration API
 * GET: Retrieve current configuration (credentials masked)
 * PUT: Save configuration (encrypts credentials)
 * DELETE: Remove configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { readOslcConfig, saveOslcConfig, deleteOslcConfig } from '@/lib/oslc/config-reader';
import { readConfig as readMasConfig } from '@/lib/mas/config-reader';
import { encrypt, isEncrypted, hasEncryptionKey } from '@/lib/mas/crypto';
import type { OslcConfig } from '@/lib/oslc/types';

export async function GET(): Promise<NextResponse> {
  try {
    const config = await readOslcConfig();

    // If OSLC has no baseUrl, try to fill from MAS config
    let baseUrl = config?.baseUrl || '';
    let baseUrlSource: 'oslc' | 'mas' | null = config?.baseUrl ? 'oslc' : null;
    if (!baseUrl) {
      const masConfig = await readMasConfig();
      if (masConfig?.maximoBaseUrl) {
        baseUrl = masConfig.maximoBaseUrl;
        baseUrlSource = 'mas';
      }
    }

    return NextResponse.json({
      success: true,
      data: config
        ? {
            baseUrl,
            baseUrlSource,
            authMethod: config.authMethod,
            hasApiKey: !!config.encryptedApiKey,
            hasCredentials: !!(config.encryptedUsername && config.encryptedPassword),
            hasEncryptionKey: hasEncryptionKey(),
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to read config' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { baseUrl, authMethod, apiKey, username, password } = body;

    if (!authMethod) {
      return NextResponse.json(
        { success: false, error: 'authMethod is required' },
        { status: 400 }
      );
    }

    const config: OslcConfig = { baseUrl: baseUrl || '', authMethod };

    if (authMethod === 'apikey') {
      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: 'apiKey is required for apikey auth' },
          { status: 400 }
        );
      }
      config.encryptedApiKey = isEncrypted(apiKey) ? apiKey : encrypt(apiKey);
    } else {
      if (!username || !password) {
        return NextResponse.json(
          { success: false, error: 'username and password are required for basic auth' },
          { status: 400 }
        );
      }
      config.encryptedUsername = isEncrypted(username) ? username : encrypt(username);
      config.encryptedPassword = isEncrypted(password) ? password : encrypt(password);
    }

    await saveOslcConfig(config);
    return NextResponse.json({ success: true, data: { message: 'Configuration saved' } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save config' },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    await deleteOslcConfig();
    return NextResponse.json({ success: true, data: { message: 'Configuration deleted' } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ success: true, data: { message: 'Configuration was already empty' } });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete config' },
      { status: 500 }
    );
  }
}
