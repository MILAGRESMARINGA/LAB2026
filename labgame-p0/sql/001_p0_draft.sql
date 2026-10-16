-- LABGame P0: base de preferências e notificações.
-- Revisar e aplicar apenas no banco LABGAME após backup e testes locais.
-- Não executado em produção.
begin;
create table if not exists public.lab_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  timezone text not null default 'America/Sao_Paulo',
  email_notifications boolean not null default true,
  push_notifications boolean not null default false,
  leaderboard_opt_in boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint display_name_length check (char_length(display_name) <= 80),
  constraint timezone_length check (char_length(timezone) between 1 and 64)
);
alter table public.lab_user_preferences enable row level security;
create policy "p0_prefs_select_own" on public.lab_user_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "p0_prefs_insert_own" on public.lab_user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "p0_prefs_update_own" on public.lab_user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "p0_prefs_delete_own" on public.lab_user_preferences for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.lab_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('system','reading','group','reward')),
  title text not null check (char_length(title) between 1 and 140),
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  expires_at timestamptz
);
create index if not exists lab_notifications_user_created_idx on public.lab_notifications (user_id,created_at desc);
alter table public.lab_notifications enable row level security;
create policy "p0_notifications_select_own" on public.lab_notifications for select to authenticated using ((select auth.uid()) = user_id);
-- Envio de notificações reservado ao backend confiável. Cliente não pode inventar notificações.
-- Apenas leitura e alteração da coluna read_at. Operações de INSERT/DELETE reservadas ao backend.
revoke insert, delete, update on public.lab_notifications from anon, authenticated;
grant select on public.lab_notifications to authenticated;
grant update (read_at) on public.lab_notifications to authenticated;
create policy "p0_notifications_update_own" on public.lab_notifications for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;
-- Antes da aplicação, auditar GRANTs efetivos e políticas concorrentes. Rascunho, não homologado.