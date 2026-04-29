'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface TaskFormProps {
  onSubmit: (data: CreateTaskPayload) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  tenants?: Array<{ id: string; name: string }>;
}

export interface CreateTaskPayload {
  type: string;
  tenant_id: string;
  assigned_agent?: string;
  priority: 'low' | 'normal' | 'high';
  payload: Record<string, any>;
  max_retries?: number;
  timeout_seconds?: number;
}

export function TaskForm({
  onSubmit,
  isLoading = false,
  error,
  tenants = [],
}: TaskFormProps) {
  const [payloadText, setPayloadText] = useState('{}');
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      type: 'data_sync',
      tenant_id: '',
      assigned_agent: '',
      priority: 'normal' as const,
      max_retries: 3,
      timeout_seconds: 3600,
    },
  });

  const handleSubmit = async (data: any) => {
    // Validate payload JSON
    try {
      const payload = JSON.parse(payloadText);
      setPayloadError(null);

      await onSubmit({
        ...data,
        payload,
        max_retries: data.max_retries ? parseInt(data.max_retries) : 3,
        timeout_seconds: data.timeout_seconds ? parseInt(data.timeout_seconds) : 3600,
      });
    } catch (err: any) {
      setPayloadError('Invalid JSON: ' + err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nueva Tarea</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Tarea</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="data_sync">Data Sync</SelectItem>
                    <SelectItem value="report_generation">Report Generation</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona el tipo de tarea a ejecutar
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tenant */}
          <FormField
            control={form.control}
            name="tenant_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tenant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  El tenant al cual aplica esta tarea
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridad</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Nivel de prioridad de ejecución
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Assigned Agent */}
          <FormField
            control={form.control}
            name="assigned_agent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agente Asignado (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Identificador del agente"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Identificador del agente que ejecutará esta tarea
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max Retries */}
          <FormField
            control={form.control}
            name="max_retries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Máximo de Reintentos</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Número máximo de reintentos si falla
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Timeout */}
          <FormField
            control={form.control}
            name="timeout_seconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeout (segundos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="60"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Tiempo máximo de ejecución en segundos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payload */}
          <FormItem>
            <FormLabel>Payload (JSON)</FormLabel>
            <FormControl>
              <textarea
                className="w-full px-3 py-2 border rounded-md font-mono text-sm min-h-[200px]"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                placeholder='{"key": "value"}'
              />
            </FormControl>
            <FormDescription>
              Datos específicos de la tarea en formato JSON
            </FormDescription>
            {payloadError && (
              <p className="text-sm text-destructive mt-2">{payloadError}</p>
            )}
          </FormItem>

          {/* Submit */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Tarea'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
