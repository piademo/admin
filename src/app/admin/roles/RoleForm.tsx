"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const roleSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  display_name: z.string().min(2, 'El nombre visible es requerido'),
  description: z.string().optional(),
  level: z.number().min(1, 'Nivel requerido'),
})

type RoleFormData = z.infer<typeof roleSchema>

export function RoleForm({
  initialData,
  onSubmit: onSubmitProp,
  onCancel,
}: {
  initialData?: Partial<RoleFormData>
  onSubmit: (data: RoleFormData) => void
  onCancel: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData || { level: 1 },
  })

  const onSubmit = async (data: RoleFormData) => {
    setIsLoading(true)
    await onSubmitProp(data)
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Editar Rol' : 'Nuevo Rol'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre (único)</label>
            <Input {...register('name')} disabled={isLoading || !!initialData?.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Nombre visible</label>
            <Input {...register('display_name')} disabled={isLoading} />
            {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Descripción</label>
            <Input {...register('description')} disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium">Nivel</label>
            <Input type="number" {...register('level', { valueAsNumber: true })} disabled={isLoading} />
            {errors.level && <p className="text-sm text-destructive">{errors.level.message}</p>}
          </div>
          <Separator />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{initialData ? 'Guardar' : 'Crear'}</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
