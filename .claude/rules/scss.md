# SCSS Rules

## 구조

- 일반 컴포넌트: `<style lang="scss" scoped>` 필수
- **레이아웃 컴포넌트** (AppHeader, AppSidebar 등): `assets/styles/layout/` 글로벌 SCSS 파일에 스타일 작성, 컴포넌트에 `<style>` 태그 없음
- **페이지 전용 컴포넌트** (Chat, Agent 등): `assets/styles/page/_[도메인].scss` 글로벌 SCSS 파일에 스타일 작성, 컴포넌트에 `<style>` 태그 없음
- BEM 사용 안 함 — SCSS 중첩으로 부모-자식 관계 표현
- `scoped`가 스코프를 잡아주므로 클래스 충돌 없음

## 스타일 파일 배치 기준

| 분류 | 스타일 위치 | `<style>` 태그 | 예시 |
|------|-------------|----------------|------|
| 일반 컴포넌트 | 컴포넌트 내 `<style lang="scss" scoped>` | O | `UiButton.vue`, `UiInput.vue` |
| 레이아웃 컴포넌트 | `assets/styles/layout/_[이름].scss` | X | `AppHeader` → `_header.scss` |
| 페이지 전용 컴포넌트 | `assets/styles/page/_[도메인].scss` | X | `Chat*` → `_chat.scss` |
| Radix-vue 포탈 | 컴포넌트 내 global `<style>` 블록 추가 | O (scoped + global 분리) | `UiSelect.vue` |

### 페이지 전용 스타일 규칙

- 한 도메인의 컴포넌트 + 페이지 스타일을 **하나의 SCSS 파일**로 통합
- 파일 생성 후 `assets/styles/main.scss`에 `@use './page/[도메인]';` 등록
- 컴포넌트에 `<style>` 태그 작성하지 않음

```
assets/styles/page/
├── _home.scss      # pages/chat/index.vue (채팅 홈)
├── _chat.scss      # components/chat/* + pages/chat/[id].vue
└── _agent.scss     # components/agent/* + pages/agents/*
```

## 공통 클래스 재사용 원칙

- 같은 도메인 SCSS 파일 내에서 **동일한 스타일이 반복되면 공통 클래스로 통합** — 컴포넌트마다 별도 클래스 만들지 않음
- 예: 섹션 타이틀이 Agent 유형/기본 설정/데이터셋에서 동일하면 `.agent-setting-section-title` 하나로 통일
- 공통 클래스 목록: 타이틀(`-section-title`), 라벨(`-label`), 설명(`-desc`), 필드 행(`-field-row`), 힌트(`-hint`)
- **새 컴포넌트 추가 시**: 기존 공통 클래스로 커버 가능한지 먼저 확인 → 불가능할 때만 새 클래스 생성

## 클래스 네이밍

- 블록 (최상위): kebab-case → `.chat-message`, `.agent-card`
- 자식 요소: SCSS 중첩 → `.chat-message { .avatar { } }`
- 상태: `is-/has-` 접두사 → `&.is-active`, `&.is-open`, `&.has-error`
- 타입 변형: `type-` 접두사 → `&.type-green`, `&.type-blue`
- 크기 변형: `size-` 접두사 → `&.size-sm`, `&.size-lg`
- 그룹 요소: `-grp` 접미사 → `.action-grp`, `.gauge-grp`

## 디자인 토큰 사용 필수

- **테마 색상은 CSS 변수 사용 필수**: 테마 변경 시 동적 반영을 위해 `$color-primary`(SCSS 변수) 대신 `var(--color-primary)`(CSS 변수) 사용
  - `$color-primary` → `var(--color-primary)`
  - `$color-primary-hover` → `var(--color-primary-hover)`
  - `$color-primary-dark` → `var(--color-primary-dark)`
  - `$color-primary-bg` → `var(--color-primary-bg)`
  - SCSS 변수는 컴파일 시 고정값으로 변환되어 테마 변경이 반영되지 않음
