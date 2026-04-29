# AGENTES_MASTER.md
# BookFast Pro — Documento Maestro de Automatización con Agentes AI

> **Para el agente que lea esto:** Este documento contiene TODO el contexto del proyecto BookFast Pro, la arquitectura técnica, la visión de automatización, el estado actual y el plan de construcción. Léelo completo antes de actuar. Es el punto de partida de cada nueva conversación de trabajo.

---

## 1. QUIÉNES SOMOS

**BookFast Pro** es un SaaS all-in-one para barberías y peluquerías pequeñas (1-4 trabajadores).

**El equipo:**
- **Josep Calafat** (`josepcalafataloy@gmail.com` / `josep@bookfast.es`) — Cofundador. Lleva el desarrollo y la visión técnica. Trabaja en el proyecto en sus ratos libres. Habla español.
- **Sergi** (`sergi@bookfast.es`) — Cofundador. Rol más comercial y de captación.

**Contacto corporativo:** `info@bookfast.es`

**Estado del negocio:** Pre-launch. 0 clientes activos. La plataforma tiene ~80% construida. El objetivo más inmediato es salir a la venta con los primeros clientes beta (barberías pequeñas de 1-4 trabajadores) y arrancar el sistema de automatización completo.

**La propuesta de valor:** All-in-one con IA integrada. El barbero solo se ocupa de cortar el pelo. Nosotros automatizamos el resto.

---

## 2. LA VISIÓN — LO QUE QUEREMOS CONSTRUIR

Josep quiere que BookFast Pro sea una **empresa completamente autónoma gestionada por agentes AI**:

- Los agentes captan clientes solos (prospección + ventas).
- Los agentes hacen el onboarding de cada nuevo cliente de forma personalizada.
- Los agentes gestionan el soporte (email + WhatsApp).
- Los agentes gestionan todas las redes sociales.
- Los agentes detectan y solucionan bugs sin intervención humana.
- Los agentes gestionan las suscripciones y facturación.
- **La plataforma aprende y se mejora sola** según el feedback y comportamiento de los usuarios.
- Josep solo abre el dashboard de admin cada mañana, ve los KPIs, y supervisa. No interviene salvo en decisiones de alto riesgo.

**Esto no es automatización parcial. Es una empresa con empleados AI.**

---

## 3. ARQUITECTURA TÉCNICA — LOS 3 REPOSITORIOS

Hay 3 repositorios desplegados en Vercel, todos compartiendo la misma instancia de Supabase.

### 3.1 Platform (PRIORIDAD MÁXIMA)

| Campo | Valor |
|-------|-------|
| Repo GitHub | `salonpanel/platform` |
| URL producción | `pro.bookfast.pro` |
| Carpeta local | `C:\Users\Josep Calafat\Desktop\platform` (ruta Linux sandbox: `/sessions/.../mnt/platform/`) |
| Stack | Next.js 16.0.8 + React 19 + Turbopack + Tailwind 4 |
| Estado build | ✅ GREEN |

**Qué es:** El panel de gestión que usan los salones — el producto core que los clientes pagan.

**Estructura de carpetas clave:**
```
app/
  api/                    # Route handlers
    auth/                 # Login OTP (magic link)
    availability/         # Slots disponibles
    checkout/             # Stripe checkout
    payments/             # Procesamiento pagos
    reservations/         # CRUD reservas
    services/             # CRUD servicios
    staff/                # CRUD staff
    webhooks/             # Stripe webhooks
    panel/marketing/      # Campañas email
  panel/                  # Páginas del panel de gestión
    agenda/               # Calendario de citas
    clientes/             # Gestión de clientes
    servicios/            # Configuración servicios
    staff/                # Gestión de empleados
    chat/                 # Chat de equipo
    monedero/             # Wallet/pagos
    marketing/            # Campañas de email
    ajustes/              # Settings (calendario, no-shows)
    config/payments/      # Config de pagos Stripe
    pagos/                # Gestión de pagos
  admin/                  # Admin interno de la plataforma
    new-tenant/           # Wizard crear tenant (página.tsx ya existe)
    platform-users/       # Gestión usuarios plataforma

src/
  lib/
    supabase/             # Clientes Supabase (browser, server, admin)
    availability/         # Lógica de slots
    booking-conflicts.ts
    booking-status-transitions.ts
    agenda-data.ts
    permissions/          # RBAC (owner/admin/manager/staff)
    stripe-handlers/      # Handlers webhooks Stripe
    rate-limit.ts
  components/
    agenda/               # Grid calendario, slots, citas
    calendar/             # Modales reserva, búsqueda
    customers/            # Lista clientes, filtros
    ui/glass/             # Design system glassmorphism
    panel/                # Nav, layout
  hooks/                  # Custom hooks
  modules/bookings/       # Modales crear/detalle reserva
  types/                  # TypeScript types
```

