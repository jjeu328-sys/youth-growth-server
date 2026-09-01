# 청소년부 신앙 성장 서버형 웹앱 v2

이번 버전 추가 기능:
- 관리자 대시보드 편집: 제목 / 부제목 / 전체 공지 수정
- 관리자 학생 직접 등록: 이름 / 학년 / 반 / 아이디 / 초기 비밀번호
- 왼쪽 메뉴 접기 / 펼치기
- 휴대폰 / 태블릿 / PC / 큰 모니터에 맞춘 반응형 글자 크기와 레이아웃
- 기존 회원가입 / 선생님 / 점수 / 메달 / 게시판 / 사진·영상 / 전체 비교 유지

## 이미 Supabase와 Vercel을 사용 중인 경우

### 1. Supabase에 DB 업데이트
Supabase → SQL Editor → `supabase/migration_v2.sql` 내용을 전부 붙여넣고 Run.

`Success. No rows returned`가 나오면 정상입니다.

### 2. GitHub 파일 업데이트
이 ZIP의 프로젝트 파일을 기존 GitHub `youth-growth-server` 저장소에 덮어씁니다.
`.env.local`은 절대 GitHub에 올리지 마세요.

특히 새 파일:
- `app/api/admin/student/route.ts`
- `supabase/migration_v2.sql`

수정 파일:
- `app/page.tsx`
- `app/globals.css`
- `package.json`
- `supabase/schema.sql`

GitHub에서 Commit changes 하면 Vercel이 자동으로 새 배포합니다.

## 중요
`package.json`의 TypeScript는 `5.9.3`으로 고정했습니다. 이전 Vercel 빌드에서 TypeScript 7 계열로 인한 오류를 피하기 위한 설정입니다.

## 권한
- 관리자: 대시보드 편집, 학생 직접 등록/수정, 선생님 계정 생성, 점수, 메달, 게시판, 순위, 설정
- 선생님: 점수, 메달, 게시판, 순위
- 학생: 나의 성장, 메달, 게시판, 순위


## v3 추가 기능
- 관리자와 교사 모두 `학생 관리` 메뉴 진입 가능
- 학생 관리 화면을 `학생 목록 / 교사 목록` 탭으로 분리
- 교사 계정은 학생/교사 목록 조회만 가능
- 관리자는 학생 등록/수정, 교사 추가/수정/삭제 가능
- 교사 계정 수정/삭제 API 추가
- v2 마이그레이션을 이미 실행했다면 v3는 추가 SQL 불필요
