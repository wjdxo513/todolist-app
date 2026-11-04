# TodoList 스타일 가이드 (초안)

## 버전 이력

| 버전 | 일자 | 작성자 | 상태 | 요약 |
|------|------|--------|------|------|
| v0.1 | 2026-11-04 | jtaewu | 초안 | 최초 작성 (8번 문서 PRE-01) |

## 변경 이력

| 버전 | 일자 | 변경 섹션 | 구분 | 변경 내용 | 작성자 |
|------|------|-----------|------|-----------|--------|
| v0.1 | 2026-11-04 | 전체 | 신규 | 스타일 가이드 초안 작성 | jtaewu |

> 구분: 신규 / 추가 / 수정 / 삭제. 버전을 올릴 때는 '버전 이력'에 한 줄을 추가하고, 세부 변경 사항은 '변경 이력'에 섹션 단위로 기록한다.

> 본 문서는 `1-domain-definition.md`(v0.3), `4-wireframe.md`(v0.4), `5-project-principle.md`(v0.6), `8-plan.md`(v0.8)를 기준으로 한다. 화면 구성·상태 판정 규칙은 재정의하지 않고 해당 문서를 참조한다.

## 1. 개요

**범위:** 웹 우선, 모바일은 반응형만. 최소 폭 360px(NFR-08). CSS Modules + `frontend/src/styles/tokens.css`의 CSS 변수로 구현하며 UI 라이브러리·CSS 프레임워크·웹폰트를 쓰지 않는다(5번 문서 2.4).

**원칙:**
- 컴포넌트 CSS(`components/ui/*.module.css`)에는 색상 리터럴(`#hex`, `rgb(`)을 쓰지 않고 `var(--...)`만 쓴다(FE-04 검사).
- 값은 3장 표의 변수로만 참조한다. 표에 없는 값이 필요하면 이 문서에 먼저 추가한다.
- 다크 모드·테마 전환·애니메이션 체계·아이콘 세트는 두지 않는다.

## 2. 상태 표시 (WA-19)

상태는 **라벨 텍스트 + 모양 + 막대 선 모양**으로 구분하고, **색상은 이를 보조하는 수단**이다. 색상만으로 상태를 전달하지 않으며, 색상 없이도 4종이 구별되어야 한다. 라벨·모양·선 모양은 4번 문서 5.2를 따른다.

| 상태 | 라벨 / 모양 | 배지 배경 | 배지 글자 | 배지 테두리 | 막대 색 | 막대 선 모양 |
|------|-------------|-----------|-----------|-------------|---------|--------------|
| 시작 전 | 시작 전 / `( )` | `#F1F3F5` | `#495057` | `#ADB5BD` | `#868E96` | 점선 `dashed` |
| 진행중 | 진행중 / `(>)` | `#E7F1FF` | `#0B4F9E` | `#74A9E8` | `#1C6DD0` | 실선 `solid` |
| 완료 | 완료 / `(v)` | `#E6F4EA` | `#1E6B34` | `#7CC090` | `#2E8B4A` | 물결 `wavy` |
| 기한 초과 | 기한 초과 / `(!)` | `#FDECEA` | `#A61B1B` | `#E58A8A` | `#D32F2F` | 굵은 실선 `solid` (4px) |

- 막대 선 모양: 점선 `dashed` 2px, 실선 `solid` 2px, 물결 `wavy`(`text-decoration-style`) 2px, 굵은 선 `solid` 4px.
- **완료 변형:** 목록·캘린더의 제목에 취소선(`text-decoration: line-through`)을 더하고 글자색은 `--color-text-muted`로 한다. 배지 자체는 취소선 없이 `(v) 완료`로 둔다.
- 모바일 월·주 뷰 막대는 라벨 없이 모양과 선 모양만 쓴다(4번 문서 5.2).
- 상태 값은 화면에서 계산하지 않고 서버가 준 파생 상태를 표시만 한다(BR-13).

## 3. CSS 변수 (`styles/tokens.css`)

이름 규칙: `--{분류}-{이름}`. 분류는 `color`, `space`, `font`, `radius`, `shadow`, `layout`만 쓴다. 모두 `:root`에 선언한다. 아래 표의 이름·값을 그대로 옮긴다(FE-04 테스트가 이름·값 일치를 검사한다).

