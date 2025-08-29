'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CheckCircle, Upload, School, Clock, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SchoolCreationProgressDialogProps {
  isOpen: boolean
  onClose: () => void
  currentStep: 'uploading' | 'creating' | 'success' | 'error'
  errorMessage?: string
}

export function SchoolCreationProgressDialog({
  isOpen,
  onClose,
  currentStep,
  errorMessage
}: SchoolCreationProgressDialogProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (currentStep === 'uploading') {
      setProgress(25)
    } else if (currentStep === 'creating') {
      setProgress(75)
    } else if (currentStep === 'success') {
      setProgress(100)
    }
  }, [currentStep])

  const getStepContent = () => {
    switch (currentStep) {
      case 'uploading':
        return {
          icon: <Upload className="w-16 h-16 text-blue-500" />,
          title: 'Uploading Logo...',
          description: 'Please wait while we upload your school logo',
          showSpinner: true
        }
      case 'creating':
        return {
          icon: <School className="w-16 h-16 text-blue-500" />,
          title: 'Creating School...',
          description: 'Setting up your school profile and updating your account',
          showSpinner: true
        }
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'School Created Successfully!',
          description: 'Redirecting you to the dashboard...',
          showSpinner: false
        }
      case 'error':
        return {
          icon: <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">!</span>
            </div>
          </div>,
          title: 'Creation Failed',
          description: errorMessage || 'An error occurred while creating your school',
          showSpinner: false
        }
    }
  }

  const stepContent = getStepContent()

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-md backdrop-blur-md bg-white/95 border-0 shadow-2xl"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center text-center p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              {/* Icon with optional spinner */}
              <div className="relative mb-6">
                {stepContent.showSpinner ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    {stepContent.icon}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    {stepContent.icon}
                  </motion.div>
                )}
                
                {stepContent.showSpinner && (
                  <div className="absolute -bottom-2 -right-2">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{progress}% Complete</p>
              </div>

              {/* Title and Description */}
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-semibold mb-3 text-gray-800"
              >
                {stepContent.title}
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-lg leading-relaxed"
              >
                {stepContent.description}
              </motion.p>

              {/* Additional info for uploading */}
              {currentStep === 'uploading' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 flex items-center gap-2 text-sm text-gray-500"
                >
                  <Clock className="w-4 h-4" />
                  <span>This may take a few moments...</span>
                </motion.div>
              )}

              {/* Success redirect info */}
              {currentStep === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <p className="text-sm text-green-700">
                    🎉 Your school has been created successfully! You will be redirected to the dashboard shortly.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}