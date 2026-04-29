'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const requestCode = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      })

      if (otpError) {
        setError('No se pudo enviar el código. Revisa el email.')
        return
      }

      setCodeSent(true)
      setSuccess('Te hemos enviado un código por correo.')
    } catch {
      setError('Error al enviar el código')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyCode = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })

      if (verifyError) {
        setError('Código inválido o expirado')
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      const authUserId = userData.user?.id

      if (!authUserId) {
        setError('No se pudo validar la sesión')
        return
      }

      const { data: platformUser } = await supabase
        .from('platform_users')
        .select('mfa_enabled')
        .eq('auth_user_id', authUserId)
        .single()

      if (platformUser?.mfa_enabled) {
        router.push('/mfa/verify')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center dark">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            BookFast Admin
          </CardTitle>
          <CardDescription>
            Accede con código de verificación por correo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@bookfast.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {codeSent && (
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-emerald-500/10 p-3">
                <p className="text-sm text-emerald-400">{success}</p>
              </div>
            )}

            {!codeSent ? (
              <Button
                type="button"
                className="w-full"
                disabled={isLoading || !email}
                onClick={requestCode}
              >
                {isLoading ? 'Enviando código...' : 'Enviar código'}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  type="button"
                  className="w-full"
                  disabled={isLoading || !email || !code}
                  onClick={verifyCode}
                >
                  {isLoading ? 'Verificando...' : 'Entrar con código'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || !email}
                  onClick={requestCode}
                >
                  Reenviar código
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
