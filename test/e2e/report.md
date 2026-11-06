# TodoList 통합 테스트(E2E) 리포트

| 항목 | 내용 |
|------|------|
| 실행일 | 2026-11-06 (오늘 = 2026-11-06 금, 실제 시스템 날짜) |
| 기준 문서 | `docs/3-user-scenario.md` v0.6 |
| 도구 | Playwright MCP (Chromium), 데스크톱 1280×800 / 모바일 390×844 |
| 대상 | 프론트엔드 Vite 개발 서버 `http://localhost:5173`, 백엔드 `http://localhost:3000/api` (CORS, 실제 PostgreSQL) |
| 방식 | 화면 조작은 UI로 수행. 직접 요청 검증(FR-13·BR-02·BR-08)과 대량 데이터 준비는 브라우저 안 `fetch`(쿠키 포함)로 수행. 토큰 만료는 쿠키 삭제로 재현 |
| 테스트 계정 | `e2e-u1@test.com`(최종 비밀번호 `NewPassw0rd!`), `e2e-u2@test.com` / `e2e-u3@test.com`(`Passw0rd!`), 잠금 확인용 `e2e-lock@test.com`(미가입) |

> 시나리오 문서의 날짜 예시(오늘 11-04)는 실행일(11-06)에 맞춰 같은 조건이 되도록 바꿔 입력했다.

## 1. 요약

| 구분 | 결과 |
|------|------|
| 시나리오 | **17개 중 17개 통과** (SN-01~15, E2E-01, E2E-02) |
| 미수행 | 5개 항목(아래 5장) |
| 앱 결함 | 없음 |
| 환경 이슈 | 1건: Vite 개발 서버가 오래된 모듈을 서빙해 필터가 동작하지 않음 → 파일 재저장으로 해소(4장 E-01) |
| 관찰 사항 | 1건 (4장 O-01, 낮음) |

## 2. 시나리오별 결과

