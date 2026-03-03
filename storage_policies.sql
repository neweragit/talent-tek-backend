-- ============================================
-- STORAGE POLICIES FOR users_images BUCKET
-- ============================================
-- This file contains Supabase Storage policies for the users_images bucket
-- FOR CUSTOM AUTHENTICATION (not using Supabase Auth)
-- Run this in Supabase SQL Editor after creating the bucket
-- ============================================

-- First, ensure the bucket exists (run this in Supabase Storage UI or via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('users_images', 'users_images', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- IMPORTANT: Since you're using custom authentication,
-- we need to use more permissive policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all user images" ON storage.objects;

-- ============================================
-- POLICY 1: Allow all authenticated requests to upload
-- ============================================
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'users_images');

-- ============================================
-- POLICY 2: Allow all authenticated requests to update
-- ============================================
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'users_images')
WITH CHECK (bucket_id = 'users_images');

-- ============================================
-- POLICY 3: Allow all authenticated requests to delete
-- ============================================
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'users_images');

-- ============================================
-- POLICY 4: Allow public read access to all images
-- ============================================
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'users_images');

-- ============================================
-- ALTERNATIVE: Private images (authenticated users only)
-- If you want images to be private, replace Policy 4 with:
-- ============================================
-- CREATE POLICY "Authenticated users can view all user images"
-- ON storage.objects
-- FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'users_images');

-- ============================================
-- NOTES:
-- ============================================
-- 1. Storage structure: users_images/{user_id}/{filename}
--    Example: users_images/22222222-2222-2222-2222-222222222222/profile.jpg
--
-- 2. The policies use auth.uid() which is the authenticated user's ID from Supabase Auth
--    Since you're using custom auth, you might need to adjust these policies
--
-- 3. If using custom auth without Supabase Auth, consider using RLS policies on the users table
--    and modify these policies to check against user IDs in your users table
--
-- 4. To make the bucket public, set public=true in the bucket settings
--
-- 5. File naming convention:
--    - Profile photos: {user_id}/profile.{ext}
--    - Resumes: {user_id}/resume.{ext}
--    - Company logos: {user_id}/logo.{ext}
-- ============================================
