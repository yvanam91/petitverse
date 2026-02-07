-- Create a new private bucket for Hero Assets if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hero_assets', 
  'hero_assets', 
  true, 
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Policy: Allow public read access to everyone
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'hero_assets' );

-- Policy: Allow authenticated users to upload their own files
-- We enforce that the file path starts with their user ID for organization and security
create policy "Authenticated User Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'hero_assets' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow users to update their own files
create policy "Authenticated User Update"
  on storage.objects for update
  using (
    bucket_id = 'hero_assets' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow users to delete their own files
create policy "Authenticated User Delete"
  on storage.objects for delete
  using (
    bucket_id = 'hero_assets' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
