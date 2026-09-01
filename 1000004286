-- v2 기능 추가용 SQL
-- 이미 기존 schema.sql을 실행한 프로젝트에서 이 파일만 추가로 실행하세요.

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  dashboard_title text not null default '청소년부 신앙 성장',
  dashboard_subtitle text not null default '점수보다 성장, 경쟁보다 격려',
  dashboard_notice text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site settings readable" on public.site_settings;
create policy "site settings readable" on public.site_settings
for select to authenticated using (true);

drop policy if exists "admin updates site settings" on public.site_settings;
create policy "admin updates site settings" on public.site_settings
for update to authenticated
using (public.my_role()='admin')
with check (public.my_role()='admin');
