# 운영 배포 스모크 테스트 리포트

| 항목 | 내용 |
| --- | --- |
| 수행일 | 2026-11-06 |
| 대상 | 프론트 `https://todolist-app-wfa9.vercel.app` (Vercel), 백엔드 `https://todolist-app-iota-one.vercel.app` (Vercel, 프론트 `/api` 프록시 경유), DB Supabase |
| 배포 커밋 | `995e33a` (Fallback UI 포함) |
| 도구 | Playwright MCP (Chromium, 1280×900 · 390×844) |
| 기준 | `docs/3-user-scenario.md` 핵심 흐름(SN-01~SN-15) |
| 테스트 계정 | `smoke-1793942179381@test.com` (테스트 중 비밀번호 변경) |

## 1. 요약

- 15개 시나리오의 핵심 경로 **전부 통과**. 운영 환경에서 앱 결함은 발견되지 않았다.
- 인증 쿠키는 프록시 덕분에 프론트 도메인의 1st-party 쿠키로 저장된다(`HttpOnly`, `Secure`, `SameSite=Lax`, refresh는 `Path=/api/auth`).
- 개선 권장 1건: 응답 시간(S-01, 아래 3장).

## 2. 시나리오별 결과

| 시나리오 | 확인 내용 | 결과 | 캡처 |
| --- | --- | --- | --- |
| SN-01 회원가입 | 빈 값 제출 시 필드별 오류 3건, 정상 가입 후 로그인 화면 이동 | 통과 | 01 |
| SN-02 로그인 | 틀린 비밀번호 → "이메일 또는 비밀번호가 올바르지 않습니다.", 정상 로그인 → `/todos` | 통과 | 02, 03 |
| SN-03 미인증 접근 | 로그아웃 후 `/calendar` 직접 접근 → `/login` | 통과 | 18 |
| SN-04 로그아웃 | 쿠키 2개 모두 삭제, 이후 `/api/users/me` 401 | 통과 | - |
| SN-05 내 정보 | 이름 변경이 헤더에 반영. 현재 비밀번호 틀림 → 오류 표시 후 두 칸 비움. 정상 변경 후 이전 비밀번호 로그인 거부, 새 비밀번호 로그인 성공 | 통과 | 16, 17 |
| SN-06 카테고리 | 추가 2건, 중복 이름 → "이미 같은 이름의 카테고리가 있습니다.", 이름 변경, 삭제 확인창 후 소속 할일이 '기본'으로 이동(BR-10) | 통과 | 05, 12 |
| SN-07 할일 등록 | 빈 값 → 제목·시작일·종료일 오류, 종료일 < 시작일 → 오류, 정상 등록 3건 | 통과 | 04, 06 |
| SN-08 할일 수정 | 제목·종료일 변경이 목록에 반영 | 통과 | 10 |
| SN-09 완료 처리·해제 | 체크 → (v) 완료·취소선, 해제 → 진행중 복귀 | 통과 | 08 |
| SN-10 할일 삭제 | 확인창 취소 시 유지, 확인 시 삭제 | 통과 | 11 |
| SN-11 목록·필터 | 상태 판정(기한 초과·진행중·시작 전), 종료일 순 정렬, 상태 필터(완료·기한 초과), 카테고리 필터 | 통과 | 07, 09 |
| SN-12 캘린더 | 월(여러 날 막대가 주를 넘어 이어짐), 주, 일 뷰 | 통과 | 13, 14, 15 |
| SN-13 타인 할일 차단 | 다른 계정의 할일 ID로 GET·PUT·DELETE → 모두 404 `NOT_FOUND`, 데이터 변경 없음 | 통과 | - |
| SN-14 메모 | 줄바꿈 포함 메모가 편집 화면에 그대로 보존 | 통과 | 10 |
| SN-15 토큰 자동 갱신 | access 쿠키 삭제 후 이동 → `401 /todos/calendar` → `204 /auth/refresh` → 재요청 성공, refresh 토큰 교체됨 | 통과 | - |
| 모바일 390px | 목록 카드형·상태 선택 콤보, 캘린더 아이콘 표시, 가로 스크롤 없음 | 통과 | 19, 20 |

