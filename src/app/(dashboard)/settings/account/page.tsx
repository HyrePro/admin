'use client'

import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Avatar } from '@radix-ui/react-avatar';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';
import useSWR from 'swr';
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

// TODO: Consider caching and error handling for this API call
// Fetcher function for user data
const fetchUserInfo = async (userId: string) => {
    if (!userId) return null;

    const supabase = createClient();
    const { data, error } = await supabase
        .from('admin_user_info')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    // Ensure the returned data is serializable
    return data ? JSON.parse(JSON.stringify(data)) : null;
};



export default function AccountPage() {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: userInfo, error, isLoading } = useSWR(
        user?.id ? ['user-info', user.id] : null,
        ([_, userId]) => fetchUserInfo(userId)
    );

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
        if (!user) return;

        setIsSaving(true);
        const toastId = toast.loading('Saving profile...');

        try {
            const supabase = createClient();

            // First, update user info in database
            // TODO: Consider caching and error handling for this API call
            const { error: updateError } = await supabase
                .from('admin_user_info')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    phone_no: phone
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Then, upload avatar if a new file was selected
            if (selectedFile) {
                toast.loading('Uploading avatar...', { id: toastId });

                // Create file name with timestamp
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

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
                    .eq('id', user.id);

                if (avatarUpdateError) throw avatarUpdateError;

                setAvatarUrl(publicUrl);
            } else if (previewUrl === null && avatarUrl === null) {
                // TODO: Consider caching and error handling for this API call
                // If user removed avatar, update database
                const { error: avatarUpdateError } = await supabase
                    .from('admin_user_info')
                    .update({ avatar: null })
                    .eq('id', user.id);

                if (avatarUpdateError) throw avatarUpdateError;
            }

            // Reset preview and selected file after successful save
            setPreviewUrl(null);
            setSelectedFile(null);

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
        return <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error loading user information: {error.message}</p>
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