-- Migration: Add company logo storage columns
-- Description: Adds logo_url and logo_path columns to companies table
-- Date: 2026-03-21

BEGIN;

-- Add logo columns to companies table if they don't exist
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_path TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on logo columns for faster queries
CREATE INDEX IF NOT EXISTS idx_companies_logo_url ON public.companies(logo_url);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF NOT EXISTS companies_update_timestamp ON public.companies;

CREATE TRIGGER companies_update_timestamp
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION update_companies_timestamp();

-- Add comment for documentation
COMMENT ON COLUMN public.companies.logo_url IS 'Public URL to company logo stored in companys_logo bucket';
COMMENT ON COLUMN public.companies.logo_path IS 'Internal path to company logo in companys_logo bucket';

COMMIT;
