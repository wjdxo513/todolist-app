# TodoList 스타일 가이드 (초안)

## 버전 이력

| 버전 | 일자 | 작성자 | 상태 | 요약 |
|------|------|--------|------|------|
| v0.1 | 2026-11-04 | jtaewu | 초안 | 최초 작성 (8번 문서 PRE-01) |
| v0.2 | 2026-11-05 | jtaewu | 초안 | 참고 캘린더 화면(이미지) 검토 반영: 보라 주 색상, 캘린더·헤더·세그먼트 버튼 규칙, 조밀한 크기 체계 |
| v0.3 | 2026-11-05 | jtaewu | 초안 | 프론트 구현(FE-01~17) 대조 반영: 주 색상 사용처, 안내 배너·작은 버튼·일 뷰 목록 규칙 추가, 캘린더·헤더·입력 세부 규칙과 리터럴 값 정리 |

## 변경 이력

| 버전 | 일자 | 변경 섹션 | 구분 | 변경 내용 | 작성자 |
|------|------|-----------|------|-----------|--------|
| v0.1 | 2026-11-04 | 전체 | 신규 | 스타일 가이드 초안 작성 | jtaewu |
| v0.2 | 2026-11-05 | 머리말 | 수정 | 기준 문서 버전 갱신(5번 v0.8, 8번 v0.13), 참고 이미지 출처 기록 | jtaewu |
| v0.2 | 2026-11-05 | 1장 | 추가 | 시각 방향(1.1) | jtaewu |
| v0.2 | 2026-11-05 | 2장 | 수정 | 캘린더 막대를 블록형(사각, 20px)으로 변경, 선 모양 적용 방법 명시 | jtaewu |
| v0.2 | 2026-11-05 | 3장 | 수정 | 주 색상 파랑 → 보라, 모서리 4/8px·pill → 2/4px, 변수 추가(주 색상 연한 배경, 캘린더 4종, 그리드 선, 글자 xs, 헤더 높이, 넓은 본문 폭), `--radius-pill` 삭제. 총 52 → 60개 | jtaewu |
| v0.2 | 2026-11-05 | 4장 | 추가 | 공통 헤더·내비, 강조 보조 버튼, 세그먼트 버튼(월/주/일), 캘린더 그리드·날짜 칸·이동 버튼 규칙 | jtaewu |
| v0.2 | 2026-11-05 | 6장 | 삭제 | PP-15 갱신 제안(5번 v0.6에 반영 완료). 가정 표를 7장 → 6장으로 이동 | jtaewu |
| v0.2 | 2026-11-05 | 6장 | 추가 | SG-10~SG-15, SG-02·03·04·06 수정 | jtaewu |
| v0.3 | 2026-11-05 | 머리말 | 수정 | 기준 문서 버전 갱신(4번 v0.5, 5번 v0.9, 8번 v0.15) | jtaewu |
| v0.3 | 2026-11-05 | 1.1 | 수정 | 주 색상 사용처를 구현 기준으로 확대(강조 보조 버튼·링크·포커스·안내 배너 등) | jtaewu |
| v0.3 | 2026-11-05 | 4장 | 추가 | 작은 버튼, 안내 배너, 일 뷰 목록 규칙 | jtaewu |
| v0.3 | 2026-11-05 | 4장 | 수정 | 주 버튼 예외, 입력(라벨·포커스·읽기 전용·힌트), 헤더·내비 배치, 세그먼트 마크업·크기, 이동 버튼(정사각 → 작은 버튼), 캘린더 상단 줄 모바일 배치, 그리드(주 뷰 높이·요일 표기), 날짜 칸 `(오늘)`, 막대 좌우 1px, 오류 배너 글자, 표 대상에서 일 뷰 제외 | jtaewu |
| v0.3 | 2026-11-05 | 5장 | 수정 | 360px 월 뷰 칸 폭 약 48px → 약 43px, JS 모바일 판정 예외 명시 | jtaewu |
| v0.3 | 2026-11-05 | 6장 | 수정 | SG-06에 한 곳에서만 쓰는 리터럴 값 추가 | jtaewu |

