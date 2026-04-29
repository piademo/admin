import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/agents/callback
 * Agents report task completion/failure
 *
 * Requires: Valid agent token in Authorization header
 * Body: { task_id, status, output, error_message?, metadata? }
 * Statuses: completed, failed
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate agent authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const agentToken = authHeader.substring(7);

    // TODO: Validate agent token against registered agents table
    // For now, basic validation
    if (!agentToken || agentToken.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid agent token' },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const body = await request.json();
    const { task_id, status, output, error_message, metadata } = body;

    if (!task_id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: task_id, status' },
        { status: 400 }
      );
    }

    const validStatuses = ['completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // 3. Get current task
    const supabase = createServiceClient();
    const { data: task, error: fetchError } = await (supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', task_id)
      .single() as any);

    if (fetchError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 4. Update task status
    const updateData: any = {
      status: status === 'completed' ? 'completado' : 'error',
      completed_at: new Date().toISOString(),
      output,
    };

    if (error_message) {
      updateData.error_message = error_message;
      updateData.error_at = new Date().toISOString();
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data: updatedTask, error: updateError } = await ((supabase
      .from('agent_tasks') as any)
      .update(updateData)
      .eq('id', task_id)
      .select());

    if (updateError) {
      console.error('Error updating agent task:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update task' },
        { status: 500 }
      );
    }

    // 5. Create agent task log
    await supabase.from('agent_task_logs').insert({
      task_id,
      action: 'agent_callback',
      details: {
        status,
        output,
        error_message,
        metadata,
      },
      created_at: new Date().toISOString(),
    } as any);

    // 6. If task failed, optionally trigger retry logic or notification
    if (status === 'failed' && task.retries < task.max_retries) {
      // Task can be manually retried via PATCH endpoint
      // Or implement automatic retry with exponential backoff here
    }

    return NextResponse.json(
      {
        success: true,
        message: `Task ${status}`,
        task_id,
        new_status: updateData.status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/agents/callback error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
