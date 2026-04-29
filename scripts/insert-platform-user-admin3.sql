-- ============================================================================
-- SCRIPT: Crear primer usuario admin en platform_users
-- ============================================================================
-- Este script vincula un usuario de auth.users con platform.platform_users
-- y le asigna el rol de super_admin
-- ============================================================================

-- Variables (REEMPLAZAR con los valores correctos)
-- auth_user_id: El UUID del usuario en auth.users (obtenerlo de Supabase Dashboard > Authentication)
-- email: El email del usuario
-- full_name: Nombre completo del administrador

DO $$
DECLARE
  v_auth_user_id UUID := 'c60c4cc8-b0ed-49a0-b7bf-61df3d515eb5'; -- REEMPLAZAR
  v_email TEXT := 'admin3@bookfast.es'; -- REEMPLAZAR
  v_full_name TEXT := 'Admin BookFast'; -- REEMPLAZAR
  v_platform_user_id UUID;
  v_super_admin_role_id UUID;
BEGIN
  -- Verificar que el usuario existe en auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_auth_user_id) THEN
    RAISE EXCEPTION 'User % does not exist in auth.users', v_auth_user_id;
  END IF;

  -- Verificar que no existe ya en platform_users
  IF EXISTS (SELECT 1 FROM platform.platform_users WHERE auth_user_id = v_auth_user_id) THEN
    RAISE NOTICE 'User already exists in platform_users';
    
    -- Obtener el ID del platform_user existente
    SELECT id INTO v_platform_user_id 
    FROM platform.platform_users 
    WHERE auth_user_id = v_auth_user_id;
  ELSE
    -- Crear registro en platform_users
    INSERT INTO platform.platform_users (
      auth_user_id,
      email,
      full_name,
      status,
      mfa_enabled
    ) VALUES (
      v_auth_user_id,
      v_email,
      v_full_name,
      'active',
      false -- MFA disabled initially, user can enable it
    )
    RETURNING id INTO v_platform_user_id;

    RAISE NOTICE 'Created platform_user with ID: %', v_platform_user_id;
  END IF;

  -- Obtener el ID del rol super_admin
  SELECT id INTO v_super_admin_role_id
  FROM platform.platform_roles
  WHERE name = 'super_admin';

  IF v_super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'super_admin role not found';
  END IF;

  -- Asignar rol super_admin si no lo tiene ya
  IF NOT EXISTS (
    SELECT 1 FROM platform.user_roles
    WHERE user_id = v_platform_user_id
    AND role_id = v_super_admin_role_id
  ) THEN
    INSERT INTO platform.user_roles (user_id, role_id)
    VALUES (v_platform_user_id, v_super_admin_role_id);

    RAISE NOTICE 'Assigned super_admin role to user';
  ELSE
    RAISE NOTICE 'User already has super_admin role';
  END IF;

  -- Mostrar resumen
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Admin user created successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Platform User ID: %', v_platform_user_id;
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Name: %', v_full_name;
  RAISE NOTICE 'Role: super_admin';
  RAISE NOTICE 'Status: active';
  RAISE NOTICE 'MFA: disabled (user can enable from dashboard)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'You can now login at http://localhost:3001/login';
  RAISE NOTICE '============================================';

END $$;

-- Verificar resultado
SELECT 
  pu.id,
  pu.email,
  pu.full_name,
  pu.status,
  pu.mfa_enabled,
  pr.name as role_name,
  pr.display_name as role_display_name
FROM platform.platform_users pu
JOIN platform.user_roles ur ON ur.user_id = pu.id
JOIN platform.platform_roles pr ON pr.id = ur.role_id
WHERE pu.email = 'admin3@bookfast.es';
