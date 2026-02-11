import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OslcClient } from './oslc-client';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

describe('OslcClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('constructor + URL building', () => {
    it('should strip trailing slash from baseUrl', () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com/',
        authMethod: 'apikey',
        apiKey: 'test-key',
      });
      // Access internal for testing
      expect(client.getBaseUrl()).toBe('https://maximo.example.com');
    });
  });

  describe('authentication headers', () => {
    it('should use apikey header for apikey auth', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'my-api-key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({ member: [], 'oslc:responseInfo': {} }));
      await client.listObjects();

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['apikey']).toBe('my-api-key');
    });

    it('should use Basic auth header for basic auth', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'basic',
        username: 'admin',
        password: 'secret',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({ member: [], 'oslc:responseInfo': {} }));
      await client.listObjects();

      const [, opts] = mockFetch.mock.calls[0];
      const expected = 'Basic ' + Buffer.from('admin:secret').toString('base64');
      expect(opts.headers['Authorization']).toBe(expected);
    });
  });

  describe('listObjects', () => {
    it('should construct correct URL with pagination', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [{ objectname: 'WORKORDER' }],
        'oslc:responseInfo': { 'oslc:totalCount': 1 },
      }));

      await client.listObjects({ pageSize: 20, pageNum: 2 });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/maximo/oslc/os/mxapiobjectstructure');
      expect(url).toContain('lean=1');
      expect(url).toContain('oslc.pageSize=20');
      expect(url).toContain('pageno=2');
    });

    it('should apply search filter with oslc.where', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [],
        'oslc:responseInfo': { 'oslc:totalCount': 0 },
      }));

      await client.listObjects({ search: 'WORK' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('oslc.where=objectname%3D%22%25WORK%25%22');
    });
  });

  describe('getObjectDetail', () => {
    it('should fetch object attributes', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [
          { attributename: 'WONUM', maxtype: 'ALN' },
          { attributename: 'STATUS', maxtype: 'ALN' },
        ],
        'oslc:responseInfo': { 'oslc:totalCount': 2 },
      }));

      const result = await client.listAttributes('WORKORDER');
      expect(result.member).toHaveLength(2);
    });
  });

  describe('listDomains', () => {
    it('should fetch domains with pagination', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [{ domainid: 'WOSTATUS', domaintype: 'SYNONYM' }],
        'oslc:responseInfo': { 'oslc:totalCount': 1 },
      }));

      const result = await client.listDomains();
      expect(result.member).toHaveLength(1);
      expect(result.member[0].domainid).toBe('WOSTATUS');
    });
  });

  describe('testConnection', () => {
    it('should return true when connection succeeds', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [],
        'oslc:responseInfo': { 'oslc:totalCount': 0 },
      }));

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('should return false on network error', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw on non-OK response', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse(
        { error: 'Unauthorized' },
        401
      ));

      await expect(client.listObjects()).rejects.toThrow('OSLC request failed');
    });
  });

  describe('listRelationships', () => {
    it('should filter by objectname', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [{ name: 'ASSET', parent: 'WORKORDER', child: 'ASSET' }],
        'oslc:responseInfo': { 'oslc:totalCount': 1 },
      }));

      const result = await client.listRelationships('WORKORDER');
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('oslc.where=parent%3D%22WORKORDER%22');
      expect(result.member).toHaveLength(1);
    });
  });

  describe('listIndexes', () => {
    it('should filter by tbname', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [{ name: 'WO_IDX1', tbname: 'WORKORDER' }],
        'oslc:responseInfo': { 'oslc:totalCount': 1 },
      }));

      const result = await client.listIndexes('WORKORDER');
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('WORKORDER');
      expect(result.member).toHaveLength(1);
    });
  });

  describe('listApps', () => {
    it('should fetch applications', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [{ app: 'WOTRACK', description: 'Work Order Tracking' }],
        'oslc:responseInfo': { 'oslc:totalCount': 1 },
      }));

      const result = await client.listApps();
      expect(result.member).toHaveLength(1);
    });
  });

  describe('listModules', () => {
    it('should fetch modules', async () => {
      const client = new OslcClient({
        baseUrl: 'https://maximo.example.com',
        authMethod: 'apikey',
        apiKey: 'key',
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        member: [{ module: 'WORK_MGMT' }],
        'oslc:responseInfo': { 'oslc:totalCount': 1 },
      }));

      const result = await client.listModules();
      expect(result.member).toHaveLength(1);
    });
  });
});
