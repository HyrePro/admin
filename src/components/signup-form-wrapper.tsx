'use client'

import { SignupForm } from "@/components/signup-form"
import { useSearchParams } from "next/navigation"

export function SignupFormWrapper() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const redirectParam = searchParams.get('redirect')
  const isMeaningfulRedirect =
    redirectParam &&
    redirectParam.trim() !== '' &&
    redirectParam.trim() !== '/'
  const redirect = isMeaningfulRedirect ? redirectParam : null
  const invitation = searchParams.get('invitation')

  return <SignupForm email={email} redirect={redirect} invitation={invitation} />
}
