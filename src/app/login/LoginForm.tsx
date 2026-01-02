'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/api/client"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Loader2, AlertCircle, Eye, EyeOff } from "@/components/icons"
import Image from "next/image"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

// Dynamically import the forgot password dialog to reduce initial bundle size
const ForgotPasswordDialog = dynamic(() => import("@/components/forgot-password-dialog").then(mod => mod.ForgotPasswordDialog), {
  ssr: false
})

interface LoginFormProps extends React.ComponentProps<"form"> {
  email?: string | null
  redirect?: string | null
  invitation?: string | null
}

export function LoginForm({
  className,
  email: initialEmail,
  redirect: initialRedirect,
  invitation: initialInvitation,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false)
  const [invitation, setInvitation] = useState<string | null>(initialInvitation || null)
  const [showSignInMessage, setShowSignInMessage] = useState(!!initialEmail)
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // Create the supabase client instance
  const supabase = createClient()

  // Set email from initial prop
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
      setShowSignInMessage(true)
    }
    
    // Clear any existing error when arriving from invitation link
    setError("")
  }, [initialEmail])

  // Redirect user if they're already logged in
  useEffect(() => {
    if (!loading && user) {
      console.log('User already logged in, checking school info')
      // Check if user has school info and redirect accordingly
      checkUserSchoolInfo()
    }
  }, [user, loading, router])

  const checkUserSchoolInfo = async () => {
    if (!user) return
    
    try {
      const supabase = createClient()
      console.log('Checking school info for user', user.id)
      
      const { data, error } = await supabase
        .from('admin_user_info')
        .select('school_id')
        .eq('id', user.id)
        .single()

      console.log('Admin user info data:', data)
      console.log('Admin user info error:', error)

      if (error) {
        console.error('Error fetching school info:', error)
        // If there's an error, redirect to create-school as a fallback
        console.log('Redirecting to create-school due to error')
        router.replace('/create-school')
        return
      }

      const fetchedSchoolId = data?.school_id || null
      console.log('Fetched school ID:', fetchedSchoolId)

      // Check if user is verified
      const isVerified = user.email_confirmed_at !== null
      console.log('User verification status:', isVerified)

      // If user is verified but school_id is missing, redirect to create-school
      if (isVerified && !fetchedSchoolId) {
        console.log('Redirecting to create-school because school_id is null')
        router.replace('/select-organization')
        return
      }

      // If user is logged in and school_id exists, redirect to dashboard
      if (isVerified && fetchedSchoolId) {
        console.log('Redirecting to dashboard because school_id exists')
        router.replace('/')
        return
      }
      
      // If user is not verified, stay on current page
      if (!isVerified) {
        console.log('User not verified, should verify email first')
      }
    } catch (error) {
      console.error('Error in checkUserSchoolInfo:', error)
      // Even if there's an error, if the user is verified, redirect to create-school as a fallback
      const isVerified = user?.email_confirmed_at !== null
      if (isVerified) {
        console.log('Redirecting to create-school due to error but user is verified')
        router.replace('/create-school')
      }
    }
  }

  const isValidRedirectPath = (path: string): boolean => {
    // Security: Validate the redirect path is relative (starts with /) to prevent open redirect vulnerabilities
    return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInError) {
        console.error('Login error:', signInError)
        
        // Provide user-friendly error messages
        let errorMessage = signInError.message
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.'
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.'
        }
        
        setError(errorMessage)
      } else if (data.user && data.session) {
        console.log('Login successful, user:', data.user.email)
        console.log('User email confirmed at:', data.user.email_confirmed_at)
        
        // After successful login, check if we have a redirect parameter
        let redirectPath = '/'
        
        // If there's an invitation token, redirect to the invitation page
        if (invitation) {
          redirectPath = `/invite/${invitation}`
        }
        // Otherwise, use the initial redirect parameter passed to the component
        else if (initialRedirect && isValidRedirectPath(initialRedirect)) {
          redirectPath = initialRedirect
        }
        
        // Redirect to the appropriate path
        console.log('Redirecting to:', redirectPath)
        router.push(redirectPath)
      } else {
        setError('Login failed: No user data received')
      }
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")
    
    try {
      // Prepare redirect URL with parameters if they exist
      let redirectTo = `${window.location.origin}/auth/callback`
      
      // Add redirect parameter to the callback URL if it exists
      if (initialRedirect && isValidRedirectPath(initialRedirect)) {
        const url = new URL(redirectTo)
        url.searchParams.set('next', initialRedirect)
        redirectTo = url.toString()
      }
      // If there's an invitation token, add it to the callback URL
      else if (invitation) {
        const url = new URL(redirectTo)
        url.searchParams.set('next', `/invite/${invitation}`)
        redirectTo = url.toString()
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <>
      <form 
        className={cn("flex flex-col gap-6", className)} 
        onSubmit={handleEmailLogin}
        {...props}
      >
        <div className="flex flex-col gap-2 mb-2">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          {showSignInMessage && email && (
            <p className="text-muted-foreground text-sm text-balance">
              Sign in with <span className="font-semibold">{email}</span> to continue
            </p>
          )}
          {!showSignInMessage && (
            <p className="text-muted-foreground text-sm text-balance">
              Enter your email below to login to your account
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                // Hide the sign-in message if user manually changes the email
                if (showSignInMessage) {
                  setShowSignInMessage(false)
                }
              }}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  setShowForgotPasswordDialog(true)
                }}
              >
                Forgot your password?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </Button>
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
               <Image src="/iv_google.png" alt="Google Logo"
                width={20}
                height={20}
                 className="w-5 h-5 mr-2" />
                Login with Google
              </>
            )}
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          By continuing, you agree to our{" "}
          <a
            href="https://hyriki.com/terms"
            className="hover:underline underline-offset-4 text-blue-600"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://hyriki.com/privacy"
            className="hover:underline underline-offset-4 text-blue-600"
          >
            Privacy Policy
          </a>
          .
        </span>
      </form>

      <ForgotPasswordDialog 
        open={showForgotPasswordDialog} 
        onOpenChange={setShowForgotPasswordDialog}
        initialEmail={email}
      />
    </>
  )
}