'use client'

import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import adminSignupAnimation from "@/assets/animations/admin-signup.json"
import { SignupFormWrapper } from "@/components/signup-form-wrapper"

// Dynamic import for Lottie player to avoid SSR issues
const Lottie = dynamic(() => import('react-lottie-player/dist/LottiePlayerLight'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg w-full h-64"></div>
})

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-5">
      <div className="flex flex-col gap-4 p-6 md:p-10 lg:col-span-2">
        <div className="flex justify-between items-center">
          <div className="flex justify-center gap-2 md:justify-start">
            <Image src="/icon.png" alt="Hyriki logo" width={30} height={30} className="rounded-md" />
            <span className="text-lg font-bold text-foreground cursor-pointer">Hyriki</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium" scroll={false}>
              Login
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
              <SignupFormWrapper />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden lg:col-span-3">
        {/* Lottie Animation Background - Full Screen */}
        <div className="absolute inset-0">
          <Lottie
            loop
            animationData={adminSignupAnimation}
            play
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        
        {/* Bottom Gradient Overlay for text only */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent py-8 px-8">
          <div className="text-center space-y-4 max-w-lg mx-auto pb-4 pt-8">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg">
              Join Hyriki Admin
            </h2>
            <p className="text-white/90 text-lg drop-shadow-md leading-relaxed">
              Create your admin account and start managing job postings, reviewing applications, and building your dream team.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 