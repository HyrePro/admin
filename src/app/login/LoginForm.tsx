'use client'

import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/api/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showResendDialog, setShowResendDialog] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle error messages from URL parameters
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const messageParam = searchParams.get('message')
    
    if (errorParam && messageParam) {
      setError(decodeURIComponent(messageParam))
    } else if (errorParam) {
      // Fallback error messages
      const errorMessages: Record<string, string> = {
        'auth_error': 'Authentication failed. Please try again.',
        'email_not_confirmed': 'Please check your email and confirm your account.',
        'session_error': 'Failed to create session. Please try again.',
        'server_error': 'An unexpected error occurred. Please try again.',
        'missing_code': 'Authorization code missing. Please try again.',
      }
      setError(errorMessages[errorParam] || 'An error occurred during authentication.')
    }
  }, [searchParams])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.')
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.user && data.session) {
        setMessage('Login successful! Redirecting...')
        // Small delay to show success message
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage('Check your email for the login link')
      setShowResendDialog(true)
    } catch (error) {
      console.error('Magic link error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError('Failed to initialize Google login. Please try again.')
        setGoogleLoading(false)
      }
      // Don't set loading to false here as the page will redirect
    } catch (error) {
      console.error('Google login error:', error)
      setError('An unexpected error occurred. Please try again.')
      setGoogleLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      })
      
      if (error) {
        setError('Error resending email. Please try again.')
      } else {
        setMessage('Verification email resent!')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Sign in to HyrePro Admin</h1>
        <p className="text-muted-foreground text-sm">
          {loginMethod === 'password' 
            ? 'Enter your email and password below to sign in'
            : 'Enter your email below to receive a magic link'
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Login Method Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-md">
        <button
          type="button"
          onClick={() => setLoginMethod('password')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
            loginMethod === 'password'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('magic-link')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
            loginMethod === 'magic-link'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Magic Link
        </button>
      </div>

      <form 
        className="space-y-4" 
        onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleMagicLinkLogin}
      >
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
          />
        </div>

        {loginMethod === 'password' && (
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loginMethod === 'password'
            ? (loading ? 'Signing in...' : 'Sign In')
            : (loading ? 'Sending...' : 'Send Magic Link')
          }
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full" 
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        {googleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {googleLoading ? 'Connecting...' : 'Continue with Google'}
      </Button>

      {/* Resend Dialog */}
      <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <div className="p-6">
          <DialogTitle className="text-xl font-bold mb-4 text-center">
            Check your email for the login link
          </DialogTitle>
          <p className="text-muted-foreground text-center mb-4">
            We sent a login link to <strong>{email}</strong>
          </p>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={handleResend} 
              disabled={resendLoading}
            >
              {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resendLoading ? 'Resending...' : 'Resend email'}
            </Button>
            <button 
              onClick={() => setShowResendDialog(false)} 
              className="w-full text-sm text-muted-foreground hover:text-foreground underline"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>

      <div className="text-xs text-center text-muted-foreground pt-4">
        By signing in, you agree to our{' '}
        <a href="#" className="underline hover:text-foreground">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline hover:text-foreground">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  )
} 