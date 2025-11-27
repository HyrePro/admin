'use client'

import { LoginForm } from "@/app/login/LoginForm"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function LoginFormWrapper() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [redirect, setRedirect] = useState<string | null>(null)

  useEffect(() => {
    setEmail(searchParams.get('email'))
    setRedirect(searchParams.get('redirect'))
  }, [searchParams])

  return <LoginForm email={email} redirect={redirect} />
}