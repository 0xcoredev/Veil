-- Veil: Room membership and removal voting
create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  removed_at timestamp with time zone,
  unique(room_id, user_id)
);

create index if not exists room_members_room_id_idx on public.room_members(room_id);

alter table public.room_members enable row level security;

create policy "Room members can view membership"
  on public.room_members for select
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_members.room_id
        and rm.user_id = auth.uid()
        and rm.removed_at is null
    )
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.is_private = false
    )
  );

create policy "Authenticated users can join rooms"
  on public.room_members for insert
  with check (auth.uid() = user_id);

-- Removal votes
create table if not exists public.room_removal_votes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, target_user_id, voter_user_id),
  check (target_user_id != voter_user_id)
);

alter table public.room_removal_votes enable row level security;

create policy "Room members can view votes"
  on public.room_removal_votes for select
  using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = room_removal_votes.room_id
        and rm.user_id = auth.uid()
        and rm.removed_at is null
    )
  );

create policy "Room members can cast votes"
  on public.room_removal_votes for insert
  with check (
    auth.uid() = voter_user_id
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = room_removal_votes.room_id
        and rm.user_id = auth.uid()
        and rm.removed_at is null
    )
  );

-- Threshold check function
create or replace function public.check_removal_threshold(p_room_id text, p_target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vote_count int;
  v_member_count int;
  v_majority int;
begin
  select count(*) into v_vote_count
  from public.room_removal_votes
  where room_id = p_room_id and target_user_id = p_target_user_id;

  select count(*) into v_member_count
  from public.room_members
  where room_id = p_room_id and removed_at is null;

  v_majority := (v_member_count / 2) + 1;
  if v_vote_count >= v_majority then
    update public.room_members
    set removed_at = timezone('utc'::text, now())
    where room_id = p_room_id and user_id = p_target_user_id and removed_at is null;
    return true;
  end if;
  return false;
end;
$$;

grant execute on function public.check_removal_threshold(text, uuid) to authenticated;
