-- Obtener el UUID del usuario por email
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin3@bookfast.es';
