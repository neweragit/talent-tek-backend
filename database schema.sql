-- ============================================
-- TALENTSHUB DATABASE SCHEMA
-- Exact match with project structure
-- ============================================

-- Enable UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS (Core authentication)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'talent' CHECK (user_role IN ('superadmin', 'admin', 'owner', 'talent', 'employer', 'interviewer')),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);

-- ============================================
-- TALENTS (Job seekers)
-- ============================================

CREATE TABLE IF NOT EXISTS talents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  city TEXT,
  current_position TEXT,
  years_of_experience TEXT,
  education_level TEXT,
  job_types TEXT[],
  work_location TEXT[],
  short_bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  has_carte_entrepreneur BOOLEAN DEFAULT FALSE,
  skills TEXT[],
  profile_photo_url TEXT,
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talents_user_id ON talents(user_id);

-- ============================================
-- EMPLOYERS (Company accounts)
-- ============================================

CREATE TABLE IF NOT EXISTS employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  industry TEXT,
  website TEXT,
  company_size TEXT,
  year_founded TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  zip_code TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  logo_url TEXT,
  rep_first_name TEXT,
  rep_last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employers_user_id ON employers(user_id);

-- ============================================
-- INTERVIEWERS (Technical & Leadership)
-- ============================================

CREATE TABLE IF NOT EXISTS interviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  expertise TEXT[],
  interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'leadership', 'talent-acquisition')),
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviewers_user_id ON interviewers(user_id);
CREATE INDEX IF NOT EXISTS idx_interviewers_email ON interviewers(email);
CREATE INDEX IF NOT EXISTS idx_interviewers_status ON interviewers(status);

-- ============================================
-- ADMINS (Superadmins & admins)
-- ===========================================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_level TEXT CHECK (role_level IN ('admin', 'superadmin')),
  permissions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- ============================================
-- OWNERS (Platform owners)
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

-- ============================================
-- JOBS (Posted by employers)
-- ============================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  title TEXT NOT NULL,
  profession TEXT,
  description TEXT,
  location TEXT,
  workplace TEXT CHECK (workplace IN ('on-site', 'remote', 'hybrid')),
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  contract_type TEXT,
  experience_level TEXT,
  job_level TEXT,
  education_required TEXT,
  skills_required TEXT[],
  salary_min NUMERIC,
  salary_max NUMERIC,
  positions_available INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  applicants_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_job_employer FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON jobs(published_at);

-- ============================================
-- APPLICATIONS (Talents applying to jobs)
-- ============================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  talent_id UUID NOT NULL,
  employer_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview-scheduled', 'offered', 'hired', 'rejected', 'withdrawn')),
  stage TEXT CHECK (stage IN ('to-contact', 'talent-acquisition', 'technical', 'leadership', 'offer', 'rejected-offer')),
  match_score INTEGER,
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_application_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_application_talent FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  CONSTRAINT fk_application_employer FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
  CONSTRAINT uq_talent_job_application UNIQUE (job_id, talent_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_talent_id ON applications(talent_id);
CREATE INDEX IF NOT EXISTS idx_applications_employer_id ON applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);

