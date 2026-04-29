# 🎯 Admin Project - Complete Context for Development

**Creado:** 29 Abril 2026  
**Estado:** Inicialización completada | Listo para desarrollo  
**Versión Next.js:** 16 con App Router  
**Lenguaje:** TypeScript  

---

## 📋 Resumen Ejecutivo

El proyecto **`/admin/`** es un dashboard administrativo independiente para **BookFast** que permite:
- ✅ Gestionar tareas de agentes (crear, aprobar, rechazar, reintentar, reasignar)
- ✅ Monitorear ejecución de agentes autónomos
- ✅ Auditoría completa de todas las acciones administrativas
- ✅ Control multi-tenant con autenticación de plataforma separada
- ✅ Autenticación y autorización basada en roles (RBAC)

**Separación clara:**
- **`/platform/`** = Aplicación principal de BookFast (usuarios, reservas, servicios)
- **`/admin/`** = Dashboard administrativo aislado (sin código de admin en platform)

---

## 🏗️ Arquitectura General

### Stack Tecnológico
```
Frontend:  Next.js 16 + App Router + TypeScript + React 19
Backend:   Next.js API Routes (TypeScript)
Database:  Supabase PostgreSQL + RLS (Row-Level Security)
Auth:      Supabase Auth + Custom Platform Auth Layer
Audit:     Database trigger-based audit logging
```

### Separación de Esquemas en Supabase
```
platform schema  → Datos de administración (usuarios, roles, permisos, sesiones)
public schema    → Datos de aplicación (bookings, services, customers, etc)
```

**Importante:** No mezclar datos. El admin SOLO accede al schema `platform`.

---

## 🗄️ Estructura de Base de Datos (Supabase)

### Tablas Críticas en Schema `platform`

#### 1. **platform_users**
```typescript
id: uuid (PK)
auth_user_id: uuid (FK → auth.users)
email: string (unique)
full_name: string
status: enum('active', 'inactive', 'suspended')
created_at: timestamp
updated_at: timestamp
```
**Función:** Usuarios administrativos de la plataforma

#### 2. **platform_roles**
```typescript
id: uuid (PK)
name: string (unique) // e.g., 'platform_admin', 'tenant_manager'
description: text
permissions: jsonb (array de permission names)
created_at: timestamp
```
**Función:** Definición de roles disponibles

#### 3. **user_roles**
```typescript
id: uuid (PK)
user_id: uuid (FK → platform_users)
role_id: uuid (FK → platform_roles)
assigned_at: timestamp
created_at: timestamp
```
**Función:** Asignación de roles a usuarios

#### 4. **admin_sessions**
```typescript
id: uuid (PK)
user_id: uuid (FK → platform_users)
auth_session_id: string
ip_address: inet
user_agent: text
started_at: timestamp
ended_at: timestamp (nullable)
is_active: boolean
revoked_at: timestamp (nullable)
revoked_by: uuid (nullable)
revoke_reason: text (nullable)
```
**Función:** Tracking de sesiones administrativas activas

#### 5. **agent_tasks**
```typescript
id: uuid (PK)
type: string // 'data_sync', 'report_generation', etc
tenant_id: uuid (FK → public.tenants)
assigned_agent: string (nullable) // Agent identifier
status: enum('pendiente', 'completado', 'error', 'aprobado', 'rechazado')
priority: enum('low', 'normal', 'high')
payload: jsonb // Task-specific data
output: jsonb (nullable) // Agent execution result
error_message: text (nullable)
max_retries: integer (default 3)
retries: integer (default 0)
timeout_seconds: integer (default 3600)
created_by: uuid (FK → platform_users)
created_at: timestamp
updated_at: timestamp
completed_at: timestamp (nullable)
error_at: timestamp (nullable)
approved_by: uuid (nullable)
approved_at: timestamp (nullable)
approval_notes: text (nullable)
rejected_by: uuid (nullable)
rejected_at: timestamp (nullable)
rejection_notes: text (nullable)
reassigned_at: timestamp (nullable)
```
**Función:** Tareas para agentes autónomos (creación, estado, resultado)