**Features implementadas y funcionando:**
- Login con magic link + multi-tenant por subdominios
- Dashboard con métricas reales de Supabase
- Agenda (calendario con slots, conflictos, staff)
- Gestión de clientes (CRUD, búsqueda, historial, notas)
- Servicios (CRUD, precios)
- Staff (CRUD, horarios)
- Wallet/Monedero (Stripe, transacciones, payouts)
- Marketing por email (campañas, templates, segmentación)
- Chat de equipo
- Settings (calendario, no-shows)
- Pagos (Stripe checkout, webhooks)
- Admin: crear tenants, gestionar usuarios plataforma

**TODOs conocidos en Platform:**
- Chat: falta paginación/infinite scroll para mensajes antiguos
- Staff: flujo UI de horarios incompleto
- Timezone: hardcodeado "Europe/Madrid" en BookingDetailModal (debería venir del tenant)
- Verificación platform admin: stub en platform-admin.ts
- Sync precios Stripe desde panel config
- Portal público de reservas (referenciado pero no completo)
- Colores por staff member

---

### 3.2 Admin (NUESTRO PANEL DE TRABAJO + CONTROL DE AGENTES)

| Campo | Valor |
|-------|-------|
| Repo GitHub | `piademo/admin` |
| Carpeta local | `C:\Users\Josep Calafat\Desktop\admin` (ruta Linux sandbox: `/sessions/.../mnt/admin/`) |
| Stack | Next.js 16.0.4 + React 19 + Turbopack + Tailwind 4 + shadcn/ui |
| Estado build | ⚠️ CON ERRORES TypeScript (tipos `never` en queries Supabase) |

**Qué es:** Nuestro backoffice interno. Desde aquí trabajamos Sergi y Josep, y es donde se construirá el panel de control de todos los agentes AI.

**IMPORTANTE — Doble función de Admin:**
1. **Backoffice clásico:** gestión de tenants, suscripciones, soporte, billing, auditoría.
2. **Centro de control de agentes:** dashboard de estado de todos los agentes, cola de tareas `agent_tasks`, aprobación de decisiones de alto riesgo, KPIs en tiempo real.

**Estado actual de Admin:**
- ✅ Auth aislada con `platform_users` (separada de usuarios tenant)
- ✅ Sistema de roles (super_admin, admin, support, billing, viewer)
- ✅ RBAC con permisos granulares
- ✅ Auditoría automática en DB
- ✅ Componentes UI base (shadcn/ui)
- ✅ Estructura de migraciones Supabase
- 🚧 MFA obligatorio (TOTP) — en progreso
- ❌ UI de roles y permisos
- ❌ Gestión de sesiones
- ❌ Rate limiting
- ❌ UI de auditoría
- ❌ CRUD de tenants
- ❌ Dashboard con KPIs
- ❌ Panel de control de agentes (PRIORIDAD NUEVA)

**Fix pendiente de build:** En `src/types/supabase.ts` cambiar los catch-all de `Record<string, unknown>` a `any`. Esto resuelve todos los errores de `never[]` en las queries de Supabase.

---

### 3.3 Marketing

| Campo | Valor |
|-------|-------|
| Carpeta local | `C:\Users\Josep Calafat\Desktop\marketing` (ruta Linux sandbox: `/sessions/.../mnt/marketing/`) |
| Stack | Next.js 15 + Framer Motion + next-intl |
| Estado | Estructura completa, necesita contenido y pulido |

