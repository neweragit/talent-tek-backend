BEGIN;

-- 1) Replace the role check constraint to use recruiter instead of employer.
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_user_role_check;

-- 2) Normalize existing data after dropping the old constraint.
UPDATE public.users
SET user_role = 'recruiter'
WHERE user_role = 'employer';

ALTER TABLE public.users
ADD CONSTRAINT users_user_role_check
CHECK (
  user_role = ANY (
    ARRAY[
      'superadmin'::text,
      'admin'::text,
      'owner'::text,
      'talent'::text,
      'recruiter'::text,
      'interviewer'::text
    ]
  )
);

COMMIT;
