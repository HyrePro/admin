'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Plus, Trash2, Edit, User, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { useAuth } from '@/context/auth-context';
import { toast } from "sonner";
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ItemDescription, ItemTitle } from '@/components/ui/item';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Dynamically import dialog components with lazy loading
const InviteDialog = dynamic(() => import('@/components/user-management/invite-dialog').then(mod => mod.InviteDialog), {
  ssr: false,
  loading: () => null
});

const InviteManagementSheet = dynamic(() => import('@/components/user-management/invite-management-sheet').then(mod => mod.InviteManagementSheet), {
  ssr: false,
  loading: () => null
});

const DeleteUserDialog = dynamic(() => import('@/components/user-management/delete-user-dialog').then(mod => mod.DeleteUserDialog), {
  ssr: false,
  loading: () => null
});

const InviteCodeResultDialog = dynamic(() => import('@/components/user-management/invite-code-result-dialog').then(mod => mod.InviteCodeResultDialog), {
  ssr: false,
  loading: () => null
});

// Constants for pagination
const PAGE_SIZE = 10;

interface UserInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'hr' | 'interviewer' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  avatar?: string | null;
}

interface Panelist {
  id: string;
  name: string;
  email: string;
}

// Generate initials from user name
const getUserInitials = (name: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Pagination component
const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  totalItems,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  startIndex,
  endIndex
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  startIndex: number;
  endIndex: number;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-4 border-t">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalItems}</span> users
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

// Fetcher function for users
const fetchUsers = async (): Promise<UserInfo[]> => {
  const response = await fetch('/api/settings/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

export default function UsersPage() {
  const { user } = useAuth();
  const { schoolId, setSchoolId } = useAuthStore();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInviteManagementOpen, setIsInviteManagementOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [showInviteCodeResult, setShowInviteCodeResult] = useState(false);
  const [generatedInviteCode, setGeneratedInviteCode] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  // Use TanStack Query to fetch users
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['settings', 'users', schoolId],
    queryFn: fetchUsers,
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset to first page when schoolId changes
  useEffect(() => {
    setCurrentPage(0);
  }, [schoolId]);

  // Simulate component loading completion
  useEffect(() => {
    // Set a small timeout to simulate loading completion
    const timer = setTimeout(() => {
      setComponentsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch school_id if it's null
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (!user?.id) return;

      try {
        // We'll use the auth store directly instead of fetching from Supabase
        // The schoolId should already be available from the auth context
        if (!schoolId) {
          // If schoolId is still not available, redirect to select organization
          router.push('/select-organization');
        }
      } catch (error) {
        console.error('Error fetching school info:', error);
        toast.error('Failed to load organization information');
        router.push('/select-organization');
      }
    };

    if (!schoolId && user?.id) {
      fetchSchoolId();
    }
  }, [schoolId, user?.id, setSchoolId, router]);

  // Pagination calculations
  const { paginatedUsers, totalPages, totalItems, canGoNext, canGoPrevious, startIndex, endIndex } = useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, users.length);
    const paginatedUsers = users.slice(startIndex, endIndex);
    const totalPages = Math.ceil(users.length / PAGE_SIZE);
    
    return {
      paginatedUsers,
      totalPages,
      totalItems: users.length,
      canGoNext: currentPage < totalPages - 1,
      canGoPrevious: currentPage > 0,
      startIndex,
      endIndex
    };
  }, [users, currentPage]);

  // Handle pagination
  const handlePreviousPage = useCallback(() => {
    if (canGoPrevious) setCurrentPage(prev => prev - 1);
  }, [canGoPrevious]);

  const handleNextPage = useCallback(() => {
    if (canGoNext) setCurrentPage(prev => prev + 1);
  }, [canGoNext]);

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

  if (error) {
    return (
      <div className="space-y-4 h-full flex flex-col p-4">
        <div className="bg-white rounded-lg border flex flex-col flex-grow">
          <div className="p-4 space-y-4 flex-shrink-0">
            <div>
              <ItemTitle>User List</ItemTitle>
              <ItemDescription>
                Manage users in your organization
              </ItemDescription>
            </div>
          </div>
          <div className="flex-grow flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">Error loading users: {error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 h-full flex flex-col p-4">
        <div className="bg-white rounded-lg border flex flex-col flex-grow">
          <div className="p-4 space-y-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <ItemTitle>User List</ItemTitle>
                <ItemDescription>
                  Manage users in your organization
                </ItemDescription>
              </div>
              <div className="flex space-x-2">
                <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Loading state for user table */}
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-grow p-4">
              <div className="space-y-4">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <div>
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-6 w-16 bg-gray-200 rounded" />
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded" />
                      <div className="h-8 w-8 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-shrink-0 p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600 h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col p-4">
      <div className="bg-white rounded-lg border flex flex-col flex-grow">
        <div className="p-4 space-y-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <ItemTitle>User List</ItemTitle>
              <ItemDescription>
                Manage users in your organization
              </ItemDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setIsInviteDialogOpen(true)}
                disabled={!componentsLoaded}
              >
                {!componentsLoaded ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite New User
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsInviteManagementOpen(true)}
                disabled={!componentsLoaded}
              >
                {!componentsLoaded ? 'Loading...' : 'Manage Invites'}
              </Button>
            </div>
          </div>
        </div>
        
        {paginatedUsers.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <User className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No users found</EmptyTitle>
              <EmptyDescription>
                Get started by inviting a new user to your organization
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button 
                size="lg"
                onClick={() => setIsInviteDialogOpen(true)}
                disabled={!componentsLoaded}
              >
                {!componentsLoaded ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite User
                  </>
                )}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="flex-grow overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-grow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-full">
                              <AvatarImage src={user.avatar || ''} alt={`${user.first_name} ${user.last_name}`} />
                              <AvatarFallback className="rounded-full">
                                {getUserInitials(`${user.first_name} ${user.last_name}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.first_name} {user.last_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={!componentsLoaded}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={!componentsLoaded}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
                <div className="flex-shrink-0">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    canGoPrevious={canGoPrevious}
                    canGoNext={canGoNext}
                    onPrevious={handlePreviousPage}
                    onNext={handleNextPage}
                    startIndex={startIndex}
                    endIndex={endIndex}
                  />
                </div>
            </div>
          </>
        )}
      </div>

      {/* Dynamically loaded Invite Dialog */}
      <InviteDialog 
        open={isInviteDialogOpen} 
        onOpenChange={setIsInviteDialogOpen} 
        schoolId={schoolId} 
        user={user} 
        onInviteSuccess={() => {
          // Invalidate the query to refetch users
          queryClient.invalidateQueries({ queryKey: ['settings', 'users', schoolId] });
        }}
        onCodeGenerated={(code) => {
          setGeneratedInviteCode(code);
          setShowInviteCodeResult(true);
        }}
      />

      {/* Dynamically loaded Invite Management Sheet */}
      {isInviteManagementOpen && (
        <InviteManagementSheet 
          open={isInviteManagementOpen} 
          onOpenChange={setIsInviteManagementOpen} 
          schoolId={schoolId} 
          onFetchInviteData={() => {
            // Invalidate the query to refetch users
            queryClient.invalidateQueries({ queryKey: ['settings', 'users', schoolId] });
          }} 
        />
      )}

      {/* Dynamically loaded Delete User Dialog */}
      {isDeleteDialogOpen && (
        <DeleteUserDialog 
          open={isDeleteDialogOpen} 
          onOpenChange={setIsDeleteDialogOpen} 
          userToDelete={userToDelete} 
          onDeleteSuccess={() => {
            // Invalidate the query to refetch users
            queryClient.invalidateQueries({ queryKey: ['settings', 'users', schoolId] });
            // Close dialog and reset state
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
          }} 
        />
      )}
      
      {/* Invite Code Result Dialog */}
      <InviteCodeResultDialog
        open={showInviteCodeResult}
        onOpenChange={(open) => {
          setShowInviteCodeResult(open);
          if (!open) {
            setGeneratedInviteCode('');
          }
        }}
        inviteCode={generatedInviteCode}
      />
    </div>
  );
}