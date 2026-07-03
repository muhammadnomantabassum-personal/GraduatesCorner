-- Blog cover image storage setup for Supabase
-- Allows authenticated users to upload common image files for blog posts.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-covers', 'blog-covers', true, 8388608, NULL)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = NULL;

DROP POLICY IF EXISTS "Blog Covers Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload blog covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own blog covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own blog covers" ON storage.objects;

CREATE POLICY "Blog Covers Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-covers');

CREATE POLICY "Users can upload blog covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-covers'
  AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
  AND (metadata->>'mimetype') LIKE 'image/%'
  AND COALESCE((metadata->>'size')::bigint, 0) <= 8388608
);

CREATE POLICY "Users can delete their own blog covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-covers'
  AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own blog covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-covers'
  AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'blog-covers'
  AND (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
  AND (metadata->>'mimetype') LIKE 'image/%'
  AND COALESCE((metadata->>'size')::bigint, 0) <= 8388608
);
