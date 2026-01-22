import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import type { ApplicationMetadata, SAFieldDefinition } from './types';

// Database project with username
export interface DbProject {
  id: string;
  username: string;
  name: string;
  metadata: ApplicationMetadata;
  fields: SAFieldDefinition[];
  createdAt: string;
  updatedAt: string;
}

// Database row representation
interface DbProjectRow {
  id: string;
  username: string;
  name: string;
  metadata: string; // JSON
  fields: string;   // JSON
  created_at: string;
  updated_at: string;
}

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'projects.db');

let db: Database | null = null;
let currentDbPath: string | null = null;

/**
 * Initialize and return the SQLite database
 */
export async function getDb(dbPath: string = DEFAULT_DB_PATH): Promise<Database> {
  // Return existing instance if path matches
  if (db && currentDbPath === dbPath) {
    return db;
  }

  // Close existing connection if different path
  if (db) {
    await closeDb();
  }

  // Initialize SQL.js with the WASM file from node_modules
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new SQL.Database();
  }

  currentDbPath = dbPath;

  // Initialize schema
  initSchema(db);

  // Save to file
  saveToFile(dbPath);

  return db;
}

/**
 * Initialize database schema
 */
function initSchema(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      name TEXT NOT NULL,
      metadata TEXT NOT NULL,
      fields TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  database.run(`
    CREATE INDEX IF NOT EXISTS idx_projects_username ON projects(username)
  `);
}

/**
 * Save database to file
 */
function saveToFile(dbPath: string = DEFAULT_DB_PATH): void {
  if (!db) return;

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * Close database connection
 */
export async function closeDb(): Promise<void> {
  if (db) {
    // Save before closing
    if (currentDbPath) {
      saveToFile(currentDbPath);
    }
    db.close();
    db = null;
    currentDbPath = null;
  }
}

/**
 * Convert database row to DbProject
 */
function rowToProject(row: DbProjectRow): DbProject {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    metadata: JSON.parse(row.metadata),
    fields: JSON.parse(row.fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Insert a new project
 */
export function insertProject(project: DbProject): void {
  if (!db) throw new Error('Database not initialized');

  db.run(
    `INSERT INTO projects (id, username, name, metadata, fields, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      project.id,
      project.username,
      project.name,
      JSON.stringify(project.metadata),
      JSON.stringify(project.fields),
      project.createdAt,
      project.updatedAt,
    ]
  );

  if (currentDbPath) {
    saveToFile(currentDbPath);
  }
}

/**
 * Get a project by ID
 */
export function getProjectById(id: string): DbProject | null {
  if (!db) throw new Error('Database not initialized');

  const result = db.exec(
    `SELECT id, username, name, metadata, fields, created_at, updated_at
     FROM projects WHERE id = ?`,
    [id]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const row: DbProjectRow = {
    id: values[columns.indexOf('id')] as string,
    username: values[columns.indexOf('username')] as string,
    name: values[columns.indexOf('name')] as string,
    metadata: values[columns.indexOf('metadata')] as string,
    fields: values[columns.indexOf('fields')] as string,
    created_at: values[columns.indexOf('created_at')] as string,
    updated_at: values[columns.indexOf('updated_at')] as string,
  };

  return rowToProject(row);
}

/**
 * Get all projects for a username
 */
export function getProjectsByUsername(username: string): DbProject[] {
  if (!db) throw new Error('Database not initialized');

  const result = db.exec(
    `SELECT id, username, name, metadata, fields, created_at, updated_at
     FROM projects WHERE username = ? ORDER BY updated_at DESC`,
    [username]
  );

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map((values) => {
    const row: DbProjectRow = {
      id: values[columns.indexOf('id')] as string,
      username: values[columns.indexOf('username')] as string,
      name: values[columns.indexOf('name')] as string,
      metadata: values[columns.indexOf('metadata')] as string,
      fields: values[columns.indexOf('fields')] as string,
      created_at: values[columns.indexOf('created_at')] as string,
      updated_at: values[columns.indexOf('updated_at')] as string,
    };
    return rowToProject(row);
  });
}

/**
 * Update a project
 */
export function updateProject(
  id: string,
  updates: Partial<Omit<DbProject, 'id' | 'username' | 'createdAt'>>
): boolean {
  if (!db) throw new Error('Database not initialized');

  const existing = getProjectById(id);
  if (!existing) {
    return false;
  }

  const setClauses: string[] = [];
  const values: (string | null)[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }

  if (updates.metadata !== undefined) {
    setClauses.push('metadata = ?');
    values.push(JSON.stringify(updates.metadata));
  }

  if (updates.fields !== undefined) {
    setClauses.push('fields = ?');
    values.push(JSON.stringify(updates.fields));
  }

  if (updates.updatedAt !== undefined) {
    setClauses.push('updated_at = ?');
    values.push(updates.updatedAt);
  }

  if (setClauses.length === 0) {
    return true;
  }

  values.push(id);

  db.run(`UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`, values);

  if (currentDbPath) {
    saveToFile(currentDbPath);
  }

  return true;
}

/**
 * Delete a project by ID
 */
export function deleteProjectById(id: string): boolean {
  if (!db) throw new Error('Database not initialized');

  const existing = getProjectById(id);
  if (!existing) {
    return false;
  }

  db.run('DELETE FROM projects WHERE id = ?', [id]);

  if (currentDbPath) {
    saveToFile(currentDbPath);
  }

  return true;
}
