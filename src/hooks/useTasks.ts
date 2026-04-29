import { useState, useEffect, useCallback } from 'react';

export interface Task {
  id: string;
  type: string;
  tenant_id: string;
  assigned_agent?: string;
  status: 'pendiente' | 'completado' | 'error' | 'aprobado' | 'rechazado';
  priority: 'low' | 'normal' | 'high';
  payload: Record<string, any>;
  output?: Record<string, any>;
  error_message?: string;
  max_retries: number;
  retries: number;
  timeout_seconds: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  completed_at?: string;
  error_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  approval_notes?: string;
  rejection_notes?: string;
}

export interface TaskLog {
  id: string;
  task_id: string;
  action: string;
  admin_id?: string;
  details: Record<string, any>;
  created_at: string;
}

export interface TaskFilters {
  status?: string;
  type?: string;
  tenant_id?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface TasksResponse {
  success: boolean;
  tasks: Task[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function useTasks(filters?: TaskFilters, pagination?: PaginationParams) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationState, setPaginationState] = useState({
    limit: pagination?.limit || 50,
    offset: pagination?.offset || 0,
    total: 0,
    hasMore: false,
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.tenant_id) params.set('tenant_id', filters.tenant_id);
      params.set('limit', paginationState.limit.toString());
      params.set('offset', paginationState.offset.toString());

      const response = await fetch(`/api/agents/tasks?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const data: TasksResponse = await response.json();
      setTasks(data.tasks || []);
      setPaginationState((prev) => ({
        ...prev,
        ...data.pagination,
      }));
    } catch (err: any) {
      setError(err.message || 'Error loading tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filters, paginationState.limit, paginationState.offset]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(
    async (payload: any) => {
      try {
        const response = await fetch('/api/agents/tasks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create task');
        }

        await loadTasks();
        return await response.json();
      } catch (err: any) {
        throw new Error(err.message);
      }
    },
    [loadTasks]
  );

  const getTask = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/agents/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to load task');
      }
      return await response.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, []);

  const approveTask = useCallback(
    async (taskId: string, notes?: string) => {
      try {
        const response = await fetch(`/api/agents/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve', notes }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to approve task');
        }

        await loadTasks();
        return await response.json();
      } catch (err: any) {
        throw new Error(err.message);
      }
    },
    [loadTasks]
  );

  const rejectTask = useCallback(
    async (taskId: string, reason?: string) => {
      try {
        const response = await fetch(`/api/agents/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject', notes: reason }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to reject task');
        }

        await loadTasks();
        return await response.json();
      } catch (err: any) {
        throw new Error(err.message);
      }
    },
    [loadTasks]
  );

  const retryTask = useCallback(
    async (taskId: string) => {
      try {
        const response = await fetch(`/api/agents/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'retry' }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to retry task');
        }

        await loadTasks();
        return await response.json();
      } catch (err: any) {
        throw new Error(err.message);
      }
    },
    [loadTasks]
  );

  const reassignTask = useCallback(
    async (taskId: string, agent: string) => {
      try {
        const response = await fetch(`/api/agents/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reassign', assigned_agent: agent }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to reassign task');
        }

        await loadTasks();
        return await response.json();
      } catch (err: any) {
        throw new Error(err.message);
      }
    },
    [loadTasks]
  );

  return {
    tasks,
    loading,
    error,
    pagination: paginationState,
    createTask,
    getTask,
    approveTask,
    rejectTask,
    retryTask,
    reassignTask,
    refetch: loadTasks,
    setPagination: setPaginationState,
  };
}
