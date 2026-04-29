# 🔧 Troubleshooting Guide

Soluciones rápidas para problemas comunes durante el desarrollo.

---

## 🔴 API Endpoints

### Error: "Unauthorized" (401)

**Síntomas:** Todas las llamadas API retornan 401

**Causas posibles:**
1. Usuario no existe en `platform.platform_users`
2. Usuario está inactivo (`status != 'active'`)
3. Usuario no tiene rol asignado en `platform.user_roles`
4. Bearer token está vacío o inválido

**Solución:**
```sql
-- Verificar que usuario existe
SELECT * FROM platform.platform_users WHERE email = 'admin@bookfast.com';

-- Verificar que tiene rol
SELECT ur.*, r.name 
FROM platform.user_roles ur
JOIN platform.platform_roles r ON ur.role_id = r.id
WHERE ur.user_id = 'USER_ID';

-- Verificar sesión
SELECT * FROM platform.admin_sessions 
WHERE user_id = 'USER_ID' AND is_active = true;
```

Si falta algo:
```sql
-- Recrear usuario
INSERT INTO platform.platform_users (auth_user_id, email, full_name, status)
VALUES ('AUTH_UUID', 'admin@bookfast.com', 'Admin', 'active');

-- Asignar rol
INSERT INTO platform.user_roles (user_id, role_id)
SELECT 'USER_UUID', id FROM platform.platform_roles WHERE name = 'platform_admin';
```

---

### Error: "Failed to fetch tasks" (500)

**Síntomas:** GET `/api/agents/tasks` retorna 500

**Causas posibles:**
1. Supabase service role key inválida
2. Tabla `agent_tasks` no existe
3. Query SQL mal formada
4. Error en función `logAudit()`

**Solución:**
```bash
# 1. Verificar que está corriendo Next.js
npm run dev

# 2. Revisar logs en terminal
# Busca "Error fetching agent tasks:" en la salida

# 3. Verificar Supabase credenciales
# Abre .env.local y verifica:
echo $SUPABASE_SERVICE_ROLE_KEY  # Debe estar definida

# 4. En Supabase SQL Editor, ejecuta:
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'agent_tasks';

# Debe retornar 1 fila. Si no, la tabla no existe.
```

**Si tabla no existe:**
```sql
-- Recrearla desde el SQL de Supabase (ver SUPABASE_ANALYSIS.md)
-- O hacer push de migraciones si usas Supabase migrations
```

---

### Error: "Missing required fields"

**Síntomas:** POST `/api/agents/tasks/create` retorna 400

**Causas posibles:**
1. Body JSON malformado
2. Falta alguno de: `type`, `tenant_id`, `payload`
3. `priority` no es uno de: low, normal, high

**Solución:**
```bash
# Verificar JSON
curl -X POST "http://localhost:3000/api/agents/tasks/create" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "data_sync",
    "tenant_id": "valid-uuid",
    "priority": "high",
    "payload": {"test": true}
  }'

# Importante: Todas estas DEBEN estar presentes
```

---

## 🟡 Auditoría

### Audit Logs no se registran

**Síntomas:** 
- Crear tarea no muestra en `platform.audit_logs`
- `platform.agent_task_logs` está vacío

**Causas posibles:**
1. Función `logAudit()` no se está llamando
2. RPC `log_audit` no existe en Supabase
3. Tabla `platform.audit_logs` no existe

**Solución:**
```typescript
// 1. Verificar que logAudit se llama en route.ts
// En /admin/src/app/api/agents/tasks/create/route.ts
// Busca: await logAudit({...})

// 2. Si no está, añadirlo:
import { logAudit } from '@/lib/auth/platform';

// Después de crear la tarea:
await logAudit({
  userId: user.id,
  action: 'create_agent_task',
  resourceType: 'agent_task',
  resourceId: newTask[0]?.id,
  description: `Created agent task: ${type}`,
  metadata: { type, tenant_id, priority }
});
```

**Si RPC no existe:**
```sql
-- Crear RPC log_audit en Supabase
-- Ver documentación de Supabase de cómo crear RPCs
-- O ejecutar script SQL en SUPABASE_ANALYSIS.md
```

---

## 🔵 Autenticación Frontend

### "Cannot read property 'user' of null"

**Síntomas:** Error en layout cuando intenta acceder a `session.user`

**Causa:** No hay sesión activa

**Solución:**
```typescript
// app/(app)/layout.tsx
const { data: { session } } = await supabase.auth.getSession();

// SIEMPRE verificar
if (!session) {
  redirect('/auth/login');  // ← Agregar esta línea
}
```

---

### Login no funciona

