# BookFast Admin Panel

Panel de administración para BookFast - Sistema de gestión multi-tenant para servicios de reservas.

## 📋 Descripción

Panel administrativo construido con Next.js 16, TypeScript y Tailwind CSS v4 para gestionar tenants, reservas, soporte y reportes de la plataforma BookFast.

## ✨ Características Implementadas

### Sprint 1: Infraestructura y Seguridad ✅
- [x] 🔐 Autenticación admin aislada (platform_users)
- [x] 🎨 UI Base con shadcn/ui y Tailwind v4
- [x] 📊 Dashboard básico con métricas
- [x] 🔒 Middleware de protección de rutas
- [x] 📝 Sistema de auditoría completo
- [x] 👥 RBAC (Roles y permisos granulares)
- [ ] 🔑 MFA obligatorio con TOTP
- [ ] ⏱️ Rate limiting con Upstash Redis
- [ ] 🖥️ Gestión de sesiones activas

### Sprint 2: Gestión de Tenants (En progreso)
- [ ] CRUD completo de tenants
- [ ] Ciclo de vida (trial, active, suspended, etc.)
- [ ] Búsqueda avanzada y filtros
- [ ] Impersonación segura con auditoría
- [ ] Export GDPR por tenant

### Sprint 3: Gestión de Bookings
- [ ] Buscador global de reservas
- [ ] Acciones rápidas (cancelar, refund, mover)
- [ ] Wizard de resolución de conflictos
- [ ] Integración con Stripe
- [ ] Notificaciones automáticas

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS v4
- **UI Components:** shadcn/ui + Radix UI
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Validación:** Zod + React Hook Form
- **Iconos:** Lucide React

## 📦 Requisitos

- Node.js 18.x o superior
- npm, pnpm o yarn
- Cuenta de Supabase

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/piademo/admin.git
cd admin
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Ejecutar migraciones de base de datos

Ver instrucciones detalladas en [`supabase-migrations/README.md`](./supabase-migrations/README.md)

**Resumen rápido:**
1. Ve a [Supabase Dashboard](https://app.supabase.com) > SQL Editor
2. Ejecuta el contenido de `supabase-migrations/001_platform_admin_security.sql`
3. Verifica que se crearon las tablas en el esquema `platform`

### 5. Crear primer usuario admin

```sql
-- En Supabase Dashboard > SQL Editor

-- 1. Primero crea un usuario en Authentication > Add User
-- 2. Luego ejecuta:

INSERT INTO platform.platform_users (
  auth_user_id,
  email,
  full_name,
  status
) VALUES (
  'uuid-del-usuario-creado',
  'admin@bookfast.es',
  'Super Admin',
  'active'
);

-- 3. Asigna el rol de super_admin:

INSERT INTO platform.user_roles (user_id, role_id)
SELECT pu.id, pr.id
FROM platform.platform_users pu
CROSS JOIN platform.platform_roles pr
WHERE pu.email = 'admin@bookfast.es'
AND pr.name = 'super_admin';
```

### 6. Ejecutar en modo desarrollo

```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3001](http://localhost:3001)

## 📁 Estructura del Proyecto

```
admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── AdminHeader.tsx
│   │   └── ui/
│   │       └── [shadcn components]
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── public/
├── .env.example
├── components.json
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 Comandos Disponibles

- `npm run dev` - Inicia el servidor de desarrollo en puerto 3001
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🔒 Seguridad

- ⚠️ **IMPORTANTE:** El `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse al cliente
- Las sesiones se validan en el middleware antes de acceder a rutas protegidas
- Todos los inputs se validan con Zod
- Las cookies se manejan de forma segura con Supabase SSR

## 🎨 Componentes UI

El proyecto incluye los siguientes componentes de shadcn/ui:

- Button
- Card
- Input
- Label
- Dropdown Menu
- Avatar
- Badge
- Separator

## 📝 Licencia

Este proyecto es parte de BookFast Platform.

## 👥 Contribución

Para contribuir al proyecto, por favor sigue las guías de estilo y asegúrate de que todos los tests pasen antes de crear un pull request.
