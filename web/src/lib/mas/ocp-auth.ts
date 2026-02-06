/**
 * OCP Authentication Module
 * Handles username/password login to get OAuth token
 */

/**
 * Login to OCP using username and password
 * Returns the OAuth access token
 *
 * @param clusterUrl OCP cluster URL (e.g., https://api.ocp.example.com:6443)
 * @param username OCP username
 * @param password OCP password
 * @returns OAuth access token
 */
export async function loginToOcp(
  clusterUrl: string,
  username: string,
  password: string
): Promise<string> {
  // OCP uses OAuth 2.0 with resource owner password credentials grant
  // The OAuth server URL is typically at oauth-openshift.apps.<cluster>
  // But we can also use the well-known oauth-authorization-server endpoint

  // First, discover the OAuth server URL
  const oauthServerUrl = await discoverOAuthServer(clusterUrl);

  // Request token using password grant
  const tokenUrl = `${oauthServerUrl}/oauth/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from('openshift-challenging-client:').toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
    }),
    // Skip TLS verification for self-signed certs
    // @ts-expect-error - Node.js fetch extension
    agent: new (await import('https')).Agent({ rejectUnauthorized: false }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCP login failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Discover OAuth server URL from OCP cluster
 */
async function discoverOAuthServer(clusterUrl: string): Promise<string> {
  // The OAuth metadata is available at /.well-known/oauth-authorization-server
  const wellKnownUrl = `${clusterUrl}/.well-known/oauth-authorization-server`;

  try {
    const response = await fetch(wellKnownUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Skip TLS verification for self-signed certs
      // @ts-expect-error - Node.js fetch extension
      agent: new (await import('https')).Agent({ rejectUnauthorized: false }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.issuer || clusterUrl;
    }
  } catch {
    // Fallback: try to construct the OAuth URL from the cluster URL
  }

  // Fallback: assume OAuth server is at the same host
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
  // OCP's OAuth endpoint for password-based auth
  // This simulates what 'oc login -u username -p password' does
  const oauthUrl = `${clusterUrl}/oauth/authorize`;

  const params = new URLSearchParams({
    response_type: 'token',
    client_id: 'openshift-challenging-client',
  });

  const response = await fetch(`${oauthUrl}?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      'X-CSRF-Token': '1',
    },
    redirect: 'manual', // Don't follow redirects
    // Skip TLS verification for self-signed certs
    // @ts-expect-error - Node.js fetch extension
    agent: new (await import('https')).Agent({ rejectUnauthorized: false }),
  });

  // OCP redirects to a URL with the token in the fragment
  // e.g., https://api.ocp/oauth/token/implicit#access_token=xxx&...
  const location = response.headers.get('location');

  if (!location) {
    throw new Error('OCP login failed: No redirect location');
  }

  // Parse the access_token from the fragment
  const hashIndex = location.indexOf('#');
  if (hashIndex === -1) {
    throw new Error('OCP login failed: Invalid redirect URL');
  }

  const fragment = location.substring(hashIndex + 1);
  const params2 = new URLSearchParams(fragment);
  const accessToken = params2.get('access_token');

  if (!accessToken) {
    throw new Error('OCP login failed: No access token in response');
  }

  return accessToken;
}
