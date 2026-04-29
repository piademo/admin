/**
 * Supabase Service Role Client
 * 
 * ⚠️ SECURITY WARNING ⚠️
 * This client uses the SERVICE_ROLE_KEY which bypasses ALL RLS policies.
 * 
 * CRITICAL RULES:
 * 1. NEVER import this in client components
 * 2. ONLY use in server-side code (API routes, server actions, server components)
 * 3. Always validate permissions before using
 * 4. Audit all operations that use this client
 * 
 * The service role key must NEVER be exposed to the client.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for service client')
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
