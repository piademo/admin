'use client';

import { useState } from 'react';
import { TaskTable } from '@/components/tasks/TaskTable';
import { useTasks, TaskFilters } from '@/hooks/useTasks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function TasksPage() {
  const [filters, setFilters] = useState<TaskFilters>({});
  const { tasks, loading, error, pagination, refetch, setPagination } = useTasks(filters);

  const handleFilterChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
    setPagination({ limit: 50, offset: 0 });
  };

  const handlePaginationChange = (limit: number, offset: number) => {
    setPagination({ limit, offset });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tareas de Agentes</h1>
        <p className="text-muted-foreground">
          Gestiona las tareas de los agentes autónomos
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TaskTable
        tasks={tasks}
        isLoading={loading}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onPaginationChange={handlePaginationChange}
      />
    </div>
  );
}
