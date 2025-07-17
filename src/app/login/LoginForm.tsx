'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from './Button'
import { Input } from './Input'
import { Dialog, DialogTitle } from '@/components/ui/dialog'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showResendDialog, setShowResendDialog] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) setMessage('Error sending magic link')
    else {
      setMessage('Check your email for the login link')
      setShowResendDialog(true)
    }

    setLoading(false)
  }

  const handleResend = async () => {
    setResendLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage('Error resending magic link')
    else setMessage('Verification email resent!')
    setResendLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Sign in to HyrePro Admin</h1>
        <p className="text-muted-foreground text-sm">Enter your email below to sign in</p>
      </div>
      <form className="space-y-4" onSubmit={handleLogin}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Sign In with Email'}
        </Button>
      </form>
      {message && <p className="text-sm mt-2 text-center text-muted-foreground">{message}</p>}
      <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <DialogTitle className="text-xl font-bold mb-2 text-center">Check your email for the login link</DialogTitle>
          <p className="text-muted-foreground text-center mb-4">Not received?</p>
          <Button className="w-full" onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? 'Resending...' : 'Resend verification email'}
          </Button>
          <button onClick={() => setShowResendDialog(false)} className="block mx-auto mt-4 text-xs text-muted-foreground underline">Close</button>
        </Dialog>
      <div className="text-xs text-center text-muted-foreground pt-4">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  )
} 