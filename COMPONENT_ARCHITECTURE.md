# 🎨 Component Architecture & UI Patterns

Guía para construir la UI del dashboard admin consistentemente.

---

## 📐 Estructura Base

```
admin/src/
├── app/
│   ├── auth/                          # Layout y páginas de auth
│   │   ├── layout.tsx                 # Auth layout (no navbar)
│   │   └── login/
│   │       └── page.tsx               # Formulario login
│   │
│   └── (app)/                         # Layout autenticado
│       ├── layout.tsx                 # Layout principal con navbar
│       ├── page.tsx                   # Home/redirect
│       ├── dashboard/
│       │   └── page.tsx               # Dashboard principal
│       ├── tasks/
│       │   ├── page.tsx               # Listado tareas
│       │   ├── [id]/
│       │   │   └── page.tsx           # Detalle tarea
│       │   └── create/
│       │       └── page.tsx           # Crear tarea
│       ├── users/
│       │   ├── page.tsx               # Gestión usuarios
│       │   └── [id]/
│       │       └── page.tsx           # Editar usuario
│       ├── sessions/
│       │   └── page.tsx               # Sesiones activas
│       └── audit/
│           └── page.tsx               # Audit logs
│
└── components/
    ├── layout/
    │   ├── Navbar.tsx                 # Top navigation
    │   ├── Sidebar.tsx                # Side navigation
    │   └── Layout.tsx                 # Main layout wrapper
    ├── tasks/
    │   ├── TaskTable.tsx              # Tabla con sorting/filtering
    │   ├── TaskForm.tsx               # Crear/editar tarea
    │   ├── TaskDetail.tsx             # Vista detallada
    │   ├── TaskActions.tsx            # Botones approve/reject/retry
    │   └── TaskStatusBadge.tsx        # Badge de status
    ├── users/
    │   ├── UserTable.tsx
    │   ├── UserForm.tsx
    │   └── UserRoleSelector.tsx
    ├── audit/
    │   ├── AuditLogTable.tsx
    │   └── AuditLogFilter.tsx
    ├── common/
    │   ├── Button.tsx                 # Botón base (reutilizable)
    │   ├── Input.tsx                  # Input base
    │   ├── Modal.tsx                  # Modal reutilizable
    │   ├── Loading.tsx                # Spinner/skeleton
    │   ├── Alert.tsx                  # Alert messages
    │   └── Pagination.tsx             # Paginación
    └── hooks/
        ├── useAuth.ts                 # Hook para auth context
        ├── useAdmin.ts                # Hook para API admin
        └── useQuery.ts                # Hook para query params
```

---

## 🎯 Flujo de Autenticación (Frontend)

```typescript
// app/(app)/layout.tsx
export default async function AppLayout({ children }) {
  // 1. Obtener sesión actual
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // 2. Verificar que es admin (opcional frontend, siempre se valida en backend)
  const { user } = await getCurrentPlatformUser();
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
```

---

## 📊 Componentes Principales

### 1. **TaskTable Component**

```typescript
// components/tasks/TaskTable.tsx

interface TaskTableProps {
  tasks: AgentTask[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
  isLoading?: boolean;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  onPaginationChange?: (limit: number, offset: number) => void;
}

export function TaskTable({
  tasks,
  onStatusChange,
  isLoading,
  pagination,
  onPaginationChange
}: TaskTableProps) {
  // Mostrar tabla con:
  // - ID, Type, Status (colored badge), Priority, Tenant, Created, Actions
  // - Sorting por columnas
  // - Click en fila abre /tasks/[id]
  // - Botón rápido "Approve" / "Reject" si está pendiente
  // - Paginación si hay
}
```

### 2. **TaskForm Component**

```typescript
// components/tasks/TaskForm.tsx

interface TaskFormProps {
  onSubmit: (data: CreateTaskPayload) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  tenants?: { id: string; name: string }[];
}

export function TaskForm({ onSubmit, isLoading, error, tenants }: TaskFormProps) {
  // Formulario con campos:
  // - Type (dropdown: data_sync, report_generation, etc)
  // - Tenant (dropdown de tenants)
  // - Priority (radio: low, normal, high)
  // - Payload (JSON editor o campo de texto)
  // - Max retries (number input, default 3)
  // - Timeout seconds (number input, default 3600)
  // - Botón Submit
  // - Error message si falla
}
```

### 3. **TaskDetail Component**

```typescript
// components/tasks/TaskDetail.tsx

interface TaskDetailProps {
  task: AgentTask;
  logs: AgentTaskLog[];
  isLoadingLogs?: boolean;
  onApprove?: (notes: string) => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
  onRetry?: () => Promise<void>;
  onReassign?: (agent: string) => Promise<void>;
}

export function TaskDetail({
  task,
  logs,
  isLoadingLogs,
  onApprove,
  onReject,
  onRetry,
  onReassign
}: TaskDetailProps) {
  // Mostrar:
  // - Header con ID, Type, Status, Priority
  // - Sección Información: tenant, assigned_agent, created_by, created_at
  // - Sección Payload (JSON visualizado)
  // - Sección Output (si completado)
  // - Sección Error (si falló)
  // - Timeline de logs (action, timestamp, details)
  // - Acciones contextuales según status:
  //   - Si pendiente: [Approve] [Reject] [Retry] [Reassign]
  //   - Si aprobado: [Reject] [Retry]
  //   - Si error: [Retry] [Reject]
  //   - Si completado: [Reject] (para reabrir)
}
```

### 4. **AuditLogTable Component**

