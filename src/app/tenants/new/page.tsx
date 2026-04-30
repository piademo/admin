import { TenantCreateForm } from '@/components/tenants/TenantCreateForm'

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo tenant</h1>
        <p className="text-muted-foreground">Dar de alta un negocio/organización en la plataforma</p>
      </div>

      <TenantCreateForm />
    </div>
  )
}

