-- ============================================
-- DATABASE MIGRATION: Optimize Interview Tables
-- ============================================

-- ============================================
-- 1. UPDATE INTERVIEWERS TABLE
-- ============================================

-- Add new required columns
ALTER TABLE interviewers 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS interview_type TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Drop columns we don't need
ALTER TABLE interviewers 
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS availability,
DROP COLUMN IF EXISTS rating;

-- Add constraints
ALTER TABLE interviewers 
ADD CONSTRAINT interviewers_email_unique UNIQUE (email);

ALTER TABLE interviewers 
ADD CONSTRAINT interviewers_interview_type_check 
CHECK (interview_type IN ('technical', 'leadership', 'talent-acquisition'));

ALTER TABLE interviewers 
ADD CONSTRAINT interviewers_status_check 
CHECK (status IN ('active', 'inactive'));

-- Make columns NOT NULL (update existing rows first if needed)
-- UPDATE interviewers SET email = 'placeholder@example.com' WHERE email IS NULL;
-- UPDATE interviewers SET interview_type = 'technical' WHERE interview_type IS NULL;
-- UPDATE interviewers SET role = 'Interviewer' WHERE role IS NULL;

ALTER TABLE interviewers 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN interview_type SET NOT NULL,
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN status SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interviewers_email ON interviewers(email);
CREATE INDEX IF NOT EXISTS idx_interviewers_status ON interviewers(status);

-- ============================================
-- 2. UPDATE INTERVIEWS TABLE
-- ============================================

-- Drop foreign key constraints first
ALTER TABLE interviews 
DROP CONSTRAINT IF EXISTS fk_interview_employer,
DROP CONSTRAINT IF EXISTS fk_interview_talent;

-- Drop columns we don't need
ALTER TABLE interviews 
DROP COLUMN IF EXISTS employer_id,
DROP COLUMN IF EXISTS talent_id,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS feedback,
DROP COLUMN IF EXISTS rating,
DROP COLUMN IF EXISTS completed_at;

-- Rename column
ALTER TABLE interviews 
RENAME COLUMN meeting_link TO meet_link;

-- Update interview_type constraint (remove 'final')
ALTER TABLE interviews 
DROP CONSTRAINT IF EXISTS interviews_interview_type_check;

ALTER TABLE interviews 
ADD CONSTRAINT interviews_interview_type_check 
CHECK (interview_type IN ('technical', 'leadership', 'talent-acquisition'));

-- Make interview_type NOT NULL
ALTER TABLE interviews 
ALTER COLUMN interview_type SET NOT NULL;

-- Drop old indexes
DROP INDEX IF EXISTS idx_interviews_employer_id;
DROP INDEX IF EXISTS idx_interviews_talent_id;

-- ============================================
-- 3. RECREATE INTERVIEW_REVIEWS TABLE
-- ============================================

-- Drop old table and its indexes
DROP TABLE IF EXISTS interviewer_reviews CASCADE;
DROP INDEX IF EXISTS idx_interviewer_reviews_interviewer_id;
DROP INDEX IF EXISTS idx_interviewer_reviews_interview_id;

-- Create new simplified table
CREATE TABLE IF NOT EXISTS interview_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL UNIQUE,
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_interview_review_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_interview_reviews_interview_id ON interview_reviews(interview_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check interviewers table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'interviewers'
ORDER BY ordinal_position;

-- Check interviews table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'interviews'
ORDER BY ordinal_position;

-- Check interview_reviews table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'interview_reviews'
ORDER BY ordinal_position;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================

/*
-- Rollback interviewers changes
ALTER TABLE interviewers 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS interview_type,
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS status;

ALTER TABLE interviewers 
ADD COLUMN department TEXT,
ADD COLUMN availability JSONB,
ADD COLUMN rating NUMERIC(3,2);

-- Rollback interviews changes
ALTER TABLE interviews 
ADD COLUMN employer_id UUID,
ADD COLUMN talent_id UUID,
ADD COLUMN location TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN feedback TEXT,
ADD COLUMN rating NUMERIC(3,2),
ADD COLUMN completed_at TIMESTAMPTZ;

ALTER TABLE interviews 
RENAME COLUMN meet_link TO meeting_link;

-- Restore interview_reviews to interviewer_reviews
DROP TABLE IF EXISTS interview_reviews CASCADE;

CREATE TABLE interviewer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewer_id UUID NOT NULL,
  interview_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  professionalism_rating NUMERIC(3,2),
  communication_rating NUMERIC(3,2),
  technical_rating NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_interviewer_review_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE,
  CONSTRAINT fk_interviewer_review_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_interviewer_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_interview_review UNIQUE (interview_id, reviewer_id)
);
*/
