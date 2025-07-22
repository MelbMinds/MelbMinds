'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-email/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Network error. Please try again.')
      }
    }

    verifyEmail()
  }, [token])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue to-deep-blue/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl font-serif">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={getStatusColor()}>
            <AlertDescription className="text-center">
              {message}
            </AlertDescription>
          </Alert>

          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>Welcome to MelbMinds! 🎉</p>
                <p>Your account has been successfully verified.</p>
              </div>
              <Button 
                onClick={() => router.push('/auth')}
                className="w-full bg-deep-blue hover:bg-deep-blue/90"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>The verification link may be invalid or expired.</p>
                <p>Please check your email for a new verification link.</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/auth')}
                  className="flex-1"
                >
                  Back to Login
                </Button>
                <Button 
                  onClick={() => router.push('/auth?resend=true')}
                  className="flex-1 bg-deep-blue hover:bg-deep-blue/90"
                >
                  Resend Email
                </Button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center text-sm text-gray-600">
              <p>Please wait while we verify your email address...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}