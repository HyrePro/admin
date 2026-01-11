'use client';

import React, { useState, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Mail, Plus, Trash2, Edit, User, ArrowLeft, ArrowRight, CheckCircle2, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';

/* ---------------- dynamic dialogs ---------------- */
const InviteDialog = dynamic(() => import('@/components/user-management/invite-dialog').then((m) => m.InviteDialog), { ssr: false });
const InviteManagementSheet = dynamic(() => import('@/components/user-management/invite-management-sheet').then((m) => m.InviteManagementSheet), { ssr: false });
const DeleteUserDialog = dynamic(() => import('@/components/user-management/delete-user-dialog').then((m) => m.DeleteUserDialog), { ssr: false });
const InviteCodeResultDialog = dynamic(() => import('@/components/user-management/invite-code-result-dialog').then((m) => m.InviteCodeResultDialog), { ssr: false });

/* ---------------- constants ---------------- */
const PAGE_SIZE = 20;

export type UserRole = 'admin' | 'hr' | 'interviewer' | 'viewer';
export type SortColumn = 'created_at' | 'first_name' | 'last_name' | 'email' | 'contact_no' | 'role'|'joined_at';

export interface UserInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  created_at: string;
  role: UserRole;
  status: 'active' | 'invited' | 'disabled';
  avatar?: string | null;
  joined_at: Timestamp | null;
}