**Qué es:** Web pública de marketing. Landing page, pricing, blog, páginas por sector. Aquí la gente conoce BookFast Pro, contrata, gestiona suscripción, contacta soporte.

**Prioridad:** BAJA. Se trabajará en Fase 2 cuando haya algo que vender.

---

## 4. BASE DE DATOS — SUPABASE

Las 3 apps comparten **una única instancia de Supabase** con PostgreSQL.

**Schemas:**
- `public` — datos de negocio (tenants, bookings, clientes, etc.)
- `platform` — admin interno (platform_users, roles, permisos, audit_logs)
- `app` — funciones helper

**Extensions activas:** `pg_cron`, `pg_trgm`, `pgcrypto`, `uuid-ossp`, `btree_gist`

**Tablas principales en `public`:**
- `tenants` — cada barbería/salón es un tenant
- `memberships` — qué usuarios pertenecen a qué tenant y con qué rol
- `profiles` — datos de perfil de usuarios
- `services` — servicios que ofrece cada salón
- `staff` — empleados de cada salón
- `appointments` — citas individuales
- `bookings` — reservas (pueden agrupar appointments)
- `customers` — clientes de cada salón
- `transactions` — movimientos de dinero
- `marketing_campaigns` — campañas de email

**Tablas en `platform` (admin):**
- `platform_users` — admins internos de BookFast (separados de usuarios tenant)
- `platform_roles` — roles de admin (super_admin, admin, support, billing, viewer)
- `platform_permissions` — permisos granulares
- `user_roles`, `role_permissions` — asignaciones
- `admin_sessions` — tracking de sesiones
- `audit_logs` — auditoría completa de todas las acciones
- `impersonations` — tracking de impersonaciones de tenants

**Multi-tenancy:** Row Level Security (RLS) por `tenant_id`. Cada tenant solo ve sus datos.

**Migraciones:** El baseline completo está en `/platform/supabase/migrations/0000_full_baseline.sql` (370KB).

**Problema conocido — tipos TypeScript:**
Las queries complejas de Supabase devuelven `data` tipado como `never[]`. Fix estándar aplicado: cast con `as any[]` en los returns o `(client.from('table') as any)` para `.update()/.insert()`. Fix definitivo pendiente: regenerar tipos con `supabase gen types typescript`.

---

## 5. OPENCLAW — EL SISTEMA DE AGENTES

### 5.1 Qué es OpenClaw

OpenClaw es el gateway de agentes AI que corre en un VPS Ubuntu propio. Es el runtime donde viven y operan todos los agentes. Yo (el agente en Cowork) puedo controlarlo desde el sandbox bash de Cowork instalando el cliente openclaw localmente.

**Arquitectura:**
```
Cowork (sandbox bash)
    ↓ websocket
OpenClaw Gateway (VPS Ubuntu)
    wss://10574.pm7.moltly.ai
    ↓
Agentes en el VPS
    - agent:main:main (principal, GPT-5.4 con 500k tokens de contexto)
    - futuros agentes departamentales
```

### 5.2 Cómo conectarse desde el sandbox

Cada sesión de Cowork es efímera — el sandbox se reinicia. Hay que reinstalar openclaw y reconfigurar cada vez:

```bash
# 1. Instalar openclaw en el sandbox
npm install openclaw --prefix /tmp/openclaw --force 2>&1 | tail -3

# Binario disponible en:
# /tmp/openclaw/node_modules/.bin/openclaw

# 2. Crear config apuntando al VPS
# IMPORTANTE: la ruta del home del sandbox cambia en cada sesión
# Usar $(eval echo ~) o descubrir la ruta con: echo ~
HOME_DIR=$(eval echo ~)
mkdir -p $HOME_DIR/.openclaw
cat > $HOME_DIR/.openclaw/openclaw.json << 'EOF'
{
  "gateway": {
    "mode": "remote",
    "remote": {
      "url": "wss://10574.pm7.moltly.ai",
      "token": "20eb2d6691f5931a34defe4ddbd3722673a0a6da579c10f1b743e796fd6782e6"
    },
    "auth": {
      "token": "20eb2d6691f5931a34defe4ddbd3722673a0a6da579c10f1b743e796fd6782e6"
    }
  }
}
EOF

# 3. Verificar conexión
HOME=$HOME_DIR /tmp/openclaw/node_modules/.bin/openclaw health
```