### 3.1 기본 색상

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-bg` | `#FFFFFF` | 카드·입력·다이얼로그 배경 |
| `--color-surface` | `#F8F9FA` | 페이지 배경 |
| `--color-text` | `#212529` | 본문 글자 |
| `--color-text-muted` | `#5C6570` | 보조 글자, 완료 제목 |
| `--color-border` | `#CED4DA` | 입력·카드·구분선 테두리 |
| `--color-primary` | `#1C6DD0` | 주 버튼 배경, 현재 페이지 강조 |
| `--color-primary-hover` | `#1559AB` | 주 버튼 hover |
| `--color-primary-text` | `#FFFFFF` | 주 버튼 글자 |
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

### 3.3 글꼴·간격·모서리·그림자·레이아웃

| 변수 | 값 | 용도 |
|------|----|------|
| `--font-family` | `system-ui, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif` | 시스템 글꼴 스택 |
| `--font-size-sm` | `0.875rem` | 오류 문구, 배지, 보조 글자 |
| `--font-size-md` | `1rem` | 본문, 입력, 버튼 |
| `--font-size-lg` | `1.25rem` | 다이얼로그·카드 제목 |
| `--font-size-xl` | `1.5rem` | 화면 제목 |
| `--font-weight-normal` | `400` | 본문 |
| `--font-weight-bold` | `700` | 제목, 버튼, 현재 페이지 |
| `--font-line-height` | `1.5` | 본문 행간 |
| `--space-1` | `4px` | 배지 안쪽 세로 여백 |
| `--space-2` | `8px` | 요소 사이 좁은 간격 |
| `--space-3` | `12px` | 버튼·입력 안쪽 여백 |
| `--space-4` | `16px` | 기본 간격, 카드 안쪽 여백 |
| `--space-5` | `24px` | 섹션 간격 |
| `--space-6` | `32px` | 화면 바깥 여백 |
| `--radius-sm` | `4px` | 배지, 입력 |
| `--radius-md` | `8px` | 버튼, 카드, 다이얼로그 |
| `--radius-pill` | `999px` | 캘린더 막대 끝 |
| `--shadow-dialog` | `0 8px 24px rgba(0, 0, 0, 0.2)` | 다이얼로그·date picker 팝업 |
| `--layout-max-width` | `960px` | 데스크톱 본문 최대 폭 |

변수는 총 52개(3.1: 17, 3.2: 16, 3.3: 19)다.

## 4. 컴포넌트 스타일 규칙

모든 값은 3장 변수를 참조한다. 특별한 언급이 없으면 글자 `--font-size-md`, 글꼴 `--font-family`.

| 대상 | 규칙 |
|------|------|
| 버튼 공통 | 안쪽 여백 `--space-3` `--space-4`, 모서리 `--radius-md`, 굵기 `--font-weight-bold`. 비활성은 `--color-disabled-bg`/`--color-disabled-text`, hover 효과 없음 |
| 주 버튼 | 배경 `--color-primary`, 글자 `--color-primary-text`, hover `--color-primary-hover` |
| 보조 버튼 | 배경 `--color-bg`, 글자 `--color-text`, 테두리 1px `--color-border`. 취소·편집 등에 사용 |
| 위험 버튼 | 배경 `--color-danger`, 글자 `--color-danger-text`, hover `--color-danger-hover`. 삭제 확인에만 사용 |
| 입력(기본) | 배경 `--color-bg`, 테두리 1px `--color-border`, 모서리 `--radius-sm`, 안쪽 여백 `--space-3`. 라벨은 입력 위, `--space-1` 간격 |
| 입력(오류) | 테두리를 `--color-error-border`로 바꾸고, 바로 아래에 `--font-size-sm`·`--color-error-text`로 `[!]` 접두 문구(4번 문서 5.4). 입력값은 지우지 않는다 |
| 배지 | `( ) 시작 전` 등 라벨 포함. 상태별 `--color-status-*-bg/-text/-border`, 테두리 1px, 모서리 `--radius-sm`, 안쪽 여백 `--space-1` `--space-2`, 글자 `--font-size-sm` |
| 캘린더 막대 | 색 `--color-status-*-bar`, 선 모양은 2장, 끝 모양 `--radius-pill`. 모양 기호는 막대 앞에 표기 |
| 다이얼로그 | 뒷배경 `--color-overlay`, 본체 `--color-bg`, 모서리 `--radius-md`, 그림자 `--shadow-dialog`, 안쪽 여백 `--space-5`, 제목 `--font-size-lg` 굵게, 버튼은 오른쪽 정렬 `취소`(보조)·`삭제`(위험), 간격 `--space-2`. 폭 최대 `420px`, 모바일은 좌우 `--space-4` 여백 |
| 오류 배너 | 배경 `--color-error-bg`, 글자 `--color-error-text`, 테두리 1px `--color-error-border`, 모서리 `--radius-sm`, 안쪽 여백 `--space-3` `--space-4`. 메시지가 있을 때만 표시 |
| 페이지네이션 | 번호·이전·다음은 보조 버튼 모양. 현재 페이지는 `--color-primary` 배경·`--color-primary-text`·굵게. 첫·마지막에서 이전·다음은 비활성 스타일. 모바일은 `현재 / 전체` 텍스트 |
| 빈 상태·찾을 수 없음 | 가운데 정렬, 문구 `--color-text-muted`, 부가 버튼과 `--space-4` 간격. 찾을 수 없음 제목은 `--font-size-lg` 굵게 |
| 페이지·본문 | 페이지 배경 `--color-surface`, 본문 `max-width: var(--layout-max-width)` 가운데 정렬, 바깥 여백 `--space-6`(모바일 `--space-4`). 카드는 `--color-bg`, 테두리 1px `--color-border`, `--radius-md` |

