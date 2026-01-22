import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock the database path for testing
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-projects.db');

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

      const project = {
        id: 'test-project-1',
        username: 'testuser',
        name: 'Test Project',
        metadata: { id: 'APP1', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [{ fieldName: 'FIELD1', label: 'Field 1' }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

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

      insertProject({
        id: 'project-1',
        username: 'user1',
        name: 'User1 Project 1',
        metadata: { id: 'APP1', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      insertProject({
        id: 'project-2',
        username: 'user1',
        name: 'User1 Project 2',
        metadata: { id: 'APP2', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [],
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });

      insertProject({
        id: 'project-3',
        username: 'user2',
        name: 'User2 Project',
        metadata: { id: 'APP3', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [],
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      });

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

      insertProject({
        id: 'project-1',
        username: 'user1',
        name: 'Original Name',
        metadata: { id: 'APP1', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      updateProject('project-1', {
        name: 'Updated Name',
        fields: [{ fieldName: 'NEW_FIELD', label: 'New Field' }],
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

      insertProject({
        id: 'project-1',
        username: 'user1',
        name: 'To Delete',
        metadata: { id: 'APP1', keyAttribute: 'APPID', mboName: 'SR', version: '7.6.1.2', orderBy: '', whereClause: '', isStandardObject: true },
        fields: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

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