### 5.3 Device Pairing

El sandbox tiene un device ID fijo: `a1d00858fb411476bca40d62399ba2283e38b5cbc1a7d40b4e6508c74c07af06`

Ya fue aprobado por Josep con los siguientes scopes:
`operator.admin, operator.approvals, operator.pairing, operator.read, operator.talk.secrets, operator.write`

Si en una nueva sesión el pairing caduca, Josep aprueba desde el VPS:
```bash
openclaw devices approve <requestId>
```

### 5.4 Comandos clave para controlar agentes

```bash
HOME_DIR=$(eval echo ~)
OPENCLAW="HOME=$HOME_DIR /tmp/openclaw/node_modules/.bin/openclaw"

# Verificar estado del gateway
$OPENCLAW gateway call status --json

# Enviar mensaje a un agente (fire & forget — SIEMPRE usar este método)
IKEY=$(cat /proc/sys/kernel/random/uuid)
$OPENCLAW gateway call agent \
  --params "{\"sessionKey\":\"agent:main:main\",\"message\":\"TU MENSAJE\",\"idempotencyKey\":\"$IKEY\"}" \
  --json
# Devuelve: {"runId":"...","status":"accepted"}
# Esperar ~20 segundos antes de leer la respuesta

# Leer respuesta del agente
$OPENCLAW gateway call chat.history \
  --params '{"sessionKey":"agent:main:main","limit":3}' \
  --json
```

**CRÍTICO:** NUNCA usar `openclaw agent --message "..."` (el CLI directo). Tarda >45s y supera el timeout del sandbox. SIEMPRE usar `gateway call agent` (fire & forget) + `gateway call chat.history`.

### 5.5 Agente principal actual

- **Session key:** `agent:main:main`
- **Session ID:** `83900d2c-1414-40d2-9751-1507718cda6f`
- **Modelo:** GPT-5.4 (MyClaw provider)
- **Contexto:** 500k tokens
- **Estado verificado:** ✅ Conexión y comunicación bidireccional funcionando

---

## 6. LA ORGANIZACIÓN DE AGENTES

### 6.1 Estructura de la "empresa AI"

```
Josep (Supervisor)
    ↓
Bus Central (agent_tasks en Supabase)
    ↓
5 Departamentos → 14 Secciones → 28 Agentes
```

### 6.2 Los 5 Departamentos

---

#### DEPARTAMENTO 1 — INGENIERÍA (8 agentes)

**Misión:** Mantener la plataforma funcionando perfectamente, sin intervención humana.

**Sección: Monitoreo**
- **Watcher** — Vigila Vercel logs, Supabase errores, Stripe webhooks fallidos 24/7. Crea una `agent_task` cuando detecta algo.
- **Alerter** — Evalúa si el problema requiere notificar a Josep. El 95% no llega a él.

**Sección: Bug Fixing (Self-healing)**
- **Debugger** — Dado un error, lo localiza en el código (lee archivos, analiza stack traces, busca en el repo).
- **Patcher** — Aplica el fix, verifica que el build no se rompe, hace commit y push. Josep no se entera.

**Sección: Onboarding Técnico**
- **Scout** ← **(EN CONSTRUCCIÓN — PRIORIDAD 1)** — Dado el nombre/slug de un nuevo tenant, investiga el negocio en Google Maps, web oficial e Instagram. Extrae: nombre real, dirección, teléfono, horarios, servicios con precios, equipo, fotos.
- **Configurator** — Usa los datos del Scout para configurar el panel del tenant: crea los servicios, añade el staff, configura horarios, sube descripción. Todo vía API de Platform.

**Sección: QA & Deploy**
- **Reviewer** — Revisa cambios antes de que lleguen a producción.
- **Deployer** — Gestiona deploys a Vercel, verifica que el build está verde, hace rollback si hay errores.

---

