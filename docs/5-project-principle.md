# TodoList 프로젝트 구조 설계 원칙 (초안)

## 버전 이력

| 버전 | 일자 | 작성자 | 상태 | 요약 |
|------|------|--------|------|------|
| v0.1 | 2026-11-04 | jtaewu | 초안 | 최초 작성 |
| v0.2 | 2026-11-04 | jtaewu | 초안 | 인증 변경 반영: HS384 Access Token + Refresh Token(rotation), client 자동 갱신 |
| v0.3 | 2026-11-04 | jtaewu | 초안 | 문서 간 불일치 정리: NP-14 503, 루트 트리 docs 설명, PP-16 상태 |
| v0.4 | 2026-11-04 | jtaewu | 초안 | SP-03 Refresh 쿠키 Max-Age 메모, PP-16 해결 |
| v0.5 | 2026-11-04 | jtaewu | 초안 | DB 연결 환경 변수 이름을 `DB_CONN_STRING`으로 변경 |
| v0.6 | 2026-11-04 | jtaewu | 초안 | PRE-01·PRE-02 반영: PP-11·14·15·21 해결 |
| v0.7 | 2026-11-04 | jtaewu | 초안 | PP-23 해결, PP-09 실패 기록 정리 정책 추가 |
| v0.8 | 2026-11-05 | jtaewu | 초안 | 개발·운영 모두 CORS 방식으로 변경(프록시 미사용), PP-12 해결 |
| v0.9 | 2026-11-05 | jtaewu | 초안 | 프론트 구현(FE-01~17) 반영: PP-13 해결, LP-11 쿼리 키 위치, 6.2 디렉토리 구조. 코드 대조 반영: 레이어·라이브러리·네이밍·테스트·운영 규칙, 6.1·6.3 트리, PP-02~10·18·20·22 해결 |

## 변경 이력

| 버전 | 일자 | 변경 섹션 | 구분 | 변경 내용 | 작성자 |
|------|------|-----------|------|-----------|--------|
| v0.1 | 2026-11-04 | 전체 | 신규 | 프로젝트 구조 설계 원칙 초안 작성 | jtaewu |
| v0.2 | 2026-11-04 | 머리말 | 수정 | 기준 문서 버전 갱신(PRD v0.5, 시나리오 v0.4, 와이어프레임 v0.3) | jtaewu |
| v0.2 | 2026-11-04 | 3장 | 수정 | LP-08·LP-09: client 401 시 갱신 1회(single-flight)·재시도, 만료 안내는 갱신 실패 시에만. 의존성 표 jsonwebtoken 설명 | jtaewu |
| v0.2 | 2026-11-04 | 4장 | 수정 | NP-13 auth 동사 경로 예시(refresh, logout), TP-13·TP-15 필수 테스트 대상 추가 | jtaewu |
| v0.2 | 2026-11-04 | 5장 | 수정 | SP-03 JWT·Refresh 쿠키 규칙 재작성, `JWT_SECRET` 64자 이상(env 표) | jtaewu |
| v0.2 | 2026-11-04 | 6장 | 수정 | 디렉토리 트리에 `refreshTokens.repository.js`, 토큰 TTL 상수 위치(`lib/jwt.js`) 명시 | jtaewu |
| v0.2 | 2026-11-04 | 7장 | 수정 | PP-22 재작성(페이로드·쿠키 이름·TTL 상수), PP-23 추가 | jtaewu |
| v0.3 | 2026-11-04 | 3장 | 수정 | NP-14에 헬스체크 실패 503 추가(SP-12와 일치) | jtaewu |
| v0.3 | 2026-11-04 | 6장 | 수정 | 6.1 저장소 루트 트리의 `docs/` 설명을 '1~5번 문서'에서 '1~8번 문서, schema.sql'로 정정 | jtaewu |
| v0.3 | 2026-11-04 | 7장 | 수정 | PP-16: 계획 문서가 `8-plan.md`로 확정됨을 반영하고 스킬 경로 수정은 8번 D-01로 연결(미결 유지) | jtaewu |
| v0.4 | 2026-11-04 | 머리말, 7장 | 수정 | 기준 문서 버전 갱신(PRD v0.6, 시나리오 v0.5, 와이어프레임 v0.4) | jtaewu |
| v0.4 | 2026-11-04 | 5장 | 수정 | SP-03에 갱신 시 Refresh 쿠키 `Max-Age` 7일 재설정과 서버 절대 만료 차이 메모(현행 유지) | jtaewu |
| v0.4 | 2026-11-04 | 7장 | 수정 | PP-16 해결: 스킬 참조 경로를 `docs/8-plan.md`로 수정 | jtaewu |
| v0.5 | 2026-11-04 | 5장 | 수정 | 환경 변수 표의 `DATABASE_URL`을 `DB_CONN_STRING`으로 변경 | jtaewu |
| v0.6 | 2026-11-04 | 6장 | 수정 | frontend `styles/` 설명을 스타일 가이드 기준으로 변경 | jtaewu |
| v0.6 | 2026-11-04 | 7장 | 수정 | PP-11·PP-14·PP-21 해결(API 명세 `backend/swagger.yaml` v0.2), PP-15 해결(`9-style-guide.md`) | jtaewu |
| v0.7 | 2026-11-04 | 7장 | 수정 | PP-23 해결(다른 기기 Refresh 폐기 안 함, D-18), PP-09에 실패 기록 정리 정책(D-07) | jtaewu |
| v0.8 | 2026-11-05 | 5·7장 | 수정 | SP-07·PP-03·PP-12·`VITE_API_BASE_URL`: 같은 출처/Vite 프록시 → 개발·운영 CORS(같은 사이트, 다른 출처). `FRONTEND_ORIGIN` 쉼표 다중 출처·운영 필수 | jtaewu |
| v0.8 | 2026-11-05 | 2장 | 추가 | 2.4에 FE 개발 보조 라이브러리 행 추가(FE-01: testing-library/dom, 타입 선언, @eslint/js, globals) | jtaewu |
| v0.9 | 2026-11-05 | 2장 | 수정 | LP-11: 쿼리 키 팩토리를 `lib/queryKeys.ts` 한 모듈로(기능 간 무효화에 같은 키 사용) | jtaewu |
| v0.9 | 2026-11-05 | 6장 | 수정 | 6.2 `frontend/` 구조를 구현에 맞춤(vitest.config.ts, 기능별 hooks.ts, Notice, lib의 routes·messages·queryKeys, 테스트 파일 위치) | jtaewu |
| v0.9 | 2026-11-05 | 7장 | 수정 | PP-13 해결(네이티브 date input, 8번 문서 D-03) | jtaewu |
| v0.9 | 2026-11-05 | 2장 | 수정 | 코드 대조: 2.1 의존 방향에 `validators → domain`·서비스의 `withTransaction`·컨트롤러의 `lib/jwt.js` 명시, `repositories` 소유자 조건 예외, LP-03 토큰 갱신 트랜잭션, LP-04 `fields` 인자, LP-07 `overlapCondition`. 2.2 상위→하위 import 허용 명시. 2.4에 `swagger-ui-express`·`yaml`(BE 런타임), `@eslint/js`·`globals`(BE 개발) 추가 | jtaewu |
| v0.9 | 2026-11-05 | 3장 | 수정 | 코드 대조: NP-02 `.schemas.js`·`auth`/`health` 예외, NP-04 예시를 기능별 `hooks.ts`로, NP-18 `::date` 캐스트 범위와 `count(*)::int` | jtaewu |
| v0.9 | 2026-11-05 | 4장 | 수정 | 코드 대조: TP-08 `loadtest/` 미생성(INT-02)·시드 실행 명령 | jtaewu |
| v0.9 | 2026-11-05 | 5장 | 수정 | 코드 대조: SP-06 소유자 조건 예외, SP-07 본문 100kb, SP-10 타임아웃 상수·CLI 스크립트의 `pg.Client`, SP-12 `SIGINT`·헬스 응답 | jtaewu |
| v0.9 | 2026-11-05 | 6장 | 수정 | 코드 대조: 6.1 트리(`.claude/` 구성, 1~9번 문서, `loadtest/` 예정), 6.3 트리(`swagger.yaml`·`.prettierignore`·`lib/pgError.js`·`requireAuth`·`tests/` 하위 폴더), TP-17·TP-18·TP-19 테스트 위치 | jtaewu |
| v0.9 | 2026-11-05 | 7장 | 수정 | 코드로 확정된 PP-02~PP-10·PP-18·PP-20·PP-22를 해결로 변경(PP-09 선집계 구현 명시) | jtaewu |

