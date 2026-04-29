import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { validatePlatformAdmin, logAudit } from '@/lib/auth/platform';

/**
 * GET /api/agents/tasks/{id}
 * Get a single agent task
 *
 * Requires: Authenticated platform admin session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validate authentication and admin role
    const { user, error: authError } = await validatePlatformAdmin(request);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const taskId = id;

    // 2. Get task
    const supabase = createServiceClient();
    const { data: task, error: queryError } = await (supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', taskId)
      .single() as any);

    if (queryError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 3. Log audit
    await logAudit({
      userId: user.id,
      action: 'view_agent_task',
      resourceType: 'agent_task',
      resourceId: taskId,
      description: 'Viewed agent task details',
    });

    return NextResponse.json(
      { success: true, task },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('GET /api/agents/tasks/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/tasks/{id}
 * Approve, reject, retry or reassign tasks
 *
 * Requires: Authenticated platform admin session
 * Body: { action, reason?, notes?, assigned_agent? }
 * Actions: approve, reject, retry, reassign
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validate authentication and admin role
    const { user, error: authError } = await validatePlatformAdmin(request);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const taskId = id;

    // 2. Parse payload
    const body = await request.json();
    const { action, reason, notes, assigned_agent } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'retry', 'reassign'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // 3. Get current task
    const supabase = createServiceClient();
    const { data: task, error: fetchError } = await (supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', taskId)
      .single() as any);

    if (fetchError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 4. Perform action
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'approve':
        updateData.status = 'aprobado';
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
        updateData.approval_notes = notes;
        break;

      case 'reject':
        updateData.status = 'rechazado';
        updateData.rejected_by = user.id;
        updateData.rejected_at = new Date().toISOString();
        updateData.rejection_notes = notes;
        break;

      case 'retry':
        updateData.status = 'pendiente';
        updateData.retries = (task.retries || 0) + 1;
        if (updateData.retries > task.max_retries) {
          return NextResponse.json(
            {
              success: false,
              error: `Maximum retries (${task.max_retries}) exceeded`,
            },
            { status: 400 }
          );
        }
        break;

      case 'reassign':
        if (!assigned_agent) {
          return NextResponse.json(
            { success: false, error: 'assigned_agent required for reassign action' },
            { status: 400 }
          );
        }
        updateData.assigned_agent = assigned_agent;
        updateData.status = 'pendiente';
        updateData.reassigned_at = new Date().toISOString();
        break;
    }

    // 5. Update task
    const { data: updatedTask, error: updateError } = await (supabase
      .from('agent_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select() as any);

    if (updateError) {
      console.error('Error updating agent task:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update task' },
        { status: 500 }
      );
    }

    // 6. Create audit log
    await logAudit({
      userId: user.id,
      action: `agent_task_${action}`,
      resourceType: 'agent_task',
      resourceId: taskId,
      description: `Task ${action}ed`,
      changes: {
        action,
        reason,
        notes,
        assigned_agent,
      },
      severity: action === 'approve' ? 'info' : 'warning',
    });

    // 7. Create agent task log
    await supabase.from('agent_task_logs').insert({
      task_id: taskId,
      action: `admin_${action}`,
      admin_id: user.id,
      details: { reason, notes, assigned_agent },
      created_at: new Date().toISOString(),
    } as any);

    return NextResponse.json(
      {
        success: true,
        message: `Task ${action}ed successfully`,
        task_id: taskId,
        new_status: updateData.status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PATCH /api/agents/tasks/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
