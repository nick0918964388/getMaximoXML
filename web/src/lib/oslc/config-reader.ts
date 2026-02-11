/**
 * OSLC Configuration Reader
 *
 * Manages OSLC connection config stored at `.oslc-config/config.json`.
 * Follows same pattern as `web/src/lib/mas/config-reader.ts`.
 *
 * Falls back to MAS config's `maximoBaseUrl` when OSLC has no `baseUrl`.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { OslcConfig } from './types';
import { decrypt } from '@/lib/mas/crypto';
import { OslcClient } from './oslc-client';
import { readConfig as readMasConfig } from '@/lib/mas/config-reader';

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
 * Resolve the Maximo base URL. Prefers OSLC config's own baseUrl,
 * falls back to MAS config's maximoBaseUrl.
 */
async function resolveBaseUrl(oslcConfig: OslcConfig): Promise<string> {
  if (oslcConfig.baseUrl) {
    return oslcConfig.baseUrl;
  }

  // Fallback to MAS config
  const masConfig = await readMasConfig();
  if (masConfig?.maximoBaseUrl) {
    return masConfig.maximoBaseUrl;
  }

  throw new Error(
    'No Maximo base URL configured. Set it in OSLC config or MAS config.'
  );
}

/**
 * Create an authenticated OSLC client from stored config.
 * Decrypts credentials before creating the client.
 * Falls back to MAS config's maximoBaseUrl when OSLC has no baseUrl.
 */
export async function getAuthenticatedOslcClient(): Promise<{
  client: OslcClient;
  config: OslcConfig;
}> {
  const config = await readOslcConfig();
  if (!config) {
    throw new Error('OSLC configuration not found. Please configure the connection first.');
  }

  const baseUrl = await resolveBaseUrl(config);
  const resolvedConfig = { ...config, baseUrl };

  if (config.authMethod === 'apikey') {
    if (!config.encryptedApiKey) {
      throw new Error('No API key configured.');
    }
    const apiKey = decrypt(config.encryptedApiKey);
    return {
      client: new OslcClient({
        baseUrl,
        authMethod: 'apikey',
        apiKey,
      }),
      config: resolvedConfig,
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
      baseUrl,
      authMethod: 'basic',
      username,
      password,
    }),
    config: resolvedConfig,
  };
}
