"use client"
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [userRoles, setUserRoles] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes, userRolesRes] = await Promise.all([
        supabase.from('platform_users').select('*').order('created_at', { ascending: false }),
        supabase.from('platform_roles').select('*').order('level', { ascending: true }),
        supabase.from('user_roles').select('*, platform_roles(name, display_name)').order('created_at', { ascending: false })
      ])

      if (usersRes.error) setError('Error al cargar usuarios')
      else setUsers(usersRes.data || [])

      if (rolesRes.error) setError('Error al cargar roles')
      else setRoles(rolesRes.data || [])

      if (userRolesRes.error) setError('Error al cargar asignaciones')
      else setUserRoles(userRolesRes.data || [])
    } catch (err) {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getUserRoles = (userId: string) => {
    return userRoles.filter(ur => ur.user_id === userId).map(ur => ur.platform_roles)
  }

  const handleAssignRole = async (userId: string, roleId: string) => {
    setError('')
    const { error } = await supabase.from('user_roles').insert([{ user_id: userId, role_id: roleId }])
    if (error) setError('No se pudo asignar el rol')
    else fetchData()
  }

  const handleRemoveRole = async (userId: string, roleId: string) => {
    setError('')
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId)
    if (error) setError('No se pudo quitar el rol')
    else fetchData()
  }

  const hasRole = (userId: string, roleId: string) => {
    return userRoles.some(ur => ur.user_id === userId && ur.role_id === roleId)
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Gestión de Usuarios y Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}
          <div className="space-y-4">
            {loading ? (
              <div className="text-muted-foreground">Cargando...</div>
            ) : users && users.length > 0 ? (
              users.map((user: any) => {
                const userRolesList = getUserRoles(user.id)
                return (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Estado: <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {userRolesList.map((role: any) => (
                          <Badge key={role.name} variant="outline">{role.display_name}</Badge>
                        ))}
                      </div>
                    </div>
                    <Separator className="mb-3" />
                    <div>
                      <div className="text-sm font-medium mb-2">Asignar roles:</div>
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role: any) => {
                          const assigned = hasRole(user.id, role.id)
                          return (
                            <Button
                              key={role.id}
                              size="sm"
                              variant={assigned ? "default" : "outline"}
                              onClick={() => assigned ? handleRemoveRole(user.id, role.id) : handleAssignRole(user.id, role.id)}
                            >
                              {role.display_name} {assigned ? '✓' : '+'}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-muted-foreground">No hay usuarios registrados.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}