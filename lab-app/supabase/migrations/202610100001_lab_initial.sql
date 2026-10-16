-- LAB isolated schema. Apply ONLY to a newly provisioned LAB Supabase project.
create table if not exists public.reading_completions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 reading_year integer not null check(reading_year between 1 and 9999),
 chapter_id text not null check(chapter_id ~ '^[0-9]{1,2}:[0-9]{1,3}$'),
 completed_at timestamptz not null default now(),
 unique(user_id,reading_year,chapter_id)
);
create index if not exists reading_completions_user_year_idx on public.reading_completions(user_id,reading_year);
alter table public.reading_completions enable row level security;
create policy "Read own progress" on public.reading_completions for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own progress" on public.reading_completions for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Delete own progress" on public.reading_completions for delete to authenticated using ((select auth.uid())=user_id);
create policy "Update own progress" on public.reading_completions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create table if not exists public.reading_groups(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 2 and 100),
 owner_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.reading_group_members(
 group_id uuid not null references public.reading_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'member' check(role in ('member','leader')),
 primary key(group_id,user_id)
);
alter table public.reading_groups enable row level security;
alter table public.reading_group_members enable row level security;
create policy "Owner sees groups" on public.reading_groups for select to authenticated using (owner_id=(select auth.uid()));
create policy "Owner creates groups" on public.reading_groups for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "Members see own memberships" on public.reading_group_members for select to authenticated using(user_id=(select auth.uid()));
-- Group invitation and delegated leader access require reviewed SECURITY DEFINER RPCs before enabling.
