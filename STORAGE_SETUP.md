# Storage Setup Guide

## Setting up Supabase Storage for User Images

### 1. Create the Storage Bucket

In Supabase Dashboard:
1. Go to **Storage** section
2. Click **"New bucket"**
3. Name: `users_images`
4. Set **Public** to `true` (for public profile images)
5. Click **Create**

### 2. Apply Storage Policies

Run the SQL script in Supabase SQL Editor:

```bash
# Navigate to SQL Editor in Supabase Dashboard and run:
storage_policies.sql
```

This will create the following policies:
- ✅ Users can upload their own images
- ✅ Users can update their own images  
- ✅ Users can delete their own images
- ✅ Public can view all user images

### 3. File Structure

Images are stored with this structure:
```
users_images/
  ├── {user_id}/
  │   ├── profile.jpg     (profile photo)
  │   ├── resume.pdf      (resume file)
  │   └── logo.png        (company logo for employers)
```

Example:
```
users_images/22222222-2222-2222-2222-222222222222/profile.jpg
```

### 4. Usage in Code

The OwnerSettings component now:
- ✅ Uploads profile photos to `users_images/{user_id}/profile.{ext}`
- ✅ Stores public URL in the database
- ✅ Displays uploaded images
- ✅ Shows upload progress
- ✅ Validates file size (max 2MB)
- ✅ Accepts JPG, PNG, GIF formats

### 5. Security Notes

**Current Setup:** Public bucket with RLS policies

- Anyone can **view** images (public access)
- Only authenticated users can **upload** to their own folder
- Users can only **update/delete** their own images

**Alternative: Private Bucket**

If you want images to be private (authenticated users only), change the policy in `storage_policies.sql`:

```sql
-- Replace the public policy with:
CREATE POLICY "Authenticated users can view all user images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'users_images');
```

### 6. Testing

1. Login as owner: `owner@talentshub.com` / `password123`
2. Navigate to Settings (click avatar → Profile)
3. Click "Upload Photo"
4. Select an image (max 2MB)
5. Image should upload and display immediately

### 7. Troubleshooting

**Error: "Failed to upload profile photo"**
- Check if bucket exists in Storage
- Verify policies are applied
- Check browser console for detailed error
- Ensure user is authenticated

**Error: "File too large"**
- Images must be under 2MB
- Compress image before uploading

**Images not displaying:**
- Check if public URL is correct
- Verify bucket is set to public
- Check browser network tab for 403/404 errors

### 8. Additional Configuration

You can extend this for:
- Resume uploads: `users_images/{user_id}/resume.pdf`
- Company logos: `users_images/{user_id}/logo.png`
- Cover photos: `users_images/{user_id}/cover.jpg`

Just update the upload functions to use different filenames!