> 구분: 신규 / 추가 / 수정 / 삭제. 버전을 올릴 때는 '버전 이력'에 한 줄을 추가하고, 세부 변경 사항은 '변경 이력'에 섹션 단위로 기록한다.

> 본 문서는 `1-domain-definition.md`(v0.4), `4-wireframe.md`(v0.5), `5-project-principle.md`(v0.9), `8-plan.md`(v0.15)를 기준으로 한다. 화면 구성·상태 판정 규칙은 재정의하지 않고 해당 문서를 참조한다. v0.2는 사용자가 제공한 웹 캘린더 서비스의 월간 화면 캡처(2026-11-05)를 시각 참고로 삼았으며, 해당 서비스의 로고·명칭·아이콘은 쓰지 않는다.

## 1. 개요

**범위:** 웹 우선, 모바일은 반응형만. 최소 폭 360px(NFR-08). CSS Modules + `frontend/src/styles/tokens.css`의 CSS 변수로 구현하며 UI 라이브러리·CSS 프레임워크·웹폰트를 쓰지 않는다(5번 문서 2.4).

**원칙:**
- 컴포넌트 CSS(`components/ui/*.module.css`)에는 색상 리터럴(`#hex`, `rgb(`)을 쓰지 않고 `var(--...)`만 쓴다(FE-04 검사).
- 값은 3장 표의 변수로만 참조한다. 표에 없는 값이 필요하면 이 문서에 먼저 추가한다.
- 다크 모드·테마 전환·애니메이션 체계·아이콘 세트는 두지 않는다.
- 글자색은 배경 대비 4.5:1 이상으로 한다(3장 값은 이 기준으로 골랐다).

### 1.1 시각 방향 (참고 이미지 검토 결과)

| 참고 화면의 특징 | 이 앱에 적용 | 적용하지 않음 (이유) |
|------------------|--------------|----------------------|
| 흰 배경 + 가는 회색 선으로 나뉜 조밀한 업무형 화면 | 페이지·카드 흰 배경, 그리드 선 `--color-grid-line`, 작은 글자(12~14px) 위주 | - |
| 보라 계열 단일 강조색(주 버튼, 선택된 보기 전환, 현재 메뉴) | `--color-primary` 보라. 주 버튼·강조 보조 버튼·세그먼트 선택·현재 메뉴·현재 페이지·링크·키보드 포커스·입력 포커스 테두리·안내 배너 테두리에 사용 | 상태 색으로는 쓰지 않는다(상태와 혼동 방지) |
| 이어 붙은 `일간/주간/월간` 버튼, 선택 항목만 채움 | 월/주/일 전환을 세그먼트 버튼으로(4장) | - |
| 날짜를 가로질러 이어지는 사각형 일정 막대 | 캘린더 막대를 블록형(20px, 모서리 2px)으로 | 단일 주황 채움(색만으로 구분, WA-19 위반) → 상태별 연한 배경 + 선 모양 |
| 오늘 칸: 진한 테두리 + 연한 푸른 배경 | `--color-calendar-today-*` | - |
| 일요일 빨간 글자, 이번 달 밖 날짜 흐린 글자 | `--color-calendar-sunday`, `--color-calendar-outside` | 토요일 별도 색, 음력·공휴일 표기(요구사항 없음) |
| 작은 사각 이동 버튼 `< >` + `오늘` | 이동 버튼 규칙(4장) | - |
| 왼쪽 사이드바(미니 달력·캘린더 목록) | - | 와이어프레임은 상단 헤더 내비 구조(4번 문서 3장) |

## 2. 상태 표시 (WA-19)

