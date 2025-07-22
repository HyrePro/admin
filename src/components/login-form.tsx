'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useRouter } from "next/navigation"
import { supabaseServer } from "@/lib/supabase/api/server"
import { ForgotPasswordDialog } from "./forgot-password-dialog"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [forgotOpen, setForgotOpen] = useState(false)
  const [emailValue, setEmailValue] = useState("")

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
      toast.success("Login successful! Redirecting...")
      router.push("/dashboard")
    } catch (error) {
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