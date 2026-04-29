
"use client"
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RoleForm } from './RoleForm'
import { createClient } from '@/lib/supabase/client'

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchRoles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('platform_roles')
      .select(`
        *,
        role_permissions(
          platform_permissions(name, display_name, resource, action)
        )
      `)
      .order('level', { ascending: true })
    if (error) setError('Error al cargar roles')
    else setRoles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleCreate = async (data: any) => {
    setError('')
    const { error } = await supabase.from('platform_roles').insert([data])
    if (error) setError('No se pudo crear el rol')
    else {
      setShowForm(false)
      fetchRoles()
    }
  }

  const handleEdit = async (data: any) => {
    setError('')
    const { error } = await supabase
      .from('platform_roles')
      .update(data as any)
      .eq('id', editingRole.id)
    if (error) setError('No se pudo actualizar el rol')
    else {
      setShowForm(false)
      setEditingRole(null)
      fetchRoles()
    }
  }

  const handleEditClick = (role: any) => {
    setEditingRole(role)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingRole(null)
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Gestión de Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button variant="default" onClick={() => setShowForm(true)}>Nuevo Rol</Button>
          </div>
          {showForm && (
            <div className="mb-6">
              <RoleForm 
                initialData={editingRole} 
                onSubmit={editingRole ? handleEdit : handleCreate} 
                onCancel={handleCancel} 
              />
            </div>
          )}
          <Separator className="mb-4" />
          {error && (
            <div className="text-red-500">{error}</div>
          )}
          <div className="space-y-2">
            {loading ? (
              <div className="text-muted-foreground">Cargando...</div>
            ) : roles && roles.length > 0 ? (
              roles.map((role: any) => (
                <div key={role.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold">{role.display_name}</div>
                      <div className="text-xs text-muted-foreground">{role.name} (Nivel {role.level})</div>
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEditClick(role)}>Editar</Button>
                  </div>
                  {role.role_permissions && role.role_permissions.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">Permisos:</div>
                      <div className="flex flex-wrap gap-1">
                        {role.role_permissions.map((rp: any) => (
                          <Badge key={rp.platform_permissions.name} variant="secondary" className="text-xs">
                            {rp.platform_permissions.display_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No hay roles registrados.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
