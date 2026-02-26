# SCSS Rules

## 구조

- 모든 컴포넌트: `<style lang="scss" scoped>` 필수
- BEM 사용 안 함 — SCSS 중첩으로 부모-자식 관계 표현
- `scoped`가 스코프를 잡아주므로 클래스 충돌 없음

## 클래스 네이밍

- 블록 (최상위): kebab-case → `.chat-message`, `.agent-card`
- 자식 요소: SCSS 중첩 → `.chat-message { .avatar { } }`
- 상태: `is-/has-` 접두사 → `&.is-active`, `&.is-open`, `&.has-error`
- 타입 변형: `type-` 접두사 → `&.type-green`, `&.type-blue`
- 크기 변형: `size-` 접두사 → `&.size-sm`, `&.size-lg`
- 그룹 요소: `-grp` 접미사 → `.action-grp`, `.gauge-grp`

## 디자인 토큰 사용 필수

- 색상: `$color-primary`, `$color-text-primary`, `$color-border` 등
- 간격: `$spacing-xs(4px)`, `$spacing-sm(8px)`, `$spacing-md(16px)`, `$spacing-lg(24px)`, `$spacing-xl(32px)`
- 폰트: `$font-size-sm(14px)`, `$font-size-base(16px)`, `$font-size-lg(18px)`
- 둥글기: `$border-radius-sm(6px)`, `$border-radius-md(8px)`, `$border-radius-lg(12px)`
- 그림자: `$shadow-sm`, `$shadow-md`, `$shadow-lg`
- 트랜지션: `$transition-fast(150ms)`, `$transition-base(200ms)`, `$transition-slow(300ms)`
- z-index: `$z-dropdown(100)`, `$z-sticky(200)`, `$z-overlay(300)`, `$z-modal(400)`, `$z-toast(500)`

## 레이아웃 변수

- `$sidebar-width: 260px`, `$sidebar-width-collapsed: 64px`
- `$header-height: 56px`
- `$chat-input-height: 64px`, `$chat-max-width: 768px`

## 믹스인 사용

- 모바일/태블릿 전용: `@include mobile { ... }` → `@media (max-width: 1023px)`
- 텍스트 말줄임: `@include ellipsis(1)` 또는 `@include ellipsis(2)`
- 커스텀 스크롤바: `@include custom-scrollbar`
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
