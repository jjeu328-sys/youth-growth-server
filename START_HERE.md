# v6.5 설치 순서

## 1. Supabase SQL 먼저 실행

압축파일 맨 바깥의 `1_RUN_IN_SUPABASE.sql`을 열어 전체 내용을 복사합니다.

Supabase의 `SQL Editor → New query`에 붙여넣고 `Run`을 누릅니다.

실행 결과에 아래 내용이 보이면 정상입니다.

- `faith_checks`
- `bible_chapter_checks`
- `bible_books_count`: `66`
- `view_events`

## 2. GitHub 파일 교체

SQL 실행이 끝난 다음 나머지 프로젝트 파일을 기존 GitHub 저장소에 덮어쓰고 Commit합니다.

Vercel이 자동 재배포하면 웹앱에서 로그아웃 후 다시 로그인합니다.

## 오류가 계속되는 경우

Vercel의 `NEXT_PUBLIC_SUPABASE_URL`이 SQL을 실행한 Supabase 프로젝트의 URL과 같은지 확인하세요.