상태는 **라벨 텍스트 + 모양 + 막대 선 모양**으로 구분하고, **색상은 이를 보조하는 수단**이다. 색상만으로 상태를 전달하지 않으며, 색상 없이도 4종이 구별되어야 한다. 라벨·모양·선 모양은 4번 문서 5.2를 따른다.

| 상태 | 라벨 / 모양 | 배지 배경 | 배지 글자 | 배지 테두리 | 막대 색 | 막대 선 모양 |
|------|-------------|-----------|-----------|-------------|---------|--------------|
| 시작 전 | 시작 전 / `( )` | `#F1F3F5` | `#495057` | `#ADB5BD` | `#868E96` | 점선 `dashed` |
| 진행중 | 진행중 / `(>)` | `#E7F1FF` | `#0B4F9E` | `#74A9E8` | `#1C6DD0` | 실선 `solid` |
| 완료 | 완료 / `(v)` | `#E6F4EA` | `#1E6B34` | `#7CC090` | `#2E8B4A` | 물결 `wavy` |
| 기한 초과 | 기한 초과 / `(!)` | `#FDECEA` | `#A61B1B` | `#E58A8A` | `#D32F2F` | 굵은 실선 `solid` (4px) |

- 막대 선 두께: 점선·실선·물결 2px, 굵은 선 4px.
- **캘린더 막대(블록형):** 높이 20px, 모서리 `--radius-sm`, 배경 `--color-status-*-bg`, 글자 `--color-status-*-text`. 선 모양은 막대 아래쪽에 `--color-status-*-bar` 색으로 넣는다. 점선·실선·굵은 선은 `border-bottom`이고, 물결은 CSS 테두리로 만들 수 없으므로 막대 요소에 `text-decoration: underline wavy`(두께 2px)를 적용한다.
- **완료 변형:** 목록·캘린더의 제목에 취소선(`text-decoration: line-through`)을 더하고 글자색은 `--color-text-muted`로 한다. 물결 밑줄은 막대 요소에, 취소선은 안쪽 제목 요소에 둔다. 배지 자체는 취소선 없이 `(v) 완료`로 둔다.
- 모바일 월·주 뷰 막대는 라벨 없이 모양과 선 모양만 쓴다(4번 문서 5.2).
- 상태 값은 화면에서 계산하지 않고 서버가 준 파생 상태를 표시만 한다(BR-13).

## 3. CSS 변수 (`styles/tokens.css`)

이름 규칙: `--{분류}-{이름}`. 분류는 `color`, `space`, `font`, `radius`, `shadow`, `layout`만 쓴다. 모두 `:root`에 선언한다. 아래 표의 이름·값을 그대로 옮긴다(FE-04 테스트가 이름·값 일치를 검사한다).

### 3.1 기본 색상

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-bg` | `#FFFFFF` | 카드·입력·다이얼로그·헤더 배경 |
| `--color-surface` | `#F8F9FA` | 페이지 배경 |
| `--color-text` | `#212529` | 본문 글자 |
| `--color-text-muted` | `#5C6570` | 보조 글자, 완료 제목 |
| `--color-border` | `#CED4DA` | 입력·카드·버튼 테두리 |
| `--color-grid-line` | `#E9ECEF` | 캘린더 그리드·표 행·헤더 아래 구분선 |
| `--color-primary` | `#5B4FE9` | 주 버튼 배경, 세그먼트 선택, 현재 메뉴·페이지 강조 (흰 글자 대비 5.6:1) |
| `--color-primary-hover` | `#4A3DD4` | 주 버튼 hover |
| `--color-primary-text` | `#FFFFFF` | 주 버튼 글자 |
| `--color-primary-subtle` | `#EFEDFD` | 강조 보조 버튼 hover, 내비 hover 배경 |
| `--color-danger` | `#C62828` | 위험 버튼 배경 |
| `--color-danger-hover` | `#A61B1B` | 위험 버튼 hover |
| `--color-danger-text` | `#FFFFFF` | 위험 버튼 글자 |
| `--color-error-bg` | `#FDECEA` | 오류 배너 배경 |
| `--color-error-text` | `#A61B1B` | 오류 문구 글자(필드·배너) |
| `--color-error-border` | `#E58A8A` | 오류 배너·오류 입력 테두리 |
| `--color-disabled-bg` | `#E9ECEF` | 비활성 버튼 배경 |
| `--color-disabled-text` | `#868E96` | 비활성 버튼 글자 |
| `--color-overlay` | `rgba(0, 0, 0, 0.5)` | 다이얼로그 뒷배경 |

