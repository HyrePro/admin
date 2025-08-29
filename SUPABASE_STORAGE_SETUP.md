# Supabase Storage Setup for School Logos

## Required Setup in Supabase Dashboard

### 1. Create Storage Bucket
- Go to Supabase Dashboard → Storage
- Create a new bucket named: `school-logos`
- Make it public for read access

### 2. Set Bucket Policies
Add these policies to the `school-logos` bucket:

#### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Allow authenticated users to upload school logos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-logos');
```

#### Policy 2: Allow public read access
```sql
CREATE POLICY "Allow public read access to school logos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'school-logos');
```

#### Policy 3: Allow users to update their own uploads
```sql
CREATE POLICY "Allow users to update their own school logos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'school-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Policy 4: Allow users to delete their own uploads
```sql
CREATE POLICY "Allow users to delete their own school logos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'school-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Folder Structure
Files will be uploaded with the following structure:
```
school-logos/
  ├── {user_id}/
  │   ├── {timestamp}.jpg
  │   ├── {timestamp}.png
  │   └── ...
```

### 4. File Restrictions
- Maximum file size: 5MB
- Allowed formats: JPG, PNG, GIF
- Recommended: Square images for best display

## Implementation Notes
- Files are uploaded with user ID as folder name for organization
- Timestamps are used for unique filenames
- Public URLs are generated for easy access
- File validation is done on the client side before upload