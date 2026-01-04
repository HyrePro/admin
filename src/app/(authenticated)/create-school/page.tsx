'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, School, Upload, MapPin, Users, GraduationCap, Globe, ImageIcon, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/api/client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Image from 'next/image'
import Link from 'next/link'
import { SchoolCreationProgressDialog } from '@/components/school-creation-progress-dialog'
import HeaderIcon from '@/components/header-icon'
import { NavUser } from '@/components/nav-user'
import { useAuth } from '@/context/auth-context'

interface SchoolFormData {
  name: string
  location: string
  board: string
  address: string
  school_type: string
  num_students: string
  num_teachers: string
  website: string
  logo_url: string
}



export default function CreateSchoolPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [progressStep, setProgressStep] = useState<'uploading' | 'creating' | 'success' | 'error'>('uploading')
  const [progressError, setProgressError] = useState<string>('')
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    location: '',
    board: '',
    address: '',
    school_type: '',
    num_students: '',
    num_teachers: '',
    website: '',
    logo_url: ''
  })
  const [errors, setErrors] = useState<Partial<SchoolFormData>>({})
  const router = useRouter()
  const { user } = useAuth()

  const validateForm = (): boolean => {
    const newErrors: Partial<SchoolFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'School name is required'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    if (!formData.board.trim()) {
      newErrors.board = 'Board is required'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!formData.school_type) {
      newErrors.school_type = 'School type is required'
    }
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Please enter a valid website URL'
    }
    if (formData.num_students && (isNaN(Number(formData.num_students)) || Number(formData.num_students) < 0)) {
      newErrors.num_students = 'Please enter a valid number'
    }
    if (formData.num_teachers && (isNaN(Number(formData.num_teachers)) || Number(formData.num_teachers) < 0)) {
      newErrors.num_teachers = 'Please enter a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsLoading(true)
    setShowProgressDialog(true)
    setProgressStep('uploading')
    setProgressError('')

    try {
      // Create a Supabase client instance
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in to create a school')
        setShowProgressDialog(false)
        router.push('/login')
        return
      }

      let logoUrl = ''

      // Upload logo if selected
      if (logoFile) {
        try {
          console.log('Starting logo upload...', {
            fileName: logoFile.name,
            fileSize: logoFile.size,
            fileType: logoFile.type,
            userId: user.id
          })

          const fileExt = logoFile.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}.${fileExt}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('school')
            .upload(fileName, logoFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Logo upload error details:', {
              error: uploadError,
              message: uploadError.message,
              fileName: fileName,
              bucketName: 'school'
            })

            // Provide more specific error messages
            let errorMsg = 'Failed to upload logo. Please try again.'
            if (uploadError.message?.includes('not found')) {
              errorMsg = 'Storage bucket not found. Please contact support.'
            } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
              errorMsg = 'Permission denied. Please check your account permissions.'
            } else if (uploadError.message?.includes('size')) {
              errorMsg = 'File size too large. Please choose a smaller image.'
            } else if (uploadError.message) {
              errorMsg = `Upload failed: ${uploadError.message}`
            }

            setProgressStep('error')
            setProgressError(errorMsg)
            setTimeout(() => {
              setShowProgressDialog(false)
              setIsLoading(false)
            }, 3000)
            return
          }

          console.log('Upload successful:', uploadData)

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('school')
            .getPublicUrl(fileName)

          console.log('Generated public URL:', publicUrl)
          logoUrl = publicUrl
        } catch (error) {
          console.error('Logo upload catch error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          setProgressStep('error')
          setProgressError(`Upload failed: ${errorMessage}`)
          setTimeout(() => {
            setShowProgressDialog(false)
            setIsLoading(false)
          }, 3000)
          return
        }
      }

      // Move to creating step
      setProgressStep('creating')

      // Prepare school data
      const schoolData = {
        name: formData.name,
        location: formData.location,
        board: formData.board,
        address: formData.address,
        school_type: formData.school_type,
        num_students: formData.num_students ? parseInt(formData.num_students) : null,
        num_teachers: formData.num_teachers ? parseInt(formData.num_teachers) : null,
        website: formData.website || null,
        logo_url: logoUrl || null
      }

      // Call API to create school
      const response = await fetch('/api/school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schoolData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('School creation error:', errorData)
        const errorMsg = errorData.error || 'Failed to create school. Please try again.'
        setProgressStep('error')
        setProgressError(errorMsg)
        setTimeout(() => {
          setShowProgressDialog(false)
          setIsLoading(false)
        }, 3000)
        return
      }

      const result = await response.json()

      // Show success step
      setProgressStep('success')

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      console.error('Unexpected error:', error)
      setProgressStep('error')
      setProgressError('An unexpected error occurred. Please try again.')
      setTimeout(() => {
        setShowProgressDialog(false)
        setIsLoading(false)
      }, 3000)
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Header with Hyriki Logo and NavUser - Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <HeaderIcon />
            {user && (
              <div className="ml-auto">
                <NavUser user={getUserData()} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-start justify-center p-4 sm:p-6 pt-6 sm:pt-8">
          <div className="w-full max-w-4xl">
            {/* Back Button and Header */}
            <div>
              <Link 
                href={isLoading ? "#" : "/select-organization"}
                className={`inline-flex items-center mb-6 transition-colors ${
                  isLoading 
                    ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={(e) => {
                  if (isLoading) {
                    e.preventDefault()
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Organization Selection
              </Link>
            </div>

            {/* Form Card */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  School Information
                </CardTitle>
                <CardDescription>
                  Please provide details about your school to complete the setup
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Logo and School Name Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    {/* Circular Logo Picker */}
                    <div className="flex flex-col items-center justify-center space-y-2 mx-auto sm:mx-0">
                      <div className="space-y-2">
                        {/* Clickable Circular Logo */}
                        <div className="relative flex justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                // Validate file type
                                if (!file.type.startsWith('image/')) {
                                  toast.error('Please select a valid image file')
                                  return
                                }
                                // Validate file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error('Image size should be less than 5MB')
                                  return
                                }
                                // Store file and create preview
                                setLogoFile(file)
                                setLogoPreview(URL.createObjectURL(file))
                                // Store file name in form data for now
                                setFormData(prev => ({ ...prev, logo_url: file.name }))
                              }
                            }}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="block w-16 h-16 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-50 cursor-pointer hover:border-gray-400 transition-colors"
                          >
                            <div className="w-full h-full flex items-center justify-center">
                              {logoPreview ? (
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                              )}
                            </div>
                          </label>
                          {logoPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setLogoFile(null)
                                setLogoPreview('')
                                setFormData(prev => ({ ...prev, logo_url: '' }))
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          Click to {logoPreview ? 'change' : 'upload'}
                        </p>
                      </div>
                    </div>

                    {/* School Name, Board and Type */}
                    <div className="flex-1 w-full space-y-4">
                      {/* School Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          School Name *
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter school name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600">{errors.name}</p>
                        )}
                      </div>

                      {/* Board and School Type */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="board" className="text-sm font-medium">
                            Board/Curriculum *
                          </Label>
                          <Select value={formData.board} onValueChange={(value) => handleInputChange('board', value)}>
                            <SelectTrigger className={`w-full ${errors.board ? 'border-red-500' : ''}`}>
                              <SelectValue placeholder="Select board" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cbse">CBSE</SelectItem>
                              <SelectItem value="icse">ICSE</SelectItem>
                              <SelectItem value="state">State Board</SelectItem>
                              <SelectItem value="igcse">Cambridge / CAIE</SelectItem>
                              <SelectItem value="ib">International Baccalaureate</SelectItem>
                              <SelectItem value="cambridge">Mix Boards</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.board && (
                            <p className="text-sm text-red-600">{errors.board}</p>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <Label htmlFor="school_type" className="text-sm font-medium">
                            School Type *
                          </Label>
                          <Select value={formData.school_type} onValueChange={(value) => handleInputChange('school_type', value)}>
                            <SelectTrigger className={`w-full ${errors.school_type ? 'border-red-500' : ''}`}>
                              <SelectValue placeholder="Select school type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="preschool">Pre-school</SelectItem>
                              <SelectItem value="primary">Primary school</SelectItem>
                              <SelectItem value="k8">K-8 school</SelectItem>
                              <SelectItem value="k10">K-10 school</SelectItem>
                              <SelectItem value="k12">K-12 school</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.school_type && (
                            <p className="text-sm text-red-600">{errors.school_type}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Complete Address *
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Enter complete school address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={errors.address ? 'border-red-500' : ''}
                      rows={3}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Location *
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="City, State/Province"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className={errors.location ? 'border-red-500' : ''}
                    />
                    {errors.location && (
                      <p className="text-sm text-red-600">{errors.location}</p>
                    )}
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="num_students" className="text-sm font-medium flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Number of Students
                      </Label>
                      <Input
                        id="num_students"
                        type="number"
                        placeholder="Enter number of students"
                        value={formData.num_students}
                        onChange={(e) => handleInputChange('num_students', e.target.value)}
                        className={errors.num_students ? 'border-red-500' : ''}
                        min="0"
                      />
                      {errors.num_students && (
                        <p className="text-sm text-red-600">{errors.num_students}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="num_teachers" className="text-sm font-medium flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        Number of Teachers
                      </Label>
                      <Input
                        id="num_teachers"
                        type="number"
                        placeholder="Enter number of teachers"
                        value={formData.num_teachers}
                        onChange={(e) => handleInputChange('num_teachers', e.target.value)}
                        className={errors.num_teachers ? 'border-red-500' : ''}
                        min="0"
                      />
                      {errors.num_teachers && (
                        <p className="text-sm text-red-600">{errors.num_teachers}</p>
                      )}
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      Website URL
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.example.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className={errors.website ? 'border-red-500' : ''}
                    />
                    {errors.website && (
                      <p className="text-sm text-red-600">{errors.website}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t">
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 text-base font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 w-full sm:w-auto sm:min-w-[200px]"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating School...' : 'Create School'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Progress Dialog */}
      <SchoolCreationProgressDialog
        isOpen={showProgressDialog}
        onClose={() => setShowProgressDialog(false)}
        currentStep={progressStep}
        errorMessage={progressError}
      />
    </div>
  )
}