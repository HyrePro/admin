'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/api/client"
import { Separator } from "./ui/separator"
import Image from "next/image"
import { SignupProgressDialog } from "./signup-progress-dialog"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const router = useRouter()

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
      console.log('Starting signup process...');
      // Show signup progress dialog
      setSignupEmail(email)
      setIsSignupDialogOpen(true)
      console.log('Dialog opened, isSignupDialogOpen:', true);
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            first_name: firstName,
            last_name: lastName,
            contact_number: contactNumber
          }
          // Remove custom emailRedirectTo to use Supabase's default flow
        }
      })
      
      console.log('Signup response:', { data, error: signUpError });
      
      if (signUpError) {
        console.error('Signup error:', signUpError);
        setIsSignupDialogOpen(false)
        setError(signUpError.message)
        toast.error(signUpError.message)
        return
      }

      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        console.log('User created, email confirmation required');
        console.log('User data:', data.user);
        console.log('Email confirmed at:', data.user.email_confirmed_at);
        
        // Check if verification email was sent
        if (data.session) {
          console.log('Session created, user might be auto-confirmed');
        } else {
          console.log('No session, verification email should be sent');
        }
      } else if (data.user && data.user.email_confirmed_at) {
        console.log('User created and email already confirmed');
      }

      // Signup successful - keep dialog open and show success message
      console.log('Signup successful, keeping dialog open');
      toast.success("Signup successful! Please check your email to confirm your account.")
      
      // Keep the dialog open to show verification progress
      // The dialog will automatically progress through the steps
      
      // Also show a success message in the form
      setMessage("Account created successfully! Please check your email and click the verification link to activate your account.")
      
    } catch (error) {
      console.error('Unexpected error during signup:', error);
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
      
      {/* Debug info */}
      <div className="text-xs text-gray-500">
        Debug: Dialog open: {isSignupDialogOpen.toString()}, Email: {signupEmail}
      </div>
      
      {/* Test button for debugging */}
      <button
        type="button"
        onClick={() => {
          console.log('Test button clicked');
          setSignupEmail('test@example.com');
          setIsSignupDialogOpen(true);
        }}
        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
      >
        Test Dialog
      </button>
      
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
            <Input id="password" name="password" type="password" required />
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

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="underline underline-offset-4">
            Login
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