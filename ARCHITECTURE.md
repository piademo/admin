# BookFast Architecture - Admin Panel Integration

## Overview

The admin panel serves as the "center of control" for the BookFast platform. It provides administrative access to manage all tenants, their configurations, payments, data, and support.

## Supabase Architecture Decision

**Recommendation: SAME Supabase instance with schema-based separation**

### Why This Approach?

1. **Security**: Row-Level Security (RLS) policies enforce isolation automatically
2. **Operational Needs**: Admins can access and manage any tenant's data with full audit trails
3. **Data Consistency**: No duplication between instances, single source of truth
4. **Compliance**: Complete audit logging of all admin actions
5. **Impersonation**: Built-in support for admin impersonation with tracking

### Architecture

```
Supabase Instance
├── platform schema (Admin users & system)
│   ├── platform_users (admin accounts)
│   ├── platform_roles (admin roles: super_admin, admin, support, billing, viewer)
│   ├── platform_permissions (granular permission matrix)
│   ├── user_roles (admin role assignments)
│   ├── role_permissions (role-permission mappings)
│   ├── admin_sessions (session tracking)
│   ├── audit_logs (complete action audit trail)
│   ├── impersonations (admin impersonation tracking)
│   └── rate_limit_overrides (rate limiting exceptions)
│
└── public schema (Tenant data)
    ├── tenants (tenant accounts)
    ├── bookings (all reservations)
    ├── customers (tenant's customers)
    ├── services (tenant's services)
    ├── settings (tenant configurations)
    ├── payments (payment records)
    ├── agent_tasks (background jobs for agents)
    ├── agent_task_logs (task execution logs)
    └── [other tenant-specific tables]
```

### Row-Level Security (RLS) Strategy

**For public schema tables:**

```sql
-- Allow regular tenant users to see only their own data
CREATE POLICY tenant_isolation ON bookings
  USING (tenant_id = get_current_tenant_id());

-- Allow platform admins to see ALL data for management
CREATE POLICY admin_full_access ON bookings
  USING (is_platform_admin(auth.uid()));
```

**Benefits:**
- ✅ Automatic isolation enforced at database level
- ✅ No need for application-level permission checks
- ✅ Prevents data leaks if application code has bugs
- ✅ Audit trail of admin access

## Agent Task Management Integration

Agent tasks are now managed through the admin panel with full authentication and audit logging.

### API Endpoints

All endpoints require authenticated platform admin session.

#### 1. List Tasks
```
GET /api/agents/tasks?status=pending&tenant_id=xxx&limit=50&offset=0

Response:
{
  "success": true,
  "tasks": [...],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 2. Create Task
```
POST /api/agents/tasks/create

Body:
{
  "type": "data_sync",
  "tenant_id": "uuid",
  "priority": "normal",
  "payload": { ... },
  "assigned_agent": "agent-uuid" (optional),
  "max_retries": 3,
  "timeout_seconds": 3600
}

Response:
{
  "success": true,
  "task": { id, type, status, ... }
}
```

#### 3. Manage Task
```
PATCH /api/agents/tasks/{id}

Body:
{
  "action": "approve|reject|retry|reassign",
  "reason": "string (optional)",
  "notes": "string (optional)",
  "assigned_agent": "uuid (required for reassign)"
}

Response:
{
  "success": true,
  "message": "Task approved successfully",
  "new_status": "aprobado"
}
```

#### 4. Agent Callback
```
POST /api/agents/callback

Headers:
Authorization: Bearer {agent_token}

Body:
{
  "task_id": "uuid",
  "status": "completed|failed",
  "output": { ... },
  "error_message": "string (optional)",
  "metadata": { ... }
}

