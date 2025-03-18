-- Create company-assets bucket if it doesn't exist
insert into storage.buckets (id, name)
values ('company-assets', 'company-assets')
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Create policies
create policy "Authenticated users can upload company assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] in ('organizations')
);

create policy "Authenticated users can view company assets"
on storage.objects for select
to authenticated
using (bucket_id = 'company-assets');

create policy "Organization owners can update their assets"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = 'organizations' AND
  exists (
    select 1 from organization_members
    where organization_members.user_id = auth.uid()
    and organization_members.role = 'OWNER'
  )
);

create policy "Organization owners can delete their assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = 'organizations' AND
  exists (
    select 1 from organization_members
    where organization_members.user_id = auth.uid()
    and organization_members.role = 'OWNER'
  )
); 