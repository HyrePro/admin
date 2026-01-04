import Link from 'next/link'
import { Button } from '@/components/ui/button'



export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link href="/" passHref>
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}