#### 6. **agent_task_logs**
```typescript
id: uuid (PK)
task_id: uuid (FK → agent_tasks)
action: string // 'task_created', 'agent_callback', 'admin_approve', etc
admin_id: uuid (nullable, FK → platform_users)
details: jsonb
created_at: timestamp
```
**Función:** Audit trail de cambios en tareas

#### 7. **audit_logs**
```typescript
id: uuid (PK)
user_id: uuid (FK → platform_users)
action: string // 'create_agent_task', 'approve_task', etc
resource_type: string // 'agent_task', 'admin_session', etc
resource_id: uuid (nullable)
description: text
metadata: jsonb (nullable)
changes: jsonb (nullable)
ip_address: inet (nullable)
severity: enum('info', 'warning', 'error', 'critical')
created_at: timestamp
```
**Función:** Auditoría completa de acciones administrativas

#### 8. **impersonations**
```typescript
id: uuid (PK)
admin_user_id: uuid (FK → platform_users)
admin_session_id: uuid (FK → admin_sessions, nullable)
tenant_id: uuid (FK → public.tenants)
tenant_name: string
reason: text
ip_address: inet
is_active: boolean
started_at: timestamp
ended_at: timestamp (nullable)
max_duration_minutes: integer (default 60)
```
**Función:** Suplantación de tenants para debugging/testing

---

## 🔐 Autenticación y Autorización

### Flujo de Autenticación
1. Usuario inicia sesión en `/admin/`
2. Supabase Auth valida credenciales
3. `validatePlatformAdmin()` verifica:
   - Sesión activa en `auth.users`
   - Registro en `platform_users` con status='active'
   - Rol admin en `user_roles`
   - Sesión no revocada en `admin_sessions`
4. Se retorna `PlatformUser` con roles incluidos

### Archivo Crítico: `/admin/src/lib/auth/platform.ts`
**Funciones disponibles:**
```typescript
validatePlatformAdmin(request) // Valida admin en API requests
getCurrentPlatformUser() // Obtiene usuario actual de sesión
getUserRoles(userId) // Carga roles del usuario
getUserPermissions(userId) // Obtiene permisos específicos
hasPermission(userId, permission) // Verifica un permiso
hasAllPermissions(userId, perms) // Verifica múltiples permisos
verifyPlatformAdmin(authUserId) // Verifica status admin
logAudit(params) // Registra acción en audit_logs
getUserActiveSessions(userId) // Lista sesiones activas
revokeSession(sessionId, reason) // Revoca una sesión
revokeAllSessions(userId, currentSessionId) // Revoca todas excepto actual
startImpersonation(params) // Inicia suplantación de tenant
endImpersonation(impersonationId) // Termina suplantación
getActiveImpersonation(adminUserId) // Obtiene suplantación activa
```

---

## 🛣️ API Endpoints Implementados

### `POST /api/agents/tasks/create`
**Descripción:** Crear nueva tarea de agente  
**Auth:** Requiere plataforma admin  
**Body:**
```typescript
{
  type: string,              // 'data_sync', 'report_generation', etc
  tenant_id: string,         // UUID
  assigned_agent?: string,   // Identificador del agente
  priority: 'low' | 'normal' | 'high',
  payload: object,           // Datos específicos de la tarea
  max_retries?: number,      // Default: 3
  timeout_seconds?: number   // Default: 3600
}
```
**Response:** `{ success: true, task: AgentTask }`  
**Archivo:** `/admin/src/app/api/agents/tasks/create/route.ts`

### `GET /api/agents/tasks`
**Descripción:** Listar tareas con filtros y paginación  
**Auth:** Requiere plataforma admin  
**Query Params:**
```
?status=pendiente&type=data_sync&tenant_id=xxx&limit=50&offset=0
```
**Response:**
```typescript
{
  success: true,
  tasks: AgentTask[],
  pagination: { total, limit, offset, hasMore }
}
```
**Archivo:** `/admin/src/app/api/agents/tasks/route.ts`

### `PATCH /api/agents/tasks/{id}`
**Descripción:** Aprobar, rechazar, reintentar o reasignar tareas  
**Auth:** Requiere plataforma admin  
**Body:**
```typescript
{
  action: 'approve' | 'reject' | 'retry' | 'reassign',
  reason?: string,
  notes?: string,
  assigned_agent?: string  // Requerido solo si action='reassign'
}
```
**Response:** `{ success: true, task_id, new_status }`  
**Archivo:** `/admin/src/app/api/agents/tasks/[id]/route.ts`