### 3.2 상태 색상 (2장)

| 변수 | 값 |
|------|----|
| `--color-status-todo-bg` | `#F1F3F5` |
| `--color-status-todo-text` | `#495057` |
| `--color-status-todo-border` | `#ADB5BD` |
| `--color-status-todo-bar` | `#868E96` |
| `--color-status-progress-bg` | `#E7F1FF` |
| `--color-status-progress-text` | `#0B4F9E` |
| `--color-status-progress-border` | `#74A9E8` |
| `--color-status-progress-bar` | `#1C6DD0` |
| `--color-status-done-bg` | `#E6F4EA` |
| `--color-status-done-text` | `#1E6B34` |
| `--color-status-done-border` | `#7CC090` |
| `--color-status-done-bar` | `#2E8B4A` |
| `--color-status-overdue-bg` | `#FDECEA` |
| `--color-status-overdue-text` | `#A61B1B` |
| `--color-status-overdue-border` | `#E58A8A` |
| `--color-status-overdue-bar` | `#D32F2F` |

### 3.3 캘린더 색상

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-calendar-today-bg` | `#EEF3FA` | 오늘 날짜 칸 배경 |
| `--color-calendar-today-border` | `#343A40` | 오늘 날짜 칸 테두리(1px) |
| `--color-calendar-sunday` | `#C92A2A` | 일요일 요일 머리글·날짜 숫자 (대비 5.5:1) |
| `--color-calendar-outside` | `#6C757D` | 월 뷰에서 이번 달 밖 날짜 숫자 (대비 4.7:1) |

### 3.4 글꼴·간격·모서리·그림자·레이아웃

| 변수 | 값 | 용도 |
|------|----|------|
| `--font-family` | `system-ui, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif` | 시스템 글꼴 스택 |
| `--font-size-xs` | `0.75rem` | 캘린더 막대 제목, 날짜 숫자, `[+N건]` |
| `--font-size-sm` | `0.875rem` | 오류 문구, 배지, 보조 글자, 세그먼트·이동 버튼, 내비 |
| `--font-size-md` | `1rem` | 본문, 입력, 버튼 |
| `--font-size-lg` | `1.25rem` | 다이얼로그·카드 제목, 캘린더 범위 제목 |
| `--font-size-xl` | `1.5rem` | 화면 제목 |
| `--font-weight-normal` | `400` | 본문 |
| `--font-weight-bold` | `700` | 제목, 버튼, 현재 메뉴·페이지 |
| `--font-line-height` | `1.5` | 본문 행간 |
| `--space-1` | `4px` | 배지 안쪽 세로 여백, 막대 사이 간격 |
| `--space-2` | `8px` | 요소 사이 좁은 간격 |
| `--space-3` | `12px` | 버튼·입력 안쪽 여백 |
| `--space-4` | `16px` | 기본 간격, 카드 안쪽 여백 |
| `--space-5` | `24px` | 섹션 간격 |
| `--space-6` | `32px` | 화면 바깥 여백 |
| `--radius-sm` | `2px` | 배지, 캘린더 막대, 세그먼트·이동 버튼 |
| `--radius-md` | `4px` | 버튼, 입력, 카드, 다이얼로그 |
| `--shadow-dialog` | `0 8px 24px rgba(0, 0, 0, 0.2)` | 다이얼로그·date picker 팝업 |
| `--layout-header-height` | `56px` | 공통 헤더 높이 |
| `--layout-max-width` | `960px` | 데스크톱 본문 최대 폭(SC-03~06) |
| `--layout-max-width-wide` | `1280px` | 캘린더(SC-07) 본문 최대 폭 |

