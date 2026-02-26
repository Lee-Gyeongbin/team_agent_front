# Naming Conventions

## 파일/폴더

- 컴포넌트: PascalCase → `AppButton.vue`, `ChatMessage.vue`
- composable: camelCase + `use` 접두사 → `useApi.ts`, `useChat.ts`
- 타입: camelCase → `chat.ts`, `agent.ts`
- SCSS 파셜: `_` 접두사 → `_variables.scss`, `_mixins.scss`
- 페이지: kebab-case → `index.vue`, `[id].vue`

## 컴포넌트 접두사

- 공통 UI: `App` → AppButton, AppInput, AppModal
- 채팅: `Chat` → ChatMessage, ChatInput, ChatWindow
- 에이전트: `Agent` → AgentCard, AgentBuilder, AgentList
- 레이아웃: `App` → AppSidebar, AppHeader

## 함수명 접두사 규칙

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `fetch~` | API 호출 함수 (Api 파일) | `fetchKpiList()`, `fetchSaveKpi()`, `fetchDeleteKpi()` |
| `handle~` | store action (API+상태관리) | `handleSelectKpiList()`, `handleSaveKpi()` |
| `on~` | 이벤트 핸들러 / emit | `onYearChange()`, `onGroupChange()`, `@on-select` |
| `do~` | 실행 함수 (confirm 후 호출) | `doDelete()`, `doCopy()` |
| `open~` | 모달 열기 | `openAddModal()`, `openEditModal()` |
| `is~` / `has~` | boolean 변수/함수 | `isModalOpen`, `hasPermission` |
| `toggle~` | on/off 전환 | `toggleModal()`, `toggleSidebar()` |
| `validate` | 유효성 검사 | `validateForm()`, `validateEmail()` |

## 변수

- boolean: `is/has` 접두사 → isOpen, isLoading, hasError
- 배열: 복수형 → messages, agents, users
- ref: 명사 → `const count = ref(0)`
- computed: 형용사/명사 → `const isEmpty = computed(...)`

## Props 순서

1. 식별자 (id, name)
2. 데이터 (modelValue, items)
3. 상태 (loading, disabled, error)
4. 스타일 (variant, size)
