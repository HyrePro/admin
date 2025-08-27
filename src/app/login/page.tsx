'use client'

import { LoginForm } from "./LoginForm"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center">
          <div className="flex justify-center gap-2 md:justify-start">
            <Image src="/icon.png" alt="HyrePro logo" width={30} height={30} className="rounded-md" />
            <span className="text-lg font-bold text-foreground cursor-pointer">HyrePro</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-2xl font-bold text-muted-foreground">
              Welcome to HyrePro Admin
            </h2>
            <p className="text-muted-foreground max-w-md">
              Manage your job postings, review applications, and streamline your hiring process with our comprehensive admin dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
