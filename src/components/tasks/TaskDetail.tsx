'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  Check,
  X,
  RotateCw,
  Edit,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Task {
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

interface TaskLog {
  id: string;
  task_id: string;
  action: string;
  admin_id?: string;
  details: Record<string, any>;
  created_at: string;
}

interface TaskDetailProps {
  task: Task;
  logs?: TaskLog[];
  isLoadingLogs?: boolean;
  onApprove?: (notes: string) => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
  onRetry?: () => Promise<void>;
  onReassign?: (agent: string) => Promise<void>;
}

const STATUS_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado: 'bg-blue-100 text-blue-800',
  completado: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  rechazado: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  completado: 'Completado',
  error: 'Error',
  rechazado: 'Rechazado',
};

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  normal: 'text-blue-500',
  high: 'text-red-500',
};

const PRIORITY_LABELS = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
};

export function TaskDetail({
  task,
  logs = [],
  isLoadingLogs = false,
  onApprove,
  onReject,
  onRetry,
  onReassign,
}: TaskDetailProps) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reassignAgent, setReassignAgent] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsActioning(true);
    try {
      await onApprove(approvalNotes);
      setApprovalNotes('');
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsActioning(true);
    try {
      await onReject(rejectionReason);
      setRejectionReason('');
    } finally {
      setIsActioning(false);
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsActioning(true);
    try {
      await onRetry();
    } finally {
      setIsActioning(false);
    }
  };

  const handleReassign = async () => {
    if (!onReassign || !reassignAgent) return;
    setIsActioning(true);
    try {
      await onReassign(reassignAgent);
      setReassignAgent('');
    } finally {
      setIsActioning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono">{task.id.slice(0, 12)}</h1>
                <Badge className={STATUS_COLORS[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {task.type} • {format(new Date(task.created_at), 'd MMM yyyy HH:mm', { locale: es })}
              </p>
            </div>
            <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority]}`}>
              Prioridad {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{task.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tenant</p>
              <p className="font-mono text-sm">{task.tenant_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agente Asignado</p>
              <p className="font-medium">{task.assigned_agent || 'Sin asignar'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Creado por</p>
              <p className="font-mono text-sm">{task.created_by.slice(0, 8)}...</p>
            </div>
          </CardContent>
        </Card>

        {/* Execution Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ejecución</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Reintentos</p>
              <p className="font-medium">{task.retries} / {task.max_retries}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timeout</p>
              <p className="font-medium">{task.timeout_seconds}s</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Actualización</p>
              <p className="text-sm">
                {format(new Date(task.updated_at), 'd MMM HH:mm', { locale: es })}
              </p>
            </div>
            {task.completed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Completado</p>
                <p className="text-sm">
                  {format(new Date(task.completed_at), 'd MMM HH:mm', { locale: es })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Info (if applicable) */}
      {(task.status === 'aprobado' || task.status === 'rechazado') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {task.status === 'aprobado' ? 'Aprobación' : 'Rechazo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.status === 'aprobado' && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Aprobado por</p>
                  <p className="font-mono text-sm">{task.approved_by?.slice(0, 8)}...</p>
                </div>
                {task.approval_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="text-sm">{task.approval_notes}</p>
                  </div>
                )}
              </>
            )}
            {task.status === 'rechazado' && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Rechazado por</p>
                  <p className="font-mono text-sm">{task.rejected_by?.slice(0, 8)}...</p>
                </div>
                {task.rejection_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Razón</p>
                    <p className="text-sm">{task.rejection_notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(task.payload, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Output */}
      {task.output && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(task.output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {task.error_message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{task.error_message}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {task.status === 'pendiente' && (
            <div className="space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={isActioning}>
                    <Check className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Aprobar Tarea</DialogTitle>
                    <DialogDescription>
                      Agrega notas sobre la aprobación (opcional)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Notas de aprobación..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                    />
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline">Cancelar</Button>
                      <Button
                        onClick={handleApprove}
                        disabled={isActioning}
                      >
                        {isActioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isActioning}>
                    <X className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rechazar Tarea</DialogTitle>
                    <DialogDescription>
                      Explica por qué rechazas esta tarea
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Razón del rechazo..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline">Cancelar</Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isActioning}
                      >
                        {isActioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {(task.status === 'error' || task.status === 'rechazado') && (
            <Button className="w-full" onClick={handleRetry} disabled={isActioning}>
              {isActioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RotateCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isActioning}>
                <Edit className="mr-2 h-4 w-4" />
                Reasignar Agente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reasignar a Agente</DialogTitle>
                <DialogDescription>
                  Selecciona un nuevo agente para ejecutar esta tarea
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="ID del agente"
                  value={reassignAgent}
                  onChange={(e) => setReassignAgent(e.target.value)}
                />
                <div className="flex gap-3 justify-end">
                  <Button variant="outline">Cancelar</Button>
                  <Button
                    onClick={handleReassign}
                    disabled={isActioning || !reassignAgent}
                  >
                    {isActioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reasignar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin historial de actividad
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="text-xs text-muted-foreground flex-shrink-0 w-20">
                    {format(new Date(log.created_at), 'HH:mm', { locale: es })}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    {Object.keys(log.details).length > 0 && (
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
