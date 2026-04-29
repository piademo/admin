# ⚡ Quickstart - Primeros 30 minutos

Sigue estos pasos EXACTAMENTE en orden para empezar a desarrollar el admin.

---

## 1️⃣ Entender el Estado Actual (5 min)

Lee estos archivos en este orden:
1. `/admin/CONTEXT.md` - Resumen completo (este documento)
2. `/admin/SUPABASE_ANALYSIS.md` - Estructura de Supabase
3. `/admin/src/lib/auth/platform.ts` - Funciones de auth
4. Uno de los 4 endpoints: `/admin/src/app/api/agents/tasks/route.ts`

**Objetivo:** Entender qué existe y qué falta.

---

## 2️⃣ Crear Primer Usuario Admin (5 min)

Ve a Supabase console de tu proyecto:

```sql
-- 1. Crear usuario en Supabase Auth
-- Usa el UI de Supabase Auth o CLI

-- 2. Ejecuta esto en Supabase SQL Editor:

INSERT INTO platform.platform_users (
  auth_user_id, 
  email, 
  full_name, 
  status
) VALUES (
  'UUID_DEL_AUTH_USER',  -- Reemplaza con UUID real
  'admin@bookfast.com',
  'Admin User',
  'active'
) RETURNING id;

-- 3. Obtén el ID que se retornó, luego asigna rol:

INSERT INTO platform.user_roles (user_id, role_id) 
SELECT 
  'UUID_DEL_PLATFORM_USER',  -- Del paso anterior
  id 
FROM platform.platform_roles 
WHERE name = 'platform_admin';

-- 4. Crea sesión administrativa inicial:

INSERT INTO platform.admin_sessions (
  user_id,
  auth_session_id,
  ip_address,
  user_agent,
  is_active
) VALUES (
  'UUID_DEL_PLATFORM_USER',
  'test-session-001',
  '127.0.0.1'::inet,
  'CLI/Development',
  true
);
```

**Importante:** 
- Reemplaza `UUID_DEL_AUTH_USER` con el UUID real de Supabase Auth
- Reemplaza `UUID_DEL_PLATFORM_USER` con el ID retornado del INSERT

---

## 3️⃣ Probar Endpoint GET (5 min)

Abre Terminal y prueba:

```bash
# Obtén tu SUPABASE_SERVICE_ROLE_KEY de Supabase Settings

curl -X GET "http://localhost:3000/api/agents/tasks?limit=10" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Esperado:** 
```json
{
  "success": true,
  "tasks": [],
  "pagination": {"total": 0, "limit": 10, "offset": 0, "hasMore": false}
}
```

Si falla: Revisa `/admin/src/app/api/agents/tasks/route.ts` y la función `validatePlatformAdmin()`

---

## 4️⃣ Probar Endpoint POST - Crear Tarea (5 min)

```bash
curl -X POST "http://localhost:3000/api/agents/tasks/create" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "data_sync",
    "tenant_id": "tenant-uuid-here",
    "priority": "high",
    "payload": {"source": "test", "action": "sync"},
    "max_retries": 3,
    "timeout_seconds": 3600
  }'
```

**Nota:** Reemplaza `tenant-uuid-here` con un UUID de tenant real (de tabla `public.tenants`)

**Esperado:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "id": "uuid",
    "type": "data_sync",
    "status": "pendiente",
    "created_at": "2026-04-29T...",
    ...
  }
}
```

---

## 5️⃣ Verificar Audit Log (5 min)

En Supabase SQL Editor:

```sql
SELECT * FROM platform.audit_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

Deberías ver 2 registros:
1. `create_agent_task` (del POST)
2. `list_agent_tasks` (del GET anterior)

Si no los ves: El audit logging no está funcionando. Revisa la función `logAudit()`.

---

## ✅ Checklist de Verificación

- [ ] Usuario admin creado en Supabase
- [ ] Auth session creada
- [ ] GET `/api/agents/tasks` retorna JSON
- [ ] POST `/api/agents/tasks/create` crea tarea
- [ ] Tarea aparece en GET listado
- [ ] Audit logs registran acciones

---

## 🚀 Una Vez Verificado Todo

Procede a:

1. **UI Dashboard** - Crear componentes React
   - Página `/dashboard` - Overview
   - Página `/tasks` - Tabla de tareas
   - Página `/tasks/[id]` - Detalle y acciones

2. **Login** - Integrar Supabase Auth
   - Página `/auth/login`
   - Middleware de autenticación
   - Logout

3. **Componentes** - Reutilizables
   - TaskTable con filtros
   - TaskForm para crear
   - AuditLog viewer

---

## 📖 Referencia Rápida de Rutas API

| Método | Ruta | Auth | Body |
|--------|------|------|------|
| POST | `/api/agents/tasks/create` | Admin | type, tenant_id, priority, payload |
| GET | `/api/agents/tasks` | Admin | Query: status, type, tenant_id, limit, offset |
| PATCH | `/api/agents/tasks/{id}` | Admin | action, notes, assigned_agent |
| POST | `/api/agents/callback` | Agent Token | task_id, status, output, error_message |

---

## 🆘 Si Algo Falla

1. **"Unauthorized"** en respuesta:
   - Verificar que usuario admin existe en `platform.platform_users`
   - Verificar que tiene rol en `platform.user_roles`
   - Revisar `validatePlatformAdmin()` en logs

2. **"Internal server error"**:
   - Revisa logs de Next.js (`npm run dev`)
   - Verifica credenciales de Supabase
   - Verifica que tablas existen en Supabase

3. **Audit log no registra**:
   - Verifica que `logAudit()` se está llamando
   - Verifica que la función RPC `log_audit` existe en Supabase
   - Revisa la BD: ¿tabla `platform.audit_logs` existe?

---

**¡Después de estos 30 minutos tendrás una base sólida para empezar desarrollo! 🎉**
