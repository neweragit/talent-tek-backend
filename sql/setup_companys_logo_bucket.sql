-- Create companys_logo bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('companys_logo', 'companys_logo', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can read company logos
CREATE POLICY "Authenticated users can read company logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'companys_logo'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can upload company logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'companys_logo'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update company logos
CREATE POLICY "Authenticated users can update company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'companys_logo'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'companys_logo'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can delete company logos
CREATE POLICY "Authenticated users can delete company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'companys_logo'
  AND auth.role() = 'authenticated'
);
