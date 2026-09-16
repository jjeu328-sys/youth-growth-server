-- v6.6.3 학생 친구 비교
-- 학생에게는 선택한 하루의 성경읽기·기도·큐티·예배 참석 여부만 공개합니다.
-- 개인 메모, 기록자, 성경 66권 장별 진도는 반환하지 않습니다.

create or replace function public.get_daily_faith_comparison(p_check_date date)
returns table (
  student_id uuid,
  check_date date,
  bible_reading boolean,
  prayer boolean,
  qt boolean,
  worship boolean
)
language sql
stable
security definer
set search_path=pg_catalog,public
as $$
  select fc.student_id,fc.check_date,fc.bible_reading,fc.prayer,fc.qt,fc.worship
  from public.faith_checks fc
  join public.students s on s.id=fc.student_id
  where fc.check_date=p_check_date
    and s.active=true
    and auth.uid() is not null
    and exists (select 1 from public.profiles p where p.id=auth.uid())
  order by fc.student_id;
$$;

revoke all on function public.get_daily_faith_comparison(date) from public;
grant execute on function public.get_daily_faith_comparison(date) to authenticated;

notify pgrst, 'reload schema';

select to_regprocedure('public.get_daily_faith_comparison(date)') as daily_comparison_function;
