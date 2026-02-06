/**
 * OCP Authentication Module
 * Handles username/password login to get OAuth token
 *
 * Uses Node.js https module directly to support self-signed certificates
 * (rejectUnauthorized: false), since native fetch does not support
 * custom agents.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * Low-level HTTPS request helper that supports self-signed certs.
 */
function httpsRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    followRedirects?: boolean;
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false,
    };

    const req = https.request(reqOptions, (res) => {
      // Handle redirects if not following
      if (!options.followRedirects && res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: '',
        });
        res.resume(); // drain response
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Login to OCP using username and password
 * Returns the OAuth access token
 */
export async function loginToOcp(
  clusterUrl: string,
  username: string,
  password: string
): Promise<string> {
  // First, discover the OAuth server URL
  const oauthServerUrl = await discoverOAuthServer(clusterUrl);

  // Request token using password grant
  const tokenUrl = `${oauthServerUrl}/oauth/token`;

  const response = await httpsRequest(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from('openshift-challenging-client:').toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
    }).toString(),
    followRedirects: true,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`OCP login failed: ${response.statusCode} ${response.body}`);
  }

  const data = JSON.parse(response.body);
  return data.access_token;
}

/**
 * Discover OAuth server URL from OCP cluster
 */
async function discoverOAuthServer(clusterUrl: string): Promise<string> {
  const wellKnownUrl = `${clusterUrl}/.well-known/oauth-authorization-server`;

  try {
    const response = await httpsRequest(wellKnownUrl, {
      headers: { 'Accept': 'application/json' },
      followRedirects: true,
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const data = JSON.parse(response.body);
      return data.issuer || clusterUrl;
    }
  } catch {
    // Fallback: try to construct the OAuth URL from the cluster URL
  }

  return clusterUrl;
}

/**
 * Alternative: Get token by simulating oc login
 * This uses the request-header authentication method
 */
export async function getTokenViaRequestHeader(
  clusterUrl: string,
  username: string,
  password: string
): Promise<string> {
  // Discover the OAuth server URL first (it's usually on a different host)
  const oauthServerUrl = await discoverOAuthServer(clusterUrl);
  const oauthUrl = `${oauthServerUrl}/oauth/authorize`;

  const params = new URLSearchParams({
    response_type: 'token',
    client_id: 'openshift-challenging-client',
  });

  const response = await httpsRequest(`${oauthUrl}?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'X-CSRF-Token': '1',
    },
    followRedirects: false, // We need the redirect Location header
  });

  // OCP redirects to a URL with the token in the fragment
  const location = response.headers['location'];

  if (!location) {
    // If no redirect, check if it was an auth error
    if (response.statusCode === 401) {
      throw new Error('Invalid username or password');
    }
    throw new Error(`No redirect location (HTTP ${response.statusCode})`);
  }

  // Parse the access_token from the fragment
  const hashIndex = location.indexOf('#');
  if (hashIndex === -1) {
    throw new Error('Invalid redirect URL (no token fragment)');
  }

  const fragment = location.substring(hashIndex + 1);
  const tokenParams = new URLSearchParams(fragment);
  const accessToken = tokenParams.get('access_token');

  if (!accessToken) {
    throw new Error('No access token in response');
  }

  return accessToken;
}