### `POST /api/agents/callback`
**Descripción:** Los agentes reporten culminación/fallo de tareas  
**Auth:** Bearer token de agente (validación básica por ahora)  
**Body:**
```typescript
{
  task_id: string,
  status: 'completed' | 'failed',
  output?: object,
  error_message?: string,
  metadata?: object
}
```
**Response:** `{ success: true, task_id, new_status }`  
**Archivo:** `/admin/src/app/api/agents/callback/route.ts`  
**⚠️ TODO:** Implementar validación real de agent tokens contra tabla `registered_agents`

---

## 📁 Estructura de Carpetas del Proyecto

```
admin/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── agents/
│   │   │       ├── tasks/
│   │   │       │   ├── create/
│   │   │       │   │   └── route.ts          ✅ Implementado
│   │   │       │   ├── [id]/
│   │   │       │   │   └── route.ts          ✅ Implementado
│   │   │       │   └── route.ts              ✅ Implementado
│   │   │       └── callback/
│   │   │           └── route.ts              ✅ Implementado
│   │   ├── (app)/                            ❌ TODO: Crear
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                  ❌ TODO: Dashboard principal
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx                  ❌ TODO: Listar tareas
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx              ❌ TODO: Detalle de tarea
│   │   │   │   └── create/
│   │   │   │       └── page.tsx              ❌ TODO: Crear tarea
│   │   │   ├── users/
│   │   │   │   ├── page.tsx                  ❌ TODO: Gestionar usuarios
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx              ❌ TODO: Editar usuario
│   │   │   ├── sessions/
│   │   │   │   └── page.tsx                  ❌ TODO: Sesiones activas
│   │   │   ├── audit/
│   │   │   │   └── page.tsx                  ❌ TODO: Logs de auditoría
│   │   │   ├── layout.tsx                    ❌ TODO: Layout principal
│   │   │   └── page.tsx                      ❌ TODO: Home redirect
│   │   └── auth/
│   │       ├── login/
│   │       │   └── page.tsx                  ❌ TODO: Página login
│   │       └── layout.tsx                    ❌ TODO: Auth layout
│   ├── lib/
│   │   ├── auth/
│   │   │   └── platform.ts                   ✅ Implementado (14 funciones)
│   │   ├── supabase/
│   │   │   ├── server.ts                     ✅ Cliente autenticado
│   │   │   └── service.ts                    ✅ Cliente service role
│   │   └── types/
│   │       └── database.ts                   ❌ TODO: Tipos Supabase
│   └── components/                            ❌ TODO: Componentes reutilizables
│       ├── TaskTable.tsx
│       ├── UserForm.tsx
│       ├── AuditLog.tsx
│       └── ...
├── SUPABASE_ANALYSIS.md                      ✅ Documentación DB
├── CONTEXT.md                                ✅ Este archivo
├── .env.local.example                        ❌ TODO: Crear
├── package.json                              ❌ Revisar dependencias
├── tsconfig.json                             ✅ Configurado
└── next.config.ts                            ✅ Configurado
```

---

## 🔄 Patrones de Código Implementados

### Patrón 1: Validación en API Routes
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación y admin role
    const { user, error: authError } = await validatePlatformAdmin(request);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parsear payload
    const body = await request.json();
    const { field1, field2 } = body;

    // 3. Validar campos requeridos
    if (!field1 || !field2) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. Operación en BD
    const supabase = createServiceClient();
    const { data, error } = await supabase...;

    // 5. Audit logging
    await logAudit({
      userId: user.id,
      action: 'specific_action',
      resourceType: 'resource',
      resourceId: data.id,
      description: 'Human readable description',
      metadata: { details }
    });

    // 6. Response
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### Patrón 2: Audit Logging
```typescript
await logAudit({
  userId: user.id,
  action: 'agent_task_approve',           // Acción específica
  resourceType: 'agent_task',             // Tipo de recurso
  resourceId: taskId,                     // ID del recurso
  description: 'Task approved by admin',  // Descripción legible
  metadata: {                             // Contexto adicional
    priority: task.priority,
    tenant_id: task.tenant_id
  },
  changes: {                              // Qué cambió
    old_status: 'pendiente',
    new_status: 'aprobado'
  },
  severity: 'info'                        // info | warning | error | critical
});
```

