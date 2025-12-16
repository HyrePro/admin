'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
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
  const router = useRouter()

  const getStepContent = () => {
    switch (currentStep) {
      case 'uploading':
        return {
          title: 'Uploading your logo',
          description: 'Please wait while we securely upload your school logo...',
          showSpinner: true,
          canClose: false
        }
      case 'creating':
        return {
          title: 'Creating your school',
          description: 'Setting up your school profile and configuring your account...',
          showSpinner: true,
          canClose: false
        }
      case 'success':
        return {
          title: 'School created successfully!',
          description: 'Your school profile is ready. Redirecting you to the dashboard...',
          showSpinner: false,
          canClose: false,
          isSuccess: true
        }
      case 'error':
        return {
          title: 'Creation failed',
          description: errorMessage || 'An error occurred while creating your school. Please try again.',
          showSpinner: false,
          canClose: true,
          isError: true
        }
    }
  }

  const stepContent = getStepContent()

  return (
    <Dialog open={isOpen} onOpenChange={stepContent.canClose ? onClose : undefined}>
      <DialogContent 
        className="sm:max-w-md backdrop-blur-xl bg-white/98 border border-gray-200/50 shadow-2xl p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => !stepContent.canClose && e.preventDefault()}
        onEscapeKeyDown={(e) => !stepContent.canClose && e.preventDefault()}
      >
        {stepContent.canClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-colors duration-200"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col items-center text-center px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col items-center w-full space-y-6">
            
            {/* Spinner for loading states */}
            {stepContent.showSpinner && (
              <div className="relative animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
            )}

            {/* Success icon */}
            {stepContent.isSuccess && (
              <div className="relative animate-in fade-in zoom-in duration-500">
                <div className="absolute inset-0 w-16 h-16 bg-green-100 rounded-full animate-ping opacity-30"></div>
                <CheckCircle className="relative w-16 h-16 text-green-500" strokeWidth={2} />
              </div>
            )}

            {/* Error icon */}
            {stepContent.isError && (
              <div className="relative animate-in fade-in zoom-in duration-500">
                <div className="absolute inset-0 w-16 h-16 bg-red-100 rounded-full animate-pulse"></div>
                <AlertCircle className="relative w-16 h-16 text-red-500" strokeWidth={2} />
              </div>
            )}

            {/* Title and Description */}
            <div className="space-y-3 animate-in fade-in duration-500" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-semibold text-gray-900">
                {stepContent.title}
              </h2>
              <p className="text-base text-gray-600 leading-relaxed max-w-sm mx-auto">
                {stepContent.description}
              </p>
            </div>

            {/* Success message */}
            {stepContent.isSuccess && (
              <div 
                className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/60 rounded-2xl p-5 shadow-sm animate-in fade-in duration-500"
                style={{ animationDelay: '0.4s' }}
              >
                <p className="text-sm text-green-800">
                  🎉 Your school profile has been successfully created and is ready to use!
                </p>
              </div>
            )}

            {/* Error action button */}
            {stepContent.isError && (
              <div className="w-full space-y-3 pt-2 animate-in fade-in duration-500" style={{ animationDelay: '0.4s' }}>
                <Button 
                  onClick={onClose}
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 hover:shadow-lg transition-all duration-200"
                >
                  Close and try again
                </Button>
              </div>
            )}

            {/* Loading state hint */}
            {stepContent.showSpinner && (
              <p 
                className="text-sm text-gray-500 animate-in fade-in duration-500"
                style={{ animationDelay: '0.4s' }}
              >
                This may take a few moments...
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}