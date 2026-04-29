const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://jsqminbgggwhvkfgeibz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcW1pbmJnZ2d3aHZrZmdlaWJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg2MjY0MywiZXhwIjoyMDc4NDM4NjQzfQ.uKFhaqJQlccvwO4UvttO0orcInECcc6fO8z9Ze9YhG8',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function updatePassword() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    'ffc70945-5cb0-4d9f-9120-63b8d97b4a25',
    { password: 'Admin2024!' }
  )
  
  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('✅ Contraseña actualizada!')
    console.log('Email:', data.user.email)
  }
}

updatePassword()