const getInitials = (first: string, last: string) =>
  `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';

/* ---------------- pagination ---------------- */
const Pagination = memo(({ start, end, total, canPrev, canNext, onPrev, onNext }: {
  start: number;
  end: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) => (
  <div className="flex items-center justify-between px-4 py-2 border-t text-sm">
    <div className="text-muted-foreground">
      Showing <span className="font-medium text-foreground">{start}</span>–
      <span className="font-medium text-foreground">{end}</span> of{' '}
      <span className="font-medium text-foreground">{total}</span>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={!canPrev} onClick={onPrev}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" disabled={!canNext} onClick={onNext}>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
));

/* ---------------- fetch function ---------------- */
const fetchUsers = async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<{ users: UserInfo[]; total: number }> => {
  const [_key, _subkey, schoolId, page, sort, asc, search] = queryKey;

  const start_index = Number(page) * PAGE_SIZE;
  const end_index = start_index + PAGE_SIZE - 1;

  const res = await fetch('/api/settings/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, sort, asc, search, page_size: PAGE_SIZE }),
  });

  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

/* ---------------- page ---------------- */
export default function UsersPage() {
  const { user } = useAuth();
  const { schoolId } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortColumn>('created_at');
  const [asc, setAsc] = useState(true);
  const [search, setSearch] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteMgmtOpen, setInviteMgmtOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserInfo | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);

  const { data, isLoading, error } = useQuery<{ users: UserInfo[]; total: number }, Error>({
    queryKey: ['settings', 'users', schoolId, page, sort, asc, search],
    queryFn: fetchUsers,
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });

  const users = data?.users || [];
  const total = data?.total || 0;

  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  const canPrev = page > 0;
  const canNext = end < total;

  if (!schoolId && user?.id) router.push('/select-organization');

  const handleSort = (column: SortColumn) => {
    if (sort === column) setAsc(!asc);
    else {
      setSort(column);
      setAsc(true);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 p-4">
      <div className="flex flex-col flex-1 min-h-0 border rounded-md bg-white">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 border-b">
          <div>
            <h1 className="text-base font-semibold">Users</h1>
            <p className="text-sm text-muted-foreground">Organization members and access control</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-2 py-1 border rounded"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="flex gap-2 items-center justify-center">
              <Button 
                size="sm" 
                onClick={() => setInviteOpen(true)}
                className="bg-gradient-to-b from-primary/10 to-white/20 bg-primary text-primary-foreground text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-1" /> Invite
              </Button>
              <Button size="sm" variant="outline" onClick={() => setInviteMgmtOpen(true)}>
                Manage Invites
              </Button>
            </div>
          </div>
        </div>

        {/* body */}
        {isLoading && users.length === 0 ? (
          // Show loading skeleton when initially loading
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm relative">
              <TableHeader className="sticky top-0 bg-white border-b z-10">
                <TableRow>
                  <TableHead className="table-head">
                    <div className="flex items-center gap-1">
                      User
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="table-head">
                    <div className="flex items-center gap-1">
                      Role
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="table-head">
                    <div className="flex items-center gap-1">
                      Email
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="table-head">
                    <div className="flex items-center gap-1">
                      Contact No
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="table-head">
                    <div className="flex items-center gap-1">
                      Joined
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="table-head text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Skeleton rows */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-16 bg-gray-200 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-20 bg-gray-200 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <div className="h-8 w-8 bg-gray-200 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        ) : users.length === 0 ? (
          // Show empty state
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              {(() => {
                const isFilterActive = search;
              
                if (isFilterActive) {
                  return (
                    <div className="text-center">
                      <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
                      <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
                      <Button 
                        onClick={() => {
                          setSearch('');
                          setPage(0);
                        }} 
                        variant="outline" 
                        className="mr-2"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center">
                      <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No users</h3>
                      <p className="text-muted-foreground mb-4">No users have been added yet</p>
                      <Button size="sm" onClick={() => setInviteOpen(true)}>Invite user</Button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        ) : (
          // Show actual table
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm relative">
                <TableHeader className="sticky top-0 bg-white border-b z-10">
                  <TableRow>
                    <TableHead className="table-head cursor-pointer" onClick={() => handleSort('first_name')}>
                      <div className="flex items-center gap-1">
                        User
                        {sort === 'first_name' ? (asc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                      </div>
                    </TableHead>
                    <TableHead className="table-head cursor-pointer" onClick={() => handleSort('role')}>
                      <div className="flex items-center gap-1">
                        Role
                        {sort === 'role' ? (asc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                      </div>
                    </TableHead>
                    <TableHead className="table-head cursor-pointer" onClick={() => handleSort('email')}>
                      <div className="flex items-center gap-1">
                        Email
                        {sort === 'email' ? (asc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                      </div>
                    </TableHead>
                    <TableHead className="table-head cursor-pointer" onClick={() => handleSort('contact_no')}>
                      <div className="flex items-center gap-1">
                        Contact No
                        {sort === 'contact_no' ? (asc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                      </div>
                    </TableHead>
                    <TableHead className="table-head cursor-pointer" onClick={() => handleSort('joined_at')}>
                      <div className="flex items-center gap-1">
                        Joined
                        {sort === 'joined_at' ? (asc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ChevronsUpDown className="h-4 w-4 opacity-50" />}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="table-head text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: UserInfo) => (
                    <TableRow key={u.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatar || ''} />
                            <AvatarFallback>{getInitials(u.first_name, u.last_name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.first_name} {u.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', u.role === 'admin' ? 'bg-blue-50 text-black' : 'bg-muted text-muted-foreground')}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${u.email}`} className="text-blue-600 hover:underline truncate max-w-[220px]">
                          {u.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${u.contact_no}`} className="text-blue-600 hover:underline">
                          {u.contact_no}
                        </a>
                      </TableCell>
                      <TableCell>
                        {u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '--'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'flex items-center gap-1 font-medium capitalize px-2',
                            u.status === 'active' && 'bg-emerald-50 text-emerald-700',
                            u.status === 'invited' && 'bg-amber-50 text-amber-700',
                            u.status === 'disabled' && 'bg-zinc-100 text-zinc-500'
                          )}
                        >
                          {u.status === 'active' && <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-600 text-white" />}
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>

            <Pagination start={start} end={end} total={total} canPrev={canPrev} canNext={canNext} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
          </>
        )}
      </div>

      {/* dialogs */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        schoolId={schoolId}
        user={user}
        onInviteSuccess={() => queryClient.invalidateQueries({ queryKey: ['settings', 'users', schoolId] })}
        onCodeGenerated={(code) => { setInviteCode(code); setShowInviteCode(true); }}
      />
      {inviteMgmtOpen && (
        <InviteManagementSheet
          open={inviteMgmtOpen}
          onOpenChange={setInviteMgmtOpen}
          schoolId={schoolId}
          onFetchInviteData={() => queryClient.invalidateQueries({ queryKey: ['settings', 'users', schoolId] })}
        />
      )}
      {deleteOpen && (
        <DeleteUserDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          userToDelete={userToDelete}
          onDeleteSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'users', schoolId] });
            setDeleteOpen(false);
            setUserToDelete(null);
          }}
        />
      )}
      <InviteCodeResultDialog open={showInviteCode} onOpenChange={setShowInviteCode} inviteCode={inviteCode} />
    </div>
  );
}
