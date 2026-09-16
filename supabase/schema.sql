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


create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  dashboard_title text not null default '비전제일교회 청소년부',
  dashboard_subtitle text not null default '주님 안에서 함께 웃고, 믿음으로 자라요',
  dashboard_notice text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;
create policy "site settings readable" on public.site_settings for select to authenticated using (true);
create policy "admin updates site settings" on public.site_settings for update to authenticated using (public.my_role()='admin') with check (public.my_role()='admin');

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

-- v6.4 신앙생활 체크 및 성경 66권 장별 진도
create table if not exists public.faith_checks (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  check_date date not null default current_date,
  bible_reading boolean not null default false,
  prayer boolean not null default false,
  qt boolean not null default false,
  worship boolean not null default false,
  note text not null default '' check (char_length(note) <= 500),
  checked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, check_date)
);

create table if not exists public.bible_books (
  code text primary key,
  name_ko text not null unique,
  testament text not null check (testament in ('old','new')),
  sort_order smallint not null unique,
  chapter_count smallint not null check (chapter_count > 0)
);

insert into public.bible_books (code,name_ko,testament,sort_order,chapter_count) values
  ('GEN','창세기','old',1,50),('EXO','출애굽기','old',2,40),('LEV','레위기','old',3,27),
  ('NUM','민수기','old',4,36),('DEU','신명기','old',5,34),('JOS','여호수아','old',6,24),
  ('JDG','사사기','old',7,21),('RUT','룻기','old',8,4),('1SA','사무엘상','old',9,31),
  ('2SA','사무엘하','old',10,24),('1KI','열왕기상','old',11,22),('2KI','열왕기하','old',12,25),
  ('1CH','역대상','old',13,29),('2CH','역대하','old',14,36),('EZR','에스라','old',15,10),
  ('NEH','느헤미야','old',16,13),('EST','에스더','old',17,10),('JOB','욥기','old',18,42),
  ('PSA','시편','old',19,150),('PRO','잠언','old',20,31),('ECC','전도서','old',21,12),
  ('SNG','아가','old',22,8),('ISA','이사야','old',23,66),('JER','예레미야','old',24,52),
  ('LAM','예레미야애가','old',25,5),('EZK','에스겔','old',26,48),('DAN','다니엘','old',27,12),
  ('HOS','호세아','old',28,14),('JOL','요엘','old',29,3),('AMO','아모스','old',30,9),
  ('OBA','오바댜','old',31,1),('JON','요나','old',32,4),('MIC','미가','old',33,7),
  ('NAM','나훔','old',34,3),('HAB','하박국','old',35,3),('ZEP','스바냐','old',36,3),
  ('HAG','학개','old',37,2),('ZEC','스가랴','old',38,14),('MAL','말라기','old',39,4),
  ('MAT','마태복음','new',40,28),('MRK','마가복음','new',41,16),('LUK','누가복음','new',42,24),
  ('JHN','요한복음','new',43,21),('ACT','사도행전','new',44,28),('ROM','로마서','new',45,16),
  ('1CO','고린도전서','new',46,16),('2CO','고린도후서','new',47,13),('GAL','갈라디아서','new',48,6),
  ('EPH','에베소서','new',49,6),('PHP','빌립보서','new',50,4),('COL','골로새서','new',51,4),
  ('1TH','데살로니가전서','new',52,5),('2TH','데살로니가후서','new',53,3),('1TI','디모데전서','new',54,6),
  ('2TI','디모데후서','new',55,4),('TIT','디도서','new',56,3),('PHM','빌레몬서','new',57,1),
  ('HEB','히브리서','new',58,13),('JAS','야고보서','new',59,5),('1PE','베드로전서','new',60,5),
  ('2PE','베드로후서','new',61,3),('1JN','요한일서','new',62,5),('2JN','요한이서','new',63,1),
  ('3JN','요한삼서','new',64,1),('JUD','유다서','new',65,1),('REV','요한계시록','new',66,22)
on conflict (code) do update set
  name_ko=excluded.name_ko,testament=excluded.testament,sort_order=excluded.sort_order,chapter_count=excluded.chapter_count;

create table if not exists public.bible_chapter_checks (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  book_code text not null references public.bible_books(code) on delete restrict,
  chapter smallint not null check (chapter > 0),
  read_on date not null default current_date,
  checked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, book_code, chapter)
);

create or replace function public.validate_bible_chapter()
returns trigger language plpgsql security definer set search_path=public
as $$
declare maximum_chapter smallint;
begin
  select chapter_count into maximum_chapter from public.bible_books where code=new.book_code;
  if maximum_chapter is null or new.chapter < 1 or new.chapter > maximum_chapter then
    raise exception '올바르지 않은 성경 장입니다: % %장', new.book_code, new.chapter;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_bible_chapter_trigger on public.bible_chapter_checks;
create trigger validate_bible_chapter_trigger before insert or update of book_code,chapter
on public.bible_chapter_checks for each row execute function public.validate_bible_chapter();

alter table public.faith_checks enable row level security;
alter table public.bible_books enable row level security;
alter table public.bible_chapter_checks enable row level security;

create policy "faith checks readable by staff or owner" on public.faith_checks for select to authenticated
using (public.my_role() in ('admin','teacher') or student_id=auth.uid());
create policy "staff inserts faith checks" on public.faith_checks for insert to authenticated
with check (public.my_role() in ('admin','teacher') and checked_by=auth.uid());
create policy "staff updates faith checks" on public.faith_checks for update to authenticated
using (public.my_role() in ('admin','teacher')) with check (public.my_role() in ('admin','teacher') and checked_by=auth.uid());
create policy "staff deletes faith checks" on public.faith_checks for delete to authenticated
using (public.my_role() in ('admin','teacher'));

create policy "bible books readable" on public.bible_books for select to authenticated using (true);
create policy "bible checks readable by staff or owner" on public.bible_chapter_checks for select to authenticated
using (public.my_role() in ('admin','teacher') or student_id=auth.uid());
create policy "staff inserts bible checks" on public.bible_chapter_checks for insert to authenticated
with check (public.my_role() in ('admin','teacher') and checked_by=auth.uid());
create policy "staff updates bible checks" on public.bible_chapter_checks for update to authenticated
using (public.my_role() in ('admin','teacher')) with check (public.my_role() in ('admin','teacher') and checked_by=auth.uid());
create policy "staff deletes bible checks" on public.bible_chapter_checks for delete to authenticated
using (public.my_role() in ('admin','teacher'));

create index if not exists faith_checks_student_date_idx on public.faith_checks(student_id,check_date desc);
create index if not exists bible_checks_student_book_idx on public.bible_chapter_checks(student_id,book_code,chapter);
create index if not exists bible_checks_read_on_idx on public.bible_chapter_checks(read_on desc);
