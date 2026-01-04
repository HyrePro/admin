'use client'

import { AuthProviderWrapper } from '@/components/auth-provider-wrapper'
import { I18nProvider } from '@/contexts/i18n-context'

export default function AuthenticatedLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <AuthProviderWrapper>
      <I18nProvider>
        {children}
      </I18nProvider>
    </AuthProviderWrapper>
  )
}