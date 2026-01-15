'use client'

import { LoginForm } from "@/app/login/LoginForm"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function LoginFormWrapper() {
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

  return <LoginForm email={email} redirect={redirect} invitation={invitation} />
}