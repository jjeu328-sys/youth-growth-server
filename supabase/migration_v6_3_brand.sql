-- v6.3 청소년부 기본 문구 업데이트
-- 관리자가 이미 대시보드 문구를 직접 바꾼 경우에는 덮어쓰지 않습니다.

update public.site_settings
set
  dashboard_title = '비전제일교회 청소년부',
  dashboard_subtitle = '주님 안에서 함께 웃고, 믿음으로 자라요',
  updated_at = now()
where id = 1
  and dashboard_title = '청소년부 신앙 성장'
  and dashboard_subtitle = '점수보다 성장, 경쟁보다 격려';
