-- Add team_member_id column to interviews table to support employer team members conducting interviews
-- This allows talent acquisition interviews to be assigned to employer team members directly

-- Add the new column
ALTER TABLE public.interviews 
ADD COLUMN team_member_id uuid REFERENCES public.employer_team_members(id);

-- Add a check constraint to ensure either interviewer_id OR team_member_id is set, but not both
ALTER TABLE public.interviews 
ADD CONSTRAINT check_single_interviewer 
CHECK (
  (interviewer_id IS NOT NULL AND team_member_id IS NULL) OR
  (interviewer_id IS NULL AND team_member_id IS NOT NULL)
);

-- Add an index for performance
CREATE INDEX idx_interviews_team_member_id ON public.interviews(team_member_id);

-- Add comment for documentation
COMMENT ON COLUMN public.interviews.team_member_id IS 'Reference to employer team member conducting the interview (for talent acquisition interviews)';
COMMENT ON CONSTRAINT check_single_interviewer ON public.interviews IS 'Ensures either an interviewer or team member is assigned, but not both';