> 구분: 신규 / 추가 / 수정 / 삭제. 버전을 올릴 때는 '버전 이력'에 한 줄을 추가하고, 세부 변경 사항은 '변경 이력'에 섹션 단위로 기록한다.

> 본 문서는 `1-domain-definition.md`(v0.4), `2-PRD.md`(v0.7), `3-user-scenario.md`(v0.6), `4-wireframe.md`(v0.5)를 기준으로 한다.

## 1. 개요와 공통 최상위 원칙

**목적:** 1인 개발·2일 일정(PRD 8·9장)에서 프론트엔드·백엔드 코드가 같은 규칙으로 쌓이도록 구조·네이밍·테스트·운영의 원칙을 정한다. 도메인 규칙, 요구사항, 화면은 재정의하지 않고 ID로 참조한다. API 명세, DB DDL, 스타일 가이드는 후속 문서 범위다(PRD 8장).

**원칙 ID 체계:** CP 공통 / LP 레이어 / NP 네이밍 / TP 테스트 / SP 설정·보안·운영 / PP 가정·미결(7장). 이미 정해진 규칙(스킬 문서)은 '스킬'로 표기한다.

### 1.1 고정 제약 (변경 금지)

| 영역 | 내용 | 근거 |
|------|------|------|
| 프론트엔드 | React 19 + TypeScript + Zustand + TanStack Query. 웹 우선, 모바일은 반응형만 | PRD 8장, NFR-08 |
| 백엔드 | Node.js + **JavaScript** + Express + `pg`. Prisma 등 ORM 금지 | PRD 8장, R-04 |
| DB | PostgreSQL 17 | PRD 8장 |
| 코드 위치 | 저장소 루트의 `backend/`, `frontend/` | 스킬 |
| 커버리지 | 90% 이상 | 스킬 |
| 규모 | 1인, 2일, 단일 서버 1대 + DB 1대. 마이크로서비스·DI 컨테이너·모노레포 툴·공유 패키지 도입 금지 | PRD 8·9장 |

### 1.2 공통 최상위 원칙

| ID | 원칙 | 근거 |
|----|------|------|
| CP-01 | **가볍게 만든다.** 문서에 있는 요구사항만 구현하고, 레이어·추상화·라이브러리는 필요가 확인된 뒤에 추가한다. 추가 시 PP 또는 2.4의 표에 기록한다. | PRD 8장, R-05 |
| CP-02 | **상태는 저장하지 않고 파생한다.** 저장 값은 완료 여부뿐이며, 상태 판정 규칙의 단일 출처는 백엔드 `domain/todoStatus.js`다(LP-07). | BR-13, 도메인 4장 |
| CP-03 | **날짜는 끝까지 문자열 `YYYY-MM-DD`다.** 타임존 변환을 하지 않으며, '오늘'은 클라이언트 로컬 날짜를 요청에 실어 보낸다. | AS-01, AS-02, PA-06, R-06 |
| CP-04 | **모든 데이터 접근에 소유자 조건을 넣는다.** 타인 데이터는 없는 ID와 동일하게 404로 응답한다. | BR-02, NFR-06 |
| CP-05 | **서버가 최종 검증자다.** 클라이언트 검증은 UX용이며 서버는 경계(라우트)에서 항상 다시 검증한다. | FR-13, AS-08, WA-22 |
| CP-06 | **서버 상태와 클라이언트 상태를 분리한다.** 서버 데이터는 TanStack Query만, Zustand는 UI 상태만 가진다(LP-12). | PRD 8장 |
| CP-07 | **SQL은 직접 쓰되 한 곳(repositories)에만 두고, 값은 파라미터 바인딩으로만 넣는다.** | R-04, NFR-07 |
| CP-08 | **규칙은 순수 함수로 분리해 테스트한다.** 상태 판정·날짜 계산·검증 규칙은 I/O 없는 함수로 두고 90% 커버리지를 지킨다. | 스킬, NFR-06 |

## 2. 의존성·레이어 원칙

### 2.1 백엔드 레이어

의존 방향: `routes → controllers → services → repositories → db`. `services`·`repositories`·`validators`는 `domain`을 사용할 수 있고, `domain`은 아무것도 import하지 않는다. `services`는 트랜잭션을 위해 `db/query.js`의 `withTransaction`만 직접 쓴다. `controllers`는 쿠키 옵션을 위해 `lib/jwt.js`를 쓸 수 있다. 계층을 건너뛰거나(controller → repository) 거꾸로 import하지 않는다.

| 레이어 | 책임 | 하지 않는 일 |
|--------|------|--------------|
| `routes` | 경로·메서드 정의, `auth`·`validate` 미들웨어 연결 | 로직 |
| `validators` | 요청 입력 스키마(zod). `routes`에서만 참조 | DB 조회 |
| `controllers` | `req` 값을 꺼내 서비스 호출, 상태 코드·JSON 응답 | 비즈니스 규칙, SQL |
| `services` | 비즈니스 규칙(BR), 트랜잭션 경계, `AppError` 발생 | `req`/`res` 접근, SQL |
| `repositories` | SQL 실행. 사용자 데이터 함수는 소유자 `userId`를 받아 WHERE에 포함(예외: 로그인 이메일 조회, `refresh_tokens`의 `token_hash` 조회, 헬스체크) | 규칙 판단, 응답 형식 |
| `domain` | 순수 함수·상수: 상태 판정, 날짜 문자열 검증, 길이 상수 | I/O, 시각 조회 |
| `db`·`lib`·`config`·`middlewares` | 풀·타입 파서·트랜잭션 헬퍼, 로거·JWT·에러 클래스, 환경 변수, 인증·검증·에러 처리 | 도메인 규칙 |

| ID | 원칙 | 근거 |
|----|------|------|
| LP-01 | 위 의존 방향을 지킨다. 계층 위반은 코드 리뷰 거절 사유다(ESLint `no-restricted-imports`로 가능한 만큼 강제). | CP-01 |
| LP-02 | 컨트롤러는 얇게 유지하고, 단순 CRUD도 서비스를 거친다. 규칙이 생길 자리를 한 곳으로 고정하기 위함이다. | BR-02, BR-08, BR-10 |
| LP-03 | 여러 테이블을 바꾸는 작업은 서비스가 트랜잭션으로 묶는다(가입 시 사용자+기본 카테고리, 카테고리 삭제 시 할일 이동 후 삭제, 토큰 갱신 시 `refresh_tokens` DELETE+INSERT). 리포지토리 함수는 마지막 인자로 실행자(풀 또는 트랜잭션 클라이언트)를 받는다. | BR-06, BR-10 |
| LP-04 | 오류는 `AppError(status, code, message, fields?)`를 throw하고 중앙 `errorHandler` 한 곳에서만 응답으로 바꾼다. Express 5의 async 핸들러 거부 전파를 쓰며 try/catch 래퍼를 만들지 않는다. | NFR-12 |
| LP-05 | 런타임 입력 검증은 라우트 경계에서 zod 스키마로 한다. 검증 통과 값만 컨트롤러에 전달하며, 알 수 없는 필드는 제거한다(`userId` 등 주입 방지). | FR-13, AS-08, AS-05 |
| LP-06 | `SELECT *`를 쓰지 않고 컬럼을 명시한다(`password_hash` 유출 방지). 비밀번호 해시는 인증용 전용 조회 함수에서만 읽는다. | NFR-05 |
| LP-07 | 상태 판정은 `domain/todoStatus.js` 한 파일에 두 형태로 나란히 둔다. ① `deriveStatus(todo, today)` 순수 함수(응답의 `status` 필드), ② 같은 규칙의 SQL 조건 조각(`statusCondition`: 상태 필터, 페이지네이션 때문에 서버 SQL로 처리. `overlapCondition`: 캘린더 기간 겹침). 두 형태는 TP-02의 일치 테스트로 묶는다. 기준일은 요청의 `today`이며 서버 시계로 대체하지 않는다. | BR-13, PA-06, FR-06 |

### 2.2 프론트엔드 레이어

