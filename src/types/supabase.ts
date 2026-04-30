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
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          timezone: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          public_subdomain: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          timezone?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          public_subdomain?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          name?: string
          slug?: string
          timezone?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          public_subdomain?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      [key: string]: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
    }
    Views: {}
    Functions: {}
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
        Relationships: []
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
        Relationships: []
      }
      [key: string]: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
    }
    Views: {
      [key: string]: {
        Row: any
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
        Args: any
        Returns: any
      }
    }
  }
}