#### DEPARTAMENTO 2 — SOPORTE (5 agentes)

**Misión:** Resolver cualquier problema de cliente sin que llegue a Josep.

**Sección: Email**
- **MailBot** — Lee `info@bookfast.es`, clasifica emails entrantes y responde usando historial del cliente en Supabase y templates.

**Sección: WhatsApp**
- **WA Agent** — Gestiona conversaciones de WhatsApp Business. Canal principal con clientes. Hace tanto onboarding como soporte.

**Sección: Triage & Escalación**
- **Triage** — Clasifica cada incidencia: bug técnico / duda de uso / queja / riesgo de churn.
- **Resolver** — Para bugs: coordina con Debugger. Para dudas: responde directamente.
- **Escalator** — Solo actúa cuando la situación requiere a Josep (churn inminente de cliente grande, problema legal, decisión de negocio).

---

#### DEPARTAMENTO 3 — MARKETING & REDES SOCIALES (7 agentes)

**Misión:** Presencia online 100% autónoma en todos los canales.

**Sección: Redes Sociales**
- **Insta Manager** — Posts, reels, stories en Instagram. Responde comentarios y DMs.
- **TikTok Manager** — Vídeos cortos, tendencias del sector, hashtags.
- **FB/Google Manager** — Facebook Business + Google Business Profile (horarios, respuestas a reseñas, fotos).

**Sección: Contenido**
- **Content Creator** — Genera el calendario de contenido semanal para todos los canales. Crea copy, sugiere imágenes/vídeos, adapta el mensaje a cada red.
- **SEO Writer** — Escribe artículos de blog optimizados para Google (keywords: "software gestión barbería", "app reservas peluquería", etc.).

**Sección: Ads & Performance**
- **Ads Manager** — Crea y optimiza campañas en Meta Ads y Google Ads. Ajusta presupuestos y segmentación.
- **Analyst** — Reporte semanal de métricas de todas las redes. Identifica qué funciona y qué no. Ajusta estrategia.

---

#### DEPARTAMENTO 4 — VENTAS (4 agentes)

**Misión:** Captar clientes de forma autónoma.

**Sección: Prospección**
- **Prospector** — Busca barberías y peluquerías de 1-4 trabajadores en Google Maps, directorios, Instagram. Evalúa si tienen ya un sistema digital o no.
- **Qualifier** — Analiza cada prospecto para decidir si es buen fit para BookFast Pro.

**Sección: Outreach**
- **Pitcher** — Para cada prospecto cualificado: monta una demo personalizada (crea un tenant demo con el nombre real del salón, sus servicios aproximados, sus fotos). Contacta por email o WhatsApp ofreciendo la demo gratis.
- **Follow-upper** — Gestiona las secuencias de seguimiento. Persiste hasta cerrar o descartar definitivamente.

---

#### DEPARTAMENTO 5 — OPERACIONES (4 agentes)

**Misión:** Que el negocio funcione financiera y administrativamente sin intervención.

**Sección: Billing & Admin**
- **Billing Manager** — Gestiona suscripciones en Stripe. Detecta impagos, envía recordatorios, gestiona upgrades/downgrades.
- **Tenant Admin** — Alta/baja de tenants desde Admin, cambios de estado, configuración de plan.

**Sección: Reporting & Compliance**
- **Reporter** — Genera el informe diario/semanal para Josep: MRR, churn, nuevos clientes, errores resueltos, estado de agentes, qué requiere su atención.
- **Compliance** — GDPR, backups, auditoría de seguridad periódica, exports de datos cuando los solicitan clientes.

---

## 7. EL FLUJO MAESTRO COMPLETO

### 7.1 Flujo de Captación (Ventas autónomas)

```
[Cron nocturno]
    → Prospector busca barberías en Google Maps (zona objetivo, 1-4 trabajadores, sin sistema digital)
    → Qualifier evalúa cada prospecto
    → Pitcher monta demo personalizada (tenant demo con nombre real del salón)
    → Pitcher contacta por WhatsApp/email: "Hola [Nombre], hemos preparado una demo de BookFast Pro personalizada para [Nombre Salón]..."
    → Follow-upper gestiona hasta cerrar
    → [Cierre] → Trigger de Onboarding
```

