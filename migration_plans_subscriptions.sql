-- ============================================
-- MIGRATION: Update Subscriptions Structure
-- This migrates from old subscriptions to new plans + subscriptions
-- ============================================

-- Step 1: Backup existing subscriptions data (optional but recommended)
DROP TABLE IF EXISTS subscriptions_backup;
-- Step 2: Drop old subscriptions table and related constraints
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Step 3: Create new PLANS table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  target_user_type TEXT NOT NULL CHECK (target_user_type IN ('employer', 'talent')),
  price NUMERIC NOT NULL,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'annually', 'one-time')),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  -- Employer-specific limits
  max_job_posts INTEGER,
  max_active_jobs INTEGER,
  max_users INTEGER,
  -- Talent-specific limits
  max_service_posts INTEGER,
  max_active_services INTEGER,
  -- Common features
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_target_user_type ON plans(target_user_type);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

-- Step 4: Create new SUBSCRIPTIONS table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  employer_id UUID,
  talent_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'trial')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
  CONSTRAINT fk_subscription_employer FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_talent FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  CONSTRAINT chk_subscription_user CHECK (
    (employer_id IS NOT NULL AND talent_id IS NULL) OR 
    (employer_id IS NULL AND talent_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_employer_id ON subscriptions(employer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_talent_id ON subscriptions(talent_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

-- Step 5: Add trigger for subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at 
  BEFORE UPDATE ON plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Insert predefined plans
INSERT INTO plans (id, name, display_name, description, target_user_type, price, billing_cycle, is_active, is_featured, sort_order, max_job_posts, max_active_jobs, max_users, max_service_posts, max_active_services, features) VALUES
-- Employer Plans
('a1111111-1111-1111-1111-111111111111', 'employer_free', 'Free', 'Perfect for trying out the platform', 'employer', 0, 'monthly', TRUE, FALSE, 1, 3, 1, 1, NULL, NULL, '{"job_promotion": false, "analytics": "basic", "support": "community", "applicant_tracking": true}'::jsonb),
('a2222222-2222-2222-2222-222222222222', 'employer_starter', 'Starter', 'Great for small businesses and startups', 'employer', 99, 'monthly', TRUE, FALSE, 2, 10, 3, 2, NULL, NULL, '{"job_promotion": false, "analytics": "standard", "support": "email", "applicant_tracking": true, "interview_scheduling": true}'::jsonb),
('a3333333-3333-3333-3333-333333333333', 'employer_professional', 'Professional', 'Best for growing companies', 'employer', 299, 'monthly', TRUE, TRUE, 3, 50, 10, 5, NULL, NULL, '{"job_promotion": true, "analytics": "advanced", "support": "priority", "applicant_tracking": true, "interview_scheduling": true, "custom_branding": true, "api_access": true}'::jsonb),
('a4444444-4444-4444-4444-444444444444', 'employer_enterprise', 'Enterprise', 'For large organizations with advanced needs', 'employer', 999, 'monthly', TRUE, FALSE, 4, 999, 50, 20, NULL, NULL, '{"job_promotion": true, "analytics": "premium", "support": "24/7", "applicant_tracking": true, "interview_scheduling": true, "custom_branding": true, "api_access": true, "dedicated_account_manager": true, "sso": true}'::jsonb),
-- Talent Plans
('a5555555-5555-5555-5555-555555555555', 'talent_free', 'Free', 'Start your freelance journey', 'talent', 0, 'monthly', TRUE, FALSE, 1, NULL, NULL, NULL, 3, 1, '{"service_promotion": false, "analytics": "basic", "support": "community", "profile_visibility": "standard"}'::jsonb),
('a6666666-6666-6666-6666-666666666666', 'talent_pro', 'Pro', 'Grow your freelance business', 'talent', 29, 'monthly', TRUE, TRUE, 2, NULL, NULL, NULL, 15, 5, '{"service_promotion": true, "analytics": "advanced", "support": "priority", "profile_visibility": "featured", "custom_portfolio": true, "priority_support": true}'::jsonb),
('a7777777-7777-7777-7777-777777777777', 'talent_premium', 'Premium', 'For established professionals', 'talent', 79, 'monthly', TRUE, FALSE, 3, NULL, NULL, NULL, 999, 20, '{"service_promotion": true, "analytics": "premium", "support": "24/7", "profile_visibility": "premium", "custom_portfolio": true, "priority_support": true, "verified_badge": true, "unlimited_revisions": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Migrate existing subscription data (if backup exists)
-- This maps old plan names to new plan IDs
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions_backup') THEN
    INSERT INTO subscriptions (id, plan_id, employer_id, status, started_at, expires_at, auto_renew, created_at, updated_at)
    SELECT 
      sb.id,
      CASE 
        WHEN sb.plan_name = 'starter' THEN 'a2222222-2222-2222-2222-222222222222'
        WHEN sb.plan_name = 'professional' THEN 'a3333333-3333-3333-3333-333333333333'
        WHEN sb.plan_name = 'enterprise' THEN 'a4444444-4444-4444-4444-444444444444'
        ELSE 'a1111111-1111-1111-1111-111111111111' -- Default to free
      END as plan_id,
      sb.employer_id,
      sb.status,
      sb.started_at,
      sb.expires_at,
      sb.auto_renew,
      sb.created_at,
      sb.updated_at
    FROM subscriptions_backup sb
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Migration completed: Old subscriptions migrated to new structure';
  ELSE
    RAISE NOTICE 'No backup table found, skipping data migration';
  END IF;
END $$;

-- Step 8: Insert sample subscriptions for testing
INSERT INTO subscriptions (id, plan_id, employer_id, talent_id, status, expires_at, auto_renew) VALUES
('b0000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', NULL, 'active', NOW() + INTERVAL '25 days', TRUE),
('b0000002-0000-0000-0000-000000000002', 'a2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', NULL, 'active', NOW() + INTERVAL '15 days', TRUE),
('b0000003-0000-0000-0000-000000000003', 'a6666666-6666-6666-6666-666666666666', NULL, 'a1111111-1111-1111-1111-111111111111', 'active', NOW() + INTERVAL '20 days', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Step 9: Update payments table to work with new subscriptions (if needed)
-- Payments table should still work as subscription_id foreign key is maintained

-- Step 10: Verify migration
SELECT 
  'Plans created' as migration_step,
  COUNT(*) as count
FROM plans
UNION ALL
SELECT 
  'Subscriptions migrated' as migration_step,
  COUNT(*) as count
FROM subscriptions;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- To verify the data:
-- SELECT * FROM plans ORDER BY target_user_type, sort_order;
-- SELECT s.*, p.display_name as plan_name, p.price FROM subscriptions s JOIN plans p ON s.plan_id = p.id;

-- You can now drop the backup table if everything looks good:
-- DROP TABLE IF EXISTS subscriptions_backup;