## 3. 발견 사항

| ID | 심각도 | 내용 | 권장 |
| --- | --- | --- | --- |
| S-01 | 낮음(성능) | API 응답이 약 430ms(DB를 안 쓰는 `/api/health`도 동일, 첫 요청은 콜드 스타트로 약 1.3s). 함수가 미국 동부(`iad1`)에서 실행되고 DB는 시드니(`ap-southeast-2`)에 있어 한국 사용자 기준 왕복이 길다. 완료 체크처럼 서버 응답을 기다리는 동작이 느리게 느껴진다 | Vercel 백엔드 프로젝트의 Function Region을 DB와 가까운 곳(예: `syd1`, 또는 DB를 서울로 옮기고 `icn1`)으로 맞춘다 |

콘솔 오류는 모두 의도된 응답(미로그인 401, 검증 400, 중복 409, SN-13 404)이었다.

## 4. 캡처

| 번호 | 화면 |
| --- | --- |
| 01 | ![](screenshots/01-signup-done-login.png) 가입 후 로그인 화면 |
| 02 | ![](screenshots/02-login-fail.png) 로그인 실패 |
| 03 | ![](screenshots/03-todos-empty.png) 빈 목록 |
| 04 | ![](screenshots/04-todo-form-validation.png) 날짜 역순 오류 |
| 05 | ![](screenshots/05-category-duplicate.png) 카테고리 중복 |
| 06 | ![](screenshots/06-todo-form-filled.png) 할일 등록 입력 |
| 07 | ![](screenshots/07-todos-list.png) 목록(상태 3종) |
| 08 | ![](screenshots/08-todo-completed.png) 완료 처리 |
| 09 | ![](screenshots/09-filter-completed.png) 완료 필터 · ![](screenshots/09-filter-overdue.png) 기한 초과 필터 |
| 10 | ![](screenshots/10-todo-edit-memo.png) 편집 화면 메모 |
| 11 | ![](screenshots/11-delete-confirm.png) 삭제 확인 |
| 12 | ![](screenshots/12-category-delete-confirm.png) 카테고리 삭제 확인 |
| 13 | ![](screenshots/13-calendar-month.png) 캘린더 월 |
| 14 | ![](screenshots/14-calendar-week.png) 캘린더 주 |
| 15 | ![](screenshots/15-calendar-day.png) 캘린더 일 |
| 16 | ![](screenshots/16-profile-wrong-password.png) 현재 비밀번호 불일치 |
| 17 | ![](screenshots/17-profile-password-changed.png) 비밀번호 변경 완료 |
| 18 | ![](screenshots/18-guard-to-login.png) 미인증 접근 → 로그인 |
| 19 | ![](screenshots/19-mobile-todos.png) 모바일 목록 |
| 20 | ![](screenshots/20-mobile-calendar.png) 모바일 캘린더 |

## 5. 미수행

- 로그인 5회 실패 차단(SN-02 1d~1f): 테스트 계정이 5분간 잠기고 시간 경과가 필요해 제외(로컬 E2E·백엔드 테스트로 확인됨).
- 페이지 이동(SN-11, 21건 이상 필요), 실제 15분 access 만료 대기, Chromium 외 브라우저.
- Fallback UI(`ErrorPanel`) 실제 노출: 정상 운영 중에는 오류를 일으킬 수 없어 확인하지 않음(단위 테스트로 확인).

## 6. 테스트 후 운영 DB에 남은 데이터

- 계정 `smoke-1793942179381@test.com` (이름 '스모크2'), 카테고리 '업무', 할일 2건('스모크 진행중(수정)', '스모크 임시카테').
- 계정 삭제 기능이 없어 남겨 두었다. 지우려면 Supabase에서 `todos`·`categories`·`refresh_tokens`의 해당 `user_id` 행을 먼저 지운 뒤 `users` 행을 지운다(외래 키가 `ON DELETE RESTRICT`, ER-06).