| ID | 시나리오 | 결과 | 확인 내용 |
|----|----------|------|-----------|
| SN-01 | 회원가입 | 통과 | 정상 가입 후 로그인 화면 이동 + 안내(SA-01), 형식·길이·공백 이름 검증, 대소문자만 다른 중복 이메일 거부(409) |
| SN-02 | 로그인 및 실패 차단 | 통과 | 비밀번호 오류와 없는 이메일이 같은 401·같은 문구, 5회 실패 후 6번째 429 + 차단 문구, 쿠키 2종 `HttpOnly`·`SameSite=Lax` |
| SN-03 | 미인증·세션 만료 | 통과 | 쿠키 없이 `/todos` 진입 시 `/login`으로 이동, 사용 중 두 쿠키 만료 시 갱신 실패 후 "세션이 만료되었습니다" 안내 |
| SN-04 | 로그아웃 | 통과 | 204, 쿠키 2종 삭제, 뒤로가기·직접 접근 모두 `/login`, 이전 데이터 미노출, 폐기된 Refresh Token 재사용 시 401, DB `refresh_tokens` 행 수가 로그인 시 1→2, 로그아웃 시 2→1 |
| SN-05 | 내 정보 수정 | 통과 | 이메일 읽기 전용, 이름 51자 거부, 이름 변경이 헤더에 반영, 직접 요청의 `email`은 무시, 현재 비밀번호 불일치·8자 미만 거부, 변경 후 세션 유지(D-18), 이전 비밀번호 로그인 실패·새 비밀번호 성공 |
| SN-06 | 카테고리 관리 | 통과 | 추가, 중복 이름 거부(추가·수정 모두), 21자 거부, 이름 수정, 기본 카테고리는 UI 버튼 없음 + 직접 요청 409, 삭제 확인 취소 시 변화 없음, 삭제 시 소속 할일이 기본으로 이동하고 총수 6건 유지 |
| SN-07 | 할일 등록 | 통과 | 필수 3항목 누락, 종료일<시작일, 제목 101자·메모 1,001자 모두 요청 없이 거부, 하루짜리(시작=종료) 허용, 미선택 시 기본 카테고리 |
| SN-08 | 할일 수정 | 통과 | 편집 화면에 현재 값 채움, 종료일<시작일 거부, 제목·기간·카테고리('선택 안 함' → 기본) 변경, 기간 변경으로 진행중 → 시작 전 재판정 |
| SN-09 | 완료 처리·해제 | 통과 | 완료 시 '완료', 새로고침 후 유지, 해제 시 기한 초과(ST-10)·시작 전(ST-11)으로 재판정, '완료' 필터에서 사라짐 |
| SN-10 | 할일 삭제 | 통과 | 확인 다이얼로그, 취소 시 유지, 확인 시 목록·캘린더에서 제거, 삭제된 ID 편집 화면은 '찾을 수 없음' |
| SN-11 | 목록 조회·필터 | 통과 | 종료일 오름차순, 상태 필터, 카테고리 AND 상태, 빈 결과 문구, 52건 중 1페이지 50건·2페이지 2건(종료일 마지막 2건) |
| SN-12 | 캘린더 | 통과 | 첫 진입 월 뷰(D-13), 월·주·일 전환, 이전·다음·오늘 이동, 범위 밖 기간은 겹친 날만 표시, 한 날짜 4건 → 막대 3개 + `+1건`, 클릭 시 그 날짜 일 뷰(4건 모두), 빈 달 문구 |
| SN-13 | 타인 할일 접근 차단 | 통과 | 타인 ID와 없는 ID(999999)·`abc`에 대해 조회(`GET`)·수정(`PUT`)·완료(`PATCH …/completion`)·삭제(`DELETE`) 모두 같은 404·같은 본문, 타인 카테고리로 등록·이동(`PUT`)·카테고리 수정 404, 목록 유출 없음, 상대(U2)의 할일은 변경 없음 |
| SN-14 | 메모 | 통과 | 등록·수정·새로고침 후 유지, 1,000자 저장, 1,001자 거부 |
| SN-15 | Access Token 자동 갱신 | 통과 | `access_token`만 삭제 후 이동 → `GET /categories 401`, `GET /todos 401` → **`POST /auth/refresh` 1회** → 두 요청 재시도 200, 화면 유지. 갱신 후 쿠키 2종이 다시 설정되고 `refresh_token` 값이 교체됨 |
| E2E-01 | 가입 → 첫 할일 → 캘린더 → 완료 | 통과 | UI만 사용, 가입부터 등록 화면까지 화면 전환 3회(`/signup` → `/login` → `/todos` → `/todos/new`, G-04 충족), 기본 카테고리 자동 생성 |
| E2E-02 | 공용 PC 로그아웃 | 통과 | SN-04와 같은 흐름으로 확인. 뒤로가기 화면에 이전 사용자 할일 없음 |

## 3. 주요 화면 및 엣지케이스 캡처

### 3.1 회원가입·로그인 (SN-01, SN-02)

| 회원가입 | 입력 검증(1b) |
|---|---|
| ![회원가입](screenshots/01-signup.png) | ![검증](screenshots/02-signup-validation.png) |
| **가입 완료 → 로그인 안내(SA-01)** | **대소문자만 다른 중복 이메일(1a)** |
| ![가입완료](screenshots/03-signup-done-login.png) | ![중복](screenshots/04-signup-duplicate.png) |
| **로그인 실패(1a·1b 같은 문구)** | **5회 실패 후 차단(1c, 429)** |
| ![실패](screenshots/05-login-fail.png) | ![차단](screenshots/06-login-locked.png) |

### 3.2 할일 목록·필터 (SN-07, SN-09, SN-11)

| 첫 진입 빈 목록 | 등록 후 목록(종료일 오름차순) |
|---|---|
| ![빈목록](screenshots/07-todos-empty.png) | ![목록](screenshots/14-todo-list.png) |
| **카테고리 '업무' AND '진행중'** | **조건에 맞는 할일 없음(2a)** |
| ![AND](screenshots/15-filter-and.png) | ![빈결과](screenshots/16-filter-empty.png) |
| **'완료' 필터** | |
| ![완료](screenshots/17-filter-done.png) | |

