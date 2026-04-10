-- Create offers bucket + 4 CRUD policies (Supabase style names).
-- Run this in Supabase SQL editor once.

INSERT INTO storage.buckets (id, name, public)
VALUES ('offers', 'offers', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "insert 1i5ycnr_0" ON storage.objects;
DROP POLICY IF EXISTS "insert 1i5ycnr_1" ON storage.objects;
DROP POLICY IF EXISTS "insert 1i5ycnr_2" ON storage.objects;
DROP POLICY IF EXISTS "insert 1i5ycnr_3" ON storage.objects;

-- SELECT
CREATE POLICY "insert 1i5ycnr_0"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'offers');

-- INSERT
CREATE POLICY "insert 1i5ycnr_1"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'offers');

-- UPDATE
CREATE POLICY "insert 1i5ycnr_2"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'offers')
WITH CHECK (bucket_id = 'offers');

-- DELETE
CREATE POLICY "insert 1i5ycnr_3"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'offers');