의존 방향: `app → pages → features → (components, api, stores, lib)`. 상위 레이어는 하위 레이어 어디든 import할 수 있고(예: `pages`·`app`이 `components`·`api/client`·`lib`를 직접 사용), 아래에서 위로는 금지한다. `components`는 `lib`만(타입 import는 `api/types` 허용), `api`·`stores`는 `lib`만 import한다.

| 레이어 | 책임 | 하지 않는 일 |
|--------|------|--------------|
| `app` | 라우터, QueryClient, 인증 가드, 공통 레이아웃 | 화면 로직 |
| `pages` | 라우트 단위 화면(SC-01~07) 조합 | 직접 fetch, 규칙 |
| `features` | 기능별 UI + TanStack Query 훅 + zod 스키마. 기능 간 import는 상대 기능의 `index.ts` 공개 항목만, 순환 금지 | 다른 기능 내부 import |
| `components` | 도메인 모름. props만으로 동작하는 공통 UI(와이어프레임 5장) | API 호출, 스토어 접근 |
| `api` | `fetch` 래퍼와 리소스별 호출 함수, 응답 타입 | React 의존 |
| `stores` | Zustand 클라이언트 UI 상태 | 서버 데이터 보관 |
| `lib` | 순수 유틸(날짜 문자열, 상수) | React·I/O |

| ID | 원칙 | 근거 |
|----|------|------|
| LP-08 | 모든 API 호출은 `api/client.ts`의 단일 `fetch` 래퍼를 거친다. `credentials: 'include'`, JSON 입출력, 실패 시 `ApiError{status, code, message, fields}`를 throw한다. 컴포넌트에서 `fetch`를 직접 쓰지 않는다. `/api/auth/*`가 아닌 요청이 401 `UNAUTHENTICATED`를 받으면 `POST /api/auth/refresh`를 한 번 호출하고, 성공하면 원래 요청을 한 번만 재시도한다. 동시에 여러 요청이 401을 받아도 갱신 요청은 하나만 보내고 나머지는 그 결과를 기다린다(single-flight). 갱신에 실패하면 원래 401을 throw한다. | PA-01, NFR-10 |
| LP-09 | 401 처리는 한 곳(`app/queryClient.ts`의 Query/Mutation 전역 `onError`)에서 한다. client의 갱신·재시도(LP-08)까지 실패해 던져진 오류 코드 `UNAUTHENTICATED`일 때만 로그인 화면(SC-02)으로 이동하며, 로그인 요청의 실패(`INVALID_CREDENTIALS`)는 이동 대상이 아니다. 만료 안내 문구(WA-21)는 이미 인증된 상태에서 갱신 실패로 401을 받은 경우에만(Access Token 만료만으로는 표시하지 않음) `sessionStore`의 플래그로 표시한다. 앱 진입 시 `me` 조회의 401은 안내 없이 이동한다. | FR-02, SN-03, WA-21 |
| LP-10 | 4xx에는 TanStack Query 재시도를 하지 않는다(`retry`는 네트워크·5xx만). | NFR-01 |
| LP-11 | 쿼리 키는 `lib/queryKeys.ts` 한 모듈의 키 팩토리로 만든다(여러 기능이 같은 키를 무효화하므로 한 곳에 둔다).  상태가 `today`에 의존하는 조회(목록·캘린더)는 키에 `today`를 포함한다. 변경(mutation) 성공 후에는 관련 키를 무효화해 다시 가져온다. | PA-06, BR-13 |
| LP-12 | **상태 관리 경계.** 서버 데이터(할일·카테고리·내 정보·현재 사용자)는 TanStack Query만 가진다. Zustand는 클라이언트 UI 상태(할일 목록 필터·페이지, 캘린더 뷰 종류·기준일, 세션 만료 안내 플래그)만 가진다. 서버 데이터를 Zustand에 복제하지 않으며, 폼 입력값은 컴포넌트 로컬 상태다. | PRD 8장, WA-09, WA-17 |
| LP-13 | 프론트는 상태를 계산하지 않고 API가 준 `status`를 표시만 한다. 부득이 프론트에 판정 로직이 필요해지면 TP-02와 같은 ST 표 fixture로 일치 테스트를 추가하고 PP를 갱신한다. | BR-13, WA-19 |
| LP-14 | 환경 변수·화면 경로·AS-08 길이 상수는 각각 한 모듈에 모은다. 백엔드와 프론트의 길이 상수는 공유 패키지 없이 각자 두며, 불일치 시 서버를 정답으로 한다(PP-20). | AS-08, FR-13 |

### 2.3 외부 라이브러리 추가 기준

| ID | 원칙 | 근거 |
|----|------|------|
| LP-15 | 라이브러리는 ① 플랫폼(Node·브라우저·React)이 못 하고 ② 직접 쓰면 30줄을 넘거나 보안상 위험할 때만 추가한다. ③ 순수 JS/ESM이며 네이티브 빌드가 없을 것(bcrypt는 PP-10의 예외). 추가 시 아래 표에 행을 더한다. | CP-01, R-04 |

### 2.4 허용 라이브러리 목록

| 대상 | 라이브러리 | 이유 |
|------|-----------|------|
| BE 런타임 | `express`(v5), `pg` | 고정 제약 |
| BE 런타임 | `zod` | 경계 입력 검증(FR-13). 스키마를 한 곳에서 선언해 타입 변환·필드별 오류를 얻는다 |
| BE 런타임 | `bcrypt` | 비밀번호 해시(PA-02, NFR-05). 네이티브 구현이라 이벤트 루프를 막지 않는다(PP-10) |
| BE 런타임 | `jsonwebtoken` | Access Token(JWT, `HS384`) 서명·검증(PA-01). Refresh Token은 JWT가 아니라 `crypto`로 생성한다 |
| BE 런타임 | `cookie-parser`, `cors` | 쿠키 읽기, 허용 출처 제한(NFR-10) |
| BE 런타임 | `pino` | 구조화 로그와 민감 필드 `redact`(NFR-12) |
| BE 런타임 | `swagger-ui-express`, `yaml` | 개발 환경 전용 `/api/docs`에서 `swagger.yaml` 열람(`NODE_ENV=development`일 때만 등록) |
| BE 개발 | `vitest`, `@vitest/coverage-v8`, `supertest` | 테스트·커버리지·HTTP 통합 테스트(TP-04) |
| FE 런타임 | `react`, `react-dom`, `zustand`, `@tanstack/react-query` | 고정 제약 |
| FE 런타임 | `react-router` | SC-01~07 화면 라우팅과 가드 |
| FE 런타임 | `zod` | 클라이언트 검증(WA-22). 서버와 같은 스키마 문법 |
| FE 개발 | `vite`, `@vitejs/plugin-react`, `typescript` | 빌드·번들·타입 검사 |
| FE 개발 | `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw` | 컴포넌트 테스트와 네트워크 계층 모킹(TP-05) |
| 공통 개발 | `eslint`, `typescript-eslint`(FE), `eslint-plugin-react-hooks`(FE), `prettier` | 린트·포맷(TP-07) |
| 개발(BE·FE) | `@eslint/js`, `globals`(BE·FE 공통), `@testing-library/dom`, `@types/react`, `@types/react-dom`, `@types/node`(FE) | 위 도구의 peer 의존성·타입 선언·ESLint 기본 규칙과 전역 목록(FE-01에서 추가) |

도입하지 않는 것(필요 시 PP로 재결정): ORM·쿼리 빌더(Prisma, Knex 등), axios, Redux, lodash, moment·dayjs·date-fns, 캘린더·date picker 라이브러리, UI 프레임워크, react-hook-form, passport, express-rate-limit, dotenv(Node `--env-file` 사용), nodemon(`node --watch` 사용), helmet.

## 3. 코드·네이밍 원칙

### 3.1 파일·식별자

