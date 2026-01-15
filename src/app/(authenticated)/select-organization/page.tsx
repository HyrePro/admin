'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Plus, Users, School, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/api/client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Image from 'next/image'
import { useAuth } from '@/context/auth-context'
import { NavUser } from '@/components/nav-user'
import HeaderIcon from '@/components/header-icon'

export default function SelectOrganizationPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { user } = useAuth()

    const handleCreateNewSchool = async () => {
        setIsLoading(true)
        try {
            router.push('/create-school')
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleJoinSchool = async () => {
        setIsLoading(true)
        try {
            router.push('/join-school')
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Get user data for NavUser component
    const getUserData = () => {
        if (!user) return { name: 'Loading...', email: '', avatar: '' }

        return {
            name: user.user_metadata?.name || user.email?.split('@')[0] || user.id || 'User',
            email: user.user_metadata?.email || user.email || '',
            avatar: user.user_metadata?.avatar_url || ''
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <ToastContainer position="top-center" autoClose={3000} />

            {/* Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
                    <HeaderIcon/>
                    {user && (
                        <NavUser user={getUserData()} />
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center px-4 py-12 md:py-16 min-h-[calc(100vh-73px)]">
                <div className="w-full max-w-5xl">
                    {/* Header Section */}
                    <div className="text-center mb-10 md:mb-12">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Welcome to Your Organization Setup
                        </h1>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Choose how you'd like to set up your organization and start streamlining your hiring process
                        </p>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-8">
                        {/* Create New School Card */}
                        <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group bg-white dark:bg-gray-900">
                            <CardHeader className="text-center pt-8 pb-4 px-6">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                                    <School className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                    Create New School
                                </CardTitle>
                                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Set up a new school organization from scratch with full administrative control
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="px-6 pb-8">
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Create and customize your school profile
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Design custom hiring workflows
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Invite team members with role-based access
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCreateNewSchool}
                                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-5 text-sm font-medium transition-all duration-300 group"
                                    disabled={isLoading}
                                >
                                    <span>Create New School</span>
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Join Existing School Card */}
                        <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group bg-white dark:bg-gray-900">
                            <CardHeader className="text-center pt-8 pb-4 px-6">
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                                    <UserPlus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <CardTitle className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                    Join School Organization
                                </CardTitle>
                                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Join an existing school organization using your invitation code
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="px-6 pb-8">
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Quick setup with invitation code
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Access existing workflows and templates
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Collaborate seamlessly with your team
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleJoinSchool}
                                    variant="outline"
                                    className="w-full border-2 border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 py-5 text-sm font-medium transition-all duration-300 group"
                                    disabled={isLoading}
                                >
                                    <span>Join School Organization</span>
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Footer */}
                    <div className="text-center px-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Need assistance? <span className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline transition-colors">Contact our support team</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}