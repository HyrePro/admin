'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { OTPDialog } from "@/components/otp-dialog"
import { useRouter } from "next/navigation"
import { supabaseServer } from "@/lib/supabase/api/server"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [otpDialogOpen, setOtpDialogOpen] = useState(false)
  const [emailForOtp, setEmailForOtp] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      toast.error("Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      const { error: signUpError } = await supabaseServer.auth.signUp({
        email,
        password,
        options: { data: { name } }
      })
      if (signUpError) {
        setError(signUpError.message)
        toast.error(signUpError.message)
        return
      }
      setEmailForOtp(email)
      setOtpDialogOpen(true)
      toast.success("Signup successful! Please check your email for the verification code.")
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed. Please try again.";
      setError(message);
      toast.error(message);
    }
  }

  const handleVerifyOtp = async (otp: string) => {
    try {
      const { error } = await supabaseServer.auth.verifyOtp({
        email: emailForOtp,
        token: otp,
        type: 'email'
      })
      if (error) {
        toast.error("Invalid or expired code. Please try again.")
        return
      }
      toast.success("Email verified! Redirecting...")
      setOtpDialogOpen(false)
      router.push("/dashboard")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed. Please try again.";
      toast.error(message);
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm">Enter your details below to create a new account</p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              required
            />
          </div>
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
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full">
              Sign Up
            </Button>
          </div>
        </div>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="underline underline-offset-4">
            Login
          </a>
        </div>
      </form>
    </div>
  )
} 