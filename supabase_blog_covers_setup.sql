-- SQL Commands to set up Blog Cover Photo Storage in Supabase

-- 1. Create the 'blog-covers' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-covers', 'blog-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow public to read blog covers
CREATE POLICY "Blog Covers Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'blog-covers' );

-- 3. Policy: Allow authenticated users to upload blog covers
CREATE POLICY "Users can upload blog covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-covers' AND
  (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

-- 4. Policy: Allow users to delete their own blog covers
CREATE POLICY "Users can delete their own blog covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-covers' AND
  (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

-- 5. Policy: Allow users to update their own blog covers
CREATE POLICY "Users can update their own blog covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-covers' AND
  (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);
