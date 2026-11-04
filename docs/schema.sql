-- =====================================================================
-- TodoList 데이터베이스 스키마 (PostgreSQL 17)
-- 근거: docs/7-erd.md v0.4 (테이블 명세 4장, 제약·인덱스 5장, ER-01~16)
-- 네이밍: docs/5-project-principle.md NP-08~11 (SQL 키워드 대문자)
--
-- 실행 예:
--   createdb todolist
--   psql -d todolist -v ON_ERROR_STOP=1 -f docs/schema.sql
--
-- 운영 반영은 backend/migrations/NNNN_*.sql 순번 마이그레이션으로 한다(SP-11).
-- 이 파일은 빈 DB에 전체 스키마를 한 번에 만드는 기준본이다.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- users: 사용자 (BR-03, AS-05, AS-08)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id            INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,                 -- ER-02
    password_hash TEXT         NOT NULL,                 -- bcrypt, LP-06
    name          VARCHAR(50)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_email       UNIQUE (email),                 -- BR-03
    CONSTRAINT ck_users_email_lower CHECK (email = lower(email))    -- PP-08, ER-02
);

-- ---------------------------------------------------------------------
-- categories: 카테고리 (BR-06, BR-08, BR-09, AS-04)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    id         INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    INTEGER     NOT NULL,
    name       VARCHAR(20) NOT NULL,
    is_default BOOLEAN     NOT NULL DEFAULT false,

    CONSTRAINT fk_categories_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,  -- ER-06
    CONSTRAINT uq_categories_user_id_name UNIQUE (user_id, name),        -- BR-09, ER-08
    CONSTRAINT uq_categories_id_user_id   UNIQUE (id, user_id)           -- 복합 FK 대상, ER-03
);

-- 사용자당 기본 카테고리 최대 1개. 최소 1개는 가입 트랜잭션이 보장한다(ER-12).
CREATE UNIQUE INDEX uq_categories_user_id_default
    ON categories (user_id)
    WHERE is_default;

-- ---------------------------------------------------------------------
-- todos: 할일. 상태(status)는 저장하지 않고 조회 시 파생한다(BR-13).
-- ---------------------------------------------------------------------
CREATE TABLE todos (
    id           INTEGER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      INTEGER       NOT NULL,
    category_id  INTEGER       NOT NULL,                  -- BR-07
    title        VARCHAR(100)  NOT NULL,                  -- BR-04
    memo         VARCHAR(1000),                           -- 선택(FR-12), 빈 값은 NULL(ER-11)
    start_date   DATE          NOT NULL,                  -- AS-01
    end_date     DATE          NOT NULL,
    is_completed BOOLEAN       NOT NULL DEFAULT false,    -- 유일한 저장 상태 값
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),    -- 서비스가 UPDATE 시 now()로 설정(ER-09)

    CONSTRAINT fk_todos_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,  -- ER-06
    -- 카테고리 존재 + 할일·카테고리 소유자 일치(ER-03). 삭제는 이동 후에만 가능(BR-10, ER-04).
    CONSTRAINT fk_todos_category_id_user_id
        FOREIGN KEY (category_id, user_id) REFERENCES categories (id, user_id) ON DELETE RESTRICT,
    CONSTRAINT ck_todos_end_date_gte_start_date
        CHECK (end_date >= start_date)                                    -- BR-05, 같은 날 허용
);

-- 목록: WHERE user_id ORDER BY end_date, created_at, id LIMIT 50 (FR-06, ER-05)
-- 캘린더: WHERE user_id AND end_date >= 범위시작 AND start_date <= 범위끝 (FR-10, ER-07)
CREATE INDEX idx_todos_user_id_end_date_created_at_id
    ON todos (user_id, end_date, created_at, id);

-- 카테고리 필터, BR-10 할일 이동, 카테고리 삭제 시 FK 참조 검사
CREATE INDEX idx_todos_user_id_category_id
    ON todos (user_id, category_id);

-- ---------------------------------------------------------------------
-- refresh_tokens: 로그인 세션(Refresh Token). 로그인마다 1행(PA-01).
-- 원문은 저장하지 않고 SHA-256 해시(hex 64자)만 저장한다(ER-13).
-- ---------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id         INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    INTEGER     NOT NULL,
    token_hash CHAR(64)    NOT NULL,                      -- SHA-256 hex, ER-13
    expires_at TIMESTAMPTZ NOT NULL,                      -- 로그인 후 7일, 갱신 시 이어받음(ER-14)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash),         -- 갱신·로그아웃 조회 키
    CONSTRAINT fk_refresh_tokens_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT   -- ER-06
);

-- 로그인 시 그 사용자의 만료 행 정리, FK 참조 검사(ER-16)
CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);

-- ---------------------------------------------------------------------
-- schema_migrations: 마이그레이션 적용 이력 (SP-11, ER-10)
-- ---------------------------------------------------------------------
CREATE TABLE schema_migrations (
    filename   TEXT        PRIMARY KEY,                   -- 예: 0001_init.sql
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
