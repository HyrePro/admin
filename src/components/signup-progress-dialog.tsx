'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, Clock, AlertCircle, HelpCircle, X } from 'lucide-react'
import { createClient } from "@/lib/supabase/api/client"
import { useRouter } from 'next/navigation'

interface SignupProgressDialogProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onResendEmail: () => void
}

export function SignupProgressDialog({
  isOpen,
  onClose,
  email,
  onResendEmail
}: SignupProgressDialogProps) {
  const [currentStep, setCurrentStep] = useState<'progress' | 'success' | 'email-sent'>('progress')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (currentStep === 'email-sent' && !canResend) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [currentStep, canResend])

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('progress')
      setCountdown(60)
      setCanResend(false)
      setIsEmailConfirmed(false)
      setIsResending(false)
      
      const progressTimer = setTimeout(() => {
        setCurrentStep('success')
      }, 2000)

      const successTimer = setTimeout(() => {
        setCurrentStep('email-sent')
      }, 3000)

      return () => {
        clearTimeout(progressTimer)
        clearTimeout(successTimer)
      }
    }
  }, [isOpen])

  const checkEmailConfirmation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        setIsEmailConfirmed(true)
        onClose()
        router.push("/select-organization")
        return true
      }
      return false
    } catch (error) {
      console.error("Error checking email confirmation:", error)
      return false
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    if (isOpen && currentStep === 'email-sent' && !isEmailConfirmed) {
      intervalId = setInterval(async () => {
        const confirmed = await checkEmailConfirmation()
        if (confirmed && intervalId) {
          clearInterval(intervalId)
        }
      }, 3000)
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen, currentStep, isEmailConfirmed])

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      await onResendEmail()
      setCountdown(60)
      setCanResend(false)
    } finally {
      setIsResending(false)
    }
  }

  const handleNeedHelp = () => {
    window.open('mailto:support@hyriki.com?subject=Email%20Confirmation%20Issue&body=I%20am%20having%20trouble%20confirming%20my%20email%20address%20for%20my%20Hyriki%20account.', '_blank')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/98 border border-gray-200/50 shadow-2xl p-0 gap-0 overflow-hidden">
        

        <div className="flex flex-col items-center text-center px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col items-center w-full">
            {currentStep === 'progress' && (
              <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Creating your account
                  </h2>
                  <p className="text-base text-gray-600">
                    Setting up your workspace...
                  </p>
                </div>
              </div>
            )}

            {currentStep === 'success' && (
              <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 w-20 h-20 bg-green-100 rounded-full animate-ping opacity-30"></div>
                  <CheckCircle className="relative w-20 h-20 text-green-500" strokeWidth={2} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Account created!
                  </h2>
                  <p className="text-base text-gray-600">
                    Preparing your verification email...
                  </p>
                </div>
              </div>
            )}

            {currentStep === 'email-sent' && (
              <div className="flex flex-col items-center w-full space-y-6 animate-in fade-in duration-500">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Verify your email address
                  </h2>
                  <div className="space-y-2">
                    <p className="text-base text-gray-600 leading-relaxed">
                      To complete your registration, please click the verification link we've sent to:
                    </p>
                    <p className="text-base font-semibold text-blue-600 break-all px-2">
                      {email}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 w-full shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-amber-600" strokeWidth={2} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <span className="font-semibold text-gray-900">Didn't receive the email?</span> Check your spam folder, wait a few minutes for delivery, or request a new verification email below.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3 pt-2">
                  {!canResend ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Resend available in {formatTime(countdown)}
                      </span>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleResendEmail}
                      disabled={isResending}
                      variant="outline" 
                      className="w-full h-11 text-sm font-medium border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    >
                      {isResending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Resend verification email
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleNeedHelp}
                    variant="ghost"
                    className="w-full h-11 text-sm text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-200"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Need help?
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}