- 색상: `var(--color-primary)`, `$color-text-primary`, `$color-border` 등
- 간격: `$spacing-xs(4px)`, `$spacing-sm(8px)`, `$spacing-md(16px)`, `$spacing-lg(24px)`, `$spacing-xl(32px)`
- 폰트: `$font-size-sm(14px)`, `$font-size-base(16px)`, `$font-size-lg(18px)`
- 둥글기: `$border-radius-sm(4px)`, `$border-radius-base(6px)`, `$border-radius-lg(8px)` — ⚠️ `$border-radius-md`는 존재하지 않음, `$border-radius-base` 사용
- 그림자: `$shadow-sm`, `$shadow-md`, `$shadow-lg`
- 트랜지션: `$transition-fast(150ms)`, `$transition-base(200ms)`, `$transition-slow(300ms)`
- z-index: `$z-dropdown(100)`, `$z-sticky(200)`, `$z-overlay(300)`, `$z-modal(400)`, `$z-toast(500)`

## 레이아웃 변수

- `$sidebar-width: 260px`, `$sidebar-width-collapsed: 64px`
- `$header-height: 56px`
- `$chat-input-height: 64px`, `$chat-max-width: 768px`

## 타이포 프리셋 (SCSS Map)

`@include typo($변수명)`으로 font-size, font-weight, line-height를 한 줄로 적용. 색상은 포함하지 않음 (컨텍스트별 별도 지정).

| 프리셋 | 사이즈 | weight | line-height |
|--------|--------|--------|-------------|
| `$body-caption` / `-bold` | 10px | 400 / 700 | 150% |
| `$body-xsmall` / `-bold` | 12px | 400 / 700 | 150% |
| `$body-small` / `-bold` | 14px | 400 / 700 | 150% |
| `$body-medium` / `-bold` | 16px | 400 / 700 | 150% |
| `$body-large` / `-bold` | 18px | 400 / 700 | 150% |
| `$body-xlarge` / `-bold` | 20px | 400 / 700 | 150% |

```scss
// 사용 예시
.title { @include typo($body-medium-bold, $color-text-heading); }  // color 포함
.desc  { @include typo($body-small, $color-text-muted); }          // color 포함
.label { @include typo($body-small); color: #5c6677; }             // color 별도
```

## 믹스인 사용

- **타이포 프리셋 필수**: `font-size`, `font-weight`, `line-height`를 개별 작성하지 않고 반드시 `@include typo($프리셋)` 사용
  - `font-size: 18px; font-weight: 700; line-height: 1.5;` → `@include typo($body-large-bold);`
  - 색상 포함: `@include typo($body-large-bold, $color-text-heading);` — 두 번째 인자로 color 전달 가능
  - 색상 별도 작성도 가능: `@include typo($body-large-bold); color: $color-text-dark;`
- 타이포 프리셋: `@include typo($body-medium-bold)` → font-size/weight/line-height 일괄 적용
- 모바일/태블릿 전용: `@include mobile { ... }` → `@media (max-width: 1023px)`
- 텍스트 말줄임: `@include ellipsis(1)` 또는 `@include ellipsis(2)`
- 커스텀 스크롤바: `@include custom-scrollbar`
- 스크롤바 오른쪽 띄우기: 스크롤 영역에 `width: calc(100% + 6px); padding-right: 6px;` 추가 — 스크롤바가 컨텐츠 바깥 오른쪽에 위치
- 중앙 정렬: `@include flex-center`

## 반응형 전략 (2분할)

**데스크탑 버전** (1024px~)

- 기본 레이아웃, 고정 너비 기반
- 브라우저 창 줄이면 가로 스크롤 발생 (레이아웃 깨짐 방지)
- `min-width`로 최소 너비 보장 → 리사이즈해도 레이아웃 유지
- 사이드바 펼침 (260px)

**모바일/태블릿 버전** (~1023px)

- 사이드바 숨김, 햄버거 메뉴
- 유동적 레이아웃 (퍼센트/flex 기반)
- 터치 친화적 UI (버튼 크기, 간격 확대)

**분기점**: `$breakpoint-lg: 1024px` 하나만 사용

```scss
// 데스크탑: 기본 스타일 (min-width 고정, 축소 시 스크롤)
.layout-default {
  min-width: 1024px; // 이 아래로 줄이면 가로 스크롤
}

// 모바일/태블릿: 1024px 미만일 때만 적용
@media (max-width: 1023px) {
  .layout-default {
    min-width: auto; // 고정 해제, 유동 레이아웃
  }
}
```

**금지**: `$breakpoint-sm`, `$breakpoint-md`, `$breakpoint-xl` 단독 분기 사용 금지 — 분기점은 `1024px` 하나로 통일
