/**
 * Script to create the first platform admin user
 * 
 * Usage:
 * 1. Create user in Supabase Dashboard > Authentication > Add User
 * 2. Copy the user UUID
 * 3. Run this script: node scripts/create-first-admin.js <user-uuid> <email> <full-name>
 * 
 * Example:
 * node scripts/create-first-admin.js "123e4567-e89b-12d3-a456-426614174000" "admin@bookfast.es" "Super Admin"
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createFirstAdmin() {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.error('❌ Missing arguments')
    console.log('\nUsage:')
    console.log('  node scripts/create-first-admin.js <auth-user-id> <email> <full-name>')
    console.log('\nExample:')
    console.log('  node scripts/create-first-admin.js "123e4567-e89b-12d3-a456-426614174000" "admin@bookfast.es" "Super Admin"')
    process.exit(1)
  }

  const [authUserId, email, fullName] = args

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables')
    console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🚀 Creating first platform admin...\n')

  try {
    // 1. Check if user exists in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(authUserId)
    
    if (authError || !authUser) {
      console.error('❌ User not found in Supabase Auth')
      console.log('Please create the user first in Supabase Dashboard > Authentication > Add User')
      process.exit(1)
    }

    console.log('✅ Found auth user:', authUser.user.email)

    // 2. Create platform_user
    const { data: platformUser, error: userError } = await supabase
      .from('platform_users')
      .insert({
        auth_user_id: authUserId,
        email: email,
        full_name: fullName,
        status: 'active'
      })
      .select()
      .single()

    if (userError) {
      if (userError.code === '23505') {
        console.error('❌ User already exists in platform_users')
      } else {
        console.error('❌ Error creating platform user:', userError.message)
      }
      process.exit(1)
    }

    console.log('✅ Created platform user:', platformUser.id)

    // 3. Get super_admin role
    const { data: role, error: roleError } = await supabase
      .from('platform_roles')
      .select('id')
      .eq('name', 'super_admin')
      .single()

    if (roleError || !role) {
      console.error('❌ super_admin role not found')
      console.log('Make sure you ran the migration first')
      process.exit(1)
    }

    // 4. Assign super_admin role
    const { error: assignError } = await supabase
      .from('user_roles')
      .insert({
        user_id: platformUser.id,
        role_id: role.id
      })

    if (assignError) {
      console.error('❌ Error assigning role:', assignError.message)
      process.exit(1)
    }

    console.log('✅ Assigned super_admin role')

    console.log('\n🎉 Success! First admin user created:\n')
    console.log('  Email:', email)
    console.log('  Name:', fullName)
    console.log('  Role: super_admin')
    console.log('\nYou can now login at http://localhost:3001/login')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

createFirstAdmin()
