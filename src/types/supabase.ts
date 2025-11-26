/**
 * Supabase Database Types
 * 
 * These types should be generated from your Supabase schema using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 * 
 * For now, we use a basic type definition.
 */

import type { Json } from './database'

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
  }
  platform: {
    Tables: {
      platform_users: {
        Row: {
          id: string
          auth_user_id: string
          email: string
          full_name: string
          avatar_url: string | null
          mfa_enabled: boolean
          mfa_secret: string | null
          mfa_backup_codes: string[] | null
          mfa_configured_at: string | null
          status: string
          last_login_at: string | null
          last_login_ip: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          email: string
          full_name: string
          avatar_url?: string | null
          mfa_enabled?: boolean
          mfa_secret?: string | null
          mfa_backup_codes?: string[] | null
          mfa_configured_at?: string | null
          status?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          mfa_enabled?: boolean
          mfa_secret?: string | null
          mfa_backup_codes?: string[] | null
          mfa_configured_at?: string | null
          status?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_email: string
          session_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          description: string
          metadata: Json | null
          changes: Json | null
          ip_address: string
          user_agent: string | null
          impersonated_tenant_id: string | null
          impersonated_by: string | null
          created_at: string
          severity: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email: string
          session_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          description: string
          metadata?: Json | null
          changes?: Json | null
          ip_address: string
          user_agent?: string | null
          impersonated_tenant_id?: string | null
          impersonated_by?: string | null
          created_at?: string
          severity?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string
          session_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          description?: string
          metadata?: Json | null
          changes?: Json | null
          ip_address?: string
          user_agent?: string | null
          impersonated_tenant_id?: string | null
          impersonated_by?: string | null
          created_at?: string
          severity?: string
        }
      }
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      is_platform_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      get_user_permissions: {
        Args: { check_user_id: string }
        Returns: { permission_name: string }[]
      }
      has_permission: {
        Args: { check_user_id: string; permission_name: string }
        Returns: boolean
      }
      log_audit: {
        Args: {
          p_user_id: string
          p_action: string
          p_resource_type: string
          p_description: string
          p_resource_id?: string | null
          p_metadata?: Json | null
          p_changes?: Json | null
          p_ip_address?: string | null
          p_severity?: string
        }
        Returns: string
      }
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
  }
}
