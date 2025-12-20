'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ItemDescription, ItemTitle } from '@/components/ui/item'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/auth-context'
import { createClient } from '@/lib/supabase/api/client'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'

// Fetcher function for school data
const fetchSchoolInfo = async (userId: string) => {
  console.log('Starting fetchSchoolInfo for userId:', userId);
  
  if (!userId) {
    console.log('No userId provided, returning null');
    return null;
  }

  const supabase = createClient();
  console.log('Supabase client created');
  
  // First get the school_id from admin_user_info
  console.log('Fetching user info from admin_user_info table for userId:', userId);
  const { data: userInfo, error: userError } = await supabase
    .from('admin_user_info')
    .select('school_id')
    .eq('id', userId)
    .single();

  console.log('User info fetch result:', { userInfo, userError });

  if (userError) {
    console.error('Error fetching user info:', userError);
    throw userError;
  }
  
  if (!userInfo?.school_id) {
    console.log('No school_id found in user info:', userInfo);
    return null;
  }
  
  console.log('Retrieved school_id:', userInfo.school_id);

  // Then get the school information
  console.log('Fetching school info from school_info table for school_id:', userInfo.school_id);
  const { data: schoolData, error: schoolError } = await supabase
    .from('school_info')
    .select('*')
    .eq('id', userInfo.school_id)
    .single();

  console.log('School info fetch result:', { schoolData, schoolError });

  if (schoolError) {
    console.error('Error fetching school info:', schoolError);
    throw schoolError;
  }
  
  console.log('Successfully fetched school data:', schoolData);
  return schoolData;
}

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

export default function SchoolInformationPage() {
  console.log('=== SchoolInformationPage Component Render Start ===');
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  console.log('SchoolInformationPage rendered with user:', user);
  
  // Log user authentication state changes
  useEffect(() => {
    console.log('User auth state changed:', user);
    if (user) {
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('User metadata:', user.user_metadata);
    }
    
    // Cleanup function to log when component unmounts
    return () => {
      console.log('=== SchoolInformationPage Component Unmounted ===');
    };
  }, [user]);
  
  const { data: schoolInfo, error, isLoading, mutate } = useSWR(
    user?.id ? ['school-info', user.id] : null,
    ([_, userId]) => {
      console.log('SWR fetcher called with userId:', userId);
      return fetchSchoolInfo(userId);
    }
  );

  console.log('SWR state:', { schoolInfo, error, isLoading, userId: user?.id });

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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Set form values when school info is loaded
  useEffect(() => {
    console.log('useEffect triggered with schoolInfo:', schoolInfo);
    if (schoolInfo) {
      console.log('Populating form data with schoolInfo:', schoolInfo);
      setFormData({
        name: schoolInfo.name || '',
        location: schoolInfo.location || '',
        board: schoolInfo.board || '',
        address: schoolInfo.address || '',
        school_type: schoolInfo.school_type || '',
        num_students: schoolInfo.num_students ? schoolInfo.num_students.toString() : '',
        num_teachers: schoolInfo.num_teachers ? schoolInfo.num_teachers.toString() : '',
        website: schoolInfo.website || '',
        logo_url: schoolInfo.logo_url || ''
      });
      setLogoPreview(schoolInfo.logo_url || '');
      console.log('Form data populated:', {
        name: schoolInfo.name || '',
        location: schoolInfo.location || '',
        board: schoolInfo.board || '',
        address: schoolInfo.address || '',
        school_type: schoolInfo.school_type || '',
        num_students: schoolInfo.num_students ? schoolInfo.num_students.toString() : '',
        num_teachers: schoolInfo.num_teachers ? schoolInfo.num_teachers.toString() : '',
        website: schoolInfo.website || '',
        logo_url: schoolInfo.logo_url || ''
      });
    } else {
      console.log('schoolInfo is null or undefined, not populating form data');
    }
  }, [schoolInfo])

  const handleInputChange = (field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    setFormData(prev => ({ ...prev, logo_url: '' }))
  }

  const validateForm = (): boolean => {
    console.log('Validating form with data:', formData);
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
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form validation result:', { isValid, errors: newErrors });
    return isValid;
  }

  const handleSaveChanges = async () => {
    console.log('handleSaveChanges called with formData:', formData);
    if (!user || !validateForm()) {
      console.log('Validation failed or no user, returning early');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving school information...');

    try {
      const supabase = createClient();

      let logoUrl = formData.logo_url;
      console.log('Current logoUrl:', logoUrl);

      // Upload logo if a new file was selected
      if (logoFile) {
        console.log('Uploading new logo file:', logoFile);
        toast.loading('Uploading logo...', { id: toastId });

        // Create file name with timestamp
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}/school_logo_${Date.now()}.${fileExt}`;
        console.log('Generated file name:', fileName);

        // Upload file to Supabase Storage in 'school' bucket
        const { error: uploadError } = await supabase.storage
          .from('school')
          .upload(fileName, logoFile, {
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('school')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
        console.log('Logo uploaded, new logoUrl:', logoUrl);
      }

      // Update school info in database
      console.log('Updating school info with data:', { ...formData, logo_url: logoUrl });
      const response = await fetch('/api/school', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          logo_url: logoUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to update school information');
      }

      // Reset logo state after successful save
      setLogoFile(null);

      // Revalidate the data
      await mutate();

      toast.success('School information updated successfully!', { id: toastId });
      console.log('School information saved successfully');
    } catch (error: unknown) {
      console.error('Error saving school information:', error);
      toast.error(`Error saving school information: ${(error as Error).message || 'Please try again.'}`, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    console.log('Rendering loading skeleton because isLoading is true');
    return (
      <div className="space-y-4 p-4">
        {/* Loading skeleton JSX */}
      </div>
    );
  }

  if (error) {
    console.log('Rendering error message because error occurred:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading school information: {error.message}</p>
      </div>
    );
  }

  if (!schoolInfo && !isLoading) {
    console.log('Rendering no school info message because schoolInfo is null and not loading');
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">No school information found. Please contact support.</p>
      </div>
    );
  }

  console.log('Rendering main form with schoolInfo:', schoolInfo);
  return (
    <div className="space-y-4 p-4">
      <div className="bg-white rounded-lg border p-4">
        <div className="space-y-4">
          <div>
            <ItemTitle>School Information</ItemTitle>
            <ItemDescription>
              Update your school logo, name, and other details.
            </ItemDescription>
            
            {/* Logo and School Name Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-6">
              {/* Circular Logo Picker */}
              <div className="flex flex-col items-center justify-center space-y-2 mx-auto sm:mx-0">
                <div className="space-y-2">
                  {/* Clickable Circular Logo */}
                  <div className="relative flex justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                      ref={fileInputRef}
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
                    {(logoPreview || schoolInfo.logo_url) && (
                      <button
                        type="button"
                        onClick={removeLogo}
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

              {/* School Name */}
              <div className="flex-1 w-full space-y-2">
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
            </div>

            {/* Board and School Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
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

              <div className="space-y-2">
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

            {/* Address */}
            <div className="space-y-2 mt-4">
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
            <div className="space-y-2 mt-4">
              <Label htmlFor="location" className="text-sm font-medium">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="num_students" className="text-sm font-medium">
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
                <Label htmlFor="num_teachers" className="text-sm font-medium">
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
            <div className="space-y-2 mt-4">
              <Label htmlFor="website" className="text-sm font-medium">
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
            <div className="pt-6 border-t mt-6">
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}