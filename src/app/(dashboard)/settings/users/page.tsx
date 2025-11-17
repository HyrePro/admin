'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Plus, Trash2, Edit, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';
import { toast } from "sonner";
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ItemDescription, ItemTitle } from '@/components/ui/item';

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

export default function UsersPage() {
  const { user } = useAuth();
  const { schoolId, setSchoolId } = useAuthStore();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  // Form state for inviting new users
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'viewer'
  });

  // Reset to first page when schoolId changes
  useEffect(() => {
    setCurrentPage(0);
  }, [schoolId]);

  // Fetch school_id if it's null
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (!user?.id) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('school_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data?.school_id) {
          setSchoolId(data.school_id);
        } else {
          // Redirect to select organization if school_id is missing
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

  // Fetch users and panelists from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolId) return;

      try {
        const supabase = createClient();

        // Fetch admin users with avatar information
        const { data: userData, error: userError } = await supabase
          .from('admin_user_info')
          .select('id, first_name, last_name, email, role, avatar')
          .eq('school_id', schoolId);

        if (userError) throw userError;

        // Transform user data to include status
        const usersWithStatus = (userData || []).map(user => ({
          ...user,
          status: 'active' as const,
          role: (user.role || 'admin') as 'admin' | 'hr' | 'viewer'
        }));

        // Fetch panelists (no avatar support for panelists in this implementation)
        const { data: panelistData, error: panelistError } = await supabase
          .from('interview_panelists')
          .select('id, name, email')
          .eq('school_id', schoolId);

        if (panelistError) throw panelistError;

        // Transform panelist data to match UserInfo structure
        const panelistsAsUsers = (panelistData || []).map(panelist => ({
          id: panelist.id,
          first_name: panelist.name.split(' ')[0] || '',
          last_name: panelist.name.split(' ').slice(1).join(' ') || '',
          email: panelist.email,
          role: 'interviewer' as const,
          status: 'active' as const
        }));

        // Combine users and panelists
        const allUsers = [...usersWithStatus, ...panelistsAsUsers];
        setUsers(allUsers);
        setPanelists(panelistData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

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

  // Handle invite form changes
  const handleInviteFormChange = (field: string, value: string) => {
    setInviteForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle invite user
  const handleInviteUser = async () => {
    if (!schoolId) {
      toast.error('Organization information not available. Please try again.');
      return;
    }

    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const supabase = createClient();

      // For now, we'll add to interview_panelists if role is interviewer
      // In a real implementation, you would send an invite email and add to admin_user_info
      if (inviteForm.role === 'interviewer') {
        const { data, error } = await supabase
          .from('interview_panelists')
          .insert({
            school_id: schoolId,
            name: inviteForm.name,
            email: inviteForm.email
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setPanelists(prev => [...prev, data]);
        setUsers(prev => [...prev, {
          id: data.id,
          first_name: data.name.split(' ')[0] || '',
          last_name: data.name.split(' ').slice(1).join(' ') || '',
          email: data.email,
          role: 'interviewer' as const,
          status: 'active' as const
        }]);
      } else {
        // For other roles (admin, hr, viewer), add to users list with appropriate role
        const newUser = {
          id: Math.random().toString(), // In a real implementation, this would come from the database
          first_name: inviteForm.name.split(' ')[0] || '',
          last_name: inviteForm.name.split(' ').slice(1).join(' ') || '',
          email: inviteForm.email,
          role: inviteForm.role as 'admin' | 'hr' | 'viewer',
          status: 'invited' as const
        };
        setUsers(prev => [...prev, newUser]);
        // This is a simplified implementation
        toast.success('User invited successfully! In a full implementation, an email invitation would be sent.');
      }

      // Reset form and close dialog
      setInviteForm({ name: '', email: '', role: 'viewer' });
      setIsInviteDialogOpen(false);
      toast.success('User invited successfully!');
      
      // Reset to first page when new user is added
      setCurrentPage(0);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user');
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete || !schoolId) return;

    try {
      const supabase = createClient();

      // Check if user is a panelist or admin user
      if (userToDelete.role === 'interviewer') {
        // Delete from interview_panelists
        const { error } = await supabase
          .from('interview_panelists')
          .delete()
          .eq('id', userToDelete.id);

        if (error) throw error;

        // Update local state
        setPanelists(prev => prev.filter(p => p.id !== userToDelete.id));
      } else {
        // For admin users, you would typically deactivate rather than delete
        toast.info('Admin users cannot be deleted. In a full implementation, they would be deactivated.');
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        return;
      }

      // Update users list
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));

      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
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

  // Show loading state if schoolId is not available yet
  if (!schoolId) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h3 className="text-lg font-medium">Users</h3>
          <p className="text-sm text-muted-foreground">
            Loading organization information...
          </p>
        </div>
        <Card>
          <CardContent className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </CardContent>
        </Card>
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
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Invite a new user to your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={inviteForm.name}
                      onChange={(e) => handleInviteFormChange('name', e.target.value)}
                      placeholder="Enter user's full name"
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={inviteForm.role}
                      onChange={(e) => handleInviteFormChange('role', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="hr">HR</option>
                      <option value="interviewer">Interviewer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteUser}>
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center flex-grow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center flex-grow">
            <User className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by inviting a new user to your organization
            </p>
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
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
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteDialogOpen(true);
                              }}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {userToDelete?.first_name} {userToDelete?.last_name} from your organization?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}