'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  // Debug logging
  console.log('SignupProgressDialog render:', { isOpen, email, currentStep });

  useEffect(() => {
    if (currentStep === 'email-sent') {
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
  }, [currentStep])

  useEffect(() => {
    console.log('Dialog isOpen changed:', isOpen);
    if (isOpen) {
      // Reset to progress step when dialog opens
      setCurrentStep('progress')
      setCountdown(60)
      setCanResend(false)
      
      // Simulate signup progress
      const progressTimer = setTimeout(() => {
        console.log('Moving to success step');
        setCurrentStep('success')
      }, 2000)

      const successTimer = setTimeout(() => {
        console.log('Moving to email-sent step');
        setCurrentStep('email-sent')
      }, 3000)

      return () => {
        clearTimeout(progressTimer)
        clearTimeout(successTimer)
      }
    }
  }, [isOpen])

  const handleResendEmail = () => {
    onResendEmail()
    setCountdown(60)
    setCanResend(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-md bg-white/95 border-0 shadow-2xl">
        <div className="flex flex-col items-center text-center p-8">
          <AnimatePresence mode="wait">
            {currentStep === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-semibold mb-3 text-gray-800"
                >
                  Creating your account...
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground text-lg"
                >
                  Please wait while we set up your account
                </motion.p>
              </motion.div>
            )}

            {currentStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-semibold mb-3 text-gray-800"
                >
                  Account created successfully!
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-muted-foreground text-lg"
                >
                  Setting up your verification email...
                </motion.p>
              </motion.div>
            )}

            {currentStep === 'email-sent' && (
              <motion.div
                key="email-sent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center w-full"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  <Mail className="w-20 h-20 text-blue-500 mb-6" />
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-semibold mb-4 text-gray-800"
                >
                  Verification email sent!
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-muted-foreground mb-6 text-lg"
                >
                  We&apos;ve sent a verification email to{' '}
                  <span className="font-semibold text-blue-600 break-all">{email}</span>
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 w-full"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm text-blue-800 font-semibold mb-2">Check your email</p>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        Please check your inbox and click the verification link. Don&apos;t forget to check your spam folder if you don&apos;t see it.
                      </p>
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        💡 Once you confirm your email, you&apos;ll be automatically redirected to the dashboard!
                      </p>
                    </div>
                  </div>
                </motion.div>

                <div className="w-full space-y-4">
                  <AnimatePresence mode="wait">
                    {!canResend ? (
                      <motion.div
                        key="countdown"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Resend available in {formatTime(countdown)}</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="resend-button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full"
                      >
                        <Button 
                          onClick={handleResendEmail}
                          variant="outline" 
                          className="w-full h-12 text-base"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Resend verification email
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <Button 
                      onClick={onClose} 
                      className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                    >
                      Got it, thanks!
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