변수는 총 60개(3.1: 19, 3.2: 16, 3.3: 4, 3.4: 21)다.

## 4. 컴포넌트 스타일 규칙

모든 값은 3장 변수를 참조한다. 특별한 언급이 없으면 글자 `--font-size-md`, 글꼴 `--font-family`.

| 대상 | 규칙 |
|------|------|
| 버튼 공통 | 안쪽 여백 `--space-2` `--space-4`, 모서리 `--radius-md`, 굵기 `--font-weight-bold`. 비활성은 `--color-disabled-bg`/`--color-disabled-text`, hover 효과 없음. 키보드 포커스는 `outline: 2px solid var(--color-primary)`, `outline-offset: 2px` |
| 주 버튼 | 배경 `--color-primary`, 글자 `--color-primary-text`, hover `--color-primary-hover`. 화면당 1개가 원칙(예: `[ + 새 할일 ]`, `[ 저장 ]`). 같은 동작의 반복(SC-05 빈 상태의 `[ + 새 할일 ]`)과 인라인 편집 행의 `[ 저장 ]`(SC-04)은 예외 |
| 작은 버튼 | 버튼 공통에 높이 최소 28px, 안쪽 여백 0 `--space-3`, 글자 `--font-size-sm`, 모서리 `--radius-sm`. 변형(보조·주)은 그대로 적용. 헤더 `[ 로그아웃 ]`, 표 행 작업 버튼(편집·삭제·수정·저장·취소), 페이지네이션, 캘린더 이동 버튼에 사용 |
| 보조 버튼 | 배경 `--color-bg`, 글자 `--color-text`, 테두리 1px `--color-border`. 취소·편집 등에 사용 |
| 강조 보조 버튼 | 배경 `--color-bg`, 글자 `--color-primary`, 테두리 1px `--color-primary`, hover 배경 `--color-primary-subtle`. 주 버튼 옆 두 번째 동작(예: 비밀번호 변경) |
| 위험 버튼 | 배경 `--color-danger`, 글자 `--color-danger-text`, hover `--color-danger-hover`. 삭제 확인에만 사용 |
| 입력(기본) | 배경 `--color-bg`, 테두리 1px `--color-border`, 모서리 `--radius-md`, 안쪽 여백 `--space-2` `--space-3`. 라벨은 데스크톱·모바일 모두 입력 위, `--space-1` 간격, 글자 `--font-size-sm` 굵게. 텍스트 입력은 포커스 시 테두리 `--color-primary` + 키보드 포커스 `outline: 2px solid var(--color-primary)`, `outline-offset: 1px`. 드롭다운(`select`)은 테두리 변화 없이 공통 키보드 포커스(offset 2px)만 적용하며, SC-05 필터 드롭다운은 안쪽 여백 `--space-1` `--space-3`. 읽기 전용은 배경 `--color-surface`, 글자 `--color-text-muted`. 힌트·글자 수 카운터는 입력 아래 `--font-size-sm`·`--color-text-muted`, 접두 없음 |
| 입력(오류) | 테두리를 `--color-error-border`로 바꾸고, 입력 아래(힌트·카운터가 있으면 그 아래)에 `--font-size-sm`·`--color-error-text`로 `[!]` 접두 문구(4번 문서 5.4). 입력값은 지우지 않는다 |
| 배지 | `( ) 시작 전` 등 라벨 포함. 상태별 `--color-status-*-bg/-text/-border`, 테두리 1px, 모서리 `--radius-sm`, 안쪽 여백 `--space-1` `--space-2`, 글자 `--font-size-sm` |
| 공통 헤더 | 높이 `--layout-header-height`, 배경 `--color-bg`, 아래 1px `--color-grid-line`, 좌우 여백 `--space-6`(모바일 `--space-4`). 왼쪽 앱 이름(`--font-size-lg` 굵게)과 그 오른쪽 내비, 오른쪽 끝 사용자 이름(`--color-text-muted`, `--font-size-sm`)과 `[ 로그아웃 ]`(작은 보조 버튼). 모바일은 `[=]`(테두리 1px `--color-border`, 모서리 `--radius-sm`, 안쪽 여백 `--space-1` `--space-2`, `--font-size-sm`)·앱 이름·로그아웃. 헤더 오류 영역은 헤더 바로 아래 오류 배너 |
| 내비 항목 | 글자 `--font-size-sm`, hover 배경 `--color-primary-subtle`. 데스크톱은 헤더 높이를 채우고 좌우 여백 `--space-3`, 현재 항목은 글자 `--color-primary`·굵게 + 아래 2px `--color-primary` 선(색만으로 구분하지 않도록 선을 함께 쓴다). 모바일 세로 메뉴는 안쪽 여백 `--space-3` `--space-4`, 현재 항목은 왼쪽 2px `--color-primary` 선. `aria-current="page"` |
| 세그먼트 버튼 (월/주/일, SC-05 상태 필터 데스크톱) | 항목을 간격 없이 이어 붙이고 바깥 테두리 1px `--color-border`, 항목 사이 1px `--color-border`, 양끝 모서리 `--radius-sm`. 항목: 배경 `--color-bg`, 글자 `--color-text`·`--font-size-sm`. 선택 항목: 배경·테두리 `--color-primary`, 글자 `--color-primary-text`, 굵게. 크기는 SC-05 상태 필터가 안쪽 여백 `--space-1` `--space-3`, 캘린더 보기 전환이 높이 28px·최소 폭 44px(안쪽 여백은 브라우저 기본). 마크업은 라디오 그룹(캘린더: `role="radiogroup"`/`aria-checked`, SC-05: `fieldset`·`legend` + 화면에서 숨긴 네이티브 radio)으로 두어 와이어프레임의 단일 선택 라디오 의미를 유지한다 |
| 이동 버튼 (`<` `>` `오늘`) | 작은 보조 버튼(높이 최소 28px, 좌우 여백 `--space-3`이라 `<` `>`도 정사각이 아님). 묶음 안 간격 `--space-1`. `<` `>`는 `aria-label`("이전 달"·"다음 주"·"이전 날" 등 뷰 단위)을 단다 |
| 캘린더 상단 줄 | 데스크톱: 왼쪽 이동 버튼 묶음, 가운데 범위 제목(`--font-size-lg` 굵게), 오른쪽 세그먼트 버튼. 모바일: 1행에 이동 버튼 묶음(왼쪽)과 세그먼트 버튼(오른쪽), 2행에 범위 제목(가운데). 줄 아래 `--space-4` 간격. 상단 줄과 그리드는 카드(안쪽 여백 `--space-4`, 모바일 `--space-3`) 안에 둔다 |
| 캘린더 그리드 (월·주 뷰) | 바깥과 칸 사이 선 1px `--color-grid-line`, 칸 배경 `--color-bg`. 월 뷰 요일 머리글 줄은 `--font-size-sm`·`--color-text-muted`, 일요일은 `--color-calendar-sunday`. 주 뷰는 요일 머리글 줄 없이 날짜 칸에 `일 11/01` 형식으로 표기(데스크톱 `--font-size-sm`). 막대 줄은 날짜 칸 표기 줄(24px, 주 뷰 데스크톱 28px) + 막대 3줄(각 24px) + `[+N건]` 줄(20px)로 고정. 칸 최소 높이는 월 뷰 96px(모바일 64px), 주 뷰 데스크톱 160px(모바일 64px) |
| 날짜 칸 | 날짜 숫자는 칸 왼쪽 위, `--font-size-xs`, 안쪽 여백 `--space-1` `--space-2`. 일요일 숫자 `--color-calendar-sunday`, 이번 달 밖 숫자 `--color-calendar-outside`. 오늘 칸은 배경 `--color-calendar-today-bg` + 테두리 1px `--color-calendar-today-border` + 숫자 굵게 + 숫자 뒤 `(오늘)`(`--color-text-muted`, 데스크톱·모바일 공통)으로 색만으로 구분하지 않는다. hover 시 배경 `--color-surface`, 클릭 가능함을 `cursor: pointer`로 표시 |
| 캘린더 막대 | 2장 블록형 규칙. 막대는 날짜 칸 경계를 넘어 이어 그리고(막대 칸 좌우 1px 여백), 막대 사이 세로 간격 `--space-1`. 안쪽 여백 0 `--space-1`, 글자 `--font-size-xs`, 한 줄 말줄임(`text-overflow: ellipsis`). 모양 기호를 제목 앞에 표기. 범위 밖으로 이어지면 해당 끝에 `<` `>` 표시하고 그쪽 모서리는 0. `[+N건]`은 막대 아래 `--font-size-xs`·`--color-text-muted` 링크 |
| 다이얼로그 | 뒷배경 `--color-overlay`, 본체 `--color-bg`, 모서리 `--radius-md`, 그림자 `--shadow-dialog`, 안쪽 여백 `--space-5`, 제목 `--font-size-lg` 굵게, 버튼은 오른쪽 정렬 `취소`(보조)·`삭제`(위험), 간격 `--space-2`. 폭 최대 `420px`, 모바일은 좌우 `--space-4` 여백. 열리면 `취소`에 먼저 포커스, Esc는 취소와 같다 |
| 오류 배너 | 배경 `--color-error-bg`, 글자 `--color-error-text`·`--font-size-sm`, 테두리 1px `--color-error-border`, 모서리 `--radius-md`, 안쪽 여백 `--space-3` `--space-4`, `[!]` 접두. 메시지가 있을 때만 표시 |
| 안내 배너 | 오류 배너와 같은 여백·모서리·글자 크기. 배경 `--color-primary-subtle`, 글자 `--color-text`, 테두리 1px `--color-primary`, `(i)` 접두, `role="status"`. 메시지가 있을 때만 표시(SC-02 가입 완료·세션 만료, SC-03 저장 완료) |
| 표 (SC-05 목록) | 머리글 배경 `--color-surface`, 글자 `--font-size-sm`·굵게. 행 구분선 1px `--color-grid-line`, 행 안쪽 여백 `--space-2` `--space-3`, 행 hover 배경 `--color-surface` |
| 일 뷰 목록 (SC-07) | 머리글 없는 목록. 항목마다 상태 배지·제목 링크(`--color-primary`, 밑줄, 완료는 취소선 + `--color-text-muted`)·카테고리·기간(`--font-size-sm`·`--color-text-muted`)을 한 줄에 두고 좁으면 줄바꿈. 항목 아래 1px `--color-grid-line`, 안쪽 여백 `--space-3` |
| 페이지네이션 | 번호·이전·다음은 보조 버튼 모양. 현재 페이지는 `--color-primary` 배경·`--color-primary-text`·굵게. 첫·마지막에서 이전·다음은 비활성 스타일. 모바일은 `현재 / 전체` 텍스트 |
| 빈 상태·찾을 수 없음 | 가운데 정렬, 문구 `--color-text-muted`, 부가 버튼과 `--space-4` 간격. 찾을 수 없음 제목은 `--font-size-lg` 굵게 |
| 페이지·본문 | 페이지 배경 `--color-surface`, 본문 `max-width: var(--layout-max-width)`(캘린더는 `--layout-max-width-wide`) 가운데 정렬, 바깥 여백 `--space-6`(모바일 `--space-4`). 카드는 `--color-bg`, 테두리 1px `--color-border`, `--radius-md` |

