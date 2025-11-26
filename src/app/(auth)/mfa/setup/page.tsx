'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Copy, Check, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function MfaSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [step, setStep] = useState<'loading' | 'setup' | 'verify' | 'complete'>('loading')
  
  const [mfaData, setMfaData] = useState<{
    secret: string
    qrCodeUrl: string
    backupCodes: string[]
  } | null>(null)
  
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCode, setCopiedCode] = useState<number | null>(null)

  // Generate MFA secret on mount
  useEffect(() => {
    generateMfaSecret()
  }, [])

  const generateMfaSecret = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/mfa/setup', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate MFA secret')
      }

      setMfaData(data.data)
      setStep('setup')
    } catch (err: any) {
      setError(err.message)
      setStep('setup')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || !mfaData) return

    try {
      setVerifying(true)
      setError('')

      const response = await fetch('/api/mfa/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: mfaData.secret,
          code: verificationCode,
          backupCodes: mfaData.backupCodes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code')
      }

      setStep('complete')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  const copyToClipboard = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text)
    if (index !== undefined) {
      setCopiedCode(index)
      setTimeout(() => setCopiedCode(null), 2000)
    } else {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const handleComplete = () => {
    router.push('/')
    router.refresh()
  }

  if (loading || step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Generating MFA setup...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'setup' || step === 'verify') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Configure Multi-Factor Authentication</CardTitle>
                <CardDescription>
                  Secure your account with an authenticator app
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {mfaData && (
              <>
                {/* Step 1: Scan QR Code */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Step 1: Scan QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Use Google Authenticator, Authy, or any TOTP-compatible app
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/30 p-6">
                    <div className="rounded-lg bg-white p-4">
                      <Image
                        src={mfaData.qrCodeUrl}
                        alt="MFA QR Code"
                        width={200}
                        height={200}
                        unoptimized
                      />
                    </div>
                    
                    <div className="w-full space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Or enter this key manually:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={mfaData.secret}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(mfaData.secret)}
                        >
                          {copiedSecret ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Backup Codes */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Step 2: Save Backup Codes</h3>
                    <p className="text-sm text-muted-foreground">
                      Store these codes in a safe place. Each can be used once if you lose access to your authenticator.
                    </p>
                  </div>
                  
                  <div className="grid gap-2 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                    {mfaData.backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded bg-background px-3 py-2"
                      >
                        <code className="text-sm font-mono">{code}</code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code, index)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedCode === index ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> These codes will not be shown again. Download or print them now.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Step 3: Verify */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Step 3: Verify Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-2xl tracking-widest"
                        disabled={verifying}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        className="flex-1"
                        disabled={verifying}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={verifyAndEnable}
                        className="flex-1"
                        disabled={verificationCode.length !== 6 || verifying}
                      >
                        {verifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Enable MFA'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Complete step
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-center">
              <CardTitle>MFA Enabled Successfully!</CardTitle>
              <CardDescription className="mt-2">
                Your account is now protected with multi-factor authentication
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleComplete} className="w-full">
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