**Síntomas:** Form submit no hace nada o retorna error

**Checklist:**
- [ ] Supabase Auth está habilitado en proyecto
- [ ] Usuario existe en Supabase Auth (crear con email/password)
- [ ] `.env.local` tiene `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Cliente Supabase está inicializado correctamente

**Solución:**
```typescript
// app/auth/login/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogin(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Login error:', error);  // ← Revisar este error
      return;
    }
    
    router.push('/dashboard');  // Redirigir después de login
  }

  // Form...
}
```

---

## 🟢 Database Sync Issues

### "Stale" connection a Supabase

**Síntomas:**
- A veces funciona, a veces falla (intermitente)
- "connection refused"
- Timeout errors

**Solución:**

```typescript
// Asegurar que se crea nuevo cliente cada vez
// MALO (reutilizar cliente):
const supabase = createServiceClient();
// ... usar múltiples veces

// BUENO (crear cuando sea necesario):
async function getTask(taskId: string) {
  const supabase = createServiceClient();  // Crear fresh
  return supabase.from('agent_tasks').select('*').eq('id', taskId);
}
```

---

### "Relation does not exist" error

**Síntomas:** "relation 'public.agent_tasks' does not exist"

**Causa:** Tabla está en schema `platform`, no `public`

**Solución:**
```typescript
// MALO:
const supabase = createServiceClient();
const { data } = await supabase
  .from('agent_tasks')  // ← Intenta 'public.agent_tasks'
  .select('*');

// BUENO (no hacer nada especial, el SDK detecta schema):
// El tema es que agent_tasks DEBE estar en public para el service client
// O usar RPC que tenga lógica en platform schema

// VERIFICAR en Supabase:
SELECT table_schema, table_name FROM information_schema.tables 
WHERE table_name = 'agent_tasks';
```

---

## 🟣 Performance Issues

### Queries lentas

**Síntomas:**
- GET `/api/agents/tasks` tarda >2 segundos
- UI se congela al cargar datos

**Optimización:**

```typescript
// SIN índices (lento)
const { data } = await supabase
  .from('agent_tasks')
  .select('*')
  .eq('status', 'pendiente');  // ← Secuencial scan

// CON índices (rápido)
// En Supabase: CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);

// Además, usar select específico:
const { data } = await supabase
  .from('agent_tasks')
  .select('id, type, status, priority, created_at')  // ← Solo lo necesario
  .eq('status', 'pendiente')
  .limit(50);
```

**Verificar índices:**
```sql
SELECT * FROM pg_indexes WHERE tablename = 'agent_tasks';
```

---

### UI muy lenta al renderizar tabla

**Síntomas:** TaskTable con 1000+ items es slow

**Solución:**
```typescript
// Usar virtualization
import { FixedSizeList } from 'react-window';

export function TaskTable({ tasks }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <TaskRow task={tasks[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

O simplemente usar paginación (mejor):
```typescript
const { limit, offset } = pagination;
const { data } = await supabase
  .from('agent_tasks')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1);
```

---

## 🟠 Type Errors

### "Type 'any' is not assignable to type 'Task'"

**Causa:** TypeScript types incorrectos

**Solución:**
```typescript
// Crear archivo: admin/src/lib/types/database.ts

export interface AgentTask {
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
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  reassigned_at?: string;
}

// Usar en código:
const tasks: AgentTask[] = data;
```

---

## 🔴 Critical Issues

### App no inicia ("Port 3000 already in use")

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>

# Luego:
npm run dev
```

---

### Next.js build fails

```bash
# Limpiar cache
rm -rf .next
rm -rf node_modules
npm install
npm run build

# Si sigue fallando, revisar:
# - TypeScript errors: npm run type-check
# - Lint errors: npm run lint
```

---

## ✅ Verification Checklist

Antes de reportar un bug, verificar:

- [ ] `npm run dev` está corriendo sin errores
- [ ] `.env.local` tiene todas las variables correctas
- [ ] Supabase proyecto está accesible
- [ ] Usuario admin existe en Supabase
- [ ] Tablas existen en BD (SQL Editor)
- [ ] Roles están asignados correctamente
- [ ] Browser console no tiene JS errors
- [ ] Network tab muestra requests/responses correctos

---

## 📞 Debug Mode

Para más verbosidad:

```typescript
// .env.local
NEXT_PUBLIC_DEBUG=true

// En código:
if (process.env.NEXT_PUBLIC_DEBUG) {
  console.log('DEBUG:', detailedInfo);
  console.log('Full response:', response);
}
```

---

**¡Si algo sigue fallando, revisa los logs en Terminal! 90% de los bugs están ahí.**
