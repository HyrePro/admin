'use client'

import { SignupForm } from "@/components/signup-form"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function SignupFormWrapper() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [redirect, setRedirect] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<string | null>(null)

  useEffect(() => {
    setEmail(searchParams.get('email'))
    const redirectParam = searchParams.get('redirect')
    // Only set redirect if it's not an empty string
    setRedirect(redirectParam && redirectParam.trim() !== '' ? redirectParam : null)
    setInvitation(searchParams.get('invitation'))
  }, [searchParams])

  return <SignupForm email={email} redirect={redirect} invitation={invitation} />
}