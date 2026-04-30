import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { getCurrentPlatformUser } from '@/lib/auth/platform'

export default async function AuditLayout({ children }: { children: React.ReactNode }) {
  const platformUser = await getCurrentPlatformUser()
  if (!platformUser) redirect('/login')
  return <AdminLayout>{children}</AdminLayout>
}

