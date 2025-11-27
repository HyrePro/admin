'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function AuthCodeErrorPage() {
  const router = useRouter()

  const handleRetry = () => {
    // Go back to login page to retry the process
    router.push('/login')
  }

  const handleContactSupport = () => {
    // In a real application, this would open a support ticket or contact form
    alert('Please contact support at support@Hyriki.com for assistance with authentication issues.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-600" />
          <CardHeader className="space-y-1 p-0 mt-4">
            <CardTitle className="text-2xl font-bold text-center">
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardDescription className="text-center mt-2">
            We encountered an issue while verifying your authentication code.
          </CardDescription>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="mb-2">This could be due to:</p>
            <ul className="text-left space-y-1">
              <li>• Network connectivity issues</li>
              <li>• Expired or invalid verification code</li>
              <li>• Server temporarily unavailable</li>
            </ul>
          </div>
          
          <div className="mt-6 flex flex-col gap-3 w-full">
            <Button onClick={handleRetry} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry Verification
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleContactSupport}
              className="w-full"
            >
              Contact Support
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}