### 3.3 할일 등록·수정·삭제 (SN-07, SN-08, SN-10, SN-14)

| 등록 화면 | 필수 항목 누락(1a) |
|---|---|
| ![등록](screenshots/10-todo-new.png) | ![필수](screenshots/11-todo-required.png) |
| **종료일 < 시작일(1b)** | **제목 101자·메모 1,001자(1d, SN-14 1a)** |
| ![역순](screenshots/12-todo-end-before-start.png) | ![길이](screenshots/13-todo-length-limit.png) |
| **편집 화면(현재 값 채움)** | **메모 수정 후 새로고침** |
| ![편집](screenshots/18-todo-edit.png) | ![메모](screenshots/19-todo-memo.png) |
| **삭제 확인(BR-11)** | **삭제된 ID 접근(2b)** |
| ![삭제확인](screenshots/26-delete-confirm.png) | ![삭제됨](screenshots/27-deleted-not-found.png) |

### 3.4 캘린더 (SN-12)

| 월 뷰(오늘 표시, `+1건`) | 주 뷰 |
|---|---|
| ![월](screenshots/20-calendar-month.png) | ![주](screenshots/21-calendar-week.png) |
| **일 뷰** | **`+1건` 클릭 → 그 날짜 일 뷰(4건)** |
| ![일](screenshots/22-calendar-day.png) | ![플러스](screenshots/25-calendar-plus-day.png) |
| **이전 달(10월, 범위와 일부만 겹친 기간)** | **할일 없는 달(빈 상태 문구)** |
| ![이전달](screenshots/23-calendar-prev-month.png) | ![빈달](screenshots/24-calendar-empty-month.png) |
| **할일이 많은 달(U2, 52건)** | |
| ![많음](screenshots/40-calendar-many.png) | |

### 3.5 카테고리 (SN-06)

| 카테고리 목록(기본은 수정·삭제 불가) | 중복 이름(1a) |
|---|---|
| ![카테고리](screenshots/09-categories.png) | ![중복](screenshots/08-category-duplicate.png) |
| **삭제 확인(할일 이동 안내)** | **삭제 후 '기본' 필터(이동된 할일)** |
| ![삭제확인](screenshots/28-category-delete-confirm.png) | ![이동](screenshots/29-default-filter-after-delete.png) |

### 3.6 내 정보 (SN-05)

| 내 정보 | 현재 비밀번호 불일치(3a) | 저장·변경 완료 |
|---|---|---|
| ![내정보](screenshots/30-profile.png) | ![불일치](screenshots/31-profile-wrong-current.png) | ![완료](screenshots/32-profile-saved.png) |

### 3.7 인증·세션 (SN-03, SN-04, SN-13, SN-15, E2E-02)

| 자동 갱신 후 화면 유지(SN-15) | 세션 만료 안내(SN-03 1a) |
|---|---|
| ![갱신](screenshots/33-auto-refresh.png) | ![만료](screenshots/34-session-expired.png) |
| **로그아웃 직후** | **로그아웃 후 뒤로가기(E2E-02 3)** |
| ![로그아웃](screenshots/35-logout.png) | ![뒤로](screenshots/36-logout-back.png) |
| **타인 할일 편집 URL 직접 진입(SN-13 1a)** | |
| ![타인](screenshots/37-other-user-not-found.png) | |

### 3.8 페이지 이동 (SN-11 1a)

| 1페이지(50건) 하단 | 2페이지(2건) |
|---|---|
| ![1페이지](screenshots/38-pagination.png) | ![2페이지](screenshots/39-pagination-page2.png) |

### 3.9 E2E-01 신규 사용자 흐름

| 첫 할일 저장 후 목록 | 캘린더 확인 | 완료 처리 후 '완료' 필터 |
|---|---|---|
| ![첫할일](screenshots/44-e2e01-first-todo.png) | ![캘린더](screenshots/45-e2e01-calendar.png) | ![완료](screenshots/46-e2e01-done.png) |

