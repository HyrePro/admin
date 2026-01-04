import { ReactNode } from 'react'
import { ProtectedRoute } from '@/components/protected-route'

export default function CreateSchoolLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ProtectedRoute>
  )
}