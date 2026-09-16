-- v6.6 학생 본인 신앙생활 및 성경 장별 체크 권한
-- v6.5 통합 SQL을 이미 실행한 운영 DB에서만 이 파일을 단독 실행하세요.

drop policy if exists "staff inserts faith checks" on public.faith_checks;
drop policy if exists "staff updates faith checks" on public.faith_checks;
drop policy if exists "staff deletes faith checks" on public.faith_checks;
drop policy if exists "staff or owner inserts faith checks" on public.faith_checks;
drop policy if exists "staff or owner updates faith checks" on public.faith_checks;
drop policy if exists "staff or owner deletes faith checks" on public.faith_checks;

create policy "staff or owner inserts faith checks" on public.faith_checks for insert to authenticated
with check (
  checked_by=auth.uid() and
  (public.my_role() in ('admin','teacher') or (public.my_role()='student' and student_id=auth.uid()))
);
create policy "staff or owner updates faith checks" on public.faith_checks for update to authenticated
using (public.my_role() in ('admin','teacher') or student_id=auth.uid())
with check (
  checked_by=auth.uid() and
  (public.my_role() in ('admin','teacher') or (public.my_role()='student' and student_id=auth.uid()))
);
create policy "staff or owner deletes faith checks" on public.faith_checks for delete to authenticated
using (public.my_role() in ('admin','teacher') or student_id=auth.uid());

drop policy if exists "staff inserts bible checks" on public.bible_chapter_checks;
drop policy if exists "staff updates bible checks" on public.bible_chapter_checks;
drop policy if exists "staff deletes bible checks" on public.bible_chapter_checks;
drop policy if exists "staff or owner inserts bible checks" on public.bible_chapter_checks;
drop policy if exists "staff or owner updates bible checks" on public.bible_chapter_checks;
drop policy if exists "staff or owner deletes bible checks" on public.bible_chapter_checks;

create policy "staff or owner inserts bible checks" on public.bible_chapter_checks for insert to authenticated
with check (
  checked_by=auth.uid() and
  (public.my_role() in ('admin','teacher') or (public.my_role()='student' and student_id=auth.uid()))
);
create policy "staff or owner updates bible checks" on public.bible_chapter_checks for update to authenticated
using (public.my_role() in ('admin','teacher') or student_id=auth.uid())
with check (
  checked_by=auth.uid() and
  (public.my_role() in ('admin','teacher') or (public.my_role()='student' and student_id=auth.uid()))
);
create policy "staff or owner deletes bible checks" on public.bible_chapter_checks for delete to authenticated
using (public.my_role() in ('admin','teacher') or student_id=auth.uid());

notify pgrst, 'reload schema';

-- student_write_policies=6이면 학생 본인 기록 입력·수정·삭제 권한이 모두 적용된 상태입니다.
select count(*) as student_write_policies
from pg_policies
where schemaname='public'
  and ((tablename='faith_checks' and policyname in ('staff or owner inserts faith checks','staff or owner updates faith checks','staff or owner deletes faith checks'))
    or (tablename='bible_chapter_checks' and policyname in ('staff or owner inserts bible checks','staff or owner updates bible checks','staff or owner deletes bible checks')));