## 5. 반응형 (WA-23)

경계는 768px 하나다. 모바일 기본 스타일을 먼저 쓰고 데스크톱을 덮어쓰는 `min-width` 방식으로 통일한다. **CSS 변수는 미디어 쿼리 조건에 쓸 수 없으므로** 변수로 두지 않고 `768px`를 직접 쓴다.

```css
@media (min-width: 768px) { /* 데스크톱 규칙 */ }
```

최소 폭 360px에서 가로 스크롤이 생기지 않아야 한다. 구간별 레이아웃 변화는 4번 문서 6장을 따른다.

## 6. 5번 문서 PP-15를 해결로 바꿀 내용

5번 문서 자체는 이 Task에서 수정하지 않는다. 다음 갱신 때 아래 문구로 바꾼다.

- PP-15 구분: `미결` → `해결`
- PP-15 내용 제안: "스타일 가이드는 `9-style-guide.md`로 확정했다. 공통 컴포넌트(`components/ui`)는 이 문서의 CSS 변수(`styles/tokens.css`, 3장)를 CSS Modules에서 `var(--...)`로 참조해 구현하며 색상 리터럴을 쓰지 않는다. 상태 색상은 라벨·모양·선 모양의 보조 수단이다(WA-19)."
- 6장 트리 `styles/` 설명 제안: "전역 스타일과 디자인 토큰(`9-style-guide.md` 3장 기준)"

## 7. 가정

| ID | 내용 |
|----|------|
| SG-01 | 상태 4종 색상 값(2장 표)은 문서가 정하지 않아 새로 정했다. 시작 전 회색, 진행중 파랑, 완료 초록, 기한 초과 빨강 |
| SG-02 | 기본·오류·비활성·주/위험 색상(3.1)은 새로 정했다. 주 색상은 진행중 파랑 계열 |
| SG-03 | 글꼴은 시스템 글꼴 스택, 크기 4단계(14/16/20/24px), 굵기 2단계(400/700), 행간 1.5 |
| SG-04 | 간격은 4/8/12/16/24/32px 6단계, 모서리는 4/8px와 pill |
| SG-05 | 그림자는 다이얼로그·팝업용 1개만 둔다 |
| SG-06 | 본문 최대 폭 960px(변수), 다이얼로그 최대 폭 420px(한 곳에서만 쓰여 변수화하지 않음) |
| SG-07 | 막대 선 두께는 점선·실선·물결 2px, 굵은 선(기한 초과) 4px |
| SG-08 | 완료 변형은 제목 취소선 + `--color-text-muted`이며 배지에는 취소선을 쓰지 않는다 |
| SG-09 | 반응형은 `min-width: 768px` 한 가지 방식으로 통일한다(경계는 WA-23 가정 그대로) |
