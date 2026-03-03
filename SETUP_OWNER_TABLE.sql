-- ============================================
-- QUICK START: Owner Setup with Dedicated Table
-- ============================================
-- Run this in Supabase SQL Editor to set up everything
-- ============================================

-- STEP 1: Create owners table
-- ============================================
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  city TEXT,
  country TEXT,
  bio TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owners_user_id ON owners(user_id);

-- STEP 2: Add trigger for updated_at
-- ============================================
CREATE TRIGGER update_owners_updated_at 
BEFORE UPDATE ON owners 
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

-- STEP 4: Create owner profile
-- ============================================
INSERT INTO owners (user_id, full_name, phone_number, city, country, bio) VALUES
('22222222-2222-2222-2222-222222222222', 
 'Platform Owner',
 '+213 555 123 456',
 'Algiers',
 'Algeria',
 'Platform owner and administrator of TalenTek - Empowering the future workforce.')
ON CONFLICT (user_id) DO NOTHING;

-- STEP 5: Ensure admin record exists (for permissions)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = '22222222-2222-2222-2222-222222222222') THEN
    INSERT INTO admins (user_id, role_level, permissions) VALUES
    ('22222222-2222-2222-2222-222222222222', 'admin', 
     ARRAY['manage_users', 'manage_jobs', 'view_analytics', 'manage_subscriptions', 'manage_employers']);
  END IF;
END $$;

-- STEP 6: Verify setup
-- ============================================
SELECT 
  u.email,
  u.user_role,
  u.is_active,
  o.full_name,
  o.phone_number,
  o.city,
  o.bio,
  a.role_level,
  a.permissions
FROM users u
JOIN owners o ON u.id = o.user_id
JOIN admins a ON u.id = a.user_id
WHERE u.email = 'owner@talentshub.com';

-- ============================================
-- DATABASE STRUCTURE (Following Same Pattern)
-- ============================================
-- users (authentication) → user_role: 'owner'
--   ↓
-- owners (profile data) → full_name, phone, city, bio, photo
--   ↓
-- admins (permissions) → role_level, permissions array
-- ============================================

-- ============================================
-- EXPECTED RESULT:
-- ============================================
-- email: owner@talentshub.com
-- user_role: owner
-- is_active: true
-- full_name: Platform Owner
-- phone_number: +213 555 123 456
-- city: Algiers
-- bio: Platform owner and administrator...
-- role_level: admin
-- permissions: {manage_users, manage_jobs, ...}
-- ============================================

-- ============================================
-- LOGIN CREDENTIALS
-- ============================================
-- Email: owner@talentshub.com
-- Password: password123
-- ============================================

-- ============================================
-- CONSISTENCY CHECK
-- ============================================
-- All user types now have dedicated profile tables:
-- ✅ talents table (for user_role = 'talent')
-- ✅ employers table (for user_role = 'employer')
-- ✅ interviewers table (for user_role = 'interviewer')
-- ✅ owners table (for user_role = 'owner')
-- ✅ admins table (for permissions management)
-- ============================================
