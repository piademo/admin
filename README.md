# BookFast Admin Panel

Panel de administración para BookFast - Sistema de gestión multi-tenant para servicios de reservas.

## 📋 Descripción

Panel administrativo construido con Next.js 16, TypeScript y Tailwind CSS v4 para gestionar tenants, reservas, soporte y reportes de la plataforma BookFast.

## ✨ Características

- 🎨 Modo oscuro por defecto con tema Zinc
- 🔐 Autenticación con Supabase
- 📊 Dashboard con métricas en tiempo real
- 👥 Gestión de tenants
- 📅 Administración de reservas
- 🎫 Sistema de soporte
- 📈 Reportes y analytics
- 🎯 Componentes reutilizables con shadcn/ui
- 🔒 Middleware de protección de rutas

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Base de Datos:** Supabase
- **Validación:** Zod + React Hook Form
- **Iconos:** Lucide React

## 📦 Requisitos

- Node.js 18.x o superior
- npm o yarn
- Cuenta de Supabase

## 🚀 Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd admin
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

4. Ejecutar en modo desarrollo:
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
