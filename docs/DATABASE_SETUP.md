# 🚀 Guía de Setup de Base de Datos

## Prerequisitos
- Acceso a Supabase Dashboard: https://jsqminbgggwhvkfgeibz.supabase.co
- Usuario creado en Authentication: admin3@bookfast.es

## Paso 1: Ejecutar Migración Principal

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Click en **New Query**
3. Copia y pega el contenido de: `supabase-migrations/001_platform_admin_security.sql`
4. Click en **Run** (o F5)
5. Espera a ver "Success" ✅

**¿Qué hace este script?**
- Crea schema `platform`
- Crea tablas: `platform_users`, `platform_roles`, `platform_permissions`, etc.
- Configura RBAC (roles y permisos)
- Inserta 5 roles por defecto: super_admin, admin, support, billing, viewer
- Inserta 20+ permisos
- Configura RLS policies
- Crea funciones auxiliares

## Paso 2: Obtener UUID del Usuario

1. En **SQL Editor**, ejecuta:
```sql
SELECT id, email FROM auth.users WHERE email = 'admin3@bookfast.es';
```

2. Copia el UUID (algo como: `c60c4cc8-b0ed-49a0-b7bf-61df3d515eb5`)

## Paso 3: Insertar Platform User

1. Abre `scripts/insert-platform-user-admin3.sql`
2. **REEMPLAZA** el UUID en la línea 15:
   ```sql
   v_auth_user_id UUID := 'TU-UUID-AQUI';
   ```
3. Copia todo el archivo
4. Pega en **SQL Editor**
5. Click en **Run**

**¿Qué hace este script?**
- Vincula el usuario de `auth.users` con `platform.platform_users`
- Le asigna el rol `super_admin`
- Verifica que todo esté correcto
- Muestra un resumen

## Paso 4: Verificar

Ejecuta en SQL Editor:
```sql
SELECT 
  pu.email,
  pu.full_name,
  pu.status,
  pr.name as role
FROM platform.platform_users pu
JOIN platform.user_roles ur ON ur.user_id = pu.id
JOIN platform.platform_roles pr ON pr.id = ur.role_id
WHERE pu.email = 'admin3@bookfast.es';
```

Deberías ver:
```
email                 | full_name      | status | role
admin3@bookfast.es    | Admin BookFast | active | super_admin
```

## Paso 5: Iniciar Aplicación

```bash
npm run dev
```

Ve a: http://localhost:3001/login

**Credenciales:**
- Email: `admin3@bookfast.es`
- Password: `Admin2024!`

## 🎯 Siguiente Paso: Configurar MFA

1. Después de login, verás un banner amarillo: **"Tu cuenta no tiene MFA configurado"**
2. Click en **"Configurar MFA"**
3. Escanea el código QR con tu app autenticadora (Google Authenticator, Authy, etc.)
4. Guarda los 10 códigos de backup en lugar seguro
5. Ingresa un código de 6 dígitos para verificar

---

## 🐛 Troubleshooting

### Error: "relation platform.platform_users does not exist"
→ Ejecuta el Paso 1 (migración principal)

### Error: "User does not exist in auth.users"
→ Verifica que el usuario existe en Authentication

### Error: "super_admin role not found"
→ La migración no se ejecutó completamente. Re-ejecuta el Paso 1

### Error al hacer login
→ Verifica que:
1. La migración se ejecutó ✅
2. El platform_user se creó ✅
3. El dev server está corriendo ✅
4. Las variables de entorno están en `.env.local` ✅
