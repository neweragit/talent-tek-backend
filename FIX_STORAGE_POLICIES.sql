-- ============================================
-- QUICK FIX: Storage Policies for Custom Auth
-- ============================================
-- Run this in Supabase SQL Editor to fix the RLS error
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all user images" ON storage.objects;

-- Create permissive policies that work with custom auth
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'users_images');

CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'users_images')
WITH CHECK (bucket_id = 'users_images');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'users_images');

CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'users_images');

-- ============================================
-- DONE! Now try uploading an image again
-- ============================================
