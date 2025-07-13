"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CheckEmailPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue to-deep-blue/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
          <CardTitle className="text-xl font-serif">
            Check Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-700">
            <p>We’ve sent a verification link to your university email address.</p>
            <p className="mt-2 text-sm">Please check your inbox and click the link to verify your account before logging in.</p>
            <p className="mt-2 text-xs text-gray-500">Didn’t receive the email? Check your spam folder or <span className="text-blue-700 underline cursor-pointer" onClick={() => router.push('/auth?resend=true')}>resend verification</span>.</p>
          </div>
          <Button className="w-full bg-deep-blue hover:bg-deep-blue/90" onClick={() => router.push('/auth')}>Back to Login</Button>
        </CardContent>
      </Card>
    </div>
  )
} 