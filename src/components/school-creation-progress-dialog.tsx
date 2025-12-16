'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, Clock, AlertCircle, Loader2, HelpCircle, Upload, School } from 'lucide-react'
import { createClient } from "@/lib/supabase/api/client"
import { useRouter } from 'next/navigation'

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
          <div
            key={currentStep}
            className="flex flex-col items-center animate-fade-in-up"
          >
            {/* Icon with optional spinner */}
            <div className="relative mb-6">
              {stepContent.showSpinner ? (
                <div className="animate-spin-slow">
                  {stepContent.icon}
                </div>
              ) : (
                <div className="animate-scale-in">
                  {stepContent.icon}
                </div>
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
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{progress}% Complete</p>
            </div>

            {/* Title and Description */}
            <h2 
              className="text-2xl font-semibold mb-3 text-gray-800 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {stepContent.title}
            </h2>
            
            <p 
              className="text-muted-foreground text-lg leading-relaxed animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              {stepContent.description}
            </p>

            {/* Additional info for uploading */}
            {currentStep === 'uploading' && (
              <div 
                className="mt-4 flex items-center gap-2 text-sm text-gray-500 animate-fade-in"
                style={{ animationDelay: '0.6s' }}
              >
                <Clock className="w-4 h-4" />
                <span>This may take a few moments...</span>
              </div>
            )}

            {/* Success redirect info */}
            {currentStep === 'success' && (
              <div 
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in"
                style={{ animationDelay: '0.6s' }}
              >
                <p className="text-sm text-green-700">
                  🎉 Your school has been created successfully! You will be redirected to the dashboard shortly.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}