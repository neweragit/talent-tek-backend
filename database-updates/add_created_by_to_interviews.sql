-- Add created_by column to interviews table to track who created each interview
-- This will help identify which employer team member scheduled/created the interview

ALTER TABLE public.interviews 
ADD COLUMN created_by uuid;

-- Add foreign key constraint to reference employer_team_members
ALTER TABLE public.interviews
ADD CONSTRAINT fk_interviews_created_by 
FOREIGN KEY (created_by) REFERENCES public.employer_team_members(id);

-- Add index for better query performance on created_by
CREATE INDEX idx_interviews_created_by ON public.interviews(created_by);

-- Add comment to document the column purpose
COMMENT ON COLUMN public.interviews.created_by IS 'References the employer team member who created/scheduled this interview';