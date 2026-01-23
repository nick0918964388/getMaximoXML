import type { SavedProject, SAFieldDefinition, ApplicationMetadata, DetailTableConfig, DialogTemplate } from './types';

const USERNAME_KEY = 'maximo-xml-generator-username';

// ================= Username Management =================

/**
 * Get current username from localStorage
 */
export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USERNAME_KEY);
}

/**
 * Set username in localStorage
 */
export function setUsername(username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERNAME_KEY, username);
}

/**
 * Clear username from localStorage
 */
export function clearUsername(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USERNAME_KEY);
}

// ================= Project API Calls =================

/**
 * Get all saved projects for current user from API
 */
export async function getProjects(username?: string): Promise<SavedProject[]> {
  const user = username || getUsername();
  if (!user) return [];

  try {
    const response = await fetch(`/api/projects?username=${encodeURIComponent(user)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Save a project via API
 */
export async function saveProject(
  name: string,
  metadata: ApplicationMetadata,
  fields: SAFieldDefinition[],
  existingId?: string,
  username?: string,
  detailTableConfigs: Record<string, DetailTableConfig> = {},
  dialogTemplates: DialogTemplate[] = []
): Promise<SavedProject | null> {
  const user = username || getUsername();
  if (!user) return null;

  try {
    if (existingId) {
      // Update existing project
      const response = await fetch(`/api/projects/${existingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, metadata, fields, detailTableConfigs, dialogTemplates }),
      });

      if (!response.ok) return null;
      return await response.json();
    }

    // Create new project
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user,
        name,
        metadata,
        fields,
        detailTableConfigs,
        dialogTemplates,
      }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get a project by ID via API
 */
export async function getProject(id: string): Promise<SavedProject | null> {
  try {
    const response = await fetch(`/api/projects/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Delete a project by ID via API
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Export project as JSON (no API call needed)
 */
export function exportProject(project: SavedProject): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Import project from JSON via API
 */
export async function importProject(json: string, username?: string): Promise<SavedProject | null> {
  const user = username || getUsername();
  if (!user) return null;

  try {
    const project = JSON.parse(json) as SavedProject;

    // Validate required fields
    if (!project.name || !project.metadata || !project.fields) {
      return null;
    }

    // Create new project via API with imported data
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user,
        name: `${project.name} (Imported)`,
        metadata: project.metadata,
        fields: project.fields,
        detailTableConfigs: project.detailTableConfigs || {},
        dialogTemplates: project.dialogTemplates || [],
      }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
