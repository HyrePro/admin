'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/api/client"
import { Separator } from "./ui/separator"
import Image from "next/image"
import { SignupProgressDialog } from "./signup-progress-dialog"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

interface SignupFormProps extends React.ComponentProps<"div"> {
  email?: string | null
  redirect?: string | null
  invitation?: string | null
}

export function SignupForm({
  className,
  email: initialEmail,
  redirect: initialRedirect,
  invitation: initialInvitation,
  ...props
}: SignupFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [email, setEmail] = useState(initialEmail || "")
  const [invitation, setInvitation] = useState<string | null>(initialInvitation || null)
  const [showSignUpMessage, setShowSignUpMessage] = useState(!!initialEmail)
  const router = useRouter()
  const supabase = createClient()

  // Set email from initial prop
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
      setShowSignUpMessage(true)
    }
    
    // Clear any existing error when arriving from invitation link
    setError("")
  }, [initialEmail])

  const isValidRedirectPath = (path: string): boolean => {
    // Security: Validate the redirect path is relative (starts with /) to prevent open redirect vulnerabilities
    return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const form = e.target as HTMLFormElement
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement)?.value
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement)?.value
    const contactNumber = (form.elements.namedItem('contactNumber') as HTMLInputElement)?.value
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value

    if (!firstName || !lastName || !email || !contactNumber || !password) {
      const errorMsg = "Please fill in all fields."
      setError(errorMsg)
      console.warn("Signup attempt with missing required fields")
      toast.error("Missing Information", {
        description: errorMsg,
        duration: 5000,
      })
      setIsSubmitting(false)
      return
    }

    if (!email.includes("@")) {
      const errorMsg = "Please enter a valid email address."
      setError(errorMsg)
      console.warn("Invalid email format provided:", email)
      toast.error("Invalid Email", {
        description: errorMsg,
        duration: 5000,
      })
      setIsSubmitting(false)
      return
    }

    try {
      const baseUrl = window.location.origin
      let redirectUrl = `${baseUrl}`
      
      // If there's an invitation token, redirect to the invitation page after email confirmation
      if (invitation) {
        redirectUrl = `${baseUrl}/invite/${invitation}`
      }
      // Otherwise, if there's a redirect parameter, use that
      else if (initialRedirect && isValidRedirectPath(initialRedirect)) {
        redirectUrl = `${baseUrl}${initialRedirect}`
      }

      console.log('=== SIGNUP ATTEMPT START ===')
      console.log('Email:', email)
      console.log('Redirect URL:', redirectUrl)
      console.log('Timestamp:', new Date().toISOString())

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            contact_number: contactNumber,
            user_type: "admin",
            school_id: null,
          },
          emailRedirectTo: redirectUrl,
        },
      })

      // COMPREHENSIVE logging for debugging email issues
      console.log('=== FULL SIGNUP RESPONSE ===')
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        hasError: !!signUpError,
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          confirmation_sent_at: data.user.confirmation_sent_at,
          created_at: data.user.created_at,
          identities_count: data.user.identities?.length || 0,
          identities: data.user.identities,
          role: data.user.role,
          app_metadata: data.user.app_metadata,
          user_metadata: data.user.user_metadata,
        } : null,
        session: data?.session ? {
          access_token: data.session.access_token ? '***EXISTS***' : null,
          refresh_token: data.session.refresh_token ? '***EXISTS***' : null,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
        } : null,
        error: signUpError ? {
          name: signUpError.name,
          message: signUpError.message,
          status: signUpError.status,
          stack: signUpError.stack,
        } : null,
      }, null, 2))
      console.log('=== END SIGNUP RESPONSE ===')

      // Check if user already exists and is verified
      // Supabase returns user with empty identities array for existing users
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setIsSubmitting(false)
        setError("This email is already registered.")
        console.warn("❌ Signup attempt with already registered email:", email)
        toast.error("Account already exists", {
          description: "This email is already registered. Please log in instead.",
          action: {
            label: "Go to Login",
            onClick: () => {
              // Include redirect parameter in login URL if it exists
              let loginUrl = "/login"
              if (initialRedirect && isValidRedirectPath(initialRedirect)) {
                loginUrl += `?redirect=${encodeURIComponent(initialRedirect)}`
              }
              router.push(loginUrl)
            },
          },
          duration: 5000,
        })
        return
      }

      if (signUpError) {
        setIsSubmitting(false)
        setError(signUpError.message)
        
        // DETAILED error logging
        console.error("❌ === SIGNUP ERROR DETAILS ===")
        console.error("Error Name:", signUpError.name)
        console.error("Error Message:", signUpError.message)
        console.error("Error Status:", signUpError.status)
        console.error("Error Stack:", signUpError.stack)
        console.error("Full Error Object:", JSON.stringify(signUpError, null, 2))
        console.error("=== END ERROR DETAILS ===")
        
        // Provide more user-friendly error messages for common issues
        let errorMessage = signUpError.message
        const toastDuration = 8000
        
        if (signUpError.message.includes('Email rate limit exceeded') || 
            signUpError.message.toLowerCase().includes('rate limit')) {
          errorMessage = "We've hit our email limit. Please try again in a few minutes or contact support."
          console.error("🚫 EMAIL RATE LIMIT HIT - Check Supabase dashboard for limits")
          toast.error("Email Limit Reached", {
            description: "We've temporarily reached our email sending limit. Please try again in a few minutes or contact support if this persists.",
            duration: 10000,
          })
        } else if (signUpError.message.includes('Unable to send email') ||
                   signUpError.message.includes('email') && signUpError.message.includes('send')) {
          errorMessage = "We couldn't send the verification email. Please check the email address and try again."
          console.error("📧 EMAIL SENDING FAILED - Check Supabase email provider configuration")
          console.error("Possible causes:")
          console.error("1. SMTP credentials not configured or invalid")
          console.error("2. Email provider blocked the sender")
          console.error("3. Supabase email service is down")
          console.error("4. Email confirmations disabled in Supabase settings")
          toast.error("Email Delivery Failed", {
            description: "We couldn't send the verification email. Please verify the email address is correct. If the problem persists, contact support.",
            duration: 12000,
          })
        } else if (signUpError.message.includes('Error sending confirmation email') ||
                   signUpError.message.includes('confirmation') && signUpError.message.includes('email')) {
          errorMessage = "We encountered an issue sending your confirmation email. Please try again or contact support."
          console.error("⚠️ CONFIRMATION EMAIL ERROR")
          console.error("Check Supabase Dashboard → Authentication → Email Templates")
          console.error("Verify 'Confirm signup' template is enabled")
          toast.error("Email Confirmation Error", {
            description: "We couldn't send your confirmation email. Your account may have been created, but you'll need to confirm your email to log in.",
            duration: 15000,
            action: {
              label: "Try Again",
              onClick: () => {
                setIsSubmitting(false)
              }
            }
          })
        } else if (signUpError.message.includes('Invalid email')) {
          errorMessage = "The email address is invalid. Please check and try again."
          console.error("❌ INVALID EMAIL FORMAT:", email)
          toast.error("Invalid Email", {
            description: errorMessage,
            duration: 6000,
          })
        } else if (signUpError.message.includes('SMTP') || 
                   signUpError.message.includes('mail server')) {
          errorMessage = "Email service temporarily unavailable. Please try again later."
          console.error("🔧 SMTP/MAIL SERVER ERROR - Contact your email provider")
          toast.error("Email Service Error", {
            description: "Our email service is temporarily unavailable. Please try again in a few minutes.",
            duration: 10000,
          })
        } else {
          console.error("❓ UNKNOWN SIGNUP ERROR - Review error details above")
          toast.error("Signup Error", {
            description: errorMessage,
            duration: toastDuration,
          })
        }
        return
      }

      // If signup successful, check for email confirmation issues
      if (data.user) {
        console.log('✅ User account created successfully')
        console.log('User ID:', data.user.id)
        
        // Check if email confirmation was sent
        const emailSentSuccessfully = data.user.confirmation_sent_at || data.user.email_confirmed_at
        
        if (!emailSentSuccessfully) {
          console.warn('⚠️ WARNING: Email confirmation may not have been sent!')
          console.warn('confirmation_sent_at:', data.user.confirmation_sent_at)
          console.warn('email_confirmed_at:', data.user.email_confirmed_at)
          console.warn('This usually means:')
          console.warn('1. Email confirmations are disabled in Supabase')
          console.warn('2. Email provider is not configured')
          console.warn('3. Silent email sending failure')
          console.warn('Check: Supabase Dashboard → Authentication → Settings → Enable email confirmations')
          
          toast.warning("Email May Not Be Sent", {
            description: "We created your account but may not have sent the confirmation email. Please contact support if you don't receive it within 5 minutes.",
            duration: 12000,
          })
        } else {
          console.log('📧 Email confirmation appears to have been sent')
          if (data.user.confirmation_sent_at) {
            console.log('Confirmation sent at:', data.user.confirmation_sent_at)
          }
        }
        
        setSignupEmail(email)
        setIsSignupDialogOpen(true)

        // Create admin user record
        try {
          console.log('Creating admin user record...')
          const adminResponse = await fetch("/api/admin-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              email,
              phone_no: contactNumber,
              user_id: data.user.id,
            }),
          })
          
          if (!adminResponse.ok) {
            const errorText = await adminResponse.text()
            console.error("❌ Failed to create admin user record")
            console.error("Status:", adminResponse.status)
            console.error("Response:", errorText)
          } else {
            console.log('✅ Admin user record created successfully')
          }
        } catch (adminError) {
          console.error("❌ Error creating admin user record:", adminError)
          console.error("Stack:", adminError instanceof Error ? adminError.stack : "No stack")
        }

        // Show success message with appropriate instructions
        const successMessage = emailSentSuccessfully
          ? "Please check your email to confirm your account. Check your spam folder if you don't see it. You must confirm your email before logging in."
          : "Account created! However, we may not have sent the confirmation email. Please contact support if you need assistance."

       
        
        setMessage("Account created successfully! Please check your email and click the verification link to activate your account. You must confirm your email before logging in.")
        
        console.log('=== SIGNUP ATTEMPT END - SUCCESS ===')
      }

      setIsSubmitting(false)
    } catch (err) {
      // Log unexpected errors with full details
      console.error("❌ === UNEXPECTED SIGNUP ERROR ===")
      console.error("Error:", err)
      console.error("Error Type:", typeof err)
      console.error("Error Name:", err instanceof Error ? err.name : "Unknown")
      console.error("Error Message:", err instanceof Error ? err.message : String(err))
      console.error("Error Stack:", err instanceof Error ? err.stack : "No stack trace")
      console.error("Full Error:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
      console.error("=== END UNEXPECTED ERROR ===")
      
      setIsSignupDialogOpen(false)
      setIsSubmitting(false)
      const msg = err instanceof Error ? err.message : "Signup failed. Please try again."
      setError(msg)
      toast.error("Signup Failed", {
        description: msg + " Please contact support if this issue persists.",
        duration: 10000,
      })
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")
    
    try {
      console.log('=== GOOGLE LOGIN ATTEMPT START ===')
      
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
      
      console.log('Google OAuth Redirect URL:', redirectTo)
      
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
        console.error("❌ === GOOGLE LOGIN ERROR ===")
        console.error("Error Name:", error.name)
        console.error("Error Message:", error.message)
        console.error("Error Status:", error.status)
        console.error("Full Error:", JSON.stringify(error, null, 2))
        console.error("=== END GOOGLE ERROR ===")
        
        setError(error.message)
        toast.error("Google Login Failed", {
          description: error.message || "Failed to sign in with Google. Please try again or use email signup.",
          duration: 8000,
        })
      } else {
        console.log('✅ Google OAuth initiated successfully')
      }
    } catch (err) {
      console.error("❌ === UNEXPECTED GOOGLE LOGIN ERROR ===")
      console.error("Error:", err)
      console.error("Stack:", err instanceof Error ? err.stack : "No stack")
      console.error("=== END UNEXPECTED GOOGLE ERROR ===")
      
      const errorMessage = "Failed to sign in with Google. Please try again."
      setError(errorMessage)
      toast.error("Google Login Error", {
        description: errorMessage,
        duration: 8000,
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleResendEmail = async () => {
    try {
      console.log('=== RESEND EMAIL ATTEMPT ===')
      console.log('Email:', signupEmail)
      console.log('Timestamp:', new Date().toISOString())
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail
      })
      
      if (error) {
        console.error("❌ === RESEND EMAIL ERROR ===")
        console.error("Error Name:", error.name)
        console.error("Error Message:", error.message)
        console.error("Error Status:", error.status)
        console.error("Error Stack:", error.stack)
        console.error("Full Error:", JSON.stringify(error, null, 2))
        console.error("=== END RESEND ERROR ===")
        
        // Handle specific resend errors
        if (error.message.includes('Error sending confirmation email') ||
            error.message.includes('Unable to send email')) {
          console.error("📧 Email service configuration issue - check Supabase settings")
          toast.error("Email Confirmation Error", {
            description: "We're having trouble sending your confirmation email. This usually means the email service needs to be configured. Please contact support for assistance.",
            duration: 15000,
          })
        } else if (error.message.includes('rate limit')) {
          console.error("🚫 Rate limit hit on resend")
          toast.error("Too Many Attempts", {
            description: "Please wait a few minutes before trying to resend the email again.",
            duration: 8000,
          })
        } else {
          toast.error("Failed to resend verification email", {
            description: error.message || "Please try again later or contact support.",
            duration: 10000,
          })
        }
      } else {
        console.log('✅ Resend email successful')
        toast.success("Verification email resent!", {
          description: "Please check your inbox and spam folder. The email should arrive within a few minutes.",
          duration: 10000,
        })
      }
    } catch (err) {
      console.error("❌ === UNEXPECTED RESEND ERROR ===")
      console.error("Error:", err)
      console.error("Stack:", err instanceof Error ? err.stack : "No stack trace")
      console.error("=== END UNEXPECTED RESEND ERROR ===")
      
      toast.error("Failed to resend verification email", {
        description: "An unexpected error occurred. Please try again or contact support.",
        duration: 10000,
      })
    }
  }

  const handleCloseDialog = () => {
    setIsSignupDialogOpen(false)
    if (isEmailConfirmed) {
      // After email confirmation, check if we have a redirect parameter
      let redirectPath = '/select-organization'
      
      // If there's an invitation token, redirect to the invitation page
      if (invitation) {
        redirectPath = `/invite/${invitation}`
      } 
      // Otherwise, use the initial redirect parameter passed to the component
      else if (initialRedirect && isValidRedirectPath(initialRedirect)) {
        redirectPath = initialRedirect
      }
      
      console.log('Email confirmed, redirecting to:', redirectPath)
      router.push(redirectPath)
    }
  }

  const checkEmailConfirmation = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error("❌ Error getting session during confirmation check:", error)
        return false
      }
      if (session?.user?.email_confirmed_at) {
        console.log('✅ Email confirmed at:', session.user.email_confirmed_at)
        setIsEmailConfirmed(true)
        setIsSignupDialogOpen(false)
        
        // After email confirmation, check if we have a redirect parameter
        let redirectPath = '/select-organization'
        
        // If there's an invitation token, redirect to the invitation page
        if (invitation) {
          redirectPath = `/invite/${invitation}`
        }
        // Otherwise, use the initial redirect parameter passed to the component
        else if (initialRedirect && isValidRedirectPath(initialRedirect)) {
          redirectPath = initialRedirect
        }
        
        console.log('Redirecting confirmed user to:', redirectPath)
        router.push(redirectPath)
        return true
      }
      return false
    } catch (err) {
      console.error("❌ Unexpected error checking email confirmation:", err)
      return false
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (isSignupDialogOpen && !isEmailConfirmed) {
      console.log('Starting email confirmation polling...')
      intervalId = setInterval(async () => {
        try {
          const confirmed = await checkEmailConfirmation()
          if (confirmed && intervalId) {
            console.log('Email confirmed, stopping polling')
            clearInterval(intervalId)
          }
        } catch (err) {
          console.error("Error in email confirmation check interval:", err)
          if (intervalId) clearInterval(intervalId)
        }
      }, 3000)
    }
    return () => {
      if (intervalId) {
        console.log('Stopping email confirmation polling')
        clearInterval(intervalId)
      }
    }
  }, [isSignupDialogOpen, isEmailConfirmed])

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 w-full", className)} {...props}>
      {error && (
        <div className="w-full max-w-xs text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
      {message && (
        <div className="w-full max-w-xs text-center text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2 mb-2">
          {message}
        </div>
      )}

      <form className="w-full flex flex-col gap-6 max-w-md" onSubmit={handleSubmit}>
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold">Create your account</h1>
          {showSignUpMessage && email && (
            <p className="text-muted-foreground text-sm">
              Sign up with <span className="font-semibold">{email}</span> to continue
            </p>
          )}
          {!showSignUpMessage && (
            <p className="text-muted-foreground text-sm">Enter your details below to create a new account</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" type="text" placeholder="First name" required disabled={isSubmitting} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" type="text" placeholder="Last name" required disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input id="contactNumber" name="contactNumber" type="tel" placeholder="+1234567890" required disabled={isSubmitting} />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="m@example.com" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                // Hide the sign-up message if user manually changes the email
                if (showSignUpMessage) {
                  setShowSignUpMessage(false)
                }
              }}
              required 
              disabled={isSubmitting} 
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" name="password" type={showPassword ? "text" : "password"} className="pr-10" required disabled={isSubmitting} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </Button>

            <div className="flex items-center gap-3 w-full">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              disabled={isSubmitting || isGoogleLoading}
              type="button"
              onClick={handleGoogleLogin}
            >
              <Image src="/iv_google.png" alt="Google" width={20} height={20} className="rounded-md" />
              {isGoogleLoading ? "Connecting to Google..." : "Sign up with Google"}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="https://hyriki.com/terms" className="text-primary hover:underline font-medium">Terms of Service</a>{' '}and{' '}
          <a href="https://hyriki.com/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>
        </div>
      </form>

      <SignupProgressDialog
        isOpen={isSignupDialogOpen}
        onClose={handleCloseDialog}
        email={signupEmail}
        onResendEmail={handleResendEmail}
      />
    </div>
  )
}