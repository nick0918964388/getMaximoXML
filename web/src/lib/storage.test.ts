import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getProjects,
  saveProject,
  getProject,
  deleteProject,
  exportProject,
  importProject,
  getUsername,
  setUsername,
  clearUsername,
} from './storage';
import { DEFAULT_METADATA, DEFAULT_FIELD, SavedProject } from './types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Set up localStorage mock for username
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('testuser');
    (localStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {});
    (localStorage.removeItem as ReturnType<typeof vi.fn>).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('username management', () => {
    it('should get username from localStorage', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('john');
      const result = getUsername();
      expect(result).toBe('john');
      expect(localStorage.getItem).toHaveBeenCalledWith('maximo-xml-generator-username');
    });

    it('should set username in localStorage', () => {
      setUsername('jane');
      expect(localStorage.setItem).toHaveBeenCalledWith('maximo-xml-generator-username', 'jane');
    });

    it('should clear username from localStorage', () => {
      clearUsername();
      expect(localStorage.removeItem).toHaveBeenCalledWith('maximo-xml-generator-username');
    });
  });

  describe('getProjects', () => {
    it('should return empty array when no username', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
      const result = await getProjects();
      expect(result).toEqual([]);
    });

    it('should fetch projects from API', async () => {
      const mockProjects: SavedProject[] = [
        {
          id: 'test-1',
          name: 'Test Project',
          metadata: DEFAULT_METADATA,
          fields: [],
          detailTableConfigs: {},
          dialogTemplates: [],
          subTabConfigs: {},
          mainDetailLabels: {},
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProjects),
      });

      const result = await getProjects();

      expect(mockFetch).toHaveBeenCalledWith('/api/projects?username=testuser');
      expect(result).toEqual(mockProjects);
    });

    it('should return empty array on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const result = await getProjects();
      expect(result).toEqual([]);
    });

    it('should return empty array on non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const result = await getProjects();
      expect(result).toEqual([]);
    });
  });

  describe('saveProject', () => {
    it('should create new project via API', async () => {
      const newProject = {
        id: 'project-123',
        name: 'New Project',
        metadata: DEFAULT_METADATA,
        fields: [DEFAULT_FIELD],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newProject),
      });

      const result = await saveProject('New Project', DEFAULT_METADATA, [DEFAULT_FIELD]);

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(result).toEqual(newProject);
    });

    it('should update existing project via API', async () => {
      const updatedProject = {
        id: 'existing-1',
        name: 'Updated Name',
        metadata: { ...DEFAULT_METADATA, id: 'NEWAPP' },
        fields: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedProject),
      });

      const result = await saveProject('Updated Name', { ...DEFAULT_METADATA, id: 'NEWAPP' }, [], 'existing-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/existing-1', expect.objectContaining({
        method: 'PUT',
      }));
      expect(result).toEqual(updatedProject);
    });

    it('should return null when no username', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
      const result = await saveProject('Test', DEFAULT_METADATA, []);
      expect(result).toBeNull();
    });
  });

  describe('getProject', () => {
    it('should fetch project by ID from API', async () => {
      const mockProject: SavedProject = {
        id: 'test-1',
        name: 'Test Project',
        metadata: DEFAULT_METADATA,
        fields: [],
        detailTableConfigs: {},
        dialogTemplates: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProject),
      });

      const result = await getProject('test-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/test-1');
      expect(result).toEqual(mockProject);
    });

    it('should return null for non-existent project', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const result = await getProject('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete project via API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await deleteProject('test-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/test-1', expect.objectContaining({
        method: 'DELETE',
      }));
      expect(result).toBe(true);
    });

    it('should return false when delete fails', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const result = await deleteProject('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('exportProject', () => {
    it('should export project as JSON string', () => {
      const project: SavedProject = {
        id: 'test-1',
        name: 'Test Project',
        metadata: DEFAULT_METADATA,
        fields: [],
        detailTableConfigs: {},
        dialogTemplates: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = exportProject(project);
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Test Project');
      expect(parsed.metadata).toEqual(DEFAULT_METADATA);
    });
  });

  describe('importProject', () => {
    it('should import project via API', async () => {
      const importedProject = {
        id: 'new-id',
        name: 'Imported Project (Imported)',
        metadata: DEFAULT_METADATA,
        fields: [DEFAULT_FIELD],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(importedProject),
      });

      const projectJson = JSON.stringify({
        id: 'old-id',
        name: 'Imported Project',
        metadata: DEFAULT_METADATA,
        fields: [DEFAULT_FIELD],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      const result = await importProject(projectJson);

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
        method: 'POST',
      }));
      expect(result?.name).toBe('Imported Project (Imported)');
    });

    it('should return null for invalid JSON', async () => {
      const result = await importProject('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for missing required fields', async () => {
      const result = await importProject(JSON.stringify({ name: 'Test' }));
      expect(result).toBeNull();
    });

    it('should return null when no username', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
      const result = await importProject(JSON.stringify({
        name: 'Test',
        metadata: DEFAULT_METADATA,
        fields: [],
      }));
      expect(result).toBeNull();
    });
  });
});