### Patrón 3: Service Client (Bypassea RLS)
```typescript
import { createServiceClient } from '@/lib/supabase/service';

const supabase = createServiceClient(); // Obtiene cliente con service_role key
const { data, error } = await supabase
  .from('agent_tasks')
  .select('*')
  .eq('status', 'pendiente');
```

---

## ✅ Lo Que Ya Está Hecho

1. **API Endpoints (4 rutas):**
   - ✅ POST `/api/agents/tasks/create` - Crear tareas
   - ✅ GET `/api/agents/tasks` - Listar con filtros
   - ✅ PATCH `/api/agents/tasks/{id}` - Aprobar/rechazar/reintentar/reasignar
   - ✅ POST `/api/agents/callback` - Agents reportan resultado

2. **Autenticación (14 funciones):**
   - ✅ `validatePlatformAdmin()` - Middleware para API
   - ✅ Verificación de roles y permisos
   - ✅ Gestión de sesiones
   - ✅ Suplantación de tenants
   - ✅ Revocación de sesiones

3. **Auditoría:**
   - ✅ Logging automático de todas las acciones
   - ✅ Tracking de sesiones
   - ✅ Trail completo de cambios

4. **Separación limpia:**
   - ✅ Eliminado todo código `/admin/` del proyecto `/platform/`
   - ✅ Proyecto admin es completamente independiente
   - ✅ Autenticación separada (no comparte contexto con platform)

---

## ❌ Lo Que Falta Hacer (Priorizado)

### 🔴 CRÍTICO (Debe hacerse primero)

1. **Crear primer usuario admin**
   - [ ] Script SQL para insertar usuario en `platform_users`
   - [ ] Asignar rol 'platform_admin' en `user_roles`
   - [ ] Documento de instrucciones

2. **Validación de agent tokens**
   - [ ] Crear tabla `registered_agents` en Supabase
   - [ ] Implementar hash de tokens
   - [ ] Actualizar `/api/agents/callback` para validar contra tabla
   - [ ] Script para generar tokens nuevos

3. **Tests de endpoints**
   - [ ] Crear usuario test en Supabase
   - [ ] Tests con Postman/curl para cada endpoint
   - [ ] Validar flujo completo: crear → callback → approve

### 🟡 IMPORTANTE (Segunda fase)

4. **UI Dashboard - Páginas principales:**
   - [ ] `/dashboard` - Vista general, estadísticas
   - [ ] `/tasks` - Tabla de tareas con filtros, paginación
   - [ ] `/tasks/[id]` - Detalle de tarea + acciones (approve/reject/retry)
   - [ ] `/tasks/create` - Formulario para crear tareas
   - [ ] `/auth/login` - Login (conectar con Supabase Auth)

5. **Componentes reutilizables:**
   - [ ] `TaskTable` - Tabla con sorting/filtering
   - [ ] `TaskForm` - Formulario crear/editar tarea
   - [ ] `TaskDetail` - Vista detallada con logs
   - [ ] `AuditLogViewer` - Visualizar audit trail
   - [ ] `Navigation` - Navbar/sidebar del admin

6. **Gestión de usuarios admin:**
   - [ ] `/users` - Listar usuarios admin
   - [ ] `/users/[id]` - Editar permisos/roles
   - [ ] Formulario invitar nuevo admin

### 🟢 IMPORTANTE (Tercera fase)

7. **Sesiones y seguridad:**
   - [ ] `/sessions` - Ver sesiones activas
   - [ ] Revocación de sesiones desde UI
   - [ ] Logout / Invalidar token

8. **Auditoría:**
   - [ ] `/audit` - Visualizar audit logs
   - [ ] Filtros por acción, usuario, fecha
   - [ ] Export a CSV/PDF

9. **Suplantación (impersonation):**
   - [ ] `/impersonate` - Seleccionar tenant para suplantar
   - [ ] Auto-logout después de max_duration_minutes
   - [ ] Banner que indica suplantación activa

