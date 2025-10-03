'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
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
  const router = useRouter()
  
  // Create the supabase client instance
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const form = e.target as HTMLFormElement;
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement)?.value;
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement)?.value;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const contactNumber = (form.elements.namedItem('contactNumber') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    
    if (!firstName || !lastName || !email || !contactNumber || !password) {
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
      // Show signup progress dialog
      setSignupEmail(email)
      setIsSignupDialogOpen(true)
      
      // Create a properly encoded redirect URL to avoid double encoding issues
      const redirectUrl = new URL('/auth/callback', window.location.origin);
      redirectUrl.searchParams.set('next', '/select-organization');
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            first_name: firstName,
            last_name: lastName,
            contact_number: contactNumber,
            user_type: 'admin',
            school_id: null
          },
          emailRedirectTo: redirectUrl.toString()
        }
      })
      
      if (signUpError) {
        setIsSignupDialogOpen(false)
        setError(signUpError.message)
        toast.error(signUpError.message)
        return
      }

      // If signup successful, create admin user record
      if (data.user) {
        try {
          const adminUserResponse = await fetch('/api/admin-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone_no: contactNumber,
              user_id: data.user.id
            }),
          })

          if (!adminUserResponse.ok) {
            console.error('Failed to create admin user record')
            // Don't fail the signup process if admin record creation fails
            // The user can still proceed with email verification
          }
        } catch (adminError) {
          console.error('Error creating admin user record:', adminError)
          // Don't fail the signup process
        }
      }

      // Signup successful - keep dialog open and show success message
      toast.success("Signup successful! Please check your email to confirm your account.")
      
      // Keep the dialog open to show verification progress
      // The dialog will automatically progress through the steps
      
      // Also show a success message in the form
      setMessage("Account created successfully! Please check your email and click the verification link to activate your account.")
      
    } catch (error) {
      setIsSignupDialogOpen(false)
      const message = error instanceof Error ? error.message : "Signup failed. Please try again.";
      setError(message);
      toast.error(message);
    }
  }

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail
      })
      
      if (error) {
        toast.error("Failed to resend verification email: " + error.message)
      } else {
        toast.success("Verification email resent! Please check your inbox.")
      }
    } catch (error) {
      toast.error("Failed to resend verification email. Please try again.")
    }
  }

  const handleCloseDialog = () => {
    setIsSignupDialogOpen(false)
    // Optionally redirect to login or dashboard
    // router.push("/login")
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 w-full", className)} {...props}>
      <ToastContainer position="top-center" autoClose={3000} />
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
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last name"
                required
              />
            </div>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              placeholder="+1234567890"
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
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                className="pr-10"
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
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
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white ">
              Sign Up
            </Button>

            <div className="flex items-center gap-3 w-full">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
            <Image src="/iv_google.png" alt="Google" width={20} height={20} className="rounded-md" />
              Sign up with Google
            </Button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline font-medium">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="/privacy" className="text-primary hover:underline font-medium">
            Privacy Policy
          </a>
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