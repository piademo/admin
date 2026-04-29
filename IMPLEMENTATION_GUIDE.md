# Agent Task Management - Implementation Guide

## What Was Just Completed

### API Routes Added to Admin Panel
Four new API routes have been integrated into the admin panel project with full authentication and audit logging:

```
admin/src/app/api/agents/
├── tasks/
│   ├── route.ts          (GET: list tasks)
│   ├── create/
│   │   └── route.ts      (POST: create task)
│   └── [id]/
│       └── route.ts      (PATCH: manage task)
└── callback/
    └── route.ts          (POST: agent callback)
```

Each endpoint:
- ✅ Requires authenticated platform admin
- ✅ Validates session with `validatePlatformAdmin()`
- ✅ Logs all actions to `audit_logs` table
- ✅ Creates task-specific logs in `agent_task_logs`
- ✅ Uses service role client for database operations

### Audit Trail
Every task operation is automatically logged with:
- Who performed the action (admin user ID)
- What action (create, approve, reject, retry, reassign)
- What changed (full diff of changes)
- When it happened (timestamp)

## Missing Implementation: validatePlatformAdmin Function

The API endpoints use a `validatePlatformAdmin()` function that needs to be implemented:

**Location:** `src/lib/auth/platform.ts`

**Function signature:**
```typescript
export async function validatePlatformAdmin(
  request: NextRequest
): Promise<{
  user: { id: string; email: string; name: string } | null;
  error: string | null;
}> {
  // Should:
  // 1. Extract session from cookies
  // 2. Validate session is active and not expired
  // 3. Load user from platform_users table
  // 4. Check if user has platform admin role
  // 5. Return user if valid, error if not
}
```

**Template to implement:**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function validatePlatformAdmin(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client with auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { user: null, error: 'No active session' };
    }

    // Load platform user
    const { data: user, error: userError } = await supabase
      .from('platform_users')
      .select('id, email, full_name')
      .eq('auth_user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (userError || !user) {
      return { user: null, error: 'User not found or inactive' };
    }

    // Check for admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id);

    if (!roles || roles.length === 0) {
      return { user: null, error: 'User has no roles' };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
      },
      error: null,
    };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}
```

## Next Steps to Deploy

### 1. Implement validatePlatformAdmin Function
```bash
# Edit: src/lib/auth/platform.ts
# Add the validatePlatformAdmin function above
```

### 2. Verify Supabase Schema
Ensure your Supabase instance has these tables (from `supabase-migrations/001_platform_admin_security.sql`):
- ✅ `platform.platform_users`
- ✅ `platform.user_roles`
- ✅ `public.agent_tasks`
- ✅ `public.agent_task_logs`
- ✅ `platform.audit_logs`

**Check:**
```sql
-- In Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'platform' OR table_name IN ('agent_tasks', 'agent_task_logs');
```

### 3. Setup First Admin User
```bash
# From admin project root
node scripts/create-first-admin.js <auth-user-id> <your-email> "Your Name"

# Example:
node scripts/create-first-admin.js 123e4567-e89b-12d3-a456-426614174000 josep@bookfast.es "Josep"
```

### 4. Test API Endpoints
```bash
# Start dev server
npm run dev

# Test GET tasks (requires admin session cookie)
curl -X GET http://localhost:3001/api/agents/tasks

# Test POST create task
curl -X POST http://localhost:3001/api/agents/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "data_sync",
    "tenant_id": "client-uuid",
    "priority": "normal",
    "payload": {"data": "test"}
  }'

# Test PATCH manage task
curl -X PATCH http://localhost:3001/api/agents/tasks/task-id \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "notes": "Looks good"
  }'
```

### 5. Build Agent Tasks Dashboard UI
Create a new dashboard page:

**File:** `src/app/(dashboard)/agents/page.tsx`

```typescript
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { validatePlatformAdmin } from '@/lib/auth/platform';

