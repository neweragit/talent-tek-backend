-- ============================================
-- MIGRATION: Create Owners Table
-- ============================================
-- Creates a dedicated owners table following the same pattern
-- as talents, employers, and interviewers tables
-- ============================================

-- Create owners table
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

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_owners_user_id ON owners(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_owners_updated_at 
BEFORE UPDATE ON owners 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Insert owner profile for existing owner user
INSERT INTO owners (user_id, full_name, phone_number, city, country, bio) VALUES
('22222222-2222-2222-2222-222222222222', 
 'Platform Owner',
 '+213 555 123 456',
 'Algiers',
 'Algeria',
 'Platform owner and administrator of TalenTek - Empowering the future workforce.')
ON CONFLICT (user_id) DO NOTHING;

-- Verify the migration
SELECT 
  u.email,
  u.user_role,
  o.full_name,
  o.phone_number,
  o.city,
  o.bio
FROM users u
JOIN owners o ON u.id = o.user_id
WHERE u.user_role = 'owner';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- The owners table now follows the same pattern as:
-- - talents (for talent users)
-- - employers (for employer users)
-- - interviewers (for interviewer users)
-- - owners (for owner users)
-- ============================================
