'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskForm, CreateTaskPayload } from '@/components/tasks/TaskForm';
import { useTasks } from '@/hooks/useTasks';
import { createServiceClient } from '@/lib/supabase/service';

export default function CreateTaskPage() {
  const router = useRouter();
  const { createTask } = useTasks();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const supabase = createServiceClient();
      const { data, error: err } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('active', true)
        .limit(100);

      if (err) throw err;
      setTenants(data || []);
    } catch (err: any) {
      console.error('Error loading tenants:', err);
      setTenants([]);
    }
  };

  const handleSubmit = async (data: CreateTaskPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      await createTask(data);
      router.push('/tasks');
    } catch (err: any) {
      setError(err.message || 'Error creating task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear Nueva Tarea</h1>
        <p className="text-muted-foreground">
          Crea una nueva tarea para los agentes autónomos
        </p>
      </div>

      <TaskForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        tenants={tenants}
      />
    </div>
  );
}
