# 청소년부 신앙 성장 — 서버형 웹앱

v7의 브라우저 저장형 프로토타입을 실제 다중 사용자 서버 구조로 전환한 프로젝트입니다.

## 포함 기능

- 학생 개인 회원가입: 아이디 + 비밀번호 + 이름 + 학년 + 반
- 관리자 / 선생님 / 학생 3단계 권한
- 관리자: 학생 정보 수정, 선생님 계정 생성, 점수, 메달, 게시판, 순위, 설정
- 선생님: 학생에게 자유롭게 ○1 / ●2 / ☆4 / ★8점 부여, 메달, 게시판, 순위
- 학생: 나의 성장, 메달, 게시판, 전체 비교
- 게시판 목록 → 글쓰기 → 상세 글 구조
- 댓글
- 사진 / 영상 업로드 (Supabase Storage)
- 여러 휴대폰 / PC가 동일한 서버 데이터를 실시간에 가깝게 공유
- DB Row Level Security(RLS) 정책 포함

## 기술

- Next.js 16.2.11
- React 19.2
- Supabase Auth / PostgreSQL / Storage
- Vercel 배포용

## 1. Supabase 프로젝트 만들기

Supabase에서 새 프로젝트를 생성합니다.

SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.

이 SQL은:
- profiles
- students
- activities
- posts
- comments
- post_media
- board-media Storage bucket
- RLS 권한 정책

을 생성합니다.

## 2. 환경변수

`.env.example`을 `.env.local`로 복사합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_SETUP_SECRET=아주-길고-랜덤한-문자열
```

`SUPABASE_SERVICE_ROLE_KEY`는 절대로 브라우저 코드나 GitHub 공개 저장소에 넣지 마세요.

## 3. 최초 관리자 만들기

서버를 실행한 뒤 아래 요청을 한 번 보냅니다.

```bash
curl -X POST http://localhost:3000/api/setup-admin \
  -H "Content-Type: application/json" \
  -H "x-setup-secret: .env.local의_ADMIN_SETUP_SECRET" \
  -d '{"username":"원하는관리자아이디","password":"강력한비밀번호","fullName":"관리자이름"}'
```

관리자 계정 정보는 로그인 화면에 노출되지 않습니다.

운영 배포 후에는 최초 관리자 생성이 끝나면 `ADMIN_SETUP_SECRET`을 교체하거나 `/api/setup-admin` 경로를 제거하는 것을 권장합니다.

## 4. 로컬 실행

Node.js 20.9 이상을 사용하세요.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 5. Vercel 배포

1. 이 폴더를 GitHub 저장소에 업로드
2. Vercel에서 해당 저장소 Import
3. Vercel Project Settings → Environment Variables에 `.env.local`의 4개 값을 입력
4. Deploy

## 아이디 방식

사용자에게는 이메일을 받지 않고 아이디/비밀번호만 받습니다.
서버 내부에서 Supabase Auth용 내부 이메일을 자동 생성하고 `profiles` 테이블에서 아이디와 연결합니다.
서비스 화면에는 내부 이메일이 노출되지 않습니다.

## 사진/영상

- 파일은 Supabase Storage `board-media` 버킷에 저장
- 기본 최대 파일 크기: 50MB
- 이미지: jpeg/png/webp/gif
- 영상: mp4/webm/quicktime
- 현재 버킷은 게시판에서 편리하게 재생하도록 public 설정
- 교회 내부 자료의 공개 URL 자체도 제한하고 싶다면 private bucket + signed URL 방식으로 강화 가능

## 중요한 보안 메모

이 프로젝트는 서비스 역할 키를 오직 서버 Route Handler에서만 사용합니다.
일반 데이터 접근은 RLS로 제한됩니다.
배포 전 Supabase Dashboard에서 실제 RLS 정책과 Storage 정책이 활성화되어 있는지 다시 확인하세요.

## 메달

현재 화면의 점수 기준:
- 동메달: 40점
- 은메달: 80점
- 금메달: 120점

DB에는 봉사/신약통독/제자훈련/구약통독/전도 필드도 준비되어 있습니다. 다음 버전에서 메달 판정을 기존 규칙(점수 + 미션)으로 완전히 연결할 수 있습니다.
