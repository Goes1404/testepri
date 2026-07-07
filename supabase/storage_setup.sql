-- Roadmap Fase Final 1, item 1: private Storage bucket for uploaded documents.
-- Run in the Supabase SQL editor (or via `supabase db push` if migrations are used).
-- Path convention written by backend/src/services/storage.js: {user_id}/{application_id}/{tipo}-{timestamp}-{filename}

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Only the owning user (first path segment = auth.uid()) may read/write their own files.
create policy "Users can read own documents in storage"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own documents to storage"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own documents in storage"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Note: the backend uses the service role key for uploads/signed URLs (bypasses RLS),
-- so these policies are the safety net for any direct/client-side Storage access.