### 3.10 모바일(390px)

| 할일 목록(카드형, 상태 선택 드롭다운) | 캘린더 | 메뉴 |
|---|---|---|
| ![모바일목록](screenshots/41-mobile-todos.png) | ![모바일캘린더](screenshots/42-mobile-calendar.png) | ![메뉴](screenshots/43-mobile-menu.png) |

가로 스크롤 없음(`scrollWidth ≤ innerWidth`) 확인.

## 4. 발견 사항

| ID | 구분 | 심각도 | 내용 | 조치 |
|----|------|--------|------|------|
| E-01 | 환경 | - | 첫 필터 실행에서 상태·카테고리 필터가 바뀌지 않았다. 콘솔에 `ReferenceError: logger is not defined` (`todoFilterStore.ts`). 디스크의 소스에는 `import { logger }`가 있었으나, Vite 개발 서버가 편집 도중 상태의 변환본을 계속 서빙하고 있었다(Windows 파일 감시 누락). | 파일을 다시 저장(touch)해 재변환시킨 뒤 같은 테스트를 재실행해 통과. 스토어 단위 테스트 6건도 통과. 코드 결함 아님. 개발 서버를 오래 띄워 둔 채 파일을 셸로 편집했다면 서버 재시작 권장 |
| O-01 | 관찰 | 낮음 | 세션 만료(SN-03 1a) 시 `GET /todos/calendar 401 → POST /auth/refresh 401`이 2번 반복된다. 첫 실패 후 `client.clear()`로 캐시가 비워지면서, 아직 마운트된 캘린더 쿼리가 화면 이동 전에 한 번 더 요청하는 것으로 보인다. 사용자에게 보이는 결과(안내 1회 + 로그인 이동)는 정상 | 필요 시 `app/queryClient.ts`에서 이동 후 clear 하는 순서로 바꾸는 것을 검토 |

콘솔의 나머지 오류는 모두 의도한 실패 요청(401·404·409·429)에 대한 브라우저 기본 로그와 개발 모드 `[api]` 경고였다.

## 5. 미수행 항목

| 시나리오 | 항목 | 사유 |
|----------|------|------|
| SN-02 | 1d 차단 5분 경과 후 성공, 1f 5분 경과 후 실패 횟수 초기화 | 실제 5분 대기가 필요. 백엔드 단위 테스트(시계 주입)로 대체 |
| SN-11 | 1b 날짜가 바뀐 뒤 재판정 | 시스템 날짜 변경이 필요 |
| SN-15 | 2c 여러 탭 동시 갱신 | 한계 수용 항목(D-17) |
| SN-02 | SA-10 여러 기기 독립 세션 | 단일 브라우저 컨텍스트로 수행. 비밀번호 변경 후 현재 세션 유지만 확인 |
| - | 15분 실제 만료 | `access_token` 쿠키 삭제로 대체 재현 |

## 6. 테스트 후 데이터

개발 DB에 위 테스트 계정과 할일이 남아 있다(U1 할일 6건·카테고리 2개, U2 할일 52건, U3 할일 1건). 재실행하려면 계정 이메일을 바꾸거나 해당 사용자를 삭제한다.

## 7. 정정 (2026-11-06 문서 대조 중)

최초 실행에서 SN-13의 '수정'과 '타인 카테고리로 이동'을 `PATCH /api/todos/{id}`로 요청했다. 이 경로는 없어서(수정은 `PUT`) 404가 소유권 검사가 아닌 라우트 부재 때문일 수 있었다. `PUT`으로 다시 요청해 타인 ID·없는 ID·`abc`·타인 카테고리 지정이 모두 같은 404이고 U2 데이터가 바뀌지 않음을 확인했다. 결론은 같다. 재확인 중 U1의 '지난 과제 제출'을 `categoryId` 없이 `PUT`으로 저장해 이 할일의 카테고리가 '기본'으로 바뀌었다(BR-07 동작대로).
