-- Add storage policies to allow public listing and reading from hero image buckets
-- These are needed for the hero slider to fetch and display images

-- Hero_image_1 bucket policies
CREATE POLICY "Allow public read access on Hero_image_1"
ON storage.objects FOR SELECT
USING (bucket_id = 'Hero_image_1');

-- Hero_image_2 bucket policies
CREATE POLICY "Allow public read access on Hero_image_2"
ON storage.objects FOR SELECT
USING (bucket_id = 'Hero_image_2');

-- Hero_image_3 bucket policies
CREATE POLICY "Allow public read access on Hero_image_3"
ON storage.objects FOR SELECT
USING (bucket_id = 'Hero_image_3');

-- Allow admins to upload to hero image buckets
CREATE POLICY "Allow admin upload to Hero_image_1"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Hero_image_1' AND public.is_admin());

CREATE POLICY "Allow admin upload to Hero_image_2"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Hero_image_2' AND public.is_admin());

CREATE POLICY "Allow admin upload to Hero_image_3"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Hero_image_3' AND public.is_admin());

-- Allow admins to delete from hero image buckets
CREATE POLICY "Allow admin delete from Hero_image_1"
ON storage.objects FOR DELETE
USING (bucket_id = 'Hero_image_1' AND public.is_admin());

CREATE POLICY "Allow admin delete from Hero_image_2"
ON storage.objects FOR DELETE
USING (bucket_id = 'Hero_image_2' AND public.is_admin());

CREATE POLICY "Allow admin delete from Hero_image_3"
ON storage.objects FOR DELETE
USING (bucket_id = 'Hero_image_3' AND public.is_admin());