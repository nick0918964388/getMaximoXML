import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { GET, PUT, DELETE } from './route';
import { getDb, closeDb, insertProject } from '@/lib/db';
import { DEFAULT_METADATA, DEFAULT_FIELD } from '@/lib/types';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-api-project-id.db');

// Helper to create test metadata
const createTestMetadata = (overrides = {}) => ({
  ...DEFAULT_METADATA,
  id: 'APP1',
  keyAttribute: 'APPID',
  ...overrides,
});

// Helper to create test project for insert
const createTestProject = (overrides: Record<string, unknown> = {}) => ({
  id: 'project-123',
  username: 'testuser',
  name: 'Test Project',
  metadata: createTestMetadata(),
  fields: [],
  detailTableConfigs: {},
  dialogTemplates: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Mock getDb to use test database
vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db');
  return {
    ...actual,
    getDb: () => actual.getDb(TEST_DB_PATH),
  };
});

describe('API /api/projects/[id]', () => {
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

  describe('GET /api/projects/[id]', () => {
    it('should return a project by ID', async () => {
      insertProject(createTestProject({
        fields: [{ ...DEFAULT_FIELD, fieldName: 'FIELD1', label: 'Field 1' }],
      }));

      const request = new Request('http://localhost:3000/api/projects/project-123');
      const response = await GET(request, { params: Promise.resolve({ id: 'project-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('project-123');
      expect(data.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const request = new Request('http://localhost:3000/api/projects/nonexistent');
      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
    });
  });

  describe('PUT /api/projects/[id]', () => {
    it('should update a project', async () => {
      insertProject(createTestProject({
        name: 'Original Name',
      }));

      const updateData = {
        name: 'Updated Name',
        fields: [{ ...DEFAULT_FIELD, fieldName: 'NEW_FIELD', label: 'New Field' }],
      };

      const request = new Request('http://localhost:3000/api/projects/project-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'project-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
      expect(data.fields[0].fieldName).toBe('NEW_FIELD');
    });

    it('should return 404 when updating non-existent project', async () => {
      const request = new Request('http://localhost:3000/api/projects/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
    });
  });

  describe('DELETE /api/projects/[id]', () => {
    it('should delete a project', async () => {
      insertProject(createTestProject({
        name: 'To Delete',
      }));

      const request = new Request('http://localhost:3000/api/projects/project-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'project-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 404 when deleting non-existent project', async () => {
      const request = new Request('http://localhost:3000/api/projects/nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
    });
  });
});