| ID | 대상 | 규칙 | 예 |
|----|------|------|-----|
| NP-01 | 폴더 | 소문자(필요 시 kebab-case) | `features/todos`, `middlewares` |
| NP-02 | 백엔드 파일 | `<리소스 복수형>.<레이어>.js`. 단어가 둘 이상이면 camelCase. 검증 스키마는 `<리소스>.schemas.js`. 리소스가 아닌 묶음은 `auth.*`, `health.*` | `todos.service.js`, `todoStatus.js`, `todos.schemas.js` |
| NP-03 | 프론트 컴포넌트 파일·이름 | PascalCase, 파일명 = 컴포넌트명 | `StatusBadge.tsx` |
| NP-04 | 프론트 훅 | `use` 접두 camelCase. 조회 `useTodos`, 변경 `useCreateTodo`, 스토어 `useTodoFilterStore` | `features/todos/hooks.ts`(파일은 기능별 `hooks.ts` 하나) |
| NP-05 | 그 외 파일·변수·함수 | camelCase. 상수는 UPPER_SNAKE_CASE, boolean은 `is`/`has`/`can` 접두, 이벤트 props `onXxx`·핸들러 `handleXxx` | `isCompleted`, `TITLE_MAX` |
| NP-06 | 타입 | PascalCase. 날짜 문자열은 별칭 `DateString`(= `string`)으로 의도를 드러낸다 | `Todo`, `DateString` |
| NP-07 | 테스트 파일 | 대상 파일명 + `.test.js`/`.test.ts(x)` | `todoStatus.test.js` |

### 3.2 DB 네이밍

| ID | 규칙 | 근거 |
|----|------|------|
| NP-08 | 테이블은 복수형 snake_case(`users`, `categories`, `todos`), 컬럼은 snake_case. PK는 `id`, FK는 `<단수>_id`(`user_id`, `category_id`). | 도메인 3장 |
| NP-09 | boolean은 `is_` 접두(`is_completed`, `is_default`), 시각은 `*_at`(`created_at`, `updated_at`), 날짜는 `*_date`(`start_date`, `end_date`). 시각은 `timestamptz`, 날짜는 `date`. | AS-01, CP-03 |
| NP-10 | 제약·인덱스 이름은 `uq_`, `ck_`, `fk_`, `idx_` + `<테이블>_<컬럼>`. 무결성은 DB 제약으로 한 번 더 막는다(이메일 고유, 사용자별 카테고리 이름 고유, 사용자당 기본 카테고리 1개, `end_date >= start_date`). | BR-03, BR-05, BR-09, AS-04 |
| NP-11 | 마이그레이션 파일은 `NNNN_설명.sql`(4자리 순번 + snake_case). SQL 키워드는 대문자. | SP-11 |

### 3.3 변환·API·오류