### 7.2 Flujo de Onboarding (La magia)

```
[Trigger: nuevo tenant creado en Admin]
    → agent_task creada: tipo="onboarding", tenant_id=X
    
    → Scout investiga el negocio:
        - Google Maps: nombre, dirección, teléfono, horarios, servicios, reseñas
        - Web oficial: servicios con precios, equipo, fotos
        - Instagram: estética, servicios destacados, tipos de clientes
    
    → WA Agent contacta al cliente (WhatsApp):
        "¡Hola [Nombre]! Soy el asistente de BookFast Pro. Bienvenido 🎉
        Para configurarte el panel, necesito unos datos..."
        - Pide enlace de su web/Instagram
        - Pregunta si tiene sistema actual de citas y cuál
        - Pide info adicional si falta algo
    
    → Configurator configura el panel vía API de Platform:
        - Crea servicios (nombre, precio, duración)
        - Añade staff (nombre, especialidad)
        - Configura horarios
        - Sube descripción del negocio
    
    → WA Agent entrega acceso:
        "✅ Tu panel está listo. Accede en: [URL]
        Usuario: [email] | Te llega el magic link al email.
        Aquí tienes un vídeo de 2 min para empezar: [link]"
    
    → Semana 1: WA Agent hace check-in automático día 3 y día 7
    → agent_task marcada como "completado"
```

### 7.3 Flujo de Soporte

```
[Email/WhatsApp entrante de cliente]
    → MailBot / WA Agent recibe el mensaje
    → Triage clasifica:
        - "bug técnico" → Debugger → Patcher → cliente notificado
        - "duda de uso" → respuesta automática con solución
        - "queja" → respuesta empática + solución + seguimiento
        - "churn risk" → Escalator notifica a Josep
    → agent_task creada y resuelta
    → cliente recibe respuesta en <5 minutos
```

### 7.4 Flujo de Self-healing (Bugs autónomos)

```
[Watcher detecta error en Vercel/Supabase/Stripe]
    → Alerter evalúa gravedad
    → agent_task: tipo="bug", prioridad="alta/crítica"
    
    → Debugger:
        - Lee los logs del error
        - Localiza el archivo y línea en el repo
        - Propone el fix
    
    → Patcher:
        - Aplica el fix en el archivo
        - Verifica build local
        - Commit + push a main
        - Vercel auto-deploy
        - Verifica que el nuevo build está verde
    
    → Si todo OK: agent_task "completado", Josep no se entera
    → Si falla: Escalator notifica a Josep con el contexto completo
```

### 7.5 Flujo de Redes Sociales

```
[Cron: cada domingo]
    → Content Creator genera calendario de la semana:
        - 5 posts para Instagram
        - 3 vídeos/reels para TikTok
        - 3 posts para Facebook
        - 2 artículos LinkedIn
        - 1 artículo de blog SEO
    
    → Cada día los managers publican según el calendario
    → Responden comentarios y DMs en <30 min
    → Analyst reporta rendimiento el viernes
    → Ciclo de mejora continua
```

### 7.6 Flujo de Auto-mejora de la Plataforma (La joya — Fase 3)

```
[Continuo]
    → Analyzer recopila:
        - Tickets de soporte frecuentes (pain points)
        - Features más solicitadas
        - Errores recurrentes
        - Patrones de uso (qué usan, qué no usan)
        - Reseñas y feedback
    
    → Genera lista priorizada de mejoras
    
    → Para mejoras de bajo riesgo (UI, copy, pequeñas mejoras):
        → Developer implementa automáticamente
        → QA Agent verifica
        → Deploy automático
    
    → Para mejoras de alto riesgo (cambios de arquitectura, nuevas features grandes):
        → Presenta a Josep con justificación y estimación
        → Josep aprueba/rechaza desde Admin
        → Si aprueba: Developer implementa
```

---

## 8. LA INFRAESTRUCTURA BASE — LO QUE HAY QUE CONSTRUIR PRIMERO

Antes de que ningún agente pueda trabajar, necesitamos el **sistema nervioso central**. Sin esto, los agentes no tienen dónde vivir ni comunicarse.

