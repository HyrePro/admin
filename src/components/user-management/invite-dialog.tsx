'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/api/client';
import { User } from '@supabase/supabase-js';

// Define the type for the request body
interface CreateInvitationRequestBody {
  role: string;
  schoolId: string | null;
  name: string;
  email: string;
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string | null;
  user: User | null;
  onInviteSuccess: () => void;
  onCodeGenerated?: (code: string) => void;
}

export function InviteDialog({ open, onOpenChange, schoolId, user, onInviteSuccess, onCodeGenerated }: InviteDialogProps) {
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'viewer'
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // State for invitation method and invite code
  const [inviteMethod, setInviteMethod] = useState<'email' | 'code'>('email');
  const [inviteCode, setInviteCode] = useState('');
  const [expirationPeriod, setExpirationPeriod] = useState('7'); // Default to 7 days
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  // Removed showResultDialog state as it's now handled by the parent component

  // Handle invite form changes
  const handleInviteFormChange = (field: string, value: string) => {
    setInviteForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle invite user (only for email invitations)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only handle email invitations in this function
    if (inviteMethod !== 'email') return;
    
    // Validate required fields
    if (!schoolId) {
      setMessage('School ID is required to send invitations');
      return;
    }
    
    setInviteLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if session exists
      if (!session) {
        setMessage('User session not found. Please log in again.');
        return;
      }
      
      // Validate form fields
      if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.role.trim()) {
        setMessage('Please fill in all required fields: name, email, and role');
        return;
      }
      
      // Prepare request body for email invitation with proper typing
      const requestBody: CreateInvitationRequestBody = {
        role: inviteForm.role,
        schoolId,
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
      };
      
      const response = await fetch('/api/create-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle detailed error messages from the API
        if (result.message) {
          setMessage(result.message);
        } else {
          setMessage(result.error || 'Failed to send invitation');
        }
      } else {
        setMessage('Invitation sent successfully!');
        onInviteSuccess();
        setInviteForm({ name: '', email: '', role: 'viewer' });
        // Close the dialog after successful invitation
        onOpenChange(false);
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle generate invite code
  const handleGenerateCode = async () => {
    // Check if user exists and has required properties
    if (!user?.id || !schoolId) return;
    
    // Check if user has email (required for invite code generation)
    if (!user.email) {
      setMessage('User email is required to generate invite codes');
      return;
    }
    
    setIsGeneratingCode(true);
    setMessage('');
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Calculate expiration date
      const currentDate = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(currentDate.getDate() + parseInt(expirationPeriod));
      
      // Call the Supabase function to generate invite code
      const { data, error } = await supabase.rpc('generate_invite_code', {
        p_school_id: schoolId,
        p_user_id: user.id,
        p_role: inviteForm.role,
        p_expires_at: expirationDate.toISOString()
      });

      if (error) {
        throw error;
      }
      
      if (data) {
        // Handle different possible response formats
        let code;
        
        // If data is an array with one object
        if (Array.isArray(data) && data.length > 0) {
          code = data[0].generated_code;
        } 
        // If data is an array of arrays (PostgreSQL format)
        else if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length > 0) {
          code = data[0][0];
        }
        // If data is an object with generated_code property
        else if (typeof data === 'object' && data.generated_code) {
          code = data.generated_code;
        }
        // If data is an object with a single property containing the code
        else if (typeof data === 'object' && Object.keys(data).length === 1) {
          const firstKey = Object.keys(data)[0];
          if (typeof data[firstKey] === 'string') {
            code = data[firstKey];
          }
        }
        
        if (code) {
          setInviteCode(code);
          // Close the invite dialog and notify parent to show the result dialog
          onOpenChange(false);
          if (onCodeGenerated) {
            onCodeGenerated(code);
          }
        } else {
          setMessage('Failed to generate invite code - invalid response format');
        }
      } else {
        setMessage('Failed to generate invite code - no data returned');
      }
    } catch (error) {
      setMessage('Failed to generate invite code: ' + (error as Error).message);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'default';
      case 'hr': return 'secondary';
      case 'interviewer': return 'outline';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      // Reset form when closing
      setInviteForm({ name: '', email: '', role: 'viewer' });
      setMessage('');
      setInviteMethod('email');
    }
  };

  // Removed handleResultDialogClose as it's now handled by the parent component

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Invite a new user to your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Invitation Method Selection */}
            <div className="flex space-x-4 border-b">
              <button
                type="button"
                className={`pb-2 px-1 ${inviteMethod === 'email' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
                onClick={() => setInviteMethod('email')}
              >
                Invite via Email
              </button>
              <button
                type="button"
                className={`pb-2 px-1 ${inviteMethod === 'code' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
                onClick={() => setInviteMethod('code')}
              >
                Generate Invite Code
              </button>
            </div>
            
            <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Role selection - always visible */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteForm.role} onValueChange={(value) => handleInviteFormChange('role', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="interviewer">Interviewer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {inviteMethod === 'email' ? (
                // Email invitation form
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={inviteForm.name}
                      onChange={(e) => handleInviteFormChange('name', e.target.value)}
                      placeholder="Enter user's full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => handleInviteFormChange('email', e.target.value)}
                      placeholder="Enter user's email address"
                      required
                    />
                  </div>
                </>
              ) : (
                // Invite code generation - only show dropdowns initially
                <>
                  <div className="space-y-2">
                    <Label htmlFor="expirationPeriod">Expiration Period</Label>
                    <Select value={expirationPeriod} onValueChange={setExpirationPeriod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select expiration period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {message && (
                <div className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </div>
              )}
              
              
            
            {/* Dialog footer for invite code method - outside form */}
            
            
            {/* Dialog footer with conditional buttons */}
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              {inviteMethod === 'email' ? (
                <Button type="submit" disabled={inviteLoading} form="invite-form">
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              ) : (
                <Button type="button" onClick={handleGenerateCode} disabled={isGeneratingCode || !user?.email}>
                  {isGeneratingCode ? 'Generating...' : 'Generate Invite Code'}
                </Button>
              )}
            </DialogFooter>
          </form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Invite Code Result Dialog is now handled by the parent component */}
    </>
  );
}