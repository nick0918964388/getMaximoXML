import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock before vi.mock hoisting
const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}));

// Mock https module
vi.mock('https', () => ({
  default: {
    request: mockRequest,
  },
}));
vi.mock('http', () => ({
  default: {},
}));

/**
 * Helper: queue an HTTPS response mock for the next https.request call.
 */
function simulateResponse(
  statusCode: number,
  headers: Record<string, string>,
  body: string
) {
  mockRequest.mockImplementationOnce((_opts: unknown, callback: (res: unknown) => void) => {
    const res = {
      statusCode,
      headers,
      on: vi.fn((event: string, handler: (data?: Buffer) => void) => {
        if (event === 'data') {
          handler(Buffer.from(body));
        }
        if (event === 'end') {
          handler();
        }
      }),
      resume: vi.fn(),
    };
    callback(res);
    return {
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };
  });
}

// Import after mocking
import { getTokenViaRequestHeader, loginToOcp } from '../ocp-auth';

describe('OCP Authentication', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  describe('getTokenViaRequestHeader', () => {
    it('should discover OAuth server before requesting token', async () => {
      // 1. Discovery: .well-known/oauth-authorization-server
      simulateResponse(200, {}, JSON.stringify({
        issuer: 'https://oauth-openshift.apps.ocp.example.com',
      }));

      // 2. OAuth authorize -> redirect with token
      simulateResponse(302, {
        location: 'https://oauth-openshift.apps.ocp.example.com/oauth/token/implicit#access_token=sha256~abc123&token_type=Bearer&expires_in=86400',
      }, '');

      const token = await getTokenViaRequestHeader(
        'https://api.ocp.example.com:6443',
        'testuser',
        'testpass'
      );

      expect(token).toBe('sha256~abc123');

      // Verify first call was to well-known endpoint
      expect(mockRequest).toHaveBeenCalledTimes(2);
      const firstCallOpts = mockRequest.mock.calls[0][0];
      expect(firstCallOpts.hostname).toBe('api.ocp.example.com');
      expect(firstCallOpts.path).toContain('.well-known/oauth-authorization-server');

      // Verify second call uses discovered OAuth server URL
      const secondCallOpts = mockRequest.mock.calls[1][0];
      expect(secondCallOpts.hostname).toBe('oauth-openshift.apps.ocp.example.com');
      expect(secondCallOpts.path).toContain('/oauth/authorize');
    });

    it('should fallback to cluster URL if OAuth discovery fails', async () => {
      // 1. Discovery fails with 404
      simulateResponse(404, {}, 'Not Found');

      // 2. Authorize request to cluster URL directly -> redirect with token
      simulateResponse(302, {
        location: 'https://api.ocp.example.com:6443/oauth/token/implicit#access_token=sha256~fallback&token_type=Bearer',
      }, '');

      const token = await getTokenViaRequestHeader(
        'https://api.ocp.example.com:6443',
        'testuser',
        'testpass'
      );

      expect(token).toBe('sha256~fallback');

      // Second call should fallback to cluster URL
      const secondCallOpts = mockRequest.mock.calls[1][0];
      expect(secondCallOpts.hostname).toBe('api.ocp.example.com');
    });

    it('should throw on 401 (invalid credentials)', async () => {
      // 1. Discovery succeeds
      simulateResponse(200, {}, JSON.stringify({
        issuer: 'https://oauth-openshift.apps.ocp.example.com',
      }));

      // 2. Auth returns 401 (no redirect)
      simulateResponse(401, {}, 'Unauthorized');

      await expect(
        getTokenViaRequestHeader('https://api.ocp.example.com:6443', 'bad', 'creds')
      ).rejects.toThrow('Invalid username or password');
    });

    it('should throw if redirect has no token fragment', async () => {
      // 1. Discovery succeeds
      simulateResponse(200, {}, JSON.stringify({
        issuer: 'https://oauth-openshift.apps.ocp.example.com',
      }));

      // 2. Redirect without fragment
      simulateResponse(302, {
        location: 'https://oauth-openshift.apps.ocp.example.com/oauth/error',
      }, '');

      await expect(
        getTokenViaRequestHeader('https://api.ocp.example.com:6443', 'user', 'pass')
      ).rejects.toThrow('Invalid redirect URL (no token fragment)');
    });
  });

  describe('loginToOcp', () => {
    it('should discover OAuth server and use password grant', async () => {
      // 1. Discovery
      simulateResponse(200, {}, JSON.stringify({
        issuer: 'https://oauth-openshift.apps.ocp.example.com',
      }));

      // 2. Token request via password grant
      simulateResponse(200, {}, JSON.stringify({
        access_token: 'sha256~pwgrant123',
        token_type: 'Bearer',
      }));

      const token = await loginToOcp(
        'https://api.ocp.example.com:6443',
        'testuser',
        'testpass'
      );

      expect(token).toBe('sha256~pwgrant123');

      // Verify token request goes to discovered OAuth server
      const tokenCallOpts = mockRequest.mock.calls[1][0];
      expect(tokenCallOpts.hostname).toBe('oauth-openshift.apps.ocp.example.com');
      expect(tokenCallOpts.path).toContain('/oauth/token');
    });
  });
});