### 8.1 Tabla `agent_tasks` en Supabase

```sql
CREATE TABLE public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Tipo de tarea
  type TEXT NOT NULL, -- 'onboarding', 'bug', 'soporte', 'contenido', 'prospección', etc.
  department TEXT NOT NULL, -- 'ingenieria', 'soporte', 'marketing', 'ventas', 'operaciones'
  
  -- Asignación
  assigned_agent TEXT, -- 'scout', 'patcher', 'wa_agent', etc.
  
  -- Estado
  status TEXT DEFAULT 'pendiente', -- 'pendiente', 'en_proceso', 'completado', 'error', 'requiere_aprobacion'
  priority TEXT DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'critica'
  
  -- Contexto
  tenant_id UUID REFERENCES tenants(id),
  payload JSONB, -- datos específicos de la tarea
  result JSONB, -- resultado cuando completa
  error_message TEXT,
  
  -- Metadatos
  openclaw_session_key TEXT, -- para rastrear qué sesión de agente la está procesando
  openclaw_run_id TEXT,
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Para Josep
  requires_approval BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT
);

-- Índices para performance
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_type ON agent_tasks(type);
CREATE INDEX idx_agent_tasks_tenant ON agent_tasks(tenant_id);
CREATE INDEX idx_agent_tasks_created ON agent_tasks(created_at DESC);
```

### 8.2 Endpoint Webhook Genérico en Platform

```
POST /api/agents/tasks
```
Cualquier evento interno (nuevo tenant, error detectado, email recibido) crea una `agent_task` a través de este endpoint. El agente correspondiente la pilla y la procesa.

### 8.3 Endpoint de Callback para Agentes

```
POST /api/agents/callback
```
Cuando un agente termina una tarea, llama a este endpoint para actualizar el estado en Supabase y desencadenar el siguiente paso del flujo.

### 8.4 Trigger en Wizard new-tenant

En `app/admin/new-tenant/page.tsx`, al crear el tenant con éxito, hacer POST a `/api/agents/tasks` con:
```json
{
  "type": "onboarding",
  "department": "ingenieria",
  "assigned_agent": "scout",
  "tenant_id": "<nuevo_tenant_id>",
  "payload": {
    "tenant_name": "...",
    "tenant_slug": "...",
    "owner_email": "...",
    "owner_name": "..."
  }
}
```

---

## 9. PLAN DE CONSTRUCCIÓN POR FASES

### FASE 1 — Infraestructura + Scout (AHORA)

**Objetivo:** Que el primer cliente que entre sea onboardeado automáticamente.

1. ✅ Conexión OpenClaw desde Cowork — HECHO
2. ❌ Tabla `agent_tasks` en Supabase + migración
3. ❌ Endpoint `/api/agents/tasks` en Platform (recibe webhooks)
4. ❌ Endpoint `/api/agents/callback` en Platform (agentes reportan resultado)
5. ❌ Endpoint `/api/admin/onboarding/[tenantId]` en Platform (configura datos)
6. ❌ Trigger en wizard `new-tenant` → POST a `/api/agents/tasks`
7. ❌ Sistema prompt completo del agente Scout en OpenClaw
8. ❌ Lógica de poll de tareas pendientes desde OpenClaw
9. ❌ Panel básico en Admin: lista de `agent_tasks` con estado

**Arquitectura de Admin para esta fase:** Una sola página `/agents` en Admin que muestre la tabla `agent_tasks` con estado en tiempo real. Filtros por departamento, estado y fecha. Es el panel de control mínimo viable.

### FASE 2 — Soporte + Redes Sociales (Cuando haya primeros clientes)

1. WhatsApp Business API conectada
2. Agente WA Agent para soporte
3. MailBot para soporte por email
4. Sistema de Triage
5. Content Creator + managers de Instagram, TikTok, Facebook
6. Prospector + Pitcher para ventas autónomas

### FASE 3 — Auto-mejora (Cuando la plataforma tenga feedback real)

1. Analyzer de patrones de uso y feedback
2. Developer agente que implementa mejoras
3. Loop completo de mejora continua autónoma

---

## 10. CONVENCIONES Y REGLAS IMPORTANTES

### Código

- **TypeScript:** Siempre. Para queries Supabase que devuelvan `never[]`, usar `as any[]` en el return o `(client.from('tabla') as any)` para `.update()/.insert()`.
- **Next.js:** App Router, Server Components por defecto, 'use client' solo cuando sea necesario.
- **Tailwind 4:** Sin configuración separada, todo en el CSS.
- **shadcn/ui:** En Admin. En Platform usamos el design system `glass/` (glassmorphism) propio.

### Git y Deploy

- Los commits van **directamente a `main`** en todos los repos (no hay feature branches).
- **El sandbox bash de Cowork NO puede hacer git push** (proxy bloqueado). Yo edito los archivos, Josep hace `git add . && git commit -m "..." && git push` desde su máquina local.
- Al hacer push a main, Vercel auto-despliega. Verificar build con las herramientas Vercel MCP.
- **Verificar siempre el build de Vercel** después de cada push importante.

### Comunicación con OpenClaw

- Siempre `gateway call agent` (fire & forget) + esperar ~20s + `gateway call chat.history`.
- Nunca el CLI directo `openclaw agent --message`.
- El sandbox es efímero: reinstalar openclaw y reconfigurar en cada sesión.

### Seguridad

- Nunca exponer tokens ni secrets en el código. Usar variables de entorno.
- El token de OpenClaw va siempre en el config file, nunca en código que se suba a Git.
- El archivo `.openclaw/openclaw.json` está en `.gitignore`.

### Estilo de trabajo

- Josep quiere resultados, no explicaciones largas.
- Construir primero, explicar si hace falta.
- Cuando hay dudas técnicas menores: tomar la decisión razonable y avanzar.
- Cuando hay dudas de negocio o decisiones importantes: preguntar a Josep.
- Cada sesión: leer este documento + memoria del proyecto antes de actuar.

---

## 11. VARIABLES DE ENTORNO NECESARIAS

### Platform (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Admin (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### OpenClaw Gateway
- URL: `wss://10574.pm7.moltly.ai`
- Token: `20eb2d6691f5931a34defe4ddbd3722673a0a6da579c10f1b743e796fd6782e6`
- (Este token NO va al repo, solo en el config file local del sandbox)

---

## 12. ESTADO ACTUAL — RESUMEN EJECUTIVO (28 abril 2026)

| Sistema | Estado | Notas |
|---------|--------|-------|
| Platform build | ✅ GREEN | 80% del producto construido |
| Admin build | ⚠️ ERRORES | Fix pendiente en types/supabase.ts |
| Marketing | 🔄 ESTRUCTURA OK | Necesita contenido |
| OpenClaw conexión | ✅ FUNCIONANDO | Device pairing aprobado |
| agent_tasks tabla | ❌ POR CREAR | Prioridad 1 |
| Scout agente | 🔄 30% | Sistema prompt pendiente |
| Webhook trigger onboarding | ❌ POR CREAR | |
| Panel de agentes en Admin | ❌ POR CREAR | |
| WhatsApp Business | ❌ PENDIENTE | Hasta formalizar empresa |
| Redes sociales | ❌ PENDIENTE | Instagram, TikTok, FB, LinkedIn |
| Agentes de ventas | ❌ PENDIENTE | Fase 2 |
| Auto-mejora plataforma | ❌ PENDIENTE | Fase 3 |

---

## 13. PRÓXIMO PASO INMEDIATO

**Arrancar Fase 1:**

1. Crear la migración SQL para `agent_tasks` en Supabase.
2. Crear endpoint `/api/agents/tasks` en Platform.
3. Añadir el trigger en el wizard `new-tenant/page.tsx`.
4. Escribir el sistema prompt del agente Scout en OpenClaw.
5. Crear la página `/agents` básica en Admin para ver el estado de las tareas.

**Todo esto construido en la carpeta `admin` para el panel de control, y en `platform` para los endpoints API.**

---

*Documento generado el 28 de abril de 2026. Actualizar en cada sesión de trabajo si hay cambios significativos.*
