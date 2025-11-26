'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, AlertCircle } from 'lucide-react'

export default function MfaVerifyPage() {
  const router = useRouter()
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleVerify = async () => {
    if (!code) return

    try {
      setVerifying(true)
      setError('')

      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.replace(/[^A-Z0-9-]/g, ''),
          isBackupCode: useBackupCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code')
      }

      // Redirect to dashboard
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length >= 6) {
      handleVerify()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 dark">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                {useBackupCode
                  ? 'Enter a backup code'
                  : 'Enter the code from your authenticator app'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">
              {useBackupCode ? 'Backup Code' : 'Verification Code'}
            </Label>
            <Input
              id="code"
              type="text"
              placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
              maxLength={useBackupCode ? 9 : 6}
              value={code}
              onChange={(e) => {
                const value = e.target.value
                if (useBackupCode) {
                  // Allow alphanumeric and dash for backup codes
                  setCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))
                } else {
                  // Only numbers for TOTP
                  setCode(value.replace(/\D/g, ''))
                }
              }}
              onKeyPress={handleKeyPress}
              className={`text-center ${useBackupCode ? 'text-xl' : 'text-2xl'} tracking-widest font-mono`}
              disabled={verifying}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {useBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={
              (useBackupCode ? code.length < 8 : code.length !== 6) ||
              verifying
            }
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setUseBackupCode(!useBackupCode)
              setCode('')
              setError('')
            }}
            className="w-full"
            type="button"
          >
            {useBackupCode
              ? 'Use authenticator app code'
              : 'Use backup code instead'}
          </Button>

          <div className="pt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                router.push('/login')
              }}
              className="text-sm"
            >
              Back to login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
