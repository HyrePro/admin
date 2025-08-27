'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, Suspense } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/api/client"
import { ForgotPasswordDialog } from "./forgot-password-dialog"
import { Eye, EyeOff, Loader2 } from "lucide-react"

function LoginFormContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [forgotOpen, setForgotOpen] = useState(false)
  const [emailValue, setEmailValue] = useState("")

  // Handle query parameters for verification messages
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const messageParam = searchParams.get('message')
    
    if (errorParam && messageParam) {
      const decodedMessage = decodeURIComponent(messageParam)
      setError(decodedMessage)
      toast.error(decodedMessage)
    } else if (errorParam === 'verification_failed') {
      const msg = "Email verification failed. Please try again or contact support."
      setError(msg)
      toast.error(msg)
    } else if (messageParam === 'verification_incomplete') {
      const msg = "Email verification process incomplete. Please try logging in or contact support."
      setMessage(msg)
      toast.info(msg)
    }
  }, [searchParams])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    
    if (!email || !password) {
      setError("Please fill in all fields.");
      toast.error("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters long.");
      toast.error("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting login for:", email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      
      if (signInError) {
        console.error("Login error:", signInError);
        
        // Provide user-friendly error messages
        let errorMessage = signInError.message;
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        }
        
        setError(errorMessage)
        toast.error(errorMessage)
        return
      }
      
      if (data.user && data.session) {
        console.log("Login successful, user:", data.user.email);
        console.log("User session:", data.session);
        toast.success("Login successful! Redirecting...")
        
        // Wait a moment for the session to be properly set
        setTimeout(() => {
          router.push("/dashboard")
          router.refresh()
        }, 1000);
      } else {
        console.error("No user data received");
        setError("Login failed: No user data received")
        toast.error("Login failed: No user data received")
      }
    } catch (error) {
      console.error("Unexpected login error:", error)
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    setMessage(null)

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
        toast.error('Failed to initialize Google login. Please try again.')
        setGoogleLoading(false)
      }
      // Don't set loading to false here as the page will redirect
    } catch (error) {
      console.error('Google login error:', error)
      setError('An unexpected error occurred with Google login. Please try again.')
      toast.error('An unexpected error occurred with Google login. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 w-full", className)} {...props}>
      <ToastContainer position="top-center" autoClose={3000} />
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} initialEmail={emailValue} />
      {error && (
        <div className="w-full max-w-xs text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-2">
          {error}
        </div>
      )}
      {message && (
        <div className="w-full max-w-xs text-center text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2 mb-2">
          {message}
        </div>
      )}
      <form className="w-full flex flex-col gap-6 max-w-xs" onSubmit={handleSubmit}>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm">Enter your email below to login to your account</p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              autoComplete="email"
              onChange={e => setEmailValue(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-blue-600 bg-transparent border-0 p-0 cursor-pointer"
                onClick={() => setForgotOpen(true)}
              >
                Forgot your password?
              </button>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
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
          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Login'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
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
              {googleLoading ? 'Connecting...' : 'Login with Google'}
            </Button>
          </div>
        </div>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="underline underline-offset-4">
            Sign up
          </a>
        </div>
      </form>
    </div>
  )
} 

export function LoginForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
} 