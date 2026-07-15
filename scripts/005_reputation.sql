-- Veil: User reputation tracking
create table if not exists public.user_reputation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  score int not null default 0,
  messages_sent int not null default 0,
  rooms_created int not null default 0,
  days_active int not null default 1,
  last_active timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_reputation enable row level security;

create policy "Anyone can view reputation"
  on public.user_reputation for select
  using (true);

create policy "System can manage reputation"
  on public.user_reputation for all
  using (auth.uid() = user_id);

-- Payment history
create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  amount text not null,
  asset_code text not null default 'XLM',
  memo text,
  transaction_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payment_history enable row level security;

create policy "Users can view their payments"
  on public.payment_history for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert their own payments"
  on public.payment_history for insert
  with check (auth.uid() = sender_id);
