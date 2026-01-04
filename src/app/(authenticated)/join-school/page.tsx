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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/api/client'
import { useAuth } from '@/context/auth-context'
import { Loader2 } from 'lucide-react'

interface SchoolInfo {
  school_id: string;
  school_name: string;
  school_location: string;
  school_logo_url: string | null;
  invite_role: string;
}



export default function JoinSchoolPage() {
  const [inviteCode, setInviteCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  const handleCodeChange = (index: number, value: string) => {
    // Allow only alphanumeric values (letters and numbers)
    if (!/^[a-zA-Z0-9]*$/.test(value)) return
    
    // If more than one character is entered (not paste), only take the last one
    const newCode = [...inviteCode];
    newCode[index] = value.slice(-1); // Take only the last character if multiple characters are entered
    setInviteCode(newCode);
    
    // Auto-focus next input if a character is entered
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }, 0);
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

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').toUpperCase(); // Convert to uppercase for consistency
    const alphanumericData = pasteData.replace(/[^A-Za-z0-9]/g, '').substring(0, 6); // Remove non-alphanumeric and limit to 6 chars
    
    if (alphanumericData.length > 0) {
      const newCode = Array(6).fill('');
      for (let i = 0; i < alphanumericData.length; i++) {
        newCode[i] = alphanumericData[i];
      }
      setInviteCode(newCode);
      
      // Focus on the first empty field after paste, or the last field if all are filled
      const nextFocusIndex = alphanumericData.length < 6 ? alphanumericData.length : 5;
      setTimeout(() => {
        const nextInput = document.getElementById(`code-${nextFocusIndex}`);
        if (nextInput) nextInput.focus();
      }, 0);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    
    const code = inviteCode.join('')
    
    if (code.length !== 6) {
      toast.error('Please enter a valid 6-character invite code')
      setVerifying(false)
      return
    }
    
    try {
      const supabase = createClient()
      
      // Call the verification function
      const { data, error } = await supabase.rpc('verify_invite_code_and_get_school', {
        p_invite_code: code
      })
      
      if (error) {
        console.error('Error verifying invite code:', error)
        console.error('Verification error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        toast.error(`Failed to verify invite code: ${error.message || 'Please try again.'}`)
        setVerifying(false)
        return
      }
      
      if (!data || data.length === 0 || !data[0].is_valid) {
        const errorMessage = data && data[0]?.error_message ? data[0].error_message : 'Invalid invite code'
        toast.error(errorMessage)
        setVerifying(false)
        return
      }
      
      // Set the school info and show confirmation dialog
      const schoolData = JSON.parse(JSON.stringify(data[0]))
      setSchoolInfo({
        school_id: schoolData.school_id,
        school_name: schoolData.school_name,
        school_location: schoolData.school_location,
        school_logo_url: schoolData.school_logo_url,
        invite_role: schoolData.invite_role
      })
      
      setShowConfirmationDialog(true)
      setVerifying(false)
    } catch (error) {
      console.error('Error verifying invite code:', error)
      toast.error('Invalid invite code. Please try again.')
      setVerifying(false)
    }
  }
    
  const handleConfirmJoin = async () => {
    if (!user || !schoolInfo) return
      
    setConfirming(true)
      
    try {
      const supabase = createClient()
        
      // Call the confirmation function
      const { data, error } = await supabase.rpc('confirm_user_join_school', {
        p_user_id: user.id,
        p_invite_code: inviteCode.join(''),
        p_school_id: schoolInfo.school_id,
        p_role: schoolInfo.invite_role
      })
        
      if (error) {
        console.error('Error confirming school join:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        toast.error(`Failed to join school: ${error.message || 'Please try again.'}`)
        setConfirming(false)
        return
      }
        
      if (!data || data.length === 0 || !data[0].success) {
        const errorMessage = data && data[0]?.message ? data[0].message : 'Failed to join school'
        toast.error(errorMessage)
        setConfirming(false)
        return
      }
        
      // Show success message and redirect to dashboard
      toast.success('Successfully joined the school!')
        
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/')
      }, 500)
        
    } catch (error) {
      console.error('Error confirming school join:', error)
      toast.error('Failed to join school. Please try again.')
      setConfirming(false)
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
            Enter the 6-character invite code sent to your email
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
                      inputMode="text"
                      pattern="[A-Za-z0-9]{1}"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-2xl"
                      autoFocus={index === 0}
                      disabled={verifying}
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
              disabled={verifying || inviteCode.some(digit => !digit)}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : "Verify Invite Code"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Didn&apos;t receive an invite code?{' '}
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
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Confirm School Join</DialogTitle>
            <DialogDescription>
              Please confirm that you want to join this school
            </DialogDescription>
          </DialogHeader>
          
          {schoolInfo && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-3 p-4 border rounded-lg">
                {schoolInfo.school_logo_url && (
                  <Image 
                    src={schoolInfo.school_logo_url} 
                    alt={`${schoolInfo.school_name} logo`} 
                    width={80} 
                    height={80} 
                    className="rounded-md object-contain"
                  />
                )}
                <h3 className="text-xl font-bold text-center">{schoolInfo.school_name}</h3>
                <p className="text-gray-600 text-center">{schoolInfo.school_location}</p>
                <p className="text-sm text-gray-500 text-center">Role: {schoolInfo.invite_role}</p>
              </div>
              
              <p className="text-sm text-gray-600">
                You are about to join <span className="font-semibold">{schoolInfo.school_name}</span>. 
                After joining, you will have access to the school&apso;s dashboard and resources.
              </p>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmationDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmJoin}
              disabled={confirming}
              className="flex-1"
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : "Confirm Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  )
}