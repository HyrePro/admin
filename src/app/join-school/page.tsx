'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function JoinSchoolPage() {
  const [inviteCode, setInviteCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCodeChange = (index: number, value: string) => {
    // Allow only numeric values
    if (!/^\d*$/.test(value)) return
    
    const newCode = [...inviteCode]
    newCode[index] = value.slice(-1) // Take only the last digit if multiple digits are entered
    setInviteCode(newCode)
    
    // Auto-focus next input if a digit is entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !inviteCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const code = inviteCode.join('')
    
    if (code.length !== 6) {
      toast.error('Please enter a valid 6-digit invite code')
      setLoading(false)
      return
    }
    
    // Here you would typically verify the invite code with your backend
    // For now, we'll simulate a successful verification
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Successful verification - redirect to appropriate page
      toast.success('Invite code verified successfully!')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/select-organization') // Or wherever appropriate
      }, 1500)
    } catch (error) {
      console.error('Error verifying invite code:', error)
      toast.error('Invalid invite code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <Image src="/icon.png" alt="Hyriki logo" width={30} height={30} className="rounded-md" />
        <span className="text-lg font-bold text-foreground">Hyriki</span>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Join School Organization</CardTitle>
          <CardDescription>
            Enter the 6-digit invite code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="invite-code" className="text-center block">
                Invite Code
              </Label>
              <div className="flex justify-center gap-3">
                {inviteCode.map((digit, index) => (
                  <div key={index} className="relative">
                    <Input
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="\d{1}"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-2xl"
                      autoFocus={index === 0}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Enter the code sent to your email
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || inviteCode.some(digit => !digit)}
            >
              {loading ? "Verifying..." : "Verify Invite Code"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Didn't receive an invite code?{' '}
            <button 
              type="button"
              className="text-blue-600 hover:underline font-medium"
              onClick={() => toast.info('Contact your school administrator for an invite code')}
            >
              Request one
            </button>
          </div>
        </CardContent>
      </Card>
      
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  )
}