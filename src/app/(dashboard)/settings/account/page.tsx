import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { Avatar } from '@radix-ui/react-avatar';
import React from 'react';

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

export default function AccountPage() {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
                <div className="space-y-2">
                    <div>
                        <ItemTitle>Profile Information</ItemTitle>
                        <ItemDescription>
                            Update your photo, name, and email address
                        </ItemDescription>
                        <div className="flex items-center gap-2 mt-4 mb-4">
                            <Avatar className="h-16 w-16 rounded-full">
                                <AvatarImage src="" alt="User" />
                                <AvatarFallback className="text-lg">
                                    {getUserInitials("Current User")}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <Button variant="outline" size="sm">
                                    Change Photo
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                            <div>
                                <label className="block text-sm font-medium mb-2">First Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="First Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Last Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Last Name"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Email"
                                />
                            </div>
                        </div>
                    </div>
                    <Button >Save Changes</Button>


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