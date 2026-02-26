# Nuxt & Code Quality

## nuxt.config.ts 핵심 설정

- `ssr: false` (SPA 모드, SEO 불필요)
- 모듈: `@nuxt/eslint`
- 전역 CSS: `~/assets/scss/main.scss`
- SCSS 자동 주입: `_variables.scss`, `_mixins.scss` → 매번 @use 안 써도 됨
- Vue Devtools 활성화

## ESLint 주요 규칙

- `vue/multi-word-component-names`: off (pages 폴더의 index.vue 등 허용)
- `vue/no-multiple-template-root`: off (Vue 3 다중 루트 허용)
- `vue/no-v-html`: warn (XSS 위험)
- `@typescript-eslint/no-explicit-any`: warn (MVP라 에러 아닌 경고)
- `@typescript-eslint/no-unused-vars`: warn (\_로 시작하면 무시)
- `no-console`: warn (warn, error는 허용)
- `no-debugger`: warn

## Prettier 설정

- semi: false (세미콜론 없음)
- singleQuote: true
- tabWidth: 2
- trailingComma: 'all'
- printWidth: 120
- arrowParens: 'always'
- endOfLine: 'lf'
- singleAttributePerLine: true

## 금지 사항

- NEVER 하드코딩 색상값 사용 → SCSS 변수 사용
- NEVER z-index 임의 숫자 → `$z-dropdown` 등 변수 사용
- NEVER `<style>` 태그에 `scoped` 누락
- NEVER composable에 `use` 접두사 누락
- NEVER 타입 없이 props 정의
