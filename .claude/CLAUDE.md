# todolist-app의 최상위 지침

## 반드시 지켜야 할 지침

- 모든 응답은 한국어로 할 것
- 오버엔지니어링 금지

## 프로젝트의 디렉토리 구조

- 백엔드 : backend/
- 프론트엔드 : frontend/
- 문서 : docs/

## 문서 목록

경로는 저장소 루트 기준. 필요할 때 해당 문서를 읽을 것.

| 문서                     | 경로                          | 내용                                          |
| ------------------------ | ----------------------------- | --------------------------------------------- |
| 도메인 정의서            | `docs/1-domain-definition.md` | 용어, 비즈니스 규칙(BR), 상태 판정            |
| PRD                      | `docs/2-PRD.md`               | 기능·비기능 요구사항(FR/NFR), 범위            |
| 사용자 시나리오          | `docs/3-user-scenario.md`     | 화면 흐름별 시나리오(SN)                      |
| 와이어프레임             | `docs/4-wireframe.md`         | 화면(SC) 구성과 요소                          |
| 프로젝트 구조 설계 원칙  | `docs/5-project-principle.md` | 폴더 구조, 네이밍, API·에러 규칙(PP/NP/LP/SP) |
| 기술 아키텍처 다이어그램 | `docs/6-arch-diagram.md`      | 구성도, 인증·주요 흐름 시퀀스                 |
| ERD                      | `docs/7-erd.md`               | 테이블·제약·인덱스 명세(ER)                   |
| DB 스키마                | `docs/schema.sql`             | PostgreSQL 17 DDL 기준본                      |
| 작업 실행 계획           | `docs/8-plan.md`              | Task 목록·선행 조건, 미결 결정(D)             |
| 스타일 가이드            | `docs/9-style-guide.md`       | 색상·상태 표시, CSS 변수(tokens.css), 컴포넌트 규칙 |
| API 명세                 | `backend/swagger.yaml`        | OpenAPI 3.0.3, 엔드포인트·요청/응답·에러 code |
