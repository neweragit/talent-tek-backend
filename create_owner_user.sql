-- ============================================
-- CREATE OWNER USER
-- ============================================
-- This script creates an owner user if it doesn't exist
-- Email: owner@talentshub.com
-- Password: password123
-- ============================================

-- Insert Owner User (password is 'password123' - bcrypt hash with 10 rounds)
INSERT INTO users (id, email, password_hash, user_role, is_active, email_verified, profile_completed) VALUES
('22222222-2222-2222-2222-222222222222', 'owner@talentshub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner', TRUE, TRUE, TRUE)
ON CONFLICT (email) DO UPDATE SET
  user_role = 'owner',
  is_active = TRUE,
  email_verified = TRUE,
  profile_completed = TRUE;

-- Insert Admin entry for owner
INSERT INTO admins (user_id, role_level, permissions) VALUES
('22222222-2222-2222-2222-222222222222', 'admin', ARRAY['manage_users', 'manage_jobs', 'view_analytics', 'manage_subscriptions', 'manage_employers'])
ON CONFLICT DO NOTHING;
