import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_METADATA, DEFAULT_FIELD } from './types';

// Mock the database path for testing
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-projects.db');

// Helper to create test metadata
const createTestMetadata = (overrides = {}) => ({
  ...DEFAULT_METADATA,
  id: 'APP1',
  keyAttribute: 'APPID',
  ...overrides,
});

// Helper to create test field
const createTestField = (overrides = {}) => ({
  ...DEFAULT_FIELD,
  ...overrides,
});

// Helper to create test project
const createTestProject = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-project-1',
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

describe('db', () => {
  beforeEach(() => {
    // Clean up test database before each test
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  afterEach(() => {
    // Clean up test database after each test
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('getDb', () => {
    it('should create database file if not exists', async () => {
      const { getDb, closeDb } = await import('./db');

      const db = await getDb(TEST_DB_PATH);
      expect(db).toBeDefined();
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);

      await closeDb();
    });

    it('should return same database instance on subsequent calls', async () => {
      const { getDb, closeDb } = await import('./db');

      const db1 = await getDb(TEST_DB_PATH);
      const db2 = await getDb(TEST_DB_PATH);

      expect(db1).toBe(db2);

      await closeDb();
    });
  });

  describe('schema', () => {
    it('should create projects table with correct schema', async () => {
      const { getDb, closeDb } = await import('./db');

      const db = await getDb(TEST_DB_PATH);

      // Check table exists
      const result = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='projects'"
      );

      expect(result.length).toBe(1);
      expect(result[0].values[0][0]).toBe('projects');

      await closeDb();
    });

    it('should have username index', async () => {
      const { getDb, closeDb } = await import('./db');

      const db = await getDb(TEST_DB_PATH);

      // Check index exists
      const result = db.exec(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_projects_username'"
      );

      expect(result.length).toBe(1);

      await closeDb();
    });
  });

  describe('CRUD operations', () => {
    it('should insert and retrieve a project', async () => {
      const { getDb, closeDb, insertProject, getProjectById } = await import('./db');

      await getDb(TEST_DB_PATH);

      const project = createTestProject({
        fields: [createTestField({ fieldName: 'FIELD1', label: 'Field 1' })],
      });

      insertProject(project);

      const retrieved = getProjectById('test-project-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-project-1');
      expect(retrieved?.username).toBe('testuser');
      expect(retrieved?.name).toBe('Test Project');
      expect(retrieved?.metadata.id).toBe('APP1');
      expect(retrieved?.fields[0].fieldName).toBe('FIELD1');

      await closeDb();
    });

    it('should get projects by username', async () => {
      const { getDb, closeDb, insertProject, getProjectsByUsername } = await import('./db');

      await getDb(TEST_DB_PATH);

      insertProject(createTestProject({
        id: 'project-1',
        username: 'user1',
        name: 'User1 Project 1',
        metadata: createTestMetadata({ id: 'APP1' }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }));

      insertProject(createTestProject({
        id: 'project-2',
        username: 'user1',
        name: 'User1 Project 2',
        metadata: createTestMetadata({ id: 'APP2' }),
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      }));

      insertProject(createTestProject({
        id: 'project-3',
        username: 'user2',
        name: 'User2 Project',
        metadata: createTestMetadata({ id: 'APP3' }),
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      }));

      const user1Projects = getProjectsByUsername('user1');
      expect(user1Projects.length).toBe(2);

      const user2Projects = getProjectsByUsername('user2');
      expect(user2Projects.length).toBe(1);

      const noProjects = getProjectsByUsername('nonexistent');
      expect(noProjects.length).toBe(0);

      await closeDb();
    });

    it('should update a project', async () => {
      const { getDb, closeDb, insertProject, updateProject, getProjectById } = await import('./db');

      await getDb(TEST_DB_PATH);

      insertProject(createTestProject({
        id: 'project-1',
        username: 'user1',
        name: 'Original Name',
      }));

      updateProject('project-1', {
        name: 'Updated Name',
        fields: [createTestField({ fieldName: 'NEW_FIELD', label: 'New Field' })],
        updatedAt: '2024-01-02T00:00:00.000Z',
      });

      const updated = getProjectById('project-1');
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.fields[0].fieldName).toBe('NEW_FIELD');
      expect(updated?.updatedAt).toBe('2024-01-02T00:00:00.000Z');

      await closeDb();
    });

    it('should delete a project', async () => {
      const { getDb, closeDb, insertProject, deleteProjectById, getProjectById } = await import('./db');

      await getDb(TEST_DB_PATH);

      insertProject(createTestProject({
        id: 'project-1',
        username: 'user1',
        name: 'To Delete',
      }));

      expect(getProjectById('project-1')).toBeDefined();

      const deleted = deleteProjectById('project-1');
      expect(deleted).toBe(true);

      expect(getProjectById('project-1')).toBeNull();

      await closeDb();
    });

    it('should return false when deleting non-existent project', async () => {
      const { getDb, closeDb, deleteProjectById } = await import('./db');

      await getDb(TEST_DB_PATH);

      const deleted = deleteProjectById('nonexistent');
      expect(deleted).toBe(false);

      await closeDb();
    });
  });
});
