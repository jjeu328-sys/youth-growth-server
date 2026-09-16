-- v6.4 신앙생활 체크 및 성경 66권 장별 진도
-- 기존 운영 DB의 Supabase SQL Editor에서 한 번 실행하세요.

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
  name_ko=excluded.name_ko,
  testament=excluded.testament,
  sort_order=excluded.sort_order,
  chapter_count=excluded.chapter_count;

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
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  maximum_chapter smallint;
begin
  select chapter_count into maximum_chapter from public.bible_books where code=new.book_code;
  if maximum_chapter is null or new.chapter < 1 or new.chapter > maximum_chapter then
    raise exception '올바르지 않은 성경 장입니다: % %장', new.book_code, new.chapter;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_bible_chapter_trigger on public.bible_chapter_checks;
create trigger validate_bible_chapter_trigger
before insert or update of book_code,chapter on public.bible_chapter_checks
for each row execute function public.validate_bible_chapter();

alter table public.faith_checks enable row level security;
alter table public.bible_books enable row level security;
alter table public.bible_chapter_checks enable row level security;

drop policy if exists "faith checks readable by staff or owner" on public.faith_checks;
create policy "faith checks readable by staff or owner" on public.faith_checks for select to authenticated
using (public.my_role() in ('admin','teacher') or student_id=auth.uid());

drop policy if exists "staff inserts faith checks" on public.faith_checks;
create policy "staff inserts faith checks" on public.faith_checks for insert to authenticated
with check (public.my_role() in ('admin','teacher') and checked_by=auth.uid());

drop policy if exists "staff updates faith checks" on public.faith_checks;
create policy "staff updates faith checks" on public.faith_checks for update to authenticated
using (public.my_role() in ('admin','teacher'))
with check (public.my_role() in ('admin','teacher') and checked_by=auth.uid());

drop policy if exists "staff deletes faith checks" on public.faith_checks;
create policy "staff deletes faith checks" on public.faith_checks for delete to authenticated
using (public.my_role() in ('admin','teacher'));

drop policy if exists "bible books readable" on public.bible_books;
create policy "bible books readable" on public.bible_books for select to authenticated using (true);

drop policy if exists "bible checks readable by staff or owner" on public.bible_chapter_checks;
create policy "bible checks readable by staff or owner" on public.bible_chapter_checks for select to authenticated
using (public.my_role() in ('admin','teacher') or student_id=auth.uid());

drop policy if exists "staff inserts bible checks" on public.bible_chapter_checks;
create policy "staff inserts bible checks" on public.bible_chapter_checks for insert to authenticated
with check (public.my_role() in ('admin','teacher') and checked_by=auth.uid());

drop policy if exists "staff updates bible checks" on public.bible_chapter_checks;
create policy "staff updates bible checks" on public.bible_chapter_checks for update to authenticated
using (public.my_role() in ('admin','teacher'))
with check (public.my_role() in ('admin','teacher') and checked_by=auth.uid());

drop policy if exists "staff deletes bible checks" on public.bible_chapter_checks;
create policy "staff deletes bible checks" on public.bible_chapter_checks for delete to authenticated
using (public.my_role() in ('admin','teacher'));

create index if not exists faith_checks_student_date_idx on public.faith_checks(student_id,check_date desc);
create index if not exists bible_checks_student_book_idx on public.bible_chapter_checks(student_id,book_code,chapter);
create index if not exists bible_checks_read_on_idx on public.bible_chapter_checks(read_on desc);
