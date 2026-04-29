-- Insertar el nuevo usuario admin en platform_users
INSERT INTO platform_users (id, email, role, full_name)
VALUES (
  'c60c4cc8-b0ed-49a0-b7bf-61df3d515eb5',
  'admin3@bookfast.es',
  'admin',
  'Admin BookFast'
);

-- Verificar que se insertó correctamente
SELECT id, email, role, full_name, created_at
FROM platform_users
WHERE email = 'admin3@bookfast.es';
