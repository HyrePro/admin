'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from "next/image"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/api/client'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [resetComplete, setResetComplete] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verify the reset session on page load
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Create a Supabase client instance
        const supabase = createClient();
        
        // Check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.error('No valid session for password reset:', error)
          setIsValidToken(false)
          toast.error('Invalid reset link. Please request a new password reset.')
        } else {
          setIsValidToken(true)
          // Clear any URL parameters for security
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
        }
      } catch (err) {
        console.error('Unexpected error during session verification:', err)
        setIsValidToken(false)
        toast.error('An error occurred. Please try again.')
      }
    }

    verifySession()
  }, [])

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Create a Supabase client instance
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Password reset error:', error)
        toast.error(error.message || 'Failed to update password. Please try again.')
      } else {
        setResetComplete(true)
        toast.success('Password updated successfully!')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      console.error('Unexpected error during password reset:', err)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while verifying token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <Image src="/icon.png" alt="Hyriki logo" width={30} height={30} className="rounded-md" />
          <span className="text-lg font-bold text-foreground">Hyriki</span>
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-4 text-center text-muted-foreground">
              Verifying reset link...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if token is invalid
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <Image src="/icon.png" alt="Hyriki logo" width={30} height={30} className="rounded-md" />
          <span className="text-lg font-bold text-foreground">Hyriki</span>
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-600" />
            <h2 className="mt-4 text-xl font-semibold text-center">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              This password reset link is invalid, has expired, or you accessed this page directly. Please request a new password reset from the login page.
            </p>
            <Button 
              onClick={() => router.push('/login')} 
              className="mt-6 w-full"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success state after password reset
  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <Image src="/icon.png" alt="Hyriki logo" width={30} height={30} className="rounded-md" />
          <span className="text-lg font-bold text-foreground">Hyriki</span>
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-xl font-semibold text-center">
              Password Updated Successfully!
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Your password has been updated. You will be redirected to the login page shortly.
            </p>
            <Button 
              onClick={() => router.push('/login')} 
              className="mt-6 w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <Image src="/icon.png" alt="Hyriki logo" width={30} height={30} className="rounded-md" />
        <span className="text-lg font-bold text-foreground">Hyriki</span>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password (minimum 6 characters)"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !password || !confirmPassword}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}