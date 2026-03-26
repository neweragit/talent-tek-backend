-- Create cvs bucket + required storage policies
-- Policies are named to match the requested identifiers.

-- Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Select cvs objects
CREATE POLICY "cvs_policy_24bk_0"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cvs'
  AND auth.role() = 'authenticated'
);

-- Policy: Insert cvs objects
CREATE POLICY "cvs_policy_24bk_1"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cvs'
  AND auth.role() = 'authenticated'
);

-- Policy: Update cvs objects
CREATE POLICY "cvs_policy_24bk_2"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cvs'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'cvs'
  AND auth.role() = 'authenticated'
);

-- Policy: Delete cvs objects
CREATE POLICY "cvs_policy_24bk_3"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cvs'
  AND auth.role() = 'authenticated'
);

