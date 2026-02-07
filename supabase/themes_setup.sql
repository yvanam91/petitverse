-- Create themes table
create table if not exists themes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  config jsonb not null default '{}'::jsonb,
  is_public boolean default false
);

-- RLS Policies
alter table themes enable row level security;

-- Policy: Authenticated users can read their own themes and public themes
create policy "Users can view their own themes"
  on themes for select
  using ( auth.uid() = user_id or is_public = true );

-- Policy: Users can create their own themes
create policy "Users can create their own themes"
  on themes for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own themes
create policy "Users can update their own themes"
  on themes for update
  using ( auth.uid() = user_id );

-- Policy: Users can delete their own themes
create policy "Users can delete their own themes"
  on themes for delete
  using ( auth.uid() = user_id );
