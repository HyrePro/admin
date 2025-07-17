'use client'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogTitle } from "@/components/ui/dialog"

export function OTPDialog({ open, onClose, onVerify }: {
  open: boolean,
  onClose: () => void,
  onVerify: (otp: string) => void
}) {
  const [otp, setOtp] = useState("")
  const [timer, setTimer] = useState(60)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!open) return;
    setTimer(60)
    setOtp("")
  }, [open])

  useEffect(() => {
    if (timer === 0) return
    const interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  const handleResend = () => {
    setResending(true)
    setTimeout(() => {
      setTimer(60)
      setResending(false)
      // Here you would trigger resend OTP logic
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onVerify(otp)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogTitle className="text-xl font-bold mb-2 text-center">Enter Verification Code</DialogTitle>
      <p className="text-muted-foreground text-center mb-4">We have sent a 6-digit code to your email. Please enter it below.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
            className="text-center tracking-widest text-lg"
          />
          <Button type="submit" className="w-full">Verify</Button>
        </form>
        <div className="flex justify-between items-center mt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={timer > 0 || resending}
          >
            {resending ? "Resending..." : timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
          </Button>
        </div>
        <button onClick={onClose} className="block mx-auto mt-4 text-xs text-muted-foreground underline">Cancel</button>
      </Dialog>
  )
} 