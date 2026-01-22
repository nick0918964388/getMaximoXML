import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { GET, POST } from './route';
import { getDb, closeDb, insertProject } from '@/lib/db';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-api-projects.db');

// Mock getDb to use test database
vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db');
  return {
    ...actual,
    getDb: () => actual.getDb(TEST_DB_PATH),
  };
});

describe('API /api/projects', () => {
  beforeEach(async () => {
    // Clean up and initialize test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    await getDb(TEST_DB_PATH);
  });

  afterEach(async () => {
    await closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    vi.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should return empty array when no projects exist', async () => {
      const request = new Request('http://localhost:3000/api/projects?username=testuser');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return projects for specified username', async () => {
      insertProject({
        id: 'project-1',
        username: 'testuser',
        name: 'Test Project',
        metadata: { id: 'APP1', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      insertProject({
        id: 'project-2',
        username: 'otheruser',
        name: 'Other Project',
        metadata: { id: 'APP2', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      const request = new Request('http://localhost:3000/api/projects?username=testuser');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Test Project');
    });

    it('should return 400 when username is missing', async () => {
      const request = new Request('http://localhost:3000/api/projects');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username is required');
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        username: 'testuser',
        name: 'New Project',
        metadata: { id: 'APP1', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [{ fieldName: 'FIELD1', label: 'Field 1' }],
      };

      const request = new Request('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.username).toBe('testuser');
      expect(data.name).toBe('New Project');
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('should return 400 when required fields are missing', async () => {
      const request = new Request('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
