'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { createServiceClient } from '@/lib/supabase/service';

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const router = useRouter();
  const taskId = params.id;
  const { approveTask, rejectTask, retryTask, reassignTask } = useTasks();

  const [task, setTask] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => {
    loadTask();
    loadLogs();
  }, [taskId]);

  const loadTask = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createServiceClient();
      const { data, error: err } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (err) throw err;
      setTask(data);
    } catch (err: any) {
      setError(err.message || 'Error loading task');
      setTask(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    setIsLoadingLogs(true);

    try {
      const supabase = createServiceClient();
      const { data, error: err } = await supabase
        .from('agent_task_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error loading logs:', err);
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleApprove = async (notes: string) => {
    setIsActioning(true);
    setActionError(null);

    try {
      await approveTask(taskId, notes);
      await loadTask();
      await loadLogs();
    } catch (err: any) {
      setActionError(err.message || 'Error approving task');
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async (reason: string) => {
    setIsActioning(true);
    setActionError(null);

    try {
      await rejectTask(taskId, reason);
      await loadTask();
      await loadLogs();
    } catch (err: any) {
      setActionError(err.message || 'Error rejecting task');
    } finally {
      setIsActioning(false);
    }
  };

  const handleRetry = async () => {
    setIsActioning(true);
    setActionError(null);

    try {
      await retryTask(taskId);
      await loadTask();
      await loadLogs();
    } catch (err: any) {
      setActionError(err.message || 'Error retrying task');
    } finally {
      setIsActioning(false);
    }
  };

  const handleReassign = async (agent: string) => {
    setIsActioning(true);
    setActionError(null);

    try {
      await reassignTask(taskId, agent);
      await loadTask();
      await loadLogs();
    } catch (err: any) {
      setActionError(err.message || 'Error reassigning task');
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarea no encontrada</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'No se pudo cargar la tarea'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detalle de Tarea</h1>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <TaskDetail
        task={task}
        logs={logs}
        isLoadingLogs={isLoadingLogs}
        onApprove={handleApprove}
        onReject={handleReject}
        onRetry={handleRetry}
        onReassign={handleReassign}
      />
    </div>
  );
}
