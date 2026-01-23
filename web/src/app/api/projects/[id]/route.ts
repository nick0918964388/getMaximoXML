import { NextResponse } from 'next/server';
import { getDb, getProjectById, updateProject, deleteProjectById } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]
 * Get a single project by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    await getDb();
    const project = getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    await getDb();

    const existing = getProjectById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const updates: Parameters<typeof updateProject>[1] = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.metadata !== undefined) updates.metadata = body.metadata;
    if (body.fields !== undefined) updates.fields = body.fields;
    if (body.detailTableConfigs !== undefined) updates.detailTableConfigs = body.detailTableConfigs;
    if (body.dialogTemplates !== undefined) updates.dialogTemplates = body.dialogTemplates;

    updateProject(id, updates);

    const updated = getProjectById(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    await getDb();

    const deleted = deleteProjectById(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
