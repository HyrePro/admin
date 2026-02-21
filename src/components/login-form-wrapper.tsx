'use client'

import { LoginForm } from "@/app/login/LoginForm"
import { useSearchParams } from "next/navigation"

export function LoginFormWrapper() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const redirectParam = searchParams.get('redirect')
  const isMeaningfulRedirect =
    redirectParam &&
    redirectParam.trim() !== '' &&
    redirectParam.trim() !== '/'
  const redirect = isMeaningfulRedirect ? redirectParam : null
  const invitation = searchParams.get('invitation')

  return <LoginForm email={email} redirect={redirect} invitation={invitation} />
}
