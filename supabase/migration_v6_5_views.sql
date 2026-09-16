-- v6.5 홈페이지 및 게시글 조회수
-- 같은 브라우저 세션에서는 홈페이지 1회, 게시글별 1회만 집계합니다.

create table if not exists public.site_settings (
  id int primary key default 1 check (id=1)
);
alter table public.site_settings
  add column if not exists dashboard_title text not null default '비전제일교회 청소년부',
  add column if not exists dashboard_subtitle text not null default '주님 안에서 함께 웃고, 믿음으로 자라요',
  add column if not exists dashboard_notice text not null default '',
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;
drop policy if exists "site settings readable" on public.site_settings;
drop policy if exists "admin updates site settings" on public.site_settings;
create policy "site settings readable" on public.site_settings for select to authenticated using (true);
create policy "admin updates site settings" on public.site_settings for update to authenticated
using (public.my_role()='admin') with check (public.my_role()='admin');

alter table public.site_settings
  add column if not exists home_view_count bigint not null default 0,
  add column if not exists home_today_view_count bigint not null default 0,
  add column if not exists home_view_date date not null default ((now() at time zone 'Asia/Seoul')::date);

alter table public.posts
  add column if not exists view_count bigint not null default 0;

create table if not exists public.view_events (
  id bigint generated always as identity primary key,
  view_key uuid not null,
  target text not null check (char_length(target) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (view_key,target)
);

alter table public.view_events enable row level security;

create or replace function public.record_home_view(p_view_key uuid)
returns bigint
language plpgsql
security definer
set search_path=public
as $$
declare
  affected_rows integer := 0;
  current_count bigint := 0;
  korea_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  insert into public.view_events (view_key,target)
  values (p_view_key,'home')
  on conflict (view_key,target) do nothing;
  get diagnostics affected_rows = row_count;

  if affected_rows > 0 then
    update public.site_settings
    set home_view_count=home_view_count+1,
        home_today_view_count=case when home_view_date=korea_today then home_today_view_count+1 else 1 end,
        home_view_date=korea_today
    where id=1
    returning home_view_count into current_count;
  else
    select home_view_count into current_count from public.site_settings where id=1;
  end if;

  return coalesce(current_count,0);
end;
$$;

create or replace function public.record_post_view(p_view_key uuid,p_post_id bigint)
returns bigint
language plpgsql
security definer
set search_path=public
as $$
declare
  affected_rows integer := 0;
  current_count bigint := 0;
begin
  if not exists (select 1 from public.posts where id=p_post_id) then
    raise exception '게시글을 찾을 수 없습니다.';
  end if;

  insert into public.view_events (view_key,target)
  values (p_view_key,'post:'||p_post_id::text)
  on conflict (view_key,target) do nothing;
  get diagnostics affected_rows = row_count;

  if affected_rows > 0 then
    update public.posts set view_count=view_count+1 where id=p_post_id returning view_count into current_count;
  else
    select view_count into current_count from public.posts where id=p_post_id;
  end if;

  return coalesce(current_count,0);
end;
$$;

revoke all on function public.record_home_view(uuid) from public;
revoke all on function public.record_post_view(uuid,bigint) from public;
grant execute on function public.record_home_view(uuid) to service_role;
grant execute on function public.record_post_view(uuid,bigint) to service_role;

create index if not exists view_events_created_idx on public.view_events(created_at desc);
create index if not exists view_events_target_idx on public.view_events(target);

notify pgrst, 'reload schema';

select
  to_regclass('public.view_events') as view_events,
  to_regclass('public.site_settings') as site_settings,
  (select home_view_count from public.site_settings where id=1) as home_view_count;
