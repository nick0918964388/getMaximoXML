import type { SavedProject } from './types';

const OLD_STORAGE_KEY = 'maximo-xml-generator-projects';

/**
 * Check if there's localStorage data to migrate
 */
export function hasLegacyData(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const data = localStorage.getItem(OLD_STORAGE_KEY);
    if (!data) return false;

    const projects = JSON.parse(data) as SavedProject[];
    return projects.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get legacy projects from localStorage
 */
export function getLegacyProjects(): SavedProject[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(OLD_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedProject[];
  } catch {
    return [];
  }
}

/**
 * Migrate localStorage projects to SQLite via API
 * Returns the number of projects migrated
 */
export async function migrateToSqlite(username: string): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, migrated: 0, failed: 0, error: 'Cannot run on server' };
  }

  const projects = getLegacyProjects();

  if (projects.length === 0) {
    return { success: true, migrated: 0, failed: 0 };
  }

  let migrated = 0;
  let failed = 0;

  for (const project of projects) {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          name: project.name,
          metadata: project.metadata,
          fields: project.fields,
        }),
      });

      if (response.ok) {
        migrated++;
      } else {
        failed++;
        console.error(`Failed to migrate project "${project.name}":`, await response.text());
      }
    } catch (error) {
      failed++;
      console.error(`Failed to migrate project "${project.name}":`, error);
    }
  }

  return {
    success: failed === 0,
    migrated,
    failed,
  };
}

/**
 * Clear legacy localStorage data after successful migration
 */
export function clearLegacyData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OLD_STORAGE_KEY);
}

/**
 * Perform full migration: migrate data and clear localStorage
 */
export async function performMigration(username: string): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  error?: string;
}> {
  const result = await migrateToSqlite(username);

  if (result.success && result.migrated > 0) {
    clearLegacyData();
  }

  return result;
}