10. **Configuración:**
    - [ ] `/settings` - Configuración de plataforma
    - [ ] Roles y permisos management
    - [ ] Configuración de agentes

---

## 🧪 Plan de Testing

### Fase 1: API Testing (Manual)
```bash
# Crear tarea
curl -X POST http://localhost:3000/api/agents/tasks/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "data_sync",
    "tenant_id": "xxx",
    "priority": "high",
    "payload": {"key": "value"}
  }'

# Listar tareas
curl http://localhost:3000/api/agents/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Aprobar tarea
curl -X PATCH http://localhost:3000/api/agents/tasks/{id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve", "notes": "Looks good"}'

# Callback de agente
curl -X POST http://localhost:3000/api/agents/callback \
  -H "Authorization: Bearer AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "xxx",
    "status": "completed",
    "output": {"result": "data"}
  }'
```

### Fase 2: UI Testing (End-to-end)
- Login → Create task → View in list → Approve → See callback result
- Filter tasks por status/type/tenant
- Pagination

---

## 🚀 Variables de Entorno Necesarias

```env
# .env.local (nunca commitear)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Opcional para desarrollo
NEXT_PUBLIC_DEBUG=true
```

---

## 📚 Recursos Adicionales

### Documentación Creada
- `/admin/SUPABASE_ANALYSIS.md` - Análisis detallado de Supabase
- `/admin/CONTEXT.md` - Este archivo

### Conflictos pre-existentes en Supabase
⚠️ **IMPORTANTE:** Existen 2 tablas duplicadas en Supabase (legacy):
- `platform_users` existe en schema `platform` (correcto) y en `public` (ignorar)
- `audit_logs` existe en schema `platform` (correcto) y en `public` (ignorar)

**Solución:** El admin SOLO usa tablas del schema `platform`. No usar las del schema `public`.

---

## 💡 Notas Importantes para el Desarrollo

1. **RLS (Row-Level Security):**
   - Todos los endpoints usan `createServiceClient()` que bypasea RLS
   - Las políticas RLS están en la BD pero no se aplican a service role
   - Esto es seguro porque `validatePlatformAdmin()` hace la validación en aplicación

2. **Audit Trail:**
   - TODA acción debe logearse con `logAudit()`
   - Incluir contexto suficiente para auditoría legal
   - Severidad debe ser apropiada (info/warning/error/critical)

3. **Errors y Exceptions:**
   - Siempre catch errores y retornar JSON response (nunca throw)
   - Loguear errores en consola para debugging
   - No exponer detalles internos al cliente

4. **Validación:**
   - Validar SIEMPRE los campos requeridos
   - Validar SIEMPRE los tipos y enums
   - Validar SIEMPRE que el usuario tenga permisos

5. **Tenants:**
   - `tenant_id` debe validarse contra tabla `public.tenants`
   - Los admin pueden ver/gestionar tareas de CUALQUIER tenant
   - Para suplantación usar `startImpersonation()`

6. **Agentes:**
   - Los agentes se autentican con Bearer token
   - ⚠️ TODO: Implementar tabla de agentes registrados
   - Callback es la única ruta sin autenticación admin (para que agentes reporten)

---

## 🎯 Próximos Pasos Inmediatos

1. **HOY:**
   - [ ] Crear primer usuario admin en Supabase
   - [ ] Probar endpoints API con curl
   - [ ] Verificar que audit logging funciona

2. **MAÑANA:**
   - [ ] Empezar UI - Dashboard y Task listing
   - [ ] Crear componentes base
   - [ ] Setup de autenticación en frontend

3. **ESTA SEMANA:**
   - [ ] Todas las páginas principales
   - [ ] Full E2E flow testing
   - [ ] Documentación de usuario

---

## 📞 Si Algo No Está Claro

- Revisar `/admin/SUPABASE_ANALYSIS.md` para estructura DB
- Revisar archivos route.ts implementados para ver patrones
- Revisar `/admin/src/lib/auth/platform.ts` para funciones auth
- Este archivo `CONTEXT.md` es tu referencia principal

---

**¡A por ello! 🚀**
