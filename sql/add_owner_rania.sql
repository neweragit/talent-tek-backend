-- Add or update owner account: Rania
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH upsert_user AS (
  INSERT INTO public.users (
    email,
    password_hash,
    user_role,
    is_active,
    email_verified,
    profile_completed
  )
  VALUES (
    'rania.owner@talentek.com',
    crypt('Rania@123', gen_salt('bf', 10)),
    'owner',
    true,
    true,
    true
  )
  ON CONFLICT (email) DO UPDATE
  SET
    password_hash = crypt('Rania@123', gen_salt('bf', 10)),
    user_role = 'owner',
    is_active = true,
    email_verified = true,
    profile_completed = true,
    updated_at = now()
  RETURNING id
),
owner_user AS (
  SELECT id FROM upsert_user
  UNION
  SELECT id FROM public.users WHERE email = 'rania.owner@talentek.com'
)
INSERT INTO public.owners (
  user_id,
  full_name,
  phone_number,
  city,
  country,
  bio,
  profile_photo_url
)
SELECT
  id,
  'Rania',
  '+213555123456',
  'Algiers',
  'Algeria',
  'Platform owner account for support routing.',
  null
FROM owner_user
ON CONFLICT (user_id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  phone_number = EXCLUDED.phone_number,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  bio = EXCLUDED.bio,
  profile_photo_url = EXCLUDED.profile_photo_url,
  updated_at = now();

-- Login credentials for this owner:
-- Email: rania.owner@talentek.com
-- Password: Rania@123
