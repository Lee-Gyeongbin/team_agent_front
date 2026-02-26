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

## 함수

- 이벤트 핸들러: `handle` → handleClick, handleSubmit, handleDelete
- API 호출: `fetch/create/update/delete` → fetchAgents, createAgent
- 상태 토글: `toggle` → toggleSidebar, toggleModal
- 유효성 검사: `validate` → validateForm, validateEmail

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
