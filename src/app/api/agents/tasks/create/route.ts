import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { validatePlatformAdmin, logAudit } from '@/lib/auth/platform';

/**
 * POST /api/agents/tasks/create
 * Create a new agent task
 *
 * Requires: Authenticated platform admin session
 * Body: {
 *   type: string (e.g., 'data_sync', 'report_generation'),
 *   tenant_id: string,
 *   assigned_agent?: string,
 *   priority: 'low' | 'normal' | 'high',
 *   payload: object,
 *   max_retries?: number,
 *   timeout_seconds?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication and admin role
    const { user, error: authError } = await validatePlatformAdmin(request);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const body = await request.json();
    const {
      type,
      tenant_id,
      assigned_agent,
      priority = 'normal',
      payload,
      max_retries = 3,
      timeout_seconds = 3600,
    } = body;

    // 3. Validate required fields
    if (!type || !tenant_id || !payload) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, tenant_id, payload' },
        { status: 400 }
      );
    }

    const validPriorities = ['low', 'normal', 'high'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Create task
    const supabase = createServiceClient();
    const { data: newTask, error: createError } = await (supabase
      .from('agent_tasks')
      .insert({
        type,
        tenant_id,
        assigned_agent: assigned_agent || null,
        priority,
        payload,
        status: 'pendiente',
        max_retries,
        retries: 0,
        timeout_seconds,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select() as any);

    if (createError) {
      console.error('Error creating agent task:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create task' },
        { status: 500 }
      );
    }

    // 5. Create audit log
    await logAudit({
      userId: user.id,
      action: 'create_agent_task',
      resourceType: 'agent_task',
      resourceId: newTask[0]?.id,
      description: `Created agent task: ${type}`,
      metadata: {
        type,
        tenant_id,
        priority,
        assigned_agent: assigned_agent || null,
      },
    });

    // 6. Create agent task log
    await supabase.from('agent_task_logs').insert({
      task_id: newTask[0]?.id,
      action: 'task_created',
      admin_id: user.id,
      details: {
        type,
        tenant_id,
        priority,
      },
      created_at: new Date().toISOString(),
    } as any);

    return NextResponse.json(
      {
        success: true,
        message: 'Task created successfully',
        task: newTask[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/agents/tasks/create error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
