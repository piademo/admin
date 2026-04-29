'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Shield, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function MfaSetupBanner() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    checkMfaStatus()
  }, [])

  const checkMfaStatus = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if dismissed in session
    const dismissedKey = `mfa-banner-dismissed-${user.id}`
    if (sessionStorage.getItem(dismissedKey)) {
      return
    }

    const { data: platformUser } = await supabase
      .from('platform_users')
      .select('mfa_enabled')
      .eq('auth_user_id', user.id)
      .single()

    if (platformUser && !platformUser.mfa_enabled) {
      setShow(true)
    }
  }

  const handleDismiss = () => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        sessionStorage.setItem(`mfa-banner-dismissed-${user.id}`, 'true')
      }
    })
    setDismissed(true)
    setShow(false)
  }

  const handleSetup = () => {
    router.push('/mfa/setup')
  }

  if (!show || dismissed) return null

  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <Shield className="h-4 w-4 text-amber-500" />
      <AlertTitle className="flex items-center justify-between">
        <span>Secure your account with MFA</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <span className="text-sm">
          Multi-factor authentication adds an extra layer of security to your account.
        </span>
        <Button onClick={handleSetup} size="sm" className="ml-4">
          Set up MFA
        </Button>
      </AlertDescription>
    </Alert>
  )
}
