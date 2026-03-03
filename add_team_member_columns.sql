-- Add first_name, last_name, and phone columns to employer_team_members table
-- Run this in your Supabase SQL Editor

ALTER TABLE employer_team_members 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone text;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employer_team_members'
ORDER BY ordinal_position;
