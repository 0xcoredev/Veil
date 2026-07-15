-- Veil: Token gate configuration for rooms
create table if not exists public.token_gate_config (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade unique,
  token_asset_code text not null,
  token_asset_issuer text,
  min_balance numeric not null default 1,
  is_native boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.token_gate_config enable row level security;

create policy "Anyone can view token gate config"
  on public.token_gate_config for select
  using (true);

create policy "Room creators can manage token gates"
  on public.token_gate_config for insert
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_id and r.created_by = auth.uid()
    )
  );

create policy "Room creators can update token gates"
  on public.token_gate_config for update
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id and r.created_by = auth.uid()
    )
  );

-- Encryption key distribution
create table if not exists public.encrypted_room_keys (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_key text not null,
  ephemeral_public_key text not null,
  iv text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

alter table public.encrypted_room_keys enable row level security;

create policy "Users can view their own encrypted keys"
  on public.encrypted_room_keys for select
  using (auth.uid() = user_id);

create policy "System can insert encrypted keys"
  on public.encrypted_room_keys for insert
  with check (auth.uid() = user_id);
