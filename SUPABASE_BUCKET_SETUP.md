# Supabase Storage Bucket Setup

## School Logo Storage Bucket

The application uses a Supabase Storage bucket named `school` to store school logos.

### Setup Instructions

1. **Create Bucket:**
   - Go to your Supabase Dashboard
   - Navigate to Storage
   - Create a new bucket named: `school`
   - Make it **public** (so logos can be displayed)

2. **Set Bucket Policies:**
   ```sql
   -- Allow authenticated users to upload files
   CREATE POLICY "Allow authenticated users to upload school logos" ON storage.objects 
   FOR INSERT 
   TO authenticated 
   WITH CHECK (bucket_id = 'school');

   -- Allow public read access to school logos
   CREATE POLICY "Allow public read access to school logos" ON storage.objects 
   FOR SELECT 
   TO public 
   USING (bucket_id = 'school');

   -- Allow users to update their own uploaded files
   CREATE POLICY "Allow users to update their own school logos" ON storage.objects 
   FOR UPDATE 
   TO authenticated 
   USING (bucket_id = 'school' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow users to delete their own uploaded files
   CREATE POLICY "Allow users to delete their own school logos" ON storage.objects 
   FOR DELETE 
   TO authenticated 
   USING (bucket_id = 'school' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### File Organization

Files are organized in the bucket as follows:
```
school/
  ├── {user_id_1}/
  │   ├── {timestamp_1}.{ext}
  │   └── {timestamp_2}.{ext}
  ├── {user_id_2}/
  │   └── {timestamp_3}.{ext}
  └── ...
```

### Security Features

- **User Isolation:** Each user can only upload/modify files in their own folder
- **Authentication Required:** Only authenticated users can upload files
- **Public Read Access:** Logos can be displayed publicly (necessary for web display)
- **File Type Validation:** Client-side validation ensures only image files are uploaded
- **Size Limits:** Maximum file size of 5MB enforced on client-side

### Usage in Application

The school creation form now:
1. **Validates** the selected image file (type and size)
2. **Uploads** the logo to the `school` bucket in Supabase Storage
3. **Stores** the public URL in the `school_info.logo_url` field
4. **Creates** the school record and updates admin user metadata
5. **Redirects** to the dashboard upon success

### Environment Variables Required

Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

## Troubleshooting Upload Issues

### Common Error Messages and Solutions

1. **"Storage bucket not found"**
   - **Cause**: The `school` bucket doesn't exist
   - **Solution**: Create the bucket in Supabase Dashboard → Storage

2. **"Permission denied" or Policy errors**
   - **Cause**: Missing or incorrect RLS policies
   - **Solution**: Apply the policies listed above in the Supabase SQL editor

3. **"File size too large"**
   - **Cause**: File exceeds Supabase storage limits
   - **Solution**: Client-side validation should prevent this, but check file size

4. **"Authentication required"**
   - **Cause**: User is not properly authenticated
   - **Solution**: Check user session and authentication status

### Quick Diagnostic Steps

1. **Check Bucket Exists:**
   ```javascript
   const { data, error } = await supabase.storage.listBuckets()
   console.log('Buckets:', data)
   ```

2. **Check User Authentication:**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Current user:', user)
   ```

3. **Test Bucket Access:**
   ```javascript
   const { data, error } = await supabase.storage.from('school').list()
   console.log('Bucket access:', { data, error })
   ```

### Manual Bucket Creation

If the bucket doesn't exist, create it manually:

1. Go to Supabase Dashboard
2. Navigate to Storage
3. Click "New bucket"
4. Name: `school`
5. Make it **Public**
6. Click "Save"

### Policy Application

Run these SQL commands in Supabase SQL Editor:

```sql
-- First, ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Then apply the policies (from above)
-- Copy and paste each policy individually
```