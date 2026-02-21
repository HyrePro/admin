'use client'

import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Avatar } from '@radix-ui/react-avatar';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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

type AccountUserInfo = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_no: string | null;
    avatar: string | null;
};

const ACCOUNT_REQUEST_TIMEOUT_MS = 25_000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = ACCOUNT_REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Account request timed out. Please try again.');
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

const fetchUserInfo = async (): Promise<AccountUserInfo> => {
    const response = await fetchWithTimeout('/api/settings/account', {
        method: 'GET',
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const errorMessage =
            payload && typeof payload === 'object' && 'error' in payload
                ? String((payload as { error?: string }).error || 'Failed to load account information')
                : `Request failed (${response.status})`;
        throw new Error(errorMessage);
    }

    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid account response');
    }

    return payload as AccountUserInfo;
};



export default function AccountPage() {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: userInfo, error, isLoading, refetch } = useQuery({
        queryKey: ['settings', 'account'],
        queryFn: fetchUserInfo,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Set form values when user info is loaded
    useEffect(() => {
        if (userInfo) {
            setFirstName(userInfo.first_name || '');
            setLastName(userInfo.last_name || '');
            setEmail(userInfo.email || user?.email || '');
            setPhone(userInfo.phone_no || '');
            setAvatarUrl(userInfo.avatar || null);
            
            // Sync avatar URL with auth metadata if they don't match
            if (user && userInfo.avatar !== (user.user_metadata?.avatar_url || null)) {
                const supabase = createClient();
                supabase.auth.updateUser({
                    data: {
                        ...user.user_metadata,
                        avatar_url: userInfo.avatar
                    }
                }).then(async () => {
                    // Refresh session after metadata update
                    await supabase.auth.refreshSession();
                }).catch(error => {
                    console.warn('Failed to sync avatar with auth metadata:', error);
                });
            }
        } else if (user) {
            setEmail(user.email || '');
        }
    }, [userInfo, user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select a valid image file');
          return;
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }

        setSelectedFile(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeAvatar = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setAvatarUrl(null);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const toastId = toast.loading('Saving profile...');

        try {
            const supabase = createClient();
            const userId = user?.id ?? userInfo?.id ?? null;

            // First, update user info in database
            const updateResponse = await fetchWithTimeout('/api/settings/account', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    phone_no: phone,
                }),
                cache: 'no-store',
            });

            const updatePayload = await updateResponse.json().catch(() => null);
            if (!updateResponse.ok) {
                const message =
                    updatePayload && typeof updatePayload === 'object' && 'error' in updatePayload
                        ? String((updatePayload as { error?: string }).error || 'Failed to update profile')
                        : `Update failed (${updateResponse.status})`;
                throw new Error(message);
            }

            // Then, upload avatar if a new file was selected
            if (selectedFile) {
                if (!userId) {
                    throw new Error('User session is not ready. Please refresh and try again.');
                }
                toast.loading('Uploading avatar...', { id: toastId });

                // Create file name with timestamp
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

                // TODO: Consider caching and error handling for this API call
                // Upload file to Supabase Storage in 'profiles' bucket
                const { error: uploadError } = await supabase.storage
                    .from('profiles')
                    .upload(fileName, selectedFile, {
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Get public URL for the uploaded file
                const { data: { publicUrl } } = supabase.storage
                    .from('profiles')
                    .getPublicUrl(fileName);

                // TODO: Consider caching and error handling for this API call
                // Update user info with new avatar URL
                const { error: avatarUpdateError } = await supabase
                    .from('admin_user_info')
                    .update({ avatar: publicUrl })
                    .eq('id', userId);

                if (avatarUpdateError) throw avatarUpdateError;

                // Also update Supabase auth user metadata to sync with navigation
                if (user) {
                    const { error: metadataUpdateError } = await supabase.auth.updateUser({
                        data: {
                            ...user.user_metadata,
                            avatar_url: publicUrl
                        }
                    });

                    if (metadataUpdateError) throw metadataUpdateError;

                    // Refresh the session to update the auth context
                    await supabase.auth.refreshSession();
                }

                setAvatarUrl(publicUrl);
            } else if (previewUrl === null && avatarUrl === null) {
                if (!userId) {
                    throw new Error('User session is not ready. Please refresh and try again.');
                }
                // TODO: Consider caching and error handling for this API call
                // If user removed avatar, update database
                const { error: avatarUpdateError } = await supabase
                    .from('admin_user_info')
                    .update({ avatar: null })
                    .eq('id', userId);

                if (avatarUpdateError) throw avatarUpdateError;

                // Also update Supabase auth user metadata
                if (user) {
                    const { error: metadataUpdateError } = await supabase.auth.updateUser({
                        data: {
                            ...user.user_metadata,
                            avatar_url: null
                        }
                    });

                    if (metadataUpdateError) throw metadataUpdateError;

                    // Refresh the session to update the auth context
                    await supabase.auth.refreshSession();
                }
            }

            // Reset preview and selected file after successful save
            setPreviewUrl(null);
            setSelectedFile(null);
            await refetch();

            toast.success('Profile updated successfully!', { id: toastId });
        } catch (error: unknown) {
            console.error('Error saving profile:', error);
            toast.error(`Error saving profile: ${(error as Error).message || 'Please try again.'}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="space-y-4 p-4">
            <div className="bg-white rounded-lg border p-4">
                <div className="space-y-4">
                    <div>
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-6 animate-pulse"></div>
                        <div className="flex items-center gap-2 mt-4 mb-4">
                            <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse"></div>
                            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="h-5 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="h-5 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>
        </div>;
    }

    if (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error loading user information: {message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
                Retry
            </Button>
        </div>;
    }

    return (
        <div className="space-y-4 p-4">
            <div className="bg-white rounded-lg border p-4">
                <div className="space-y-4">
                    <div>
                        <ItemTitle>Profile Information</ItemTitle>
                        <ItemDescription>
                            Update your photo, name, and email address
                        </ItemDescription>
                        <div className="flex items-center gap-2 mt-4 mb-4">
                            <Avatar className="h-16 w-16 rounded-full">
                                <AvatarImage
                                    src={previewUrl || avatarUrl || ''}
                                    alt="User"
                                    className="rounded-full"
                                />
                                <AvatarFallback className="text-lg">
                                    {getUserInitials(`${firstName} ${lastName}`)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAvatarClick}
                                >
                                    Change Photo
                                </Button>
                                {(previewUrl || avatarUrl) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={removeAvatar}
                                    >
                                        Remove
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">First Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Last Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Phone Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
            <Item variant="outline">
                <ItemContent>
                    <ItemTitle>Change Password</ItemTitle>
                    <ItemDescription>
                        Receive a secure link to reset your account password
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Button variant="outline" size="sm">
                        Send Reset Link
                    </Button>
                </ItemActions>
            </Item>

            <Item variant="outline">
                <ItemContent>
                    <ItemTitle>Delete Account</ItemTitle>
                    <ItemDescription>
                        Permanently remove your account and all associated data
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Button variant="destructive" size="sm">
                        Delete Account
                    </Button>
                </ItemActions>
            </Item>
        </div>
    );
}
