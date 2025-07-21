'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { OTPDialog } from "@/components/otp-dialog"
import { useRouter } from "next/navigation"
import { supabaseServer } from "@/lib/supabase/api/server"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [otpDialogOpen, setOtpDialogOpen] = useState(false)
  const [emailForOtp, setEmailForOtp] = useState("")
  const [otpRequested, setOtpRequested] = useState(false)
  const router = useRouter()

  // When OTP dialog opens, send OTP if not already requested
  useEffect(() => {
    if (otpDialogOpen && emailForOtp && !otpRequested) {
      (async () => {
        const { error } = await supabaseServer.auth.resend({
          type: 'signup',
          email: emailForOtp
        })
        if (error) {
          toast.error("Failed to send verification code. Please try again.")
        } else {
          toast.info("Verification code sent to your email.")
          setOtpRequested(true)
        }
      })()
    }
    if (!otpDialogOpen) setOtpRequested(false)
  }, [otpDialogOpen, emailForOtp, otpRequested])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    if (!email || !password) {
      setError("Please fill in all fields.");
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      const { data, error: signInError } = await supabaseServer.auth.signInWithPassword({
        email,
        password
      })
      if (signInError) {
        setError(signInError.message)
        toast.error(signInError.message)
        return
      }
      if (data.user && !data.user.email_confirmed_at) {
        setEmailForOtp(email)
        setOtpDialogOpen(true)
        toast.info("Please verify your email to continue.")
        return
      }
      toast.success("Login successful! Redirecting...")
      router.push("/dashboard")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      setError(message);
      toast.error(message);
    }
  }

  const handleVerifyOtp = async (otp: string) => {
    try {
      const { data, error } = await supabaseServer.auth.verifyOtp({
        email: emailForOtp,
        token: otp,
        type: 'email'
      })
      if (error) {
        toast.error("Invalid or expired code. Please try again.")
        return
      }
      else{
        console.log("TODO ",data)
      }
      toast.success("Email verified! Redirecting...")
      setOtpDialogOpen(false)
      router.push("/dashboard")
    } catch (err) {
      toast.error("Verification failed. Please try again.")
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 w-full", className)} {...props}>
      <ToastContainer position="top-center" autoClose={3000} />
      <OTPDialog
        open={otpDialogOpen}
        onClose={() => setOtpDialogOpen(false)}
        onVerify={handleVerifyOtp}
      />
      {error && (
        <div className="w-full max-w-xs text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-2">
          {error}
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
            />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <a
                href="#"
                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
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