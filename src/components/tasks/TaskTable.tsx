'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRight, Loader2 } from 'lucide-react';

interface Task {
  id: string;
  type: string;
  tenant_id: string;
  assigned_agent?: string;
  status: 'pendiente' | 'completado' | 'error' | 'aprobado' | 'rechazado';
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  created_by: string;
  error_message?: string;
}

interface TaskTableProps {
  tasks: Task[];
  isLoading?: boolean;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  onFilterChange?: (filters: TaskFilters) => void;
  onPaginationChange?: (limit: number, offset: number) => void;
}

interface TaskFilters {
  status?: string;
  type?: string;
  search?: string;
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

export function TaskTable({
  tasks,
  isLoading = false,
  pagination,
  onFilterChange,
  onPaginationChange,
}: TaskTableProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const handleStatusChange = (status: string) => {
    const newFilters = { ...filters, status: status || undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: string) => {
    const newFilters = { ...filters, type: type || undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    setCurrentPage(1);
  };

  const handleSearchChange = (search: string) => {
    const newFilters = { ...filters, search: search || undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (pagination && onPaginationChange) {
      const offset = (page - 1) * pagination.limit;
      onPaginationChange(pagination.limit, offset);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tareas de Agentes</CardTitle>
          <Link href="/tasks/create">
            <Button>Nueva Tarea</Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Buscar por ID o tenant..."
            className="flex-1 min-w-[200px]"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <Select value={filters.status || ''} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type || ''} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="data_sync">Data Sync</SelectItem>
              <SelectItem value="report_generation">Report Generation</SelectItem>
              <SelectItem value="backup">Backup</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No hay tareas para mostrar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell className="font-mono text-sm">
                      {task.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm">{task.type}</TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS_COLORS[task.status]}
                        variant="outline"
                      >
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority]}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {task.tenant_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(task.created_at), 'd MMM HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Link href={`/tasks/${task.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Mostrando {(currentPage - 1) * pagination.limit + 1} -{' '}
              {Math.min(currentPage * pagination.limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </Button>
              <span className="text-xs flex items-center px-2 py-1">
                Página {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasMore}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
