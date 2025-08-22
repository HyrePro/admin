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

function LoginFormContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [forgotOpen, setForgotOpen] = useState(false)
  const [emailValue, setEmailValue] = useState("")

  // Handle query parameters for verification messages
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const messageParam = searchParams.get('message')
    
    if (errorParam === 'verification_failed') {
      setError("Email verification failed. Please try again or contact support.")
      toast.error("Email verification failed. Please try again or contact support.")
    } else if (messageParam === 'verification_incomplete') {
      setMessage("Email verification process incomplete. Please try logging in or contact support.")
      toast.info("Email verification process incomplete. Please try logging in or contact support.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    if (!email || !password) {
      setError("Please fill in all fields.");
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      console.log("Attempting login for:", email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) {
        console.error("Login error:", signInError);
        setError(signInError.message)
        toast.error(signInError.message)
        return
      }
      
      if (data.user) {
        console.log("Login successful, user:", data.user.email);
        console.log("User session:", data.session);
        toast.success("Login successful! Redirecting...")
        
        // Wait a moment for the session to be properly set
        setTimeout(() => {
          // Use window.location for more reliable redirect
          window.location.href = "/dashboard"
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
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
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