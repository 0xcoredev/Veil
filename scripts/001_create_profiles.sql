-- Veil: Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  stellar_address text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  identity_public_key text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view profiles"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
