/**
 * Shared config reader for MAS API routes.
 * Extracts common readConfig + decrypt + createK8sClient boilerplate.
 *
 * When stored credentials (username/password) are available, re-authenticates
 * on every call to get a fresh token. This avoids OCP token expiry issues.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { MasConfig } from './types';
import { decrypt } from './crypto';
import { createK8sClient, type MasK8sClient } from './k8s-client';
import { getTokenViaRequestHeader } from './ocp-auth';
import { getMasEnvConfig } from './env';

const CONFIG_FILE = path.join(process.cwd(), '.mas-config', 'config.json');

/**
 * Read stored MAS config from file
 */
export async function readConfig(): Promise<MasConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as MasConfig;
  } catch {
    return null;
  }
}

/**
 * Obtain a fresh token. Tries credential-based re-auth first,
 * falls back to stored encrypted token.
 */
async function obtainToken(config: MasConfig): Promise<string> {
  // 1. Try stored encrypted credentials
  if (config.encryptedUsername && config.encryptedPassword) {
    try {
      const username = decrypt(config.encryptedUsername);
      const password = decrypt(config.encryptedPassword);
      return await getTokenViaRequestHeader(config.ocpClusterUrl, username, password);
    } catch {
      // Fall through to env credentials or stored token
    }
  }

  // 2. Try env credentials
  const env = getMasEnvConfig();
  if (env.username && env.password) {
    try {
      return await getTokenViaRequestHeader(config.ocpClusterUrl, env.username, env.password);
    } catch {
      // Fall through to stored token
    }
  }

  // 3. Fall back to stored encrypted token
  if (config.encryptedToken) {
    return decrypt(config.encryptedToken);
  }

  throw new Error('No credentials or token available. Please configure the connection first.');
}

/**
 * Read config, obtain a fresh token, and create an authenticated K8s client.
 * Throws descriptive errors on failure.
 */
export async function getAuthenticatedK8sClient(): Promise<{
  client: MasK8sClient;
  config: MasConfig;
}> {
  const config = await readConfig();
  if (!config) {
    throw new Error('MAS configuration not found. Please configure the connection first.');
  }

  let token: string;
  try {
    token = await obtainToken(config);
  } catch (error) {
    throw new Error(
      `Failed to obtain token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  const client = createK8sClient({
    clusterUrl: config.ocpClusterUrl,
    token,
    namespace: config.namespace,
    skipTLSVerify: true,
  });

  return { client, config };
}
