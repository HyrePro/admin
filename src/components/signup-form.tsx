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
import { Eye, EyeOff } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const form = e.target as HTMLFormElement
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement)?.value
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement)?.value
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value
    const contactNumber = (form.elements.namedItem('contactNumber') as HTMLInputElement)?.value
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value

    if (!firstName || !lastName || !email || !contactNumber || !password) {
      setError("Please fill in all fields.")
      toast.error("Please fill in all fields.")
      setIsSubmitting(false)
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.")
      toast.error("Please enter a valid email address.")
      setIsSubmitting(false)
      return
    }

    try {
      const baseUrl = window.location.origin
      const redirectUrl = `${baseUrl}`

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

      console.log('Signup response:', { 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        identitiesLength: data?.user?.identities?.length,
        error: signUpError 
      })

      // Check if user already exists and is verified
      // Supabase returns user with empty identities array for existing users
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setIsSubmitting(false)
        setError("This email is already registered.")
        toast.error("Account already exists", {
          description: "This email is already registered. Please log in instead.",
          action: {
            label: "Go to Login",
            onClick: () => router.push("/login"),
          },
          duration: 5000,
        })
        return
      }

      if (signUpError) {
        setIsSubmitting(false)
        setError(signUpError.message)
        toast.error(signUpError.message)
        return
      }

      // If signup successful, show dialog and create admin user record
      if (data.user) {
        setSignupEmail(email)
        setIsSignupDialogOpen(true)

        try {
          await fetch("/api/admin-user", {
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
        } catch (adminError) {
          console.error("Error creating admin user record:", adminError)
          // Don't fail the signup process
        }

        toast.success("Signup successful! Please check your email to confirm your account.")
        setMessage("Account created successfully! Please check your email and click the verification link to activate your account.")
      }

      setIsSubmitting(false)
    } catch (err) {
      setIsSignupDialogOpen(false)
      setIsSubmitting(false)
      const msg = err instanceof Error ? err.message : "Signup failed. Please try again."
      setError(msg)
      toast.error(msg)
    }
  }

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail
      })
      if (error) toast.error("Failed to resend verification email: " + error.message)
      else toast.success("Verification email resent! Please check your inbox.")
    } catch {
      toast.error("Failed to resend verification email. Please try again.")
    }
  }

  const handleCloseDialog = () => {
    setIsSignupDialogOpen(false)
    if (isEmailConfirmed) {
      router.push("/select-organization")
    }
  }

  const checkEmailConfirmation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        setIsEmailConfirmed(true)
        setIsSignupDialogOpen(false)
        router.push("/select-organization")
        return true
      }
      return false
    } catch {
      return false
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (isSignupDialogOpen && !isEmailConfirmed) {
      intervalId = setInterval(async () => {
        const confirmed = await checkEmailConfirmation()
        if (confirmed && intervalId) clearInterval(intervalId)
      }, 3000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isSignupDialogOpen, isEmailConfirmed])

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 w-full", className)} {...props}>
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

      <form className="w-full flex flex-col gap-6 max-w-md" onSubmit={handleSubmit}>
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm">Enter your details below to create a new account</p>
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
            <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={isSubmitting} />
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
              disabled={isSubmitting}
              type="button"
            >
              <Image src="/iv_google.png" alt="Google" width={20} height={20} className="rounded-md" />
              Sign up with Google
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline font-medium">Terms of Service</a>{' '}and{' '}
          <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>
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