'use client'

import { SignupForm } from "@/components/signup-form"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function SignupFormWrapper() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [redirect, setRedirect] = useState<string | null>(null)

  useEffect(() => {
    setEmail(searchParams.get('email'))
    setRedirect(searchParams.get('redirect'))
  }, [searchParams])

  return <SignupForm email={email} redirect={redirect} />
}