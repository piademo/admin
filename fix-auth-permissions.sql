-- Fix 1: Reasignar ownership del esquema auth al usuario postgres
ALTER SCHEMA auth OWNER TO postgres;

-- Fix 2: Dar permisos a las tablas críticas
ALTER TABLE auth.users OWNER TO postgres;
ALTER TABLE auth.sessions OWNER TO postgres;
ALTER TABLE auth.refresh_tokens OWNER TO postgres;
ALTER TABLE auth.identities OWNER TO postgres;
ALTER TABLE auth.instances OWNER TO postgres;
ALTER TABLE auth.schema_migrations OWNER TO postgres;

-- Fix 3: Dar permisos al role supabase_auth_admin (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
        GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;
    END IF;
END
$$;

-- Fix 4: Dar permisos al role authenticated
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT USAGE ON SCHEMA auth TO authenticated;
        GRANT SELECT ON auth.users TO authenticated;
    END IF;
END
$$;

-- Fix 5: Dar permisos al role anon
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT USAGE ON SCHEMA auth TO anon;
    END IF;
END
$$;

-- Fix 6: Reasignar funciones auth
ALTER FUNCTION auth.uid() OWNER TO postgres;
ALTER FUNCTION auth.role() OWNER TO postgres;
ALTER FUNCTION auth.email() OWNER TO postgres;
ALTER FUNCTION auth.jwt() OWNER TO postgres;

-- Verificación: Mostrar el nuevo owner
SELECT nspname, pg_catalog.pg_get_userbyid(nspowner) as schema_owner
FROM pg_namespace
WHERE nspname = 'auth';
