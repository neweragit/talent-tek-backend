-- ============================================
-- MIGRATION: Add Profile Fields to Admins Table
-- ============================================
-- This migration adds profile fields to the admins table
-- to support owner and admin profiles
-- ============================================

-- Add profile fields to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at 
BEFORE UPDATE ON admins 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Update existing owner admin with default data
UPDATE admins 
SET 
  full_name = 'Platform Owner',
  phone_number = '+213 555 123 456',
  city = 'Algiers',
  country = 'Algeria',
  bio = 'Platform owner and administrator of TalenTek - Empowering the future workforce.'
WHERE user_id = '22222222-2222-2222-2222-222222222222' 
AND full_name IS NULL;

-- Update superadmin with default data
UPDATE admins 
SET 
  full_name = 'Super Administrator',
  phone_number = '+213 555 000 000',
  city = 'Algiers',
  country = 'Algeria',
  bio = 'System administrator with full access to all platform features.'
WHERE user_id = '11111111-1111-1111-1111-111111111111' 
AND full_name IS NULL;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the migration was successful:
-- SELECT a.*, u.email, u.user_role 
-- FROM admins a 
-- JOIN users u ON a.user_id = u.id 
-- WHERE u.user_role IN ('owner', 'superadmin');
