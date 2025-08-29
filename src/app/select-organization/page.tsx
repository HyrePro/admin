'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Plus, Users, School, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/api/client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Image from 'next/image'

export default function SelectOrganizationPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleCreateNewSchool = async () => {
        setIsLoading(true)
        try {
            // For now, we'll just navigate to a create school page
            // This will be implemented in the next step as mentioned
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
            // For now, we'll just navigate to a join school page
            // This will be implemented in the next step as mentioned
            router.push('/join-school')
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} />
            
            {/* Header with HyrePro Logo */}
            <div className="bg-white">
                <div className="px-6 py-4">
                    <div className="flex justify-start gap-2">
                        <Image src="/icon.png" alt="HyrePro logo" width={30} height={30} className="rounded-md" />
                        <span className="text-lg font-bold text-foreground cursor-pointer">HyrePro</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center p-6 pt-12 h-full"> 
                <div className="w-full max-w-4xl justify-center items-center">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-6xl font-bold text-gray-900 mb-2 leading-tight">
                            Welcome to HyrePro Admin!
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            To get started, please choose how you&apos;d like to set up your organization
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                        {/* Create New School Organization */}
                        <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
                            <CardHeader className="text-center pb-6">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors group-hover:scale-110 duration-300">
                                    <School className="w-10 h-10 text-blue-600" />
                                </div>
                                <CardTitle className="text-2xl font-semibold mb-2">Create New School</CardTitle>
                                <CardDescription className="text-base text-gray-600">
                                    Set up a new school organization and start managing your hiring process
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                                    <li className="flex items-center">
                                        <Plus className="w-5 h-5 text-green-500 mr-3" />
                                        Create your own school profile
                                    </li>
                                    <li className="flex items-center">
                                        <Plus className="w-5 h-5 text-green-500 mr-3" />
                                        Customize hiring workflows
                                    </li>
                                    <li className="flex items-center">
                                        <Plus className="w-5 h-5 text-green-500 mr-3" />
                                        Invite team members
                                    </li>
                                </ul>
                                <Button
                                    onClick={handleCreateNewSchool}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 text-lg font-medium transition-all hover:text-white-900"
                                    disabled={isLoading}
                                >
                                    Create New School
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Join Existing School Organization */}
                        <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
                            <CardHeader className="text-center pb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors group-hover:scale-110 duration-300">
                                    <UserPlus className="w-10 h-10 text-green-600" />
                                </div>
                                <CardTitle className="text-2xl font-semibold mb-2">Join School Organization</CardTitle>
                                <CardDescription className="text-base text-gray-600">
                                    Join an existing school organization using an invitation code
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                                    <li className="flex items-center">
                                        <Plus className="w-5 h-5 text-green-500 mr-3" />
                                        Use invitation code
                                    </li>
                                    <li className="flex items-center">
                                        <Plus className="w-5 h-5 text-green-500 mr-3" />
                                        Access existing workflows
                                    </li>
                                    <li className="flex items-center">
                                        <Plus className="w-5 h-5 text-green-500 mr-3" />
                                        Collaborate with team
                                    </li>
                                </ul>
                                <Button
                                    onClick={handleJoinSchool}
                                    className="w-full bg-green-50 border border-green-600 text-green-700  py-4 text-lg font-medium transition-all duration-300 hover:bg-green-100 "
                                    disabled={isLoading}
                                >
                                    Join School Organization
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="text-center mt-8">
                        <p className="text-md text-gray-500">
                            Need help? Contact our support team for assistance
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}