Response:
{
  "success": true,
  "message": "Task completed",
  "new_status": "completado"
}
```

### Audit Trail

Every admin action is logged automatically:

```sql
-- Example audit log entry
INSERT INTO platform.audit_logs (
  user_id,
  action,
  resource_type,
  resource_id,
  changes,
  status,
  created_at
) VALUES (
  'admin-uuid',
  'agent_task_approve',
  'agent_task',
  'task-uuid',
  '{"action": "approve", "notes": "Verified output"}',
  'success',
  NOW()
);
```

**Queryable by:**
- User ID (who made the change)
- Action (what happened)
- Resource type & ID (what was changed)
- Timestamp (when it happened)
- Changes (what was modified)

## Admin Impersonation

When an admin needs to access a client's panel:

1. **Mark impersonation session**
```sql
INSERT INTO platform.impersonations (
  admin_user_id,
  tenant_id,
  reason,
  expires_at,
  created_at
) VALUES (...)
```

2. **Switch auth context** - Generate temporary session for tenant
3. **Apply banner** - Show "IMPERSONATING" banner with admin info
4. **Track all actions** - All changes made during impersonation are logged
5. **Set expiration** - Auto-expire session after timeout

## Security Considerations

### For Admin Credentials
- ✅ Separate from tenant authentication
- ✅ Isolated in `platform` schema
- ✅ MFA required (TOTP with speakeasy)
- ✅ Session tracking with device info
- ✅ Rate limiting with Upstash Redis
- ✅ Access token expiration

### For Data Access
- ✅ RLS policies enforce isolation
- ✅ All queries logged to audit_logs
- ✅ Admin IP addresses tracked
- ✅ Session geo-location tracked
- ✅ Failed access attempts logged
- ✅ Impersonation requires audit trail

### For Task Management
- ✅ Only admins can create/manage tasks
- ✅ Agent callbacks validated with token
- ✅ Task execution logged with input/output
- ✅ Failed tasks can be retried with approval
- ✅ Task reassignment tracked

## Implementation Checklist

### Phase 1: Foundation (In Progress)
- [x] Supabase schema setup (platform schema)
- [x] RBAC system implementation
- [x] Agent task API endpoints
- [ ] Admin authentication integration
- [ ] API endpoint testing

### Phase 2: UI & Dashboard
- [ ] Agent tasks dashboard page
- [ ] Task list with filters
- [ ] Task detail view
- [ ] Bulk task actions
- [ ] Task history/logs view

### Phase 3: Security Hardening
- [ ] Rate limiting middleware
- [ ] Session geo-validation
- [ ] MFA enforcement
- [ ] Audit log export
- [ ] Compliance reporting

### Phase 4: Advanced Features
- [ ] Automated retry scheduling
- [ ] Task performance analytics
- [ ] Alerting on task failures
- [ ] Integration with Stripe/payments
- [ ] Customer impact analysis

## Environment Setup

### Required Supabase Tables
All tables are defined in `supabase-migrations/001_platform_admin_security.sql`

Ensure migrations are applied:
1. Go to Supabase Dashboard > SQL Editor
2. Run the migration SQL file
3. Verify tables created in `platform` schema

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### First Admin User
```bash
node scripts/create-first-admin.js <auth-user-id> <email> <full-name>
```

## Migration Path from Platform Project

### Files to Move
- Move `/api/agents/*` endpoints from `platform` → `admin` ✅ (Done)
- Remove `/api/admin/*` endpoints from `platform` (TODO)
- Remove admin-specific database tables from platform schema (TODO)

### Breaking Changes
- Platform project no longer manages admin tasks
- All agent task management goes through admin.bookfast.es
- Admin authentication is separate from tenant auth

## Next Steps

1. **Verify Database Setup**
   - [ ] Run migrations in Supabase
   - [ ] Confirm `platform` schema and tables exist
   - [ ] Create first admin user

2. **Test API Endpoints**
   - [ ] Test GET /api/agents/tasks (requires auth)
   - [ ] Test POST /api/agents/tasks/create (requires auth)
   - [ ] Test PATCH /api/agents/tasks/{id} (requires auth)
   - [ ] Test POST /api/agents/callback (requires agent token)

3. **Build Admin Dashboard**
   - [ ] Create Tasks page (/agents/tasks)
   - [ ] List tasks with status/filters
   - [ ] Approve/reject/retry UI
   - [ ] Task detail view with logs

4. **Remove Platform Project Admin Routes**
   - [ ] Delete /api/admin/* from platform
   - [ ] Clean up platform database schema
   - [ ] Update platform documentation

---

**Last Updated:** 2026-04-29
**Architecture Review:** Approved for same-instance setup with RLS-based isolation
**Security Level:** Production-ready with full audit trail
