# Naming Conventions

## 파일/폴더

- 컴포넌트: PascalCase → `AppButton.vue`, `ChatMessage.vue`
- composable: camelCase + `use` 접두사 → `useApi.ts`, `useChat.ts`
- 타입: camelCase → `chat.ts`, `agent.ts`
- SCSS 파셜: `_` 접두사 → `_variables.scss`, `_mixins.scss`
- 페이지: kebab-case → `index.vue`, `[id].vue`

## 컴포넌트 접두사

- UI 컴포넌트: `Ui` → UiButton, UiInput, UiTextarea, UiModal (`components/ui/`)
- 채팅: `Chat` → ChatMessage, ChatInput, ChatWindow
- 에이전트: `Agent` → AgentCard, AgentBuilder, AgentList
- 레이아웃: `App` → AppSidebar, AppHeader

## 함수명 접두사 규칙

| 접두사         | 용도                        | 예시                                                   |
| -------------- | --------------------------- | ------------------------------------------------------ |
| `fetch~`       | API 호출 함수 (Api 파일)    | `fetchKpiList()`, `fetchSaveKpi()`, `fetchDeleteKpi()` |
| `handle~`      | store action (API+상태관리) | `handleSelectKpiList()`, `handleSaveKpi()`             |
| `on~`          | 이벤트 핸들러 / emit        | `onYearChange()`, `onGroupChange()`, `@on-select`      |
| `do~`          | 실행 함수 (confirm 후 호출) | `doDelete()`, `doCopy()`                               |
| `open~`        | 모달 열기                   | `openAddModal()`, `openEditModal()`                    |
| `is~` / `has~` | boolean 변수/함수           | `isModalOpen`, `hasPermission`                         |
| `toggle~`      | on/off 전환                 | `toggleModal()`, `toggleSidebar()`                     |
| `validate`     | 유효성 검사                 | `validateForm()`, `validateEmail()`                    |

## 변수

- boolean: `is/has` 접두사 → isOpen, isLoading, hasError
- 배열: 복수형 → messages, agents, users
- ref: 명사 → `const count = ref(0)`
- computed: 형용사/명사 → `const isEmpty = computed(...)`

## 공통 액션 아이콘 규칙

카드/리스트/드롭다운에서 수정·삭제 등 액션에 사용하는 아이콘을 통일한다.

| 액션 | 아이콘 클래스 | 비고 |
|------|-------------|------|
| 수정 | `icon-edit` | 연필 아이콘 |
| 삭제 | `icon-trashcan` | 각진 휴지통 (버튼, 드롭다운 공통) |
| 보기 | `icon-view` | 눈 아이콘 |
| 다운로드 | `icon-download` | |
| 복구 | `icon-refresh` | |
| 보관 | `icon-archive` | |

- **삭제 버튼/드롭다운**: `icon-trashcan` 통일 (`icon-delete`는 배경색 필요 시에만 `icon-delete-bg`로 사용)
- 드롭다운 메뉴 항목에서 삭제는 반드시 `color: 'danger'` 지정

## Props 순서

1. 식별자 (id, name)
2. 데이터 (modelValue, items)
3. 상태 (loading, disabled, error)
4. 스타일 (variant, size)
