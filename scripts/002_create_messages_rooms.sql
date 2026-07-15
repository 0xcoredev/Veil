-- Veil: Rooms and Messages tables
create table if not exists public.rooms (
  id text primary key,
  name text not null,
  description text,
  is_private boolean default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  contract_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.rooms enable row level security;

create policy "Anyone can view public rooms"
  on public.rooms for select
  using (is_private = false or created_by = auth.uid());

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  with check (auth.uid() = created_by);

create policy "Room creators can update their rooms"
  on public.rooms for update
  using (auth.uid() = created_by);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_encrypted boolean default false,
  transaction_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Room members can view messages"
  on public.messages for select
  using (true);

create policy "Authenticated users can insert messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public.messages for delete
  using (auth.uid() = user_id);

create index if not exists messages_room_id_idx on public.messages(room_id);
create index if not exists messages_created_at_idx on public.messages(created_at);
