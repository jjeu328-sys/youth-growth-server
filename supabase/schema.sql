-- 청소년부 신앙 성장 서버 DB
create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin','teacher','student');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  internal_email text not null unique,
  full_name text not null,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key references public.profiles(id) on delete cascade,
  grade text not null default '',
  class_name text not null default '',
  active boolean not null default true,
  service boolean not null default false,
  nt_read boolean not null default false,
  discipleship boolean not null default false,
  ot_read boolean not null default false,
  evangelism boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  giver_id uuid not null references public.profiles(id) on delete restrict,
  points int not null check (points in (1,2,4,8)),
  icon text not null check (icon in ('○','●','☆','★')),
  reason text not null check (char_length(reason) between 1 and 500),
  category text not null default '자유점수',
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.post_media (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  path text not null unique,
  media_type text not null,
  created_at timestamptz not null default now()
);

create or replace function public.my_role()
returns public.app_role language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.activities enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_media enable row level security;

-- 로그인한 공동체 구성원은 이름/역할/학생 기본 현황을 볼 수 있음
create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "students readable by authenticated" on public.students for select to authenticated using (true);

-- 관리자만 학생/프로필 정보 수정
create policy "admin updates profiles" on public.profiles for update to authenticated using (public.my_role()='admin') with check (public.my_role()='admin');
create policy "admin updates students" on public.students for update to authenticated using (public.my_role()='admin') with check (public.my_role()='admin');

-- 점수: 모두 읽기, 관리자/선생님만 입력
create policy "activities readable" on public.activities for select to authenticated using (true);
create policy "staff inserts activities" on public.activities for insert to authenticated
with check (public.my_role() in ('admin','teacher') and giver_id=auth.uid());
create policy "admin deletes activities" on public.activities for delete to authenticated using (public.my_role()='admin');

-- 게시판: 인증 사용자는 읽기/쓰기, 본인 또는 관리자는 삭제
create policy "posts readable" on public.posts for select to authenticated using (true);
create policy "posts insert own" on public.posts for insert to authenticated with check (author_id=auth.uid());
create policy "posts delete own or admin" on public.posts for delete to authenticated using (author_id=auth.uid() or public.my_role()='admin');

create policy "comments readable" on public.comments for select to authenticated using (true);
create policy "comments insert own" on public.comments for insert to authenticated with check (author_id=auth.uid());
create policy "comments delete own or admin" on public.comments for delete to authenticated using (author_id=auth.uid() or public.my_role()='admin');

create policy "media readable" on public.post_media for select to authenticated using (true);
create policy "media insert own" on public.post_media for insert to authenticated with check (uploader_id=auth.uid());
create policy "media delete own or admin" on public.post_media for delete to authenticated using (uploader_id=auth.uid() or public.my_role()='admin');

-- Storage bucket: 게시판에서 바로 표시하기 위해 public. 운영 정책에 따라 private+signed URL로 변경 가능.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('board-media','board-media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "authenticated upload board media" on storage.objects for insert to authenticated
with check (bucket_id='board-media' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "owner or admin delete board media" on storage.objects for delete to authenticated
using (bucket_id='board-media' and ((storage.foldername(name))[1]=auth.uid()::text or public.my_role()='admin'));

create index if not exists activities_student_idx on public.activities(student_id,created_at desc);
create index if not exists comments_post_idx on public.comments(post_id,created_at);
create index if not exists posts_created_idx on public.posts(created_at desc);
