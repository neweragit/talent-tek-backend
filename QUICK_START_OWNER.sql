-- ============================================
-- QUICK START: Complete Owner Setup
-- ============================================
-- Run these commands in order in Supabase SQL Editor
-- ============================================

-- STEP 1: Add profile fields to admins table (if not exists)
-- ============================================
ALTER TABLE admins ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- STEP 2: Add trigger for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at 
BEFORE UPDATE ON admins 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- STEP 3: Ensure owner user exists
-- ============================================
INSERT INTO users (id, email, password_hash, user_role, is_active, email_verified, profile_completed) VALUES
('22222222-2222-2222-2222-222222222222', 'owner@talentshub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner', TRUE, TRUE, TRUE)
ON CONFLICT (email) DO UPDATE SET
  user_role = 'owner',
  is_active = TRUE,
  email_verified = TRUE,
  profile_completed = TRUE;

-- STEP 4: Create or update owner admin profile
-- ============================================
INSERT INTO admins (user_id, role_level, permissions, full_name, phone_number, city, country, bio) VALUES
('22222222-2222-2222-2222-222222222222', 'admin', 
 ARRAY['manage_users', 'manage_jobs', 'view_analytics', 'manage_subscriptions', 'manage_employers'],
 'Platform Owner',
 '+213 555 123 456',
 'Algiers',
 'Algeria',
 'Platform owner and administrator of TalenTek - Empowering the future workforce.')
ON CONFLICT (user_id) DO UPDATE SET
  full_name = COALESCE(admins.full_name, EXCLUDED.full_name),
  phone_number = COALESCE(admins.phone_number, EXCLUDED.phone_number),
  city = COALESCE(admins.city, EXCLUDED.city),
  country = COALESCE(admins.country, EXCLUDED.country),
  bio = COALESCE(admins.bio, EXCLUDED.bio);

-- STEP 5: Verify setup
-- ============================================
SELECT 
  u.email,
  u.user_role,
  u.is_active,
  a.full_name,
  a.phone_number,
  a.city,
  a.bio,
  a.role_level,
  a.permissions
FROM users u
JOIN admins a ON u.id = a.user_id
WHERE u.email = 'owner@talentshub.com';

-- ============================================
-- EXPECTED RESULT:
-- ============================================
-- email: owner@talentshub.com
-- user_role: owner
-- is_active: true
-- full_name: Platform Owner
-- phone_number: +213 555 123 456
-- city: Algiers
-- bio: Platform owner and administrator of TalenTek...
-- role_level: admin
-- permissions: {manage_users, manage_jobs, view_analytics, manage_subscriptions, manage_employers}
-- ============================================

-- ============================================
-- LOGIN CREDENTIALS
-- ============================================
-- Email: owner@talentshub.com
-- Password: password123
-- ============================================