| ID | 원칙 | 근거 |
|----|------|------|
| NP-12 | **snake_case ↔ camelCase 변환은 `backend/src/db/query.js`의 조회 결과 변환 한 곳에서만 한다.** 그 위 계층에는 snake_case 키가 없으며, 입력은 위치 파라미터(`$1…`)로 바인딩하므로 변환이 필요 없다. 프론트는 변환하지 않는다. | CP-07 |
| NP-13 | API 경로는 `/api/` + 복수 명사 kebab-case 리소스(`/api/todos`, `/api/todos/:id`), 동작은 HTTP 메서드로 표현한다. 인증처럼 CRUD로 표현되지 않는 동작만 `auth` 아래 동사 경로를 허용한다(`/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`). 쿼리 파라미터·JSON 키는 camelCase. 상태를 바꾸는 요청은 GET을 쓰지 않는다. 버전 접두는 두지 않는다. 엔드포인트 명세는 후속 문서에서 정한다. | NFR-10, PRD 8장 |
| NP-14 | 상태 코드: 성공 200/201/204, 입력 오류 400, 미인증 401, 없음·타인 소유 404, 중복·규칙 위반 409, 로그인 차단 429, 서버 오류 500, 헬스체크 DB 실패 503(SP-12). | NFR-06, NFR-11 |
| NP-15 | **에러 응답은 한 형식이다.** `{ "error": { "code", "message", "fields"? } }`. `code`는 UPPER_SNAKE 안정 식별자(`VALIDATION_ERROR`, `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `NOT_FOUND`, `TOO_MANY_ATTEMPTS`, `INTERNAL_ERROR` 등)이고 프론트는 `code`로 분기한다. `message`는 사용자에게 보여도 되는 문구이며, `fields`(필드명 → 문구)는 입력 오류에만 붙는다. 500은 내부 정보·스택을 담지 않는다. | FR-13, WA-22 |
| NP-16 | 타인 소유 ID와 존재하지 않는 ID는 코드·메시지·본문이 같은 `NOT_FOUND`로 응답한다. 로그인 실패는 비밀번호 오류와 없는 이메일을 같은 `INVALID_CREDENTIALS`로 응답한다. | NFR-06, FR-02, WA-03 |

### 3.4 날짜 처리

| ID | 구간 | 원칙 | 근거 |
|----|------|------|------|
| NP-17 | DB | 시작일·종료일은 `date` 컬럼. 시간·타임존 정보를 저장하지 않는다 | AS-01 |
| NP-18 | **pg 드라이버** | `pg`는 `date`(OID 1082)를 JS `Date`(로컬 자정)로 바꿔 날짜가 하루 밀릴 수 있다. `db/pool.js`에서 `types.setTypeParser(1082, v => v)`로 **문자열 그대로** 받는다. `int8`(20)도 Number로 파싱한다(PP-07, 안전장치). 건수는 `count(*)::int`로 받는다. 비교식의 날짜 파라미터는 문자열을 `$n::date`로 캐스트하고, INSERT·UPDATE는 컬럼 타입으로 추론한다 | AS-01, R-06 |
| NP-19 | API·JSON | 날짜는 `"YYYY-MM-DD"` 문자열. 입력은 형식뿐 아니라 달력상 유효한 날짜(`2026-02-30` 거부)까지 검증한다 | FR-13 |
| NP-20 | 계산 | 날짜끼리의 비교는 제로 패딩 문자열 비교(`<`, `<=`)로 한다. `new Date('YYYY-MM-DD')`(UTC로 해석됨)와 `toISOString()`은 날짜에 쓰지 않는다. 날짜 덧셈·주 시작(일요일)·월 범위는 프론트 `lib/date.ts`가 정수 연·월·일로 계산해 문자열을 반환한다 | AS-09, CP-03 |
| NP-21 | '오늘' | 클라이언트가 `new Date()`의 **로컬** 연·월·일을 조합해 만든 `YYYY-MM-DD`를 `today`로 전달한다(`lib/date.ts`의 `todayLocal()` 한 곳). 서버는 상태 판정·필터에 서버 시계를 쓰지 않는다 | AS-02, PA-06 |
| NP-22 | 시각(timestamp) | `created_at`·`updated_at`은 `timestamptz`, JSON은 ISO 8601(UTC). 정렬(FR-06)·감사 용도로만 쓰고 날짜 판정에는 쓰지 않는다. 서버 시계는 시각 기록, JWT·Refresh Token 만료, 로그인 차단에만 쓴다 | FR-06 |

## 4. 테스트·품질 원칙

| ID | 원칙 | 근거 |
|----|------|------|
| TP-01 | 백엔드·프론트 각각 커버리지 90% 이상(lines·functions·branches·statements)을 Vitest 설정의 `thresholds`로 강제해 미달 시 `test:coverage`가 실패한다. 측정 제외는 진입점(`server.js`, `main.tsx`), 설정 파일, 테스트 헬퍼, 타입 선언만 허용한다. | 스킬 |
| TP-02 | **상태 판정 경계값을 표 기반으로 테스트한다.** `3-user-scenario.md` 4장 A표(ST-01~13)와 B표(CV-01~05)를 fixture로 삼아 `deriveStatus`와 캘린더 겹침 조건을 검증하고, **같은 fixture를 실제 DB에 넣어 SQL 상태 필터 결과가 `deriveStatus`와 일치함**을 통합 테스트로 확인한다(단일 출처 보증). | BR-13, LP-07 |
| TP-03 | 테스트 피라미드: 다수의 단위 테스트(domain·lib·스키마·컴포넌트) > 중간 수의 통합 테스트(백엔드 API, 프론트 화면 단위) > 수동 E2E(E2E-01, E2E-02, G-01) 및 부하 테스트. 브라우저 E2E 자동화는 도입하지 않는다(PP-17). | G-01, PRD 9장 |
| TP-04 | **백엔드 통합 테스트는 `supertest` + 실제 PostgreSQL 17 테스트 DB를 쓴다(권장 확정).** 직접 작성한 SQL(R-04)과 DB 제약은 `pg` 모킹으로 검증할 수 없기 때문이다. 테스트 DB 이름은 `_test`로 끝나야 하며 아니면 setup이 중단한다. 같은 마이그레이션 러너로 스키마를 만들고, 파일은 직렬 실행하며 테스트 전 `TRUNCATE`로 초기화한다. | R-04, SP-11 |
| TP-05 | **프론트는 Vitest + React Testing Library + `user-event`, API는 MSW로 네트워크 계층에서 모킹한다.** `api/` 모듈을 `vi.mock`하지 않아 `credentials`·오류 변환·401 처리까지 함께 검증한다. 모든 테스트는 `renderWithProviders`(QueryClient 새 인스턴스, 라우터)를 쓰고 테스트마다 스토어를 초기화한다. | LP-08, LP-09 |
| TP-06 | **타임존 함정 방어:** 백엔드·프론트 Vitest 설정 상단에서 `process.env.TZ`를 UTC가 아닌 값(예: `America/Los_Angeles`)으로 설정해, `date` 왕복·`todayLocal()`·`lib/date.ts`가 날짜를 밀지 않는지 노출한다. 시각 의존 로직(로그인 차단, 자정 경계)은 fake timers 또는 시각 주입으로 검증한다. | NP-18, NP-21, R-06 |
| TP-07 | 린트·포맷: ESLint(flat config) + Prettier를 패키지별로 실행하고, 공통 `.prettierrc`·`.editorconfig`는 저장소 루트에 한 벌 둔다. 프론트는 `strict` TypeScript이며 `any`를 린트로 금지한다. 스크립트 이름은 양쪽 모두 `dev`, `test`, `test:coverage`, `lint`, `format`으로 통일한다. 커밋 훅은 두지 않는다(PP-19). | CP-01 |
| TP-08 | 부하 테스트(k6)는 저장소 루트 `loadtest/`에 둔다(INT-02에서 생성 예정, 현재 없음). PA-07 조건(시드 1,000명×할일 200×카테고리 5, 요청 비율 70/25/5, 계정별 가상 사용자)을 스크립트와 시드 스크립트(`backend/scripts/seed-loadtest.js`, 실행은 `npm run seed:loadtest -- --users N --todos M`, 빈 DB에서만)로 재현하고, `NODE_ENV=production`·운영과 같은 풀 설정으로 실행해 NFR-01~03을 확인한다. 단위·통합 테스트 실행에는 포함하지 않는다. | NFR-01~03, PA-07 |

**반드시 테스트할 대상**

| ID | 대상 | 최소 검증 내용 | 근거 |
|----|------|----------------|------|
| TP-09 | 상태 판정 | ST-01~13 전부(시작일·종료일 당일, 하루짜리, 완료 해제 재판정), 네 상태의 상호 배타성 | 도메인 4장 |
| TP-10 | 소유자 검증 404 | 할일·카테고리 각 리소스의 조회·수정·완료·삭제를 타인 ID로 요청 → 존재하지 않는 ID와 **상태 코드·본문 동일**. 본문에 타인 카테고리 ID를 넣는 경우도 거부. 타인 데이터는 변경되지 않음 | BR-02, NFR-06, SN-13 |
| TP-11 | 비즈니스 규칙 | BR-03(이메일 중복), BR-05(같은 날 허용·역전 거부), BR-06·07(기본 카테고리), BR-08·09, BR-10(할일 이동·총수 불변), BR-11(삭제 후 404), BR-12(현재 비밀번호 확인) | 도메인 5장 |
| TP-12 | 입력 검증 | AS-08 경계값을 **API 직접 요청**으로: 제목 100/101, 메모 1000/1001, 카테고리 이름 20/21, 이름 50/51·빈 값, 비밀번호 7/8, 이메일 형식, 필수 누락, 달력상 무효 날짜, `today` 누락·형식 오류 | FR-13, AS-08 |
| TP-13 | 인증·보안 | 로그인 5회 실패 차단·6번째 정답 거부·5분 후 성공·실패 후 성공 시 초기화(SA-03), 비밀번호 오류/없는 이메일의 동일 응답, 쿠키 2종의 속성(`HttpOnly`, `SameSite=Lax`, 운영 `Secure`, `refresh_token`의 `Path=/api/auth`), JWT 서명·검증은 `HS384` 고정(`HS256`·`none` 등 다른 alg 토큰 거부), Refresh rotation(갱신 시 이전 행 삭제·새 행 INSERT, 만료 이어받기), 사용된 Refresh Token 재사용 시 401, 만료·미존재 Refresh 401과 쿠키 2종 만료, 로그아웃 시 Refresh 행 삭제·갱신 불가·쿠키 만료·항상 204, 미인증 401, 응답에 `password_hash` 없음 | NFR-10, NFR-11, SN-02 |
| TP-14 | 날짜 무이동 | 임의 날짜(월말·연말 포함)를 저장 후 조회해 문자열이 같음 | NP-18 |
| TP-15 | 프론트 핵심 | 401 처리(Access 만료 시 갱신 후 원요청 재시도, 동시 401에도 갱신 1회, 갱신 실패 시에만 만료 안내·이동, 로그인 실패는 이동 안 함), 필터 변경 시 1페이지 복귀, `today`가 요청에 실림, 서버 거부 오류가 필드 아래에 표시, 삭제 확인 취소 시 무변화, 캘린더 막대 범위 계산(CV 표) | WA-09, WA-21, WA-22 |

## 5. 설정·보안·운영 원칙

| ID | 원칙 | 근거 |
|----|------|------|
| SP-01 | 환경 변수는 `backend/src/config/env.js` 한 곳에서만 읽고 zod로 검증하며, 누락·형식 오류면 서버 시작을 중단한다(`process.env` 직접 접근 금지). 프론트는 `import.meta.env`를 한 모듈에서만 읽는다. | NFR-12 |
| SP-02 | 비밀값(`.env`)은 커밋하지 않는다. 패키지마다 `.env.example`(값은 예시·빈 값)을 두고, 변수를 추가·삭제하면 같은 커밋에서 갱신한다. 프론트 `VITE_*` 값은 브라우저에 노출되므로 비밀을 넣지 않는다. | NFR-05, `.gitignore` |
| SP-03 | **JWT·쿠키:** Access Token은 JWT(`HS384`, 만료 15분, 페이로드 `sub`·`iat`·`exp`)이고 쿠키 `access_token`(`HttpOnly`, `SameSite=Lax`, `Path=/`, 운영 `Secure`, `Max-Age` 15분)으로 보낸다. 서명 때 알고리즘을 명시하고, 검증 때 허용 알고리즘을 `['HS384']`로 고정해 다른 알고리즘과 `none`을 거부한다. Refresh Token은 `crypto.randomBytes(32)`의 base64url 불투명 문자열이며 DB에는 SHA-256 해시만 저장하고(원문 저장·로그 금지), 쿠키 `refresh_token`(`HttpOnly`, `SameSite=Lax`, `Path=/api/auth`, 운영 `Secure`, `Max-Age` 7일)으로 보낸다. 토큰은 JS가 접근할 수 없으며 `localStorage`·`sessionStorage`에 저장하지 않는다. 로그아웃·갱신 실패는 발급 때와 같은 속성으로 두 쿠키를 만료시킨다. 로그아웃은 Refresh 행을 삭제한다. 이미 발급된 Access Token은 최대 15분 유효하다(PA-01 한계). `JWT_SECRET`은 64자 이상(48바이트 무작위 값의 base64)을 시작 시 검증한다. 갱신 시 `refresh_token` 쿠키의 `Max-Age`는 다시 7일로 설정되어 서버 절대 만료(ER-14)보다 쿠키가 오래 남을 수 있으나, 서버가 만료 행을 거부하므로 기능 영향이 없어 그대로 둔다. | PA-01, NFR-10, FR-11 |
| SP-04 | 비밀번호는 `bcrypt`로만 저장·비교한다. 평문을 저장·로그·응답에 쓰지 않는다. 없는 이메일 로그인에도 더미 해시 비교를 수행해 응답 시간 차로 존재 여부가 드러나지 않게 한다. | PA-02, NFR-05, FR-02 |
| SP-05 | SQL 값은 파라미터 바인딩(`$n`)만 쓴다. 문자열 연결·템플릿 삽입 금지. 정렬 컬럼 등 동적 식별자가 필요하면 코드 내 화이트리스트 매핑만 허용한다. | NFR-07 |
| SP-06 | 사용자 데이터를 읽거나 바꾸는 모든 쿼리의 WHERE에 `user_id = $n`(소유자 조건)을 포함한다. `id`만으로 조회·수정·삭제하는 쿼리를 만들지 않는다. 예외는 로그인 이메일 조회, `users`의 본인 `id` 조회, `refresh_tokens`의 `token_hash` 조회(256비트 무작위 토큰의 해시라 소유 증명을 겸함), 헬스체크다. | BR-02, NFR-06 |
| SP-07 | 개발·운영 모두 프론트는 CORS로 API를 직접 호출한다(프록시 미사용, PP-12). CORS는 `FRONTEND_ORIGIN`에 지정한 출처만 허용하고 `credentials: true`로 한다. 인증 쿠키는 `SameSite=Lax`이므로 프론트와 API는 같은 사이트의 서로 다른 출처로 둔다(PP-12). 본문 크기는 `express.json({ limit: '100kb' })`로 제한(초과·파싱 오류는 400 `VALIDATION_ERROR`)하고 `x-powered-by`를 끈다. | NFR-10 |
| SP-08 | 로그인 시도 제한: 이메일(소문자 정규화) 단위로 연속 5회 실패 시 5분 차단, 성공 시 초기화, 없는 이메일도 같은 방식으로 집계, 차단 중에는 정답도 거부. 단일 서버 메모리 구현이다(PP-09). | NFR-11, SA-03 |
| SP-09 | 로그는 `pino` 구조화 JSON. 5xx는 요청 경로·시각과 함께 기록하고 스택은 로그에만 남기며 응답에 넣지 않는다. `password`, `Authorization`, `Cookie`, `Set-Cookie`, 토큰 필드는 `redact` 처리해 로그에 남기지 않는다. | NFR-05, NFR-12 |
| SP-10 | 서버 런타임의 DB 접속은 `db/pool.js`의 `pg.Pool` 하나만 쓴다. 최대 연결 수는 `DB_POOL_MAX`(기본 10, NFR-01 부하 테스트로 조정)로 받고, 연결 타임아웃 5초·유휴 30초는 `pool.js` 상수로 둔다. 풀 `error` 이벤트를 로깅한다. 수동 클라이언트(`pool.connect()`)는 트랜잭션 헬퍼에서만 쓰고 `finally`에서 반드시 반환한다. CLI 스크립트(`migrate.js`, `seed-loadtest.js`)와 테스트 setup은 풀 대신 단발 `pg.Client`를 쓴다. | NFR-04, R-02 |
| SP-11 | **마이그레이션은 ORM 없이 순번 SQL 파일로 한다.** `backend/migrations/NNNN_설명.sql`을 자체 러너(`scripts/migrate.js`)가 순번대로 실행하고 `schema_migrations` 테이블에 적용 이력을 남긴다. 파일마다 한 트랜잭션, 정방향만(롤백 파일 없음), 적용된 파일은 수정하지 않고 새 파일로 변경한다. 개발·테스트·운영 모두 같은 러너를 쓴다. | R-04, NFR-04 |
| SP-12 | 헬스체크는 인증 없는 `GET /api/health`(DB `SELECT 1` 포함, 성공 200 `{status:'ok'}`, 실패 503 `SERVICE_UNAVAILABLE`)로 노출한다. `SIGTERM`·`SIGINT` 시 새 요청을 멈추고(`server.close`, 유휴 연결 종료) 진행 중 요청과 풀(`pool.end`)을 정리한 뒤 종료한다. 두 번째 신호는 즉시 종료한다. 별도 메트릭 서버는 두지 않는다(PP-19). | PRD 8장 |
| SP-13 | 프론트는 `dangerouslySetInnerHTML`을 쓰지 않고 사용자 입력(제목·메모·카테고리 이름)을 항상 텍스트로 렌더링한다. | NFR-07, FR-12 |

**환경 변수 (이름만 정의, 값은 `.env.example`)**

| 위치 | 변수 | 용도 | 비밀 |
|------|------|------|------|
| backend | `NODE_ENV`, `PORT`, `LOG_LEVEL` | 실행 환경·포트·로그 수준 | 아니오 |
| backend | `DB_CONN_STRING`, `TEST_DATABASE_URL` | 운영/개발 DB, 통합 테스트 DB(`_test`로 끝남, TP-04) | 예 |
| backend | `DB_POOL_MAX` | 풀 최대 연결 수 | 아니오 |
| backend | `JWT_SECRET` | Access Token(HS384) 서명 키. 64자 이상 | 예 |
| backend | `BCRYPT_COST` | 해시 비용(R-03 조정용) | 아니오 |
| backend | `FRONTEND_ORIGIN` | CORS 허용 출처. 쉼표로 여러 개, 각 값은 경로·끝 슬래시 없는 출처 형식. 개발 기본 `http://localhost:5173`, 운영(`production`)은 필수(없으면 기동 실패) | 아니오 |
| frontend | `VITE_API_BASE_URL` | API 기준 URL. 다른 출처이므로 절대 URL(개발 `http://localhost:3000/api`, 운영은 API 출처 + `/api`) | 아니오 |

토큰 만료(Access 15분, Refresh 7일)는 env가 아니라 `lib/jwt.js`의 상수다(PP-22).

## 6. 디렉토리 구조

### 6.1 저장소 루트

```text
todolist-app/
├─ .claude/                 # skills/(develop-backend, develop-frontend), agents/, CLAUDE.md (기존)
├─ .editorconfig            # 공통 포맷 설정
├─ .gitignore               # .env, .env.* 무시, !.env.example 허용 (기존)
├─ .prettierrc              # 공통 Prettier 설정
├─ docs/                    # 1~9번 문서, schema.sql
├─ prompts/                 # 문서 생성 프롬프트 (기존)
├─ backend/                 # 6.3
├─ frontend/                # 6.2
└─ loadtest/                # k6 스크립트 (TP-08, INT-02에서 생성 예정)
```

루트에 `package.json`·워크스페이스를 두지 않는다. `backend/`와 `frontend/`는 각자 `package.json`·락파일을 가진 독립 패키지다(PP-01).

### 6.2 `frontend/`

```text
frontend/
├─ package.json  index.html  vite.config.ts  vitest.config.ts  tsconfig.json  eslint.config.js
├─ .env.example  .prettierignore
└─ src/
   ├─ main.tsx
   ├─ app/                    # 라우터·QueryClient(401 전역 처리)·가드·레이아웃
   │  ├─ router.tsx  queryClient.ts
   │  ├─ RequireAuth.tsx      # 미인증 → SC-02
   │  ├─ PublicOnly.tsx       # 로그인 상태에서 SC-01/02 접근 → SC-05 (WA-01)
   │  └─ AppLayout.tsx        # 공통 헤더 + 본문
   ├─ pages/                  # 라우트 단위 화면 조합
   │  ├─ SignupPage.tsx  LoginPage.tsx  ProfilePage.tsx  CategoriesPage.tsx
   │  └─ TodoListPage.tsx  TodoFormPage.tsx  CalendarPage.tsx
   ├─ features/
   │  ├─ auth/                # 가입·로그인 폼, useMe, 로그아웃
   │  ├─ profile/             # 이름 저장·비밀번호 변경 폼
   │  ├─ categories/          # 카테고리 목록·인라인 수정 훅·컴포넌트
   │  ├─ todos/               # 목록·필터 UI, 행, 폼, 훅, zod 스키마
   │  └─ calendar/            # 월·주·일 뷰, 막대 배치 순수 함수
   │      (각 기능: components/  hooks.ts  schemas.ts  index.ts. calendar는 순수 함수 calendar.ts)
   ├─ components/             # 도메인 무관 공통 UI
   │  ├─ layout/AppHeader.tsx
   │  └─ ui/                  # TextField, DateField, Button, ErrorBanner, Notice,
   │                          # ConfirmDialog, StatusBadge(StatusBar 포함), Pagination,
   │                          # EmptyState, NotFoundPanel
   ├─ api/                    # client.ts, auth.ts, users.ts, categories.ts, todos.ts, types.ts
   ├─ stores/                 # todoFilterStore.ts, calendarStore.ts, sessionStore.ts
   ├─ lib/                    # date.ts(todayLocal 등), limits.ts(AS-08 상수), routes.ts(화면 경로),
   │                          # messages.ts(공통 문구), queryKeys.ts(쿼리 키 팩토리, LP-11)
   ├─ styles/                 # tokens.css(스타일 가이드 자리), global.css
   └─ test/                   # setup.ts, server.ts(MSW), handlers.ts(메모리 가짜 백엔드), renderWithProviders.tsx
```

테스트 파일은 대상 옆에 `*.test.ts(x)`로 둔다(NP-07). 레이어 import 제한(2.2)과 `fetch` 직접 사용 금지(LP-08)는 `eslint.config.js`가 검사한다.

| 폴더 | 역할 |
|------|------|
| `app/` | 앱 조립. 인증 가드, 401 전역 처리, 공통 레이아웃 |
| `pages/` | 화면 1개 = 파일 1개. 기능 컴포넌트를 배치만 함 |
| `features/<기능>/` | 그 기능의 UI·훅·스키마. 외부에는 `index.ts`로만 노출 |
| `components/` | props 기반 공통 UI. API·스토어 접근 금지 |
| `api/` | `fetch` 래퍼, 리소스별 호출, 응답 타입 |
| `stores/` | Zustand UI 상태(LP-12) |
| `lib/` | 순수 유틸·상수 |
| `styles/` | 전역 스타일과 디자인 토큰(`9-style-guide.md` 3장 기준, PP-15) |
| `test/` | 테스트 공통 준비(MSW, 렌더 헬퍼) |

**화면·공통 컴포넌트 매핑**

| 와이어프레임 | 위치 |
|--------------|------|
| SC-01 회원가입 | `pages/SignupPage.tsx` + `features/auth` |
| SC-02 로그인(만료 안내 WA-21 포함) | `pages/LoginPage.tsx` + `features/auth`, 안내 플래그 `stores/sessionStore.ts` |
| SC-03 내 정보 | `pages/ProfilePage.tsx` + `features/profile` |
| SC-04 카테고리 관리 | `pages/CategoriesPage.tsx` + `features/categories` |
| SC-05 할일 목록(필터·토글·삭제·페이지) | `pages/TodoListPage.tsx` + `features/todos`, 필터는 `stores/todoFilterStore.ts` |
| SC-06 할일 등록/편집 | `pages/TodoFormPage.tsx` + `features/todos` (카테고리 선택은 `features/categories` 공개 훅 사용) |
| SC-07 캘린더(월/주/일) | `pages/CalendarPage.tsx` + `features/calendar`, 뷰·기준일은 `stores/calendarStore.ts` |
| 공통 헤더(3장, 로그아웃) | `components/layout/AppHeader.tsx` + `app/AppLayout.tsx` |
| 5.1 삭제 확인 다이얼로그 | `components/ui/ConfirmDialog.tsx` (SC-05, SC-04에서 사용) |
| 5.2 상태 배지 | `components/ui/StatusBadge.tsx` (SC-05, SC-07) |
| 5.3 date picker | `components/ui/DateField.tsx` (PP-13) |
| 5.4 오류 메시지 영역 | 필드 오류는 `TextField`·`DateField`의 `error` props, 영역 오류는 `components/ui/ErrorBanner.tsx` |
| 5.5 페이지 이동 | `components/ui/Pagination.tsx` |
| 5.6 빈 상태 | `components/ui/EmptyState.tsx` |
| 5.7 '찾을 수 없음' | `components/ui/NotFoundPanel.tsx` |
| 6장 반응형 | 컴포넌트별 CSS의 미디어 쿼리(768px 경계, WA-23) |

### 6.3 `backend/`

```text
backend/
├─ package.json  eslint.config.js  vitest.config.js
├─ .env.example  .prettierignore
├─ swagger.yaml             # API 명세(OpenAPI 3.0.3), 개발 환경에서 /api/docs로 열람
├─ migrations/              # 0001_init.sql, 0002_... (순번 SQL, SP-11)
├─ scripts/                 # migrate.js, seed-loadtest.js
├─ src/
│  ├─ server.js             # listen, graceful shutdown (커버리지 제외)
│  ├─ app.js                # Express 조립. supertest 대상
│  ├─ config/env.js
│  ├─ routes/               # index.js, auth/users/categories/todos/health .routes.js
│  ├─ validators/           # common.schemas.js(날짜·ID), <리소스>.schemas.js
│  ├─ controllers/          # <리소스>.controller.js
│  ├─ services/             # <리소스>.service.js (auth.service.js에 로그인 차단 포함)
│  ├─ repositories/         # <리소스>.repository.js (SQL), refreshTokens.repository.js
│  ├─ domain/               # todoStatus.js, dateString.js, limits.js
│  ├─ middlewares/          # auth.js(requireAuth: Access Token 검증; refresh·logout 경로에는 미적용), validate.js, errorHandler.js(notFound 포함)
│  ├─ db/                   # pool.js(풀+타입 파서), query.js(camelCase 변환, withTransaction)
│  └─ lib/                  # logger.js, errors.js(AppError), jwt.js(HS384 서명·검증, TTL 상수, 쿠키 옵션, Refresh 생성·해시), password.js, loginAttempts.js, pgError.js(23505 제약명 판별)
└─ tests/
   ├─ setup.js              # 테스트 DB 가드·마이그레이션·TRUNCATE(매 테스트 전)
   ├─ helpers/              # auth.js(가입·로그인 헬퍼), testDb.js(스키마 초기화)
   ├─ api/                  # <리소스>.test.js (supertest 통합 테스트)
   ├─ db/  migrations/  scripts/  config/   # 실제 DB·러너·env 테스트(TP-02 SQL 일치 포함)
   └─ lint.test.js  tz.test.js  setup.test.js
```

| 폴더 | 역할 |
|------|------|
| `migrations/` | 순번 SQL 스키마 이력. 적용 후 수정 금지 |
| `scripts/` | 마이그레이션 러너, 부하 테스트 시드 |
| `src/routes`~`repositories` | 2.1의 레이어 |
| `src/domain/` | 순수 규칙. 외부 import 없음 |
| `src/db/` | 풀·타입 파서·변환·트랜잭션 헬퍼 |
| `src/lib/` | 로거, 에러, JWT·Refresh Token·쿠키 옵션, 비밀번호 해시, 로그인 시도 기록, pg 오류(제약 위반) 판별 |
| `tests/` | 통합 테스트와 공통 준비 |

**테스트 파일 위치 규칙**

| ID | 규칙 |
|----|------|
| TP-16 | 단위 테스트는 대상 옆에 둔다(`src/domain/todoStatus.test.js`, `src/lib/date.test.ts`, `StatusBadge.test.tsx`). |
| TP-17 | 백엔드 HTTP 통합 테스트(HTTP + 실제 DB)는 `backend/tests/api/`에 리소스별로 둔다. 실제 DB가 필요한 비HTTP 테스트(TP-02 SQL 일치, 마이그레이션 러너, 시드 스크립트, env)는 `tests/db`·`tests/migrations`·`tests/scripts`·`tests/config`에 둔다. 서비스·리포지토리는 별도 모킹 테스트 없이 이 경로로 검증한다. |
| TP-18 | 프론트 화면 단위 테스트는 해당 기능 컴포넌트(`features/<기능>/components/`) 옆에 두고, 라우팅·가드 통합은 `app/App.test.tsx`에 둔다(페이지 고유 로직이 있으면 `pages/` 옆). MSW 핸들러·렌더 헬퍼는 `src/test/`에서 공유한다. |
| TP-19 | k6 스크립트는 `loadtest/`(INT-02에서 생성 예정), 수동 E2E는 `3-user-scenario.md`의 E2E-01·02 절차를 따른다. |

## 7. 가정·미결 사항

문서(도메인 v0.3, PRD v0.6, 시나리오 v0.5, 와이어프레임 v0.4)에 없던 결정이다. 기존 가정(AS/PA/SA/WA)과 구분해 PP로 기록한다.

| ID | 구분 | 내용 |
|----|------|------|
| PP-01 | 가정 | 패키지 매니저는 npm, Node.js는 LTS 최신 버전. 루트 `package.json`·워크스페이스 없이 `backend/`, `frontend/`가 독립 패키지다(LP-15, CP-01). |
| PP-02 | 해결 | 백엔드는 ESM(`"type": "module"`) + Express 5, 빌드 단계 없이 `node`로 직접 실행한다(개발은 `node --watch`, 환경 변수는 `--env-file`). → `node --watch --env-file=.env`로 확정(`backend/package.json`). |
| PP-03 | 해결 | 프론트 빌드·개발 서버는 Vite, 라우팅은 `react-router`. 개발 시에도 Vite 프록시를 쓰지 않고 `VITE_API_BASE_URL`로 백엔드를 직접 호출한다(CORS, PP-12). → 프록시 없음 확정(`vite.config.ts`, `api/client.ts`). |
| PP-04 | 해결 | 검증 라이브러리는 **zod**를 프론트·백엔드 양쪽에 쓴다(백엔드는 JS라 런타임 검증이 유일한 방어선). 스키마 공유 패키지는 만들지 않으며 각자 선언한다. 폼 라이브러리는 쓰지 않는다. → 확정(양쪽 zod v4, 폼 라이브러리 없음). |
| PP-05 | 해결 | 테스트 러너는 양쪽 모두 **Vitest**(`@vitest/coverage-v8`). 백엔드 통합 테스트는 실제 PostgreSQL 17 `_test` DB를 쓴다(로컬 설치 또는 컨테이너는 개발자 선택, TP-04). → 확정(`tests/setup.js`). |
| PP-06 | 해결 | 상태 판정 단일 출처는 백엔드다. 목록·캘린더 응답은 각 할일의 `status`를 포함하며, 이를 위해 해당 조회는 `today`를 필수 파라미터로 받는다. 프론트는 판정하지 않는다(LP-13). 상세 응답 형태는 API 명세에서 확정한다. → 목록 `{items, page, pageSize, totalCount}`, 캘린더 `{items}`, `status` 값은 `'시작 전'`·`'진행중'`·`'완료'`·`'기한 초과'`(`domain/todoStatus.js`). |
| PP-07 | 해결 | PK는 `integer` identity(SN-13의 숫자 ID 예시와 부합). `count` 등 `bigint`(OID 20)는 Number로 파싱한다. → `INTEGER GENERATED ALWAYS AS IDENTITY`로 확정(`0001_init.sql`), 건수는 `count(*)::int`로 받는다(NP-18). |
| PP-08 | 해결 | 이메일은 공백 제거·소문자로 정규화해 저장하고 고유 제약을 둔다(BR-03). 로그인 차단 집계 키도 같다. → zod `trim().toLowerCase()` + DB CHECK `ck_users_email_lower`로 확정. |
| PP-09 | 해결 | 로그인 시도 제한은 프로세스 메모리에 둔다. 서버 재시작 시 초기화되고 다중 인스턴스에서는 동작하지 않으며, 단일 서버 전제(PRD 8장)에서 허용한다. 확장 시 DB 테이블로 교체한다. 실패 기록은 마지막 실패 후 5분이 지나면 접근 시 삭제하고, 10,000개를 넘으면 만료분을 일괄 삭제한다(8번 문서 D-07). → 구현 확정(`lib/loginAttempts.js`). 동시 요청이 함께 차단 검사를 통과하지 못하도록 **비밀번호 비교 전에 실패로 먼저 집계하고 성공 시 초기화**한다(`auth.service.js`). |
| PP-10 | 해결 | `bcrypt`(네이티브)를 쓰며 기본 cost는 10, `BCRYPT_COST`로 조정한다(R-03). NFR-03이 미달이면 cost와 libuv 스레드 풀 크기(`UV_THREADPOOL_SIZE`)를 조정한다. 설치가 어려우면 `bcryptjs`로 대체하되 성능을 재측정한다. → 네이티브 `bcrypt` 설치 확정(`BCRYPT_COST` 4~31, 테스트는 4). |
| PP-11 | 해결 | 로그인 차단 응답은 429(`TOO_MANY_ATTEMPTS`), 인증 실패는 401(`INVALID_CREDENTIALS`), 미인증은 401(`UNAUTHENTICATED`)로 구분한다. 구체 코드 목록은 API 명세에서 확정한다. → `backend/swagger.yaml`의 `ErrorCode`로 확정(8번 문서 PRE-02). |
| PP-12 | 해결 | 개발·운영 모두 프론트와 API를 서로 다른 출처로 두고 CORS로 연결한다(프록시 미사용). 허용 출처는 환경 변수 `FRONTEND_ORIGIN`(쉼표로 여러 개, 운영 필수), `credentials: true`(SP-07, NFR-10). 인증 쿠키가 `SameSite=Lax`이므로 두 출처는 같은 사이트(등록 도메인이 같음)여야 한다. 예: 개발 `localhost:5173`↔`localhost:3000`, 운영 `app.example.com`↔`api.example.com`. 다른 사이트로 나누면 쿠키가 전송되지 않는다. |
| PP-13 | 해결 | date picker는 별도 라이브러리 없이 네이티브 `<input type="date">`를 `DateField`로 감싸 쓴다(값이 `YYYY-MM-DD` 문자열이라 CP-03과 맞음). 직접 입력은 브라우저 기본 동작대로 허용하고 `min`을 두지 않는다(8번 문서 D-03, 4번 문서 5.3·WA-13 갱신). 형식·역전 검증은 입력 방식과 무관하게 유지한다. |
| PP-14 | 해결 | 캘린더 월·주·일 뷰는 라이브러리 없이 직접 구현한다. R-01의 구현 순서(일 → 월 → 주)를 따르고, 기간 막대 배치는 `features/calendar`의 순수 함수로 두어 CV 표로 테스트한다. 캘린더 조회는 별도 리소스가 아니라 할일 기간 조회로 본다(API 명세에서 확정). → `backend/swagger.yaml`에서 `GET /api/todos/calendar`로 확정. |
| PP-15 | 해결 | 스타일 가이드는 `9-style-guide.md`로 확정했다. 공통 컴포넌트(`components/ui`)는 이 문서의 CSS 변수(`styles/tokens.css`, 3장)를 CSS Modules에서 `var(--...)`로 참조해 구현하며 색상 리터럴을 쓰지 않는다. 상태 색상은 라벨·모양·선 모양의 보조 수단이다(WA-19). |
| PP-16 | 해결 | 계획 문서는 `docs/8-plan.md`로 확정했고, 두 스킬(`develop-backend`, `develop-frontend`)의 참조 경로도 `docs/8-plan.md`로 수정했다(8번 문서 D-01). |
| PP-17 | 가정 | 브라우저 E2E 자동화(Playwright 등)는 도입하지 않고 E2E-01·02는 수동 점검한다(G-01). |
| PP-18 | 해결 | 본문(body)에 담긴 타인 소유 카테고리 ID는 존재하지 않는 ID와 같은 404로 처리한다(SN-07 1e의 '거부'를 NFR-06과 일치시킴). → 서비스 소유자 조회로 404, 조회와 쓰기 사이에 카테고리가 삭제된 경우의 FK 위반 23503(`fk_todos_category_id_user_id`)도 404로 확정(`todos.service.js`). |
| PP-19 | 가정 | 커밋 훅(husky 등), CI, 메트릭 엔드포인트는 두지 않는다. 품질 확인은 `lint`·`test:coverage` 수동 실행이다(NFR-12는 5xx 로그만 요구). 필요해지면 후속 결정한다. |
| PP-20 | 해결 | AS-08 길이 상수는 백엔드 `domain/limits.js`와 프론트 `lib/limits.ts`에 각각 둔다. AS-08은 '세부값은 구현 단계에서 확정'이므로 변경 시 양쪽을 함께 수정하고, 불일치하면 서버 판정이 우선한다. → 확정(비밀번호 최대 UTF-8 72바이트, 이메일 최대 255자 추가). |
| PP-21 | 해결 | 목록 응답은 페이지 번호 방식(WA-09)을 위해 전체 건수를 포함하는 것을 기본으로 한다. 불가하면 이전/다음만 둔다(API 명세에서 확정). → 전체 건수 `totalCount`를 포함하는 것으로 확정(`backend/swagger.yaml`). |
| PP-22 | 해결 | Access Token 페이로드는 `sub`(사용자 ID)·`iat`·`exp`만 담고, 비밀번호 변경 후에도 현재 세션을 유지한다(WA-06). 쿠키 이름은 `access_token`·`refresh_token`이다. 만료(Access 15분, Refresh 7일)는 env가 아니라 `lib/jwt.js` 상수다. → 확정(`lib/jwt.js`의 `ACCESS_TOKEN_TTL_SEC`·`REFRESH_TOKEN_TTL_SEC`). |
| PP-23 | 해결 | 비밀번호 변경 시 다른 기기의 Refresh Token은 폐기하지 않는다(PRD OQ-03, 8번 문서 D-18). 재사용 탐지(토큰 계열 폐기)는 하지 않는다(PA-01). |