-- ============================================
-- INTERVIEWS (Scheduled interviews)
-- ============================================

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  interviewer_id UUID,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'leadership', 'talent-acquisition')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no-show')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meet_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_interview_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_interview_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_date ON interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- ============================================
-- SERVICES (Offered by talents)
-- ============================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  starting_price NUMERIC,
  delivery_time TEXT,
  rating NUMERIC(3,2),
  reviews_count INTEGER DEFAULT 0,
  tags TEXT[],
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_service_talent FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_services_talent_id ON services(talent_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- ============================================
-- SERVICE_REVIEWS (Reviews for services)
-- ============================================

CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating NUMERIC(3,2) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_service_review_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_service_review UNIQUE (service_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_reviewer_id ON service_reviews(reviewer_id);

-- ============================================
-- TICKETS (Support system)
-- ============================================

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ticket_type TEXT DEFAULT 'Technical' CHECK (ticket_type IN ('Technical', 'Bug Report', 'Feature Request', 'Billing', 'General')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'viewed', 'in-progress', 'solved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_assigned FOREIGN KEY (assigned_to) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);

-- ============================================
-- TICKET_MESSAGES (Ticket conversation thread)
-- ============================================

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_ticket_message_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON ticket_messages(sender_id);

-- ============================================
-- PLANS (Subscription plans for employers and talents)
-- ============================================

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

-- ============================================
-- SUBSCRIPTIONS (User subscriptions to plans)
-- ============================================

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

-- ============================================
-- PAYMENTS (Payment transactions)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  employer_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  invoice_url TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_payment_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_employer FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_employer_id ON payments(employer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- ============================================
-- EMPLOYER_TEAM_MEMBERS (Multiple users per employer)
-- ============================================

CREATE TABLE IF NOT EXISTS employer_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'recruiter' CHECK (role IN ('admin', 'recruiter', 'hiring-manager', 'viewer')),
  permissions TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_team_member_employer FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_member_invited_by FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_employer_user UNIQUE (employer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_employer_id ON employer_team_members(employer_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON employer_team_members(user_id);

-- ============================================
-- INTERVIEW_REVIEWS (Reviews for interviews)
-- ============================================

CREATE TABLE IF NOT EXISTS interview_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL UNIQUE,
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_interview_review_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interview_reviews_interview_id ON interview_reviews(interview_id);

-- ============================================
-- SAVED_JOBS (Talents bookmark jobs)
-- ============================================

CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL,
  job_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_saved_job_talent FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_job_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT uq_talent_saved_job UNIQUE (talent_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_talent_id ON saved_jobs(talent_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);

-- ============================================
-- NOTIFICATIONS (System notifications)
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('application', 'interview', 'job', 'message', 'system')),
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- ACTIVITY_LOGS (Audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_activity_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_talents_updated_at BEFORE UPDATE ON talents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employers_updated_at BEFORE UPDATE ON employers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviewers_updated_at BEFORE UPDATE ON interviewers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Complete application details with related info
CREATE OR REPLACE VIEW application_details AS
SELECT 
  a.id,
  a.job_id,
  a.talent_id,
  a.employer_id,
  a.status,
  a.stage,
  a.match_score,
  a.applied_at,
  j.title as job_title,
  j.location as job_location,
  j.employment_type,
  t.full_name as talent_name,
  tu.email as talent_email,
  t.phone_number as talent_phone,
  t.city as talent_city,
  t.current_position,
  t.years_of_experience,
  t.skills,
  t.resume_url,
  e.company_name as employer_name,
  e.logo_url as employer_logo
FROM applications a
JOIN jobs j ON a.job_id = j.id
JOIN talents t ON a.talent_id = t.id
JOIN users tu ON t.user_id = tu.id
JOIN employers e ON a.employer_id = e.id;

-- Job listings with employer info
CREATE OR REPLACE VIEW job_listings AS
SELECT 
  j.id,
  j.title,
  j.profession,
  j.description,
  j.location,
  j.workplace,
  j.employment_type,
  j.experience_level,
  j.salary_min,
  j.salary_max,
  j.status,
  j.applicants_count,
  j.views_count,
  j.published_at,
  j.created_at,
  e.company_name,
  e.logo_url,
  e.industry,
  e.company_size
FROM jobs j
JOIN employers e ON j.employer_id = e.id;

-- Interview schedule with all details
CREATE OR REPLACE VIEW interview_schedule AS
SELECT 
  i.id,
  i.interview_type,
  i.status,
  i.scheduled_date,
  i.duration_minutes,
  i.meeting_link,
  i.rating,
  t.full_name as talent_name,
  tu.email as talent_email,
  t.phone_number as talent_phone,
  int.full_name as interviewer_name,
  int.department as interviewer_department,
  e.company_name as employer_name,
  j.title as job_title,
  a.match_score
FROM interviews i
JOIN applications a ON i.application_id = a.id
JOIN talents t ON i.talent_id = t.id
JOIN users tu ON t.user_id = tu.id
LEFT JOIN interviewers int ON i.interviewer_id = int.id
JOIN employers e ON i.employer_id = e.id
JOIN jobs j ON a.job_id = j.id;

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert Users (hashed password is 'password123' - bcrypt hash with 10 rounds)
INSERT INTO users (id, email, password_hash, user_role, is_active, email_verified, profile_completed) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@talentshub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin', TRUE, TRUE, TRUE),
('22222222-2222-2222-2222-222222222222', 'owner@talentshub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner', TRUE, TRUE, TRUE),
('33333333-3333-3333-3333-333333333333', 'employer1@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employer', TRUE, TRUE, TRUE),
('44444444-4444-4444-4444-444444444444', 'employer2@techcorp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employer', TRUE, TRUE, TRUE),
('55555555-5555-5555-5555-555555555555', 'abderraouf.education@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'talent', TRUE, TRUE, TRUE),
('66666666-6666-6666-6666-666666666666', 'sara.bensalem@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'talent', TRUE, TRUE, TRUE),
('77777777-7777-7777-7777-777777777777', 'ahmed.khaled@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'talent', TRUE, TRUE, TRUE),
('88888888-8888-8888-8888-888888888888', 'interviewer1@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'interviewer', TRUE, TRUE, TRUE),
('99999999-9999-9999-9999-999999999999', 'interviewer2@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'interviewer', TRUE, TRUE, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'recruiter@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employer', TRUE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert Admins
INSERT INTO admins (user_id, role_level, permissions) VALUES
('11111111-1111-1111-1111-111111111111', 'superadmin', ARRAY['all']),, 'manage_subscriptions', 'manage_employers'])
ON CONFLICT DO NOTHING;

-- Insert Owners
INSERT INTO owners (user_id, full_name, phone_number, city, country, bio) VALUES
('22222222-2222-2222-2222-222222222222', 'Platform Owner', '+213 555 123 456', 'Algiers', 'Algeria', 'Platform owner and administrator of TalenTek - Empowering the future workforce.'
('22222222-2222-2222-2222-222222222222', 'admin', ARRAY['manage_users', 'manage_jobs', 'view_analytics'])
ON CONFLICT DO NOTHING;

-- Insert Employers
INSERT INTO employers (id, user_id, company_name, tagline, description, industry, website, company_size, city, country, linkedin_url, logo_url) VALUES
('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'TechVision Inc', 'Innovating the Future', 'Leading technology company specializing in AI and cloud solutions', 'Technology', 'https://techvision.com', '50-200', 'Algiers', 'Algeria', 'https://linkedin.com/company/techvision', '/logos/techvision.png'),
('e2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Digital Solutions Corp', 'Your Digital Partner', 'Full-service digital agency providing web and mobile solutions', 'IT Services', 'https://digitalsolutions.com', '10-50', 'Oran', 'Algeria', 'https://linkedin.com/company/digitalsolutions', '/logos/digital.png')
ON CONFLICT (id) DO NOTHING;

-- Insert Talents
INSERT INTO talents (id, user_id, full_name, phone_number, city, current_position, years_of_experience, education_level, short_bio, linkedin_url, github_url, skills, profile_photo_url) VALUES
('a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Abderraouf Abla', '0699097459', 'Algiers', 'Full Stack Developer', '5+ years', 'Bachelor', 'Passionate full-stack developer with expertise in React, Node.js, and modern web technologies', 'https://linkedin.com/in/abderraouf-abla', 'https://github.com/abderraouf', ARRAY['React', 'Node.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'AWS'], '/photos/abderraouf.jpg'),
('a2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Sara Bensalem', '0666112233', 'Algiers', 'Frontend Developer', '3-5 years', 'Master', 'Creative frontend developer specializing in modern UI/UX and React applications', 'https://linkedin.com/in/sara-bensalem', 'https://github.com/sarabensalem', ARRAY['React', 'Vue.js', 'CSS', 'Tailwind', 'Figma'], '/photos/sara.jpg'),
('a3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Ahmed Khaled', '0555998877', 'Oran', 'Backend Developer', '3-5 years', 'Bachelor', 'Backend specialist with strong experience in microservices and API development', 'https://linkedin.com/in/ahmed-khaled', 'https://github.com/ahmedkhaled', ARRAY['Java', 'Spring Boot', 'Python', 'Docker', 'Kubernetes'], '/photos/ahmed.jpg')
ON CONFLICT (id) DO NOTHING;

-- Insert Interviewers
INSERT INTO interviewers (id, user_id, full_name, department, expertise, rating) VALUES
('b1111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'Sarah Johnson', 'Engineering', ARRAY['JavaScript', 'React', 'Node.js', 'System Design'], 4.85),
('b2222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', 'Michael Chen', 'Technical', ARRAY['Java', 'Python', 'Microservices', 'Cloud Architecture'], 4.92)
ON CONFLICT (id) DO NOTHING;

-- Insert Jobs
INSERT INTO jobs (id, employer_id, title, profession, description, location, workplace, employment_type, experience_level, skills_required, salary_min, salary_max, status, applicants_count, views_count, published_at) VALUES
('c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Senior Full Stack Engineer', 'Software Development', 'We are looking for an experienced Full Stack Engineer to join our growing team. You will work on cutting-edge projects using React, Node.js, and cloud technologies.', 'Algiers, Algeria', 'hybrid', 'full-time', '5+ years', ARRAY['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'], 120000, 180000, 'published', 3, 156, NOW() - INTERVAL '5 days'),
('c2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Mobile Android Engineer', 'Mobile Development', 'Join our mobile team to build innovative Android applications. Experience with Kotlin and modern Android development required.', 'Algiers, Algeria', 'on-site', 'full-time', '3-5 years', ARRAY['Android', 'Kotlin', 'Java', 'REST APIs'], 80000, 120000, 'published', 1, 89, NOW() - INTERVAL '3 days'),
('c3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'Frontend Developer', 'Web Development', 'We need a talented frontend developer to create beautiful, responsive web applications. Strong React skills required.', 'Oran, Algeria', 'remote', 'full-time', '2-4 years', ARRAY['React', 'CSS', 'JavaScript', 'Tailwind'], 60000, 90000, 'published', 2, 124, NOW() - INTERVAL '7 days'),
('c4444444-4444-4444-4444-444444444444', 'e2222222-2222-2222-2222-222222222222', 'DevOps Engineer', 'Infrastructure', 'Looking for a DevOps engineer to manage our cloud infrastructure and CI/CD pipelines.', 'Remote', 'remote', 'full-time', '3-5 years', ARRAY['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Terraform'], 100000, 150000, 'published', 0, 67, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Applications
INSERT INTO applications (id, job_id, talent_id, employer_id, status, stage, match_score, cover_letter, applied_at) VALUES
('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'interview-scheduled', 'technical', 92, 'I am very interested in this position and believe my 5+ years of experience with React and Node.js makes me a great fit.', NOW() - INTERVAL '4 days'),
('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'reviewed', 'to-contact', 78, 'Excited to apply my full-stack skills to mobile development.', NOW() - INTERVAL '2 days'),
('d3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'shortlisted', 'talent-acquisition', 85, 'My frontend expertise would be valuable for your full-stack role.', NOW() - INTERVAL '3 days'),
('d4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'offered', 'offer', 95, 'Perfect match for my skills and career goals.', NOW() - INTERVAL '6 days'),
('d5555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'pending', NULL, 72, 'Strong backend developer looking to expand into full-stack.', NOW() - INTERVAL '1 day'),
('d6666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'rejected', NULL, 45, 'Interested in frontend development.', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Interviews
INSERT INTO interviews (id, application_id, interviewer_id, employer_id, talent_id, interview_type, status, scheduled_date, duration_minutes, meeting_link) VALUES
('f1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'technical', 'scheduled', NOW() + INTERVAL '2 days', 60, 'https://meet.google.com/abc-defg-hij'),
('f2222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'talent-acquisition', 'confirmed', NOW() + INTERVAL '1 day', 45, 'https://meet.google.com/xyz-mnop-qrs'),
('f3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'leadership', 'completed', NOW() - INTERVAL '2 days', 60, 'https://meet.google.com/aaa-bbbb-ccc')
ON CONFLICT (id) DO NOTHING;

-- Insert Services (offered by talents)
INSERT INTO services (id, talent_id, title, description, category, starting_price, delivery_time, rating, reviews_count, tags, is_active) VALUES
('e0000001-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 'Full-Stack Web Development', 'Custom web applications using React, Node.js, and modern technologies. From concept to deployment.', 'Development', 150, '7 days', 4.9, 127, ARRAY['React', 'Node.js', 'MongoDB', 'AWS'], TRUE),
('e0000002-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111', 'Mobile App Development', 'Native and cross-platform mobile applications for iOS and Android with modern UI/UX.', 'Development', 200, '14 days', 4.8, 89, ARRAY['React Native', 'Flutter', 'iOS', 'Android'], TRUE),
('e0000003-0000-0000-0000-000000000003', 'a2222222-2222-2222-2222-222222222222', 'UI/UX Design', 'Beautiful and intuitive user interface designs with modern design principles.', 'Design', 100, '5 days', 4.95, 156, ARRAY['Figma', 'Adobe XD', 'UI Design', 'UX Research'], TRUE),
('e0000004-0000-0000-0000-000000000004', 'a3333333-3333-3333-3333-333333333333', 'API Development', 'RESTful and GraphQL API development with best practices and documentation.', 'Development', 120, '10 days', 4.7, 64, ARRAY['REST API', 'GraphQL', 'Microservices', 'Documentation'], TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert Service Reviews
INSERT INTO service_reviews (service_id, reviewer_id, rating, review_text) VALUES
('e0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 5.0, 'Excellent work! Delivered on time and exceeded expectations.'),
('e0000003-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 4.8, 'Great designer with excellent communication skills.')
ON CONFLICT DO NOTHING;

-- Insert Plans
INSERT INTO plans (id, name, display_name, description, target_user_type, price, billing_cycle, is_active, is_featured, sort_order, max_job_posts, max_active_jobs, max_users, features) VALUES
-- Employer Plans
('a1111111-1111-1111-1111-111111111111', 'employer_free', 'Free', 'Perfect for trying out the platform', 'employer', 0, 'monthly', TRUE, FALSE, 1, 3, 1, 1, '{"job_promotion": false, "analytics": "basic", "support": "community", "applicant_tracking": true}'::jsonb),
('a2222222-2222-2222-2222-222222222222', 'employer_starter', 'Starter', 'Great for small businesses and startups', 'employer', 99, 'monthly', TRUE, FALSE, 2, 10, 3, 2, '{"job_promotion": false, "analytics": "standard", "support": "email", "applicant_tracking": true, "interview_scheduling": true}'::jsonb),
('a3333333-3333-3333-3333-333333333333', 'employer_professional', 'Professional', 'Best for growing companies', 'employer', 299, 'monthly', TRUE, TRUE, 3, 50, 10, 5, '{"job_promotion": true, "analytics": "advanced", "support": "priority", "applicant_tracking": true, "interview_scheduling": true, "custom_branding": true, "api_access": true}'::jsonb),
('a4444444-4444-4444-4444-444444444444', 'employer_enterprise', 'Enterprise', 'For large organizations with advanced needs', 'employer', 999, 'monthly', TRUE, FALSE, 4, 999, 50, 20, '{"job_promotion": true, "analytics": "premium", "support": "24/7", "applicant_tracking": true, "interview_scheduling": true, "custom_branding": true, "api_access": true, "dedicated_account_manager": true, "sso": true}'::jsonb),
-- Talent Plans
('a5555555-5555-5555-5555-555555555555', 'talent_free', 'Free', 'Start your freelance journey', 'talent', 0, 'monthly', TRUE, FALSE, 1, NULL, NULL, NULL, '{"service_promotion": false, "analytics": "basic", "support": "community", "profile_visibility": "standard"}'::jsonb, 3, 1),
('a6666666-6666-6666-6666-666666666666', 'talent_pro', 'Pro', 'Grow your freelance business', 'talent', 29, 'monthly', TRUE, TRUE, 2, NULL, NULL, NULL, '{"service_promotion": true, "analytics": "advanced", "support": "priority", "profile_visibility": "featured", "custom_portfolio": true, "priority_support": true}'::jsonb, 15, 5),
('a7777777-7777-7777-7777-777777777777', 'talent_premium', 'Premium', 'For established professionals', 'talent', 79, 'monthly', TRUE, FALSE, 3, NULL, NULL, NULL, '{"service_promotion": true, "analytics": "premium", "support": "24/7", "profile_visibility": "premium", "custom_portfolio": true, "priority_support": true, "verified_badge": true, "unlimited_revisions": true}'::jsonb, 999, 20)
ON CONFLICT (id) DO NOTHING;

-- Insert Subscriptions
INSERT INTO subscriptions (id, plan_id, employer_id, talent_id, status, expires_at, auto_renew) VALUES
('b0000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', NULL, 'active', NOW() + INTERVAL '25 days', TRUE),
('b0000002-0000-0000-0000-000000000002', 'a2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', NULL, 'active', NOW() + INTERVAL '15 days', TRUE),
('b0000003-0000-0000-0000-000000000003', 'a6666666-6666-6666-6666-666666666666', NULL, 'a1111111-1111-1111-1111-111111111111', 'active', NOW() + INTERVAL '20 days', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert Payments
INSERT INTO payments (subscription_id, employer_id, amount, currency, payment_method, transaction_id, status, paid_at) VALUES
('a0000001-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111', 299, 'USD', 'Credit Card', 'txn_2024011501', 'completed', NOW() - INTERVAL '5 days'),
('a0000002-0000-0000-0000-000000000002', 'e2222222-2222-2222-2222-222222222222', 99, 'USD', 'Credit Card', 'txn_2024011502', 'completed', NOW() - INTERVAL '15 days'),
('a0000001-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111', 299, 'USD', 'Credit Card', 'txn_2024012001', 'completed', NOW() - INTERVAL '1 day')
ON CONFLICT (transaction_id) DO NOTHING;

-- Insert Employer Team Members
INSERT INTO employer_team_members (employer_id, user_id, role, permissions, invited_by) VALUES
('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'admin', ARRAY['manage_jobs', 'manage_interviews', 'manage_team', 'view_analytics'], NULL),
('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'recruiter', ARRAY['manage_jobs', 'view_applications'], '33333333-3333-3333-3333-333333333333')
ON CONFLICT (employer_id, user_id) DO NOTHING;

-- Insert Saved Jobs
INSERT INTO saved_jobs (talent_id, job_id) VALUES
('a1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333'),
('a1111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444'),
('a2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111'),
('a3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444')
ON CONFLICT (talent_id, job_id) DO NOTHING;

-- Insert Tickets
INSERT INTO tickets (id, user_id, sender_name, subject, message, ticket_type, status, priority) VALUES
('f0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Abderraouf Abla', 'Login Issue', 'I am unable to log in to my account. Getting an error message.', 'Technical', 'in-progress', 'high'),
('f0000002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'TechVision HR', 'Job Posting Error', 'Error when trying to publish a new job posting.', 'Bug Report', 'solved', 'medium'),
('f0000003-0000-0000-0000-000000000003', '66666666-6666-6666-6666-666666666666', 'Sara Bensalem', 'Feature Request', 'It would be great to have a dark mode option.', 'Feature Request', 'viewed', 'low')
ON CONFLICT (id) DO NOTHING;

-- Insert Notifications
INSERT INTO notifications (user_id, title, message, notification_type, is_read) VALUES
('55555555-5555-5555-5555-555555555555', 'Interview Scheduled', 'Your technical interview for Senior Full Stack Engineer has been scheduled for ' || TO_CHAR(NOW() + INTERVAL '2 days', 'Mon DD, YYYY'), 'interview', FALSE),
('55555555-5555-5555-5555-555555555555', 'Application Viewed', 'Your application for Mobile Android Engineer has been reviewed', 'application', TRUE),
('66666666-6666-6666-6666-666666666666', 'Job Offer', 'Congratulations! You have received an offer for Frontend Developer position', 'job', FALSE),
('33333333-3333-3333-3333-333333333333', 'New Application', 'New application received for Senior Full Stack Engineer', 'application', FALSE)
ON CONFLICT DO NOTHING;

-- Update applicants_count in jobs based on actual applications
UPDATE jobs SET applicants_count = (
  SELECT COUNT(*) FROM applications WHERE applications.job_id = jobs.id
);

-- Update views_count trigger (optional - for demonstration)
UPDATE jobs SET views_count = FLOOR(RANDOM() * 200 + 50) WHERE status = 'published';

-- ============================================
-- DATABASE SCHEMA AND DATA COMPLETE
-- ============================================
