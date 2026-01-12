'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/auth-context'
import { useAuthStore } from '@/store/auth-store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, X, Loader2, AlertCircle, Building2 } from 'lucide-react'

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

const fetchSchoolInfo = async (): Promise<SchoolFormData> => {
  const response = await fetch('/api/settings/school-information');
  if (!response.ok) {
    throw new Error('Failed to fetch school information');
  }
  return response.json();
};

const updateSchoolInfo = async (schoolData: SchoolFormData): Promise<any> => {
  const response = await fetch('/api/settings/school-information', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schoolData),
  });
  if (!response.ok) {
    throw new Error('Failed to update school information');
  }
  return response.json();
};

export default function SchoolInformationPage() {
  const { user } = useAuth();
  const { schoolId } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const { data: schoolInfo, error, isLoading } = useQuery({
    queryKey: ['settings', 'school-information', schoolId],
    queryFn: fetchSchoolInfo,
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: updateSchoolInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'school-information', schoolId] });
      toast.success('School information updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Error saving: ${error.message}`);
    }
  });

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

  useEffect(() => {
    if (schoolInfo) {
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
    }
  }, [schoolInfo])

  const handleInputChange = (field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
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
    const newErrors: Partial<SchoolFormData> = {}

    if (!formData.name.trim()) newErrors.name = 'School name is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.board.trim()) newErrors.board = 'Board is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.school_type) newErrors.school_type = 'School type is required'
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
    return Object.keys(newErrors).length === 0;
  }

  const handleSaveChanges = async () => {
    if (!user || !validateForm()) return;

    setIsSaving(true);

    try {
      let logoUrl = formData.logo_url;

      if (logoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', logoFile);
        formDataUpload.append('bucket', 'school');
        formDataUpload.append('fileName', `${user.id}/school_logo_${Date.now()}.${logoFile.name.split('.').pop()}`);

        const uploadResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formDataUpload
        });

        if (!uploadResponse.ok) {
          throw new Error('Logo upload failed');
        }

        const { publicUrl } = await uploadResponse.json();
        logoUrl = publicUrl;
      }

      await updateMutation.mutateAsync({
        ...formData,
        logo_url: logoUrl
      });

      setLogoFile(null);
    } catch (error: unknown) {
      toast.error(`Error: ${(error as Error).message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-600">Loading school information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error Loading Information</h3>
              <p className="text-sm text-red-700 mt-0.5">{(error as Error).message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!schoolInfo) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No School Information</h3>
          <p className="text-sm text-gray-500">Please contact support to set up your school profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">School Information</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your school's profile and basic details</p>
      </div>

      {/* Logo Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">School Logo</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-6">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-50 cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-400" />
                )}
              </div>
              {logoPreview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLogo();
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Upload school logo</p>
              <p className="text-xs text-gray-500">PNG, JPG up to 5MB. Recommended 400x400px</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 h-8 text-xs"
              >
                <Upload className="w-3 h-3 mr-1.5" />
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* School Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              School Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter school name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`mt-1.5 ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Board and School Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="board" className="text-sm font-medium text-gray-700">
                Board/Curriculum <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.board} onValueChange={(value) => handleInputChange('board', value)}>
                <SelectTrigger className={`mt-1.5 ${errors.board ? 'border-red-500' : ''}`}>
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
              {errors.board && <p className="text-xs text-red-600 mt-1">{errors.board}</p>}
            </div>

            <div>
              <Label htmlFor="school_type" className="text-sm font-medium text-gray-700">
                School Type <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.school_type} onValueChange={(value) => handleInputChange('school_type', value)}>
                <SelectTrigger className={`mt-1.5 ${errors.school_type ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preschool">Pre-school</SelectItem>
                  <SelectItem value="primary">Primary school</SelectItem>
                  <SelectItem value="k8">K-8 school</SelectItem>
                  <SelectItem value="k10">K-10 school</SelectItem>
                  <SelectItem value="k12">K-12 school</SelectItem>
                </SelectContent>
              </Select>
              {errors.school_type && <p className="text-xs text-red-600 mt-1">{errors.school_type}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="City, State/Province"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`mt-1.5 ${errors.location ? 'border-red-500' : ''}`}
            />
            {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address" className="text-sm font-medium text-gray-700">
              Complete Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              placeholder="Enter complete school address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`mt-1.5 ${errors.address ? 'border-red-500' : ''}`}
              rows={3}
            />
            {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website" className="text-sm font-medium text-gray-700">
              Website URL
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.example.com"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={`mt-1.5 ${errors.website ? 'border-red-500' : ''}`}
            />
            {errors.website && <p className="text-xs text-red-600 mt-1">{errors.website}</p>}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Statistics</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="num_students" className="text-sm font-medium text-gray-700">
                Number of Students
              </Label>
              <Input
                id="num_students"
                type="number"
                placeholder="e.g., 500"
                value={formData.num_students}
                onChange={(e) => handleInputChange('num_students', e.target.value)}
                className={`mt-1.5 ${errors.num_students ? 'border-red-500' : ''}`}
                min="0"
              />
              {errors.num_students && <p className="text-xs text-red-600 mt-1">{errors.num_students}</p>}
            </div>

            <div>
              <Label htmlFor="num_teachers" className="text-sm font-medium text-gray-700">
                Number of Teachers
              </Label>
              <Input
                id="num_teachers"
                type="number"
                placeholder="e.g., 50"
                value={formData.num_teachers}
                onChange={(e) => handleInputChange('num_teachers', e.target.value)}
                className={`mt-1.5 ${errors.num_teachers ? 'border-red-500' : ''}`}
                min="0"
              />
              {errors.num_teachers && <p className="text-xs text-red-600 mt-1">{errors.num_teachers}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveChanges}
          disabled={isSaving || updateMutation.isPending}
          className="h-9 px-4"
        >
          {(isSaving || updateMutation.isPending) ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}