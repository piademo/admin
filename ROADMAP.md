# BookFast Admin Panel - Complete Roadmap

## 📊 Resumen Ejecutivo

**Total de Issues:** 80
**Duración Estimada:** 10 semanas (5 sprints de 2 semanas)
**Estado Actual:** Sprint 1 - 20% completado

---

## 🎯 Sprint 1: Infraestructura y Seguridad (Semanas 1-2)

### Prioridad: 🔴 CRÍTICA

**Objetivo:** Establecer la base segura de autenticación y permisos para el panel admin.

| Issue | Título | Estado | Archivos Clave |
|-------|--------|--------|----------------|
| #1, #10, #16 | Setup Next.js, TypeScript, Tailwind | ✅ | package.json, tailwind.config.ts |
| #23 | Auth admin aislada (platform_users) | ✅ | middleware.ts, lib/auth/platform.ts |
| #24 | MFA obligatorio (TOTP) | 🚧 | app/(auth)/mfa/* |
| #25 | Sistema de roles y permisos | ⏳ | app/settings/roles/* |
| #26 | Gestión de sesiones activas | ⏳ | app/settings/sessions/* |
| #27 | Rate limiting (Upstash Redis) | ⏳ | lib/rate-limit.ts |
| #28 | Auditoría completa | ⏳ | app/audit/* |
| #11, #18 | Componentes UI base (shadcn) | ✅ | components/ui/* |
| #13, #20 | Cliente Supabase service_role | ✅ | lib/supabase/service.ts |
| #15, #22 | Estructura .env y docs | ✅ | .env.example, README.md |

**Entregables:**
- [x] Autenticación funcionando con platform_users
- [ ] MFA operativo
- [ ] Panel de roles y permisos
- [ ] Gestión de sesiones
- [ ] Rate limiting en endpoints críticos
- [ ] Logs de auditoría accesibles

---

## 🏢 Sprint 2: Gestión de Tenants (Semanas 3-4)

### Prioridad: 🔴 ALTA

**Objetivo:** CRUD completo, ciclo de vida e impersonación de tenants.

| Issue | Título | Componentes |
|-------|--------|-------------|
| #71, #45 | CRUD completo de tenants | app/tenants/*, app/api/tenants/* |
| #72, #46 | Ciclo de vida (estados & triggers) | components/tenants/StatusManager.tsx |
| #73, #47 | Búsqueda avanzada y filtros | components/tenants/TenantFilters.tsx |
| #74, #48 | Impersonación segura con auditoría | lib/auth/impersonation.ts |
| #75, #49 | Export GDPR por tenant | app/api/tenants/[id]/export/route.ts |

**Funcionalidades:**
- Crear/editar tenants manualmente
- Cambios de estado con justificación
- Búsqueda multi-criterio
- Impersonar tenant (con MFA)
- Exportar todos los datos del tenant

---

## 📅 Sprint 3: Gestión de Bookings (Semanas 5-6)

### Prioridad: 🔴 ALTA

**Objetivo:** Buscador global, acciones rápidas y resolución de conflictos.

| Issue | Título | Componentes |
|-------|--------|-------------|
| #77, #51 | Índices y optimización | migrations/002_booking_indexes.sql |
| #76, #50 | Buscador global y filtros | app/bookings/*, components/bookings/BookingFilters.tsx |
| #78, #52 | Acciones rápidas (cancelar, refund) | components/bookings/QuickActions.tsx |
| #79, #53 | Wizard de resolución de conflictos | components/bookings/ConflictWizard.tsx |
| #80, #54 | Integración Stripe y notificaciones | lib/integrations/stripe.ts, lib/notifications/* |

**Funcionalidades:**
- Buscar reservas por múltiples criterios
- Cancelar/refund con confirmación
- Resolver solapes de horario
- Integración con pasarela de pago
- Notificaciones automáticas

---

## 📊 Sprint 4: Dashboard y Soporte (Semanas 7-8)

### Prioridad: 🟡 MEDIA

**Objetivo:** Métricas en tiempo real y sistema de tickets.

### Dashboard (Issues #59-62, #33-36)

| Componente | Descripción |
|------------|-------------|
| Dashboard KPIs | Tenants activos, Bookings, MRR, Tickets |
| Sistema de alertas | Severidad, filtros, quick actions |
| Real-time | Supabase Realtime / SSE |
| Vistas platform | Consumo de métricas desde backend |

### Soporte (Issues #55-58, #29-32)

| Componente | Descripción |
|------------|-------------|
| CRUD tickets | Vinculado a tenant, booking, payment |
| Gestión SLA | P0-P3, tracking de vencimiento |
| Timeline ticket | Mensajes, notas internas, cambios |
| Mensajería multicanal | Email, panel, futuro IA |

---

## 📈 Sprint 5: Reportes y Exportaciones (Semanas 9-10)

### Prioridad: 🟡 MEDIA

**Objetivo:** Jobs asíncronos, exports GDPR y reportes automáticos.

| Issue | Título | Componentes |
|-------|--------|-------------|
| #63, #37 | Jobs asíncronos con estado UI | app/reports/*, lib/jobs/* |
| #64, #38 | Export GDPR usuario/tenant | app/api/gdpr/* |
| #65, #39 | Coherencia con dashboard | lib/metrics/validation.ts |
| #66, #40 | Seguridad en links descarga | lib/storage/signed-urls.ts |

**Funcionalidades:**
- Generación asíncrona de reportes pesados
- Export GDPR completo (JSON + CSV)
- Métricas sincronizadas con dashboard
- Links firmados con expiración

---

## 🤖 Fase Futura: Integración IA (Fase 2/3)

### Prioridad: 🟢 BAJA

**Objetivo:** API para IA telefónica 24/7 (22 issues)

| Área | Issues | Descripción |
|------|--------|-------------|
| Endpoints IA | #67-68, #41-42 | GET contexto, POST acciones |
| Webhooks | #69, #43 | Eventos externos de proveedores IA |
| Auditoría IA | #70, #44 | Sesiones, logs, modo testing |

**Nota:** Esta fase se implementará después de completar Sprints 1-5.

---

## 📋 Dependencias Técnicas

### Críticas (Sprint 1)

```
Setup Next.js (#1) 
  → Auth Aislada (#23)
    → MFA (#24)
      → Roles (#25)
        → Sesiones (#26)
          → Auditoría (#28)
```

### Alta Prioridad (Sprints 2-3)

```
Auth + Roles (#23, #25)
  → CRUD Tenants (#71)
    → Impersonación (#74)
      → Búsqueda Tenants (#73)
  
Tenants (#71)
  → Bookings (#76)
    → Acciones Rápidas (#78)
      → Integración Stripe (#80)
```

### Media Prioridad (Sprints 4-5)

```
Tenants + Bookings
  → Dashboard (#59)
    → Tickets (#55)
      → Reportes (#63)
```

---

## 🔧 Stack Tecnológico por Sprint

### Sprint 1: Base
- Next.js 16, TypeScript, Tailwind v4
- Supabase (PostgreSQL + Auth)
- shadcn/ui, Radix UI
- Zod, React Hook Form

### Sprint 2-3: Gestión
- Misma base +
- Stripe SDK (pagos)
- Twilio/Postmark (notificaciones)

### Sprint 4: Real-time
- Misma base +
- Supabase Realtime
- Chart.js / Recharts

### Sprint 5: Exports
- Misma base +
- Node streams (archivos grandes)
- JSZip (comprimir exports)

### Fase Futura: IA
- Misma base +
- OpenAI SDK
- Vapi/Twilio (voz)

---

## 📊 Métricas de Éxito

### Sprint 1
- [ ] Login admin funcionando con MFA
- [ ] Al menos 2 roles configurables
- [ ] 100% acciones auditadas
- [ ] Rate limiting en 5+ endpoints

### Sprint 2
- [ ] CRUD tenants completo
- [ ] Impersonación funcional
- [ ] 0 errores en cambios de estado

### Sprint 3
- [ ] Buscador con 8+ filtros
- [ ] Integración Stripe sin errores
- [ ] <1s respuesta en búsquedas

### Sprint 4
- [ ] Dashboard con <500ms de carga
- [ ] Real-time funcionando
- [ ] SLA tracking automático

### Sprint 5
- [ ] Exports GDPR en <5min
- [ ] 100% coherencia métricas
- [ ] Links seguros funcionando

---

## 🚀 Quick Start

### Paso 1: Ejecutar Migración

```bash
# En Supabase Dashboard > SQL Editor
# Ejecutar: supabase-migrations/001_platform_admin_security.sql
```

### Paso 2: Crear Primer Admin

```bash
# 1. Crear user en Supabase Dashboard > Authentication
# 2. Ejecutar script
node scripts/create-first-admin.js <user-uuid> admin@bookfast.es "Super Admin"
```

### Paso 3: Iniciar Desarrollo

```bash
npm install
npm run dev
# Abrir http://localhost:3001
```

---

## 📚 Documentación

- [README.md](./README.md) - Guía de instalación
- [PROGRESS.md](./PROGRESS.md) - Estado actual
- [supabase-migrations/README.md](./supabase-migrations/README.md) - Migraciones DB

---

**Última actualización:** 26 de noviembre de 2025  
**Versión:** 0.1.0-alpha  
**Issues totales:** 80  
**Issues completados:** 6 (~7.5%)
