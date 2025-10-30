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
import HeaderIcon from '@/components/header-icon'
import { NavUser } from '@/components/nav-user'

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
            <ToastContainer position="top-center" autoClose={3000} />

            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 py-2">
                <div className="mx-auto py-2 flex items-center justify-between">
                  <HeaderIcon/>
                    {user && (
                        <NavUser user={getUserData()} />
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-73px)]">
                <div className="w-full max-w-6xl">
                    {/* Header Section */}
                    <div className="text-center mb-6 md:mb-4">
                        
                        <p className="text-sm md:text-base lg:text-lg text-slate-700 font-semibold max-w-2xl mx-auto px-2">
                            Choose how you&apos;d like to set up your organization and start streamlining your hiring process
                        </p>

                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-5xl mx-auto mb-6">
                        {/* Create New School Card */}
                        <Card className="relative overflow-hidden border-2 border-slate-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 group bg-white">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full -mr-16 -mt-16 opacity-5 group-hover:opacity-10 transition-opacity" />

                            <CardHeader className="text-center pt-6 pb-4 px-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <School className="w-7 h-7 text-white" />
                                </div>
                                <CardTitle className="text-xl font-bold mb-2 text-slate-900">
                                    Create New School
                                </CardTitle>
                                <CardDescription className="text-sm text-slate-600">
                                    Set up a new school organization from scratch with full administrative control
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="px-5 pb-6">
                                <div className="space-y-3 mb-6 bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs text-slate-700">
                                            Create and customize your school profile
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs text-slate-700">
                                            Design custom hiring workflows and processes
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs text-slate-700">
                                            Invite and manage team members with role-based access
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCreateNewSchool}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                                    disabled={isLoading}
                                >
                                    <span>Create New School</span>
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Join Existing School Card */}
                        <Card className="relative overflow-hidden border-2 border-slate-200 hover:border-green-300 hover:shadow-2xl transition-all duration-300 group bg-white">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full -mr-16 -mt-16 opacity-5 group-hover:opacity-10 transition-opacity" />

                            <CardHeader className="text-center pt-6 pb-4 px-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <UserPlus className="w-7 h-7 text-white" />
                                </div>
                                <CardTitle className="text-xl font-bold mb-2 text-slate-900">
                                    Join School Organization
                                </CardTitle>
                                <CardDescription className="text-sm text-slate-600">
                                    Join an existing school organization using your invitation code
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="px-5 pb-6">
                                <div className="space-y-3 mb-6 bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs text-slate-700">
                                            Quick setup with invitation code
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs text-slate-700">
                                            Access existing workflows and templates
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-xs text-slate-700">
                                            Collaborate seamlessly with your team
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleJoinSchool}
                                    className="w-full bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700 py-5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
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
                        <p className="text-slate-500 text-xs md:text-sm">
                            Need assistance? <span className="text-blue-600 font-medium cursor-pointer hover:text-blue-700 transition-colors">Contact our support team</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}