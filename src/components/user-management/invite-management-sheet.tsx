'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Copy, Users, KeyRound } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
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
  
  const queryClient = useQueryClient();
  
  // Query for fetching invite data
  const { data: inviteData = [], isLoading: isLoadingInviteData, refetch } = useQuery<InviteData[]>({
    queryKey: ['inviteData', schoolId],
    queryFn: async () => {
      if (!schoolId) {
        return [];
      }
      
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('No active session');
      }
      
      // Fetch both invite codes and email invitations
      const [codesResponse, emailsResponse] = await Promise.all([
        fetch(`/api/invites/data?schoolId=${encodeURIComponent(schoolId)}`, {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`/api/invites/email?schoolId=${encodeURIComponent(schoolId)}`, {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);
      
      // Process invite codes response
      let codesData = [];
      if (codesResponse.ok) {
        const codesResult = await codesResponse.json();
        codesData = codesResult.data || [];
      } else {
        const errorData = await codesResponse.json();
        console.error('Error fetching invite codes:', errorData.error);
      }
      
      // Process email invitations response
      let emailsData = [];
      if (emailsResponse.ok) {
        const emailsResult = await emailsResponse.json();
        emailsData = emailsResult.data || [];
      } else {
        const errorData = await emailsResponse.json();
        console.error('Error fetching email invitations:', errorData.error);
      }
      
      // Define the email invitation type
      interface EmailInvitation {
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        created_at: string;
        expires_at: string;
        invited_by: string;
      }
      
      // Transform email invitations to match the existing InviteData format
      const transformedEmailInvites = emailsData.map((emailInvite: EmailInvitation) => ({
        code_id: null,
        invite_code: null,
        code_role: null,
        code_expires_at: null,
        code_created_by: emailInvite.invited_by || 'Unknown',
        code_status: null,
        associated_user_id: null,
        associated_user_name: null,
        associated_user_email: null,
        user_id: emailInvite.id,
        user_name: emailInvite.name,
        user_email: emailInvite.email,
        user_role: emailInvite.role,
        user_invited_at: emailInvite.created_at,
        user_status: emailInvite.status
      }));
      
      // Combine both sets of data
      return [...codesData, ...transformedEmailInvites];
    },
    enabled: !!schoolId && open, // Only fetch when schoolId is present and sheet is open
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for deleting invite data
  const deleteMutation = useMutation({
    mutationFn: async ({ itemId, itemType }: { itemId: string; itemType: 'code' | 'user' | 'email' }) => {
      if (!schoolId) {
        throw new Error('School ID is required');
      }
      
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('No active session');
      }
      
      // Different API routes based on item type
      let response;
      if (itemType === 'email') {
        // For email invitations, call the email-specific delete API
        response = await fetch('/api/invites/email/delete', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            schoolId,
            invitationId: itemId,
          }),
        });
      } else {
        // For invite codes and legacy users, use the existing API
        response = await fetch('/api/invites/data/delete', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            schoolId,
            itemId,
            itemType,
          }),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete invite data');
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inviteData', schoolId] });
      const message = variables.itemType === 'code' 
        ? 'Invite code deleted' 
        : variables.itemType === 'email'
          ? 'Email invitation deleted'
          : 'User removed';
      toast.success(message);
    },
    onError: (error) => {
      console.error('Error deleting invite data:', error);
      toast.error('Failed to delete item');
    },
  });
  
  const deleteInviteData = (itemId: string, itemType: 'code' | 'user' | 'email') => {
    deleteMutation.mutate({ itemId, itemType });
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

  // The data is automatically fetched when the sheet opens due to the query configuration
  useEffect(() => {
    if (open && schoolId) {
      setActiveTab('users');
    }
  }, [open, schoolId]);

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
                inviteData.filter(item => item.user_id !== null).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {inviteData
                      .filter(item => item.user_id !== null)
                      .map((item) => (
                        <Card key={item.user_id || ''} className="mx-2">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{item.user_name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{item.user_email}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!item.user_id) return;
                                  // Determine if this is an email invitation or a legacy user
                                  // Email invitations will have null code_id but non-null user_id
                                  const isEmailInvitation = item.code_id === null && item.user_id !== null;
                                  const itemType = isEmailInvitation ? 'email' : 'user';
                                  deleteInviteData(item.user_id, itemType);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant={getRoleBadgeVariant(item.user_role)}>
                                {item.user_role}
                              </Badge>
                              <Badge variant={item.user_status === 'Accepted' ? 'default' : 'secondary'}>
                                {item.user_status}
                              </Badge>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Invited: </span>
                              <span>{new Date(item.user_invited_at).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Users className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>No invited users</EmptyTitle>
                      <EmptyDescription>
                        There are currently no users invited to your organization.
                        When users are invited, they will appear here.
                      </EmptyDescription>
                    </EmptyHeader>

                  </Empty>
                )
              ) : (
                inviteData.filter(item => item.code_id !== null).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {inviteData
                      .filter(item => item.code_id !== null)
                      .map((item) => (
                        <Card key={item.code_id || ''} className="mx-2 border shadow-none">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              {/* code block */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5 font-mono text-sm tracking-wide border">
                                  {item.invite_code}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.invite_code)
                                    toast.success('Invite code copied')
                                  }}
                                  aria-label="Copy invite code"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* delete */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  if (!item.code_id) return;
                                  deleteInviteData(item.code_id, 'code');
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0 space-y-4">
                            {/* badges */}
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                className="bg-blue-100 text-blue-900 border border-blue-200 capitalize"
                              >
                                {item.code_role}
                              </Badge>

                              <Badge
                                className={
                                  item.code_status === 'Active'
                                    ? 'bg-green-100 text-green-900 border border-green-200'
                                    : item.code_status === 'Expired'
                                      ? 'bg-red-100 text-red-900 border border-red-200'
                                      : 'bg-muted text-foreground'
                                }
                              >
                                {item.code_status}
                              </Badge>
                            </div>

                            {/* metadata */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                              <div className="flex gap-1">
                                <span className="text-muted-foreground">Created by</span>
                                <span className="truncate">{item.code_created_by}</span>
                              </div>

                              <div className="flex gap-1">
                                <span className="text-muted-foreground">Expires</span>
                                <span>{new Date(item.code_expires_at).toLocaleDateString()}</span>
                              </div>

                              <div className="col-span-2 flex gap-1">
                                <span className="text-muted-foreground">Used by</span>
                                <span>
                                  {item.associated_user_name ? (
                                    <>
                                      {item.associated_user_name}
                                      <span className="text-muted-foreground">
                                        {' '}
                                        ({item.associated_user_email})
                                      </span>
                                    </>
                                  ) : (
                                    <span className="italic text-muted-foreground">Not used</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                      ))}

                  </div>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <KeyRound className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>No invite codes</EmptyTitle>
                      <EmptyDescription>
                        There are currently no invite codes created for your organization.
                        Create invite codes to allow users to join your organization.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}