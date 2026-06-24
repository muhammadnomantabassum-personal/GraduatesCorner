-- SQL Commands to set up Profile Photo Storage in Supabase

-- 1. Create the 'avatars' bucket
-- Note: Run this in the Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow public to read avatars
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Policy: Allow users to upload their own avatars
-- Path is user_id/timestamp.ext, so we check if the first part of the name is the user's ID
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (regexp_split_to_array(name, '/'))[1] = auth.uid()::text AND
  (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') AND
  (metadata->>'size')::bigint <= 2097152
);

-- 4. Policy: Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);

-- 5. Policy: Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (regexp_split_to_array(name, '/'))[1] = auth.uid()::text
);