```typescript
// components/audit/AuditLogTable.tsx

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  filters?: {
    action?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
  onFilterChange?: (filters: any) => void;
}

export function AuditLogTable({
  logs,
  isLoading,
  filters,
  onFilterChange
}: AuditLogTableProps) {
  // Tabla con:
  // - Timestamp, Action, User, Resource Type, Resource ID, Description, Severity
  // - Colores según severity (info=grey, warning=yellow, error=red, critical=dark red)
  // - Click expande detalles (metadata, changes)
  // - Filtros: action, user, date range, severity
}
```

---

## 🎨 Estilos y Patrones

### Colores por Status
```typescript
const statusColors = {
  pendiente: 'bg-yellow-100 text-yellow-800',      // Amarillo
  aprobado: 'bg-blue-100 text-blue-800',           // Azul
  completado: 'bg-green-100 text-green-800',       // Verde
  error: 'bg-red-100 text-red-800',                // Rojo
  rechazado: 'bg-gray-100 text-gray-800',          // Gris
};

const priorityColors = {
  low: 'text-gray-500',
  normal: 'text-blue-500',
  high: 'text-red-500',
};

const severityColors = {
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
  critical: 'bg-red-100 border-red-400',
};
```

### Button Variants
```typescript
<Button variant="primary" size="md">Approve</Button>
<Button variant="danger" size="md">Reject</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="ghost" size="sm">More</Button>
```

### Loading States
```typescript
// Para tablas
<TaskTable tasks={tasks} isLoading={isLoading} />

// Para formularios
<TaskForm onSubmit={handleSubmit} isLoading={isSubmitting} />

// Para datos individuales
<TaskDetail task={task} isLoadingLogs={isLoadingLogs} />
```

---

## 🔄 Manejo de Estado y Datos

### Custom Hook: useAdmin
```typescript
// hooks/useAdmin.ts

export function useAdmin() {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    try {
      const { user } = await getCurrentPlatformUser();
      setUser(user);
    } catch (err) {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  }

  return { user, loading, error, refetch: loadCurrentUser };
}
```

### Custom Hook: useTasks
```typescript
// hooks/useTasks.ts

export function useTasks(filters?: TaskFilters, pagination?: PaginationParams) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(pagination);

  useEffect(() => {
    loadTasks();
  }, [filters, pagination]);

  async function loadTasks() {
    try {
      const response = await fetch('/api/agents/tasks?...');
      const data = await response.json();
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function createTask(payload: CreateTaskPayload) {
    const response = await fetch('/api/agents/tasks/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    await loadTasks(); // Refrescar lista
    return data.task;
  }

  async function approveTask(taskId: string, notes?: string) {
    const response = await fetch(`/api/agents/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve', notes })
    });
    await loadTasks();
    return response.json();
  }

  // Similar: rejectTask, retryTask, reassignTask

  return { tasks, loading, error, pagination, createTask, approveTask, ... };
}
```

---

## 📱 Ejemplo: Página /tasks

```typescript
// app/(app)/tasks/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { TaskTable } from '@/components/tasks/TaskTable';
import { Button } from '@/components/common/Button';
import { useTasks } from '@/hooks/useTasks';
import Link from 'next/link';

export default function TasksPage() {
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const { tasks, loading, error, pagination: paginationData, approveTask } = useTasks(filters, pagination);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agent Tasks</h1>
        <Link href="/tasks/create">
          <Button variant="primary">Create Task</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error" onClose={() => window.location.reload()}>
          {error}
        </Alert>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="border px-3 py-2 rounded"
        />
        <select 
          value={filters.status || ''}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="border px-3 py-2 rounded ml-2"
        >
          <option value="">All Status</option>
          <option value="pendiente">Pending</option>
          <option value="completado">Completed</option>
          <option value="error">Error</option>
        </select>
      </div>

      <TaskTable
        tasks={tasks}
        isLoading={loading}
        pagination={paginationData}
        onPaginationChange={(limit, offset) => setPagination({ limit, offset })}
        onStatusChange={(taskId, status) => {
          if (status === 'approve') approveTask(taskId);
        }}
      />
    </div>
  );
}
```

---

## 🧪 Testing Components

### Unit Test Example
```typescript
// components/tasks/__tests__/TaskTable.test.tsx

import { render, screen } from '@testing-library/react';
import { TaskTable } from '../TaskTable';

describe('TaskTable', () => {
  it('renders tasks', () => {
    const tasks = [
      { id: '1', type: 'data_sync', status: 'pendiente', ... }
    ];
    render(<TaskTable tasks={tasks} />);
    expect(screen.getByText('data_sync')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TaskTable tasks={[]} isLoading={true} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
});
```

---

## 📝 Checklist para Cada Componente

- [ ] Props bien tipadas (TypeScript)
- [ ] Estados de loading y error
- [ ] Accessible (aria labels, keyboard navigation)
- [ ] Responsive (mobile friendly)
- [ ] Tests unitarios
- [ ] Documentación JSDoc
- [ ] Manejo de errores graceful
- [ ] Loading skeletons donde corresponda

---

## 🚀 Orden Recomendado de Implementación

1. **Componentes base** (Button, Input, Modal, Alert)
2. **Componentes layout** (Navbar, Sidebar, Layout)
3. **Autenticación** (login page, auth context)
4. **TaskTable + TaskDetail** (leyendo datos)
5. **TaskForm + acciones** (creando/editando)
6. **Páginas restantes** (users, sessions, audit)

---

**¡Sigue este patrón para mantener la UI consistente y escalable!**
