# Database Migrations

Este directorio contiene las migraciones SQL para el panel de administración BookFast.

## ⚠️ Orden de Ejecución

Las migraciones deben ejecutarse en orden numérico:

1. `001_platform_admin_security.sql` - Infraestructura de seguridad y autenticación

## 📝 Cómo Ejecutar las Migraciones

### Opción 1: Supabase Dashboard (Recomendado para desarrollo)

1. Accede a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido del archivo de migración
5. Ejecuta la query
6. Verifica que no haya errores

### Opción 2: CLI de Supabase

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Iniciar sesión
supabase login

# Enlazar con tu proyecto
supabase link --project-ref YOUR_PROJECT_ID

# Ejecutar migración
supabase db push
```

### Opción 3: Desde terminal con psql

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase-migrations/001_platform_admin_security.sql
```

## 🔍 Verificación Post-Migración

Después de ejecutar cada migración, verifica que se crearon correctamente:

```sql
-- Verificar esquema platform
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'platform';

-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'platform' 
ORDER BY table_name;

-- Verificar roles por defecto
SELECT * FROM platform.platform_roles ORDER BY level;

-- Verificar permisos por defecto
SELECT * FROM platform.platform_permissions ORDER BY resource, action;
```

## 📊 Estructura de Tablas

### Migration 001: Platform Admin Security

Esta migración crea:

- **platform.platform_users** - Usuarios administradores de la plataforma
- **platform.platform_roles** - Definición de roles (RBAC)
- **platform.platform_permissions** - Permisos granulares
- **platform.user_roles** - Asignación usuario-rol
- **platform.role_permissions** - Asignación rol-permiso
- **platform.admin_sessions** - Gestión de sesiones administrativas
- **platform.audit_logs** - Registro completo de auditoría
- **platform.impersonations** - Tracking de impersonaciones
- **platform.rate_limit_overrides** - Excepciones de rate limiting

Funciones SQL creadas:
- `platform.is_platform_admin(uuid)` - Verifica si un usuario es admin
- `platform.get_user_permissions(uuid)` - Obtiene permisos de un usuario
- `platform.has_permission(uuid, text)` - Verifica un permiso específico
- `platform.log_audit(...)` - Registra eventos de auditoría

## 🔐 Seguridad

- Todas las tablas tienen **Row Level Security (RLS)** habilitado
- Las políticas RLS restringen acceso solo a usuarios autorizados
- Los logs de auditoría son inmutables (solo INSERT)
- Las sesiones se rastrean con información completa del dispositivo

## 🚀 Primer Usuario Admin

Después de ejecutar la migración, necesitas crear tu primer usuario admin:

```sql
-- 1. Primero crea un usuario en Supabase Auth (desde Dashboard > Authentication)
-- 2. Luego crea el registro en platform_users:

INSERT INTO platform.platform_users (
  auth_user_id,
  email,
  full_name,
  status
) VALUES (
  'auth-user-id-from-supabase-auth',
  'admin@bookfast.es',
  'Super Admin',
  'active'
);

-- 3. Asigna el rol de super_admin:

INSERT INTO platform.user_roles (user_id, role_id)
SELECT 
  pu.id as user_id,
  pr.id as role_id
FROM platform.platform_users pu
CROSS JOIN platform.platform_roles pr
WHERE pu.email = 'admin@bookfast.es'
AND pr.name = 'super_admin';
```

## 🔄 Rollback

Si necesitas revertir una migración, ejecuta:

```sql
-- Rollback Migration 001
DROP SCHEMA IF EXISTS platform CASCADE;
```

⚠️ **ADVERTENCIA**: Esto eliminará TODOS los datos de las tablas platform.

## 📚 Recursos

- [Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor](https://supabase.com/docs/guides/database/overview#the-sql-editor)