## 5. 반응형 (WA-23)

경계는 768px 하나다. 모바일 기본 스타일을 먼저 쓰고 데스크톱을 덮어쓰는 `min-width` 방식으로 통일한다. **CSS 변수는 미디어 쿼리 조건에 쓸 수 없으므로** 변수로 두지 않고 `768px`를 직접 쓴다.

```css
@media (min-width: 768px) { /* 데스크톱 규칙 */ }
```

JS에서 모바일 여부를 판정할 때(캘린더 막대 제목 생략·탭 동작)는 같은 경계를 `(max-width: 767px)`로 쓴다. 이 통일 규칙은 CSS에만 적용한다.

최소 폭 360px에서 가로 스크롤이 생기지 않아야 한다. 구간별 레이아웃 변화는 4번 문서 6장을 따른다. 360px 월 뷰에서 날짜 칸은 약 43px((360 − 본문 여백 32 − 캘린더 카드 여백 24 − 그리드 테두리 2) ÷ 7)이므로 막대는 제목 없이 모양·선 모양만 표시한다(2장).

## 6. 가정

| ID | 내용 |
|----|------|
| SG-01 | 상태 4종 색상 값(2장 표)은 문서가 정하지 않아 새로 정했다. 시작 전 회색, 진행중 파랑, 완료 초록, 기한 초과 빨강 |
| SG-02 | 기본·오류·비활성·위험 색상(3.1)은 새로 정했다. 주 색상은 v0.2에서 참고 이미지의 보라 계열로 바꿨다(SG-10) |
| SG-03 | 글꼴은 시스템 글꼴 스택, 크기 5단계(12/14/16/20/24px), 굵기 2단계(400/700), 행간 1.5 |
| SG-04 | 간격은 4/8/12/16/24/32px 6단계, 모서리는 2/4px 2단계(SG-12) |
| SG-05 | 그림자는 다이얼로그·팝업용 1개만 둔다 |
| SG-06 | 본문 최대 폭 960px, 캘린더 1280px(변수). 다이얼로그 최대 폭 420px, 작은 버튼 높이 28px, 월 뷰 칸 최소 높이 96/64px, 인증 카드 최대 폭 420px, 할일 폼 640px, 내 정보 560px, 목록 열 폭(48/140/120/136px), 완료 체크박스 18px, 라벨 높이 맞춤 여백 26px(SC-04), 캘린더 줄 높이 24/28/20px·주 뷰 칸 최소 높이 160px·세그먼트 최소 폭 44px은 한 곳에서만 쓰여 변수화하지 않음 |
| SG-07 | 막대 선 두께는 점선·실선·물결 2px, 굵은 선(기한 초과) 4px |
| SG-08 | 완료 변형은 제목 취소선 + `--color-text-muted`이며 배지에는 취소선을 쓰지 않는다 |
| SG-09 | 반응형은 `min-width: 768px` 한 가지 방식으로 통일한다(경계는 WA-23 가정 그대로) |
| SG-10 | 주 색상을 진행중 파랑과 다른 보라로 두어, 주 버튼·선택 표시와 상태 색이 섞여 보이지 않게 했다 |
| SG-11 | 참고 이미지의 단일 색 채움 막대는 색만으로 정보를 주므로 쓰지 않고, 블록 모양만 가져와 상태 연한 배경 + 선 모양으로 표시한다(WA-19) |
| SG-12 | 참고 이미지의 각진 모서리를 따라 모서리를 2/4px로 줄이고 pill을 없앴다 |
| SG-13 | 토요일 색, 음력·공휴일 표시는 요구사항에 없어 두지 않는다 |
| SG-14 | 왼쪽 사이드바·미니 달력은 와이어프레임(상단 헤더 내비)과 달라 채택하지 않는다 |
| SG-15 | 세그먼트 버튼은 보기 전환(월/주/일)과 SC-05 데스크톱 상태 필터에 쓴다. 상태 필터는 '전체' 포함 5항목이며 모바일은 드롭다운(4번 문서 6장) |
