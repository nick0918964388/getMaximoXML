import { NextResponse } from 'next/server';
import { getDb, insertProject, getProjectsByUsername } from '@/lib/db';

/**
 * GET /api/projects?username=xxx
 * Get all projects for a user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    await getDb();
    const projects = getProjectsByUsername(username);

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, name, metadata, fields, detailTableConfigs = {}, dialogTemplates = [], subTabConfigs = {}, mainDetailLabels = {} } = body;

    if (!username || !name || !metadata || !fields) {
      return NextResponse.json(
        { error: 'Missing required fields: username, name, metadata, fields' },
        { status: 400 }
      );
    }

    await getDb();

    const now = new Date().toISOString();
    const project = {
      id: `project-${Date.now()}`,
      username,
      name,
      metadata,
      fields,
      detailTableConfigs,
      dialogTemplates,
      subTabConfigs,
      mainDetailLabels,
      createdAt: now,
      updatedAt: now,
    };

    insertProject(project);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
