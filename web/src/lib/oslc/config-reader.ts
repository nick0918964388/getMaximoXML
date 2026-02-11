/**
 * OSLC Configuration Reader
 *
 * Manages OSLC connection config stored at `.oslc-config/config.json`.
 * Follows same pattern as `web/src/lib/mas/config-reader.ts`.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { OslcConfig } from './types';
import { decrypt } from '@/lib/mas/crypto';
import { OslcClient } from './oslc-client';

const CONFIG_DIR = path.join(process.cwd(), '.oslc-config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Read stored OSLC config from file
 */
export async function readOslcConfig(): Promise<OslcConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as OslcConfig;
  } catch {
    return null;
  }
}

/**
 * Save OSLC config to file
 */
export async function saveOslcConfig(config: OslcConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Delete OSLC config file
 */
export async function deleteOslcConfig(): Promise<void> {
  await fs.unlink(CONFIG_FILE);
}

/**
 * Create an authenticated OSLC client from stored config.
 * Decrypts credentials before creating the client.
 */
export async function getAuthenticatedOslcClient(): Promise<{
  client: OslcClient;
  config: OslcConfig;
}> {
  const config = await readOslcConfig();
  if (!config) {
    throw new Error('OSLC configuration not found. Please configure the connection first.');
  }

  if (config.authMethod === 'apikey') {
    if (!config.encryptedApiKey) {
      throw new Error('No API key configured.');
    }
    const apiKey = decrypt(config.encryptedApiKey);
    return {
      client: new OslcClient({
        baseUrl: config.baseUrl,
        authMethod: 'apikey',
        apiKey,
      }),
      config,
    };
  }

  // basic auth
  if (!config.encryptedUsername || !config.encryptedPassword) {
    throw new Error('No username/password configured.');
  }
  const username = decrypt(config.encryptedUsername);
  const password = decrypt(config.encryptedPassword);
  return {
    client: new OslcClient({
      baseUrl: config.baseUrl,
      authMethod: 'basic',
      username,
      password,
    }),
    config,
  };
}