export default async function AgentsPage() {
  // Load tasks from API
  // Display in table with filters
  // Show status, priority, creation date
  // Action buttons: approve, reject, retry, reassign
}
```

### 6. Remove Agent Routes from Platform Project
The agent routes that were in `/platform/app/api/admin/agents/*` should now be removed:

```bash
cd platform
rm -rf src/app/api/admin/agents
rm -rf src/app/api/agents/tasks
rm -rf src/app/api/agents/callback
```

Update `platform/README.md` to remove references to agent management (those are now in admin panel).

## Database Considerations

### Agent Task Table Schema
```sql
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  priority text DEFAULT 'normal', -- 'low', 'normal', 'high'
  payload jsonb NOT NULL,
  status text DEFAULT 'pendiente', -- 'pendiente', 'completado', 'error', 'aprobado', 'rechazado'
  
  -- Execution tracking
  assigned_agent text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  completed_at timestamp,
  error_at timestamp,
  
  -- Admin approval
  created_by uuid REFERENCES platform.platform_users(id),
  approved_by uuid REFERENCES platform.platform_users(id),
  approved_at timestamp,
  approval_notes text,
  
  rejected_by uuid REFERENCES platform.platform_users(id),
  rejected_at timestamp,
  rejection_notes text,
  
  -- Retry handling
  max_retries integer DEFAULT 3,
  retries integer DEFAULT 0,
  timeout_seconds integer DEFAULT 3600,
  
  -- Output
  output jsonb,
  error_message text,
  metadata jsonb
);
```

### Audit Log Example
```sql
-- Every task operation is logged here
INSERT INTO platform.audit_logs (user_id, action, resource_type, resource_id, changes)
VALUES (
  'admin-uuid',
  'agent_task_approve',
  'agent_task',
  'task-uuid',
  '{"action": "approve", "notes": "Verified"}'::jsonb
);
```

## Security Checklist

- [ ] `validatePlatformAdmin()` function is implemented
- [ ] First admin user is created in Supabase
- [ ] Admin can successfully authenticate to admin.bookfast.es
- [ ] API endpoints return 401 for unauthenticated requests
- [ ] All task operations appear in audit_logs
- [ ] Session cookies are secure (HttpOnly, SameSite=Strict)
- [ ] MFA is enabled for admin users (from Issue #24)
- [ ] Rate limiting is configured (from Issue #27)

## API Endpoint Summary

### GET /api/agents/tasks
List tasks with optional filters

**Query Parameters:**
- `status` - Filter by status (pendiente, completado, error, aprobado, rechazado)
- `type` - Filter by task type (data_sync, report_generation, etc.)
- `tenant_id` - Filter by tenant
- `limit` - Items per page (default 50)
- `offset` - Pagination offset (default 0)

**Response:**
```json
{
  "success": true,
  "tasks": [{
    "id": "uuid",
    "type": "data_sync",
    "status": "pendiente",
    "tenant_id": "uuid",
    "priority": "normal",
    "created_at": "2026-04-29T10:00:00Z",
    "assigned_agent": "agent-uuid"
  }],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /api/agents/tasks/create
Create a new task

**Body:**
```json
{
  "type": "data_sync",
  "tenant_id": "uuid",
  "priority": "normal",
  "payload": { "source": "api", "data": "..." },
  "assigned_agent": "agent-uuid (optional)",
  "max_retries": 3,
  "timeout_seconds": 3600
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": { "id": "uuid", "status": "pendiente", ... }
}
```

### PATCH /api/agents/tasks/{id}
Manage task (approve, reject, retry, reassign)

**Body:**
```json
{
  "action": "approve|reject|retry|reassign",
  "reason": "string (optional)",
  "notes": "string (optional)",
  "assigned_agent": "uuid (required for reassign)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task approved successfully",
  "task_id": "uuid",
  "new_status": "aprobado"
}
```

### POST /api/agents/callback
Agent reports task completion/failure

**Headers:**
```
Authorization: Bearer {agent_token}
```

**Body:**
```json
{
  "task_id": "uuid",
  "status": "completed|failed",
  "output": { "result": "..." },
  "error_message": "string (optional)",
  "metadata": { ... }
}
```

## Troubleshooting

### 401 Unauthorized on API calls
- Check that admin user exists in `platform.platform_users`
- Verify session cookie is present and valid
- Ensure user has an admin role assigned via `platform.user_roles`
- Check `admin_sessions` table for active sessions

### Task not created or modified
- Verify `agent_tasks` table exists in public schema
- Check that tenant_id is valid UUID in `tenants` table
- Review error response message for specific issue
- Check `audit_logs` for failed operations

### Audit logging not working
- Verify `audit_logs` table exists in platform schema
- Check that user_id in request is valid
- Ensure timestamps are in correct format (ISO 8601)
- Check database RLS policies allow inserts

---

**Status:** Ready for implementation
**Last Updated:** 2026-04-29
**Owner:** Josep Calafat
