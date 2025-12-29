'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/api/client';

interface InviteData {
  code_id: string | null;
  invite_code: string;
  code_role: string;
  code_expires_at: string;
  code_created_by: string;
  code_status: string;
  associated_user_id: string | null;
  associated_user_name: string | null;
  associated_user_email: string | null;
  user_id: string | null;
  user_name: string;
  user_email: string;
  user_role: string;
  user_invited_at: string;
  user_status: string;
}

interface InviteManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string | null;
  onFetchInviteData: () => void;
}

export function InviteManagementSheet({ open, onOpenChange, schoolId, onFetchInviteData }: InviteManagementSheetProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'codes'>('users');
  const [inviteData, setInviteData] = useState<InviteData[]>([]);
  const [isLoadingInviteData, setIsLoadingInviteData] = useState(false);

  // Fetch invite data for the management sheet
  const fetchInviteData = async () => {
    if (!schoolId) return;
    
    setIsLoadingInviteData(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_invite_data', { p_school_id: schoolId });
      
      if (error) throw error;
      
      setInviteData(data || []);
    } catch (error) {
      console.error('Error fetching invite data:', error);
      toast.error('Failed to load invite data');
    } finally {
      setIsLoadingInviteData(false);
    }
  };

  // Delete invite data (code or user)
  const deleteInviteData = async (itemId: string, itemType: 'code' | 'user') => {
    if (!schoolId) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('delete_invite_data', {
        p_school_id: schoolId,
        p_item_id: itemId,
        p_item_type: itemType
      });
      
      if (error) throw error;
      
      // Refresh the data
      fetchInviteData();
      toast.success(itemType === 'code' ? 'Invite code deleted' : 'User removed');
    } catch (error) {
      console.error('Error deleting invite data:', error);
      toast.error('Failed to delete item');
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

  // Fetch data when sheet opens
  useEffect(() => {
    if (open) {
      setActiveTab('users');
      fetchInviteData();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right"
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col"
        style={{ 
          maxWidth: '95vw',
          minWidth: '500px',
          width: 'auto'
        }}
      >
        <SheetHeader>
          <SheetTitle>Manage Invites</SheetTitle>
          <SheetDescription>
            View and manage invited users and invite codes
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col">
          {/* Tab navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`pb-2 px-4 ${activeTab === 'users' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('users')}
            >
              Invited Users
            </button>
            <button
              className={`pb-2 px-4 ${activeTab === 'codes' ? 'border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('codes')}
            >
              Invite Codes
            </button>
          </div>
          
          {/* Tab content */}
          {isLoadingInviteData ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              {activeTab === 'users' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invitation Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inviteData
                      .filter(item => item.user_id !== null)
                      .map((item) => (
                        <TableRow key={item.user_id || ''}>
                          <TableCell>{item.user_name}</TableCell>
                          <TableCell>{item.user_email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(item.user_role)}>
                              {item.user_role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(item.user_invited_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.user_status === 'Accepted' ? 'default' : 'secondary'}>
                              {item.user_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => item.user_id && deleteInviteData(item.user_id, 'user')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              ) : (
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Invite Code</TableHead>
                      <TableHead className="whitespace-nowrap">Role</TableHead>
                      <TableHead className="whitespace-nowrap">Expiration Date</TableHead>
                      <TableHead className="whitespace-nowrap">Created By</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Associated User</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inviteData
                      .filter(item => item.code_id !== null)
                      .map((item) => (
                        <TableRow key={item.code_id || ''}>
                          <TableCell className="font-mono">{item.invite_code}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(item.code_role)}>
                              {item.code_role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(item.code_expires_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{item.code_created_by}</TableCell>
                          <TableCell>
                            <Badge variant={
                              item.code_status === 'Active' ? 'default' : 
                              item.code_status === 'Expired' ? 'destructive' : 'secondary'
                            }>
                              {item.code_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.associated_user_name ? (
                              <div>
                                <div>{item.associated_user_name}</div>
                                <div className="text-sm text-muted-foreground">{item.associated_user_email}</div>
                              </div>
                            ) : (
                              'Not used'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => item.code_id && deleteInviteData(item.code_id, 'code')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}