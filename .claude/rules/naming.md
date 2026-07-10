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

> 위 표는 **레거시(미마이그레이션) 페이지** 기준. ispark-ui 전환 페이지는 아래 표준을 따른다.

### 삭제 버튼 — ispark-ui 표준 (danger-line + UiIcon)

ispark-ui 전환 페이지의 **삭제 버튼은 공통 패턴으로 통일**한다:

```vue
<UiButton variant="danger-line" size="sm" @click="doDelete">
  <template #icon-left>
    <UiIcon name="trash-2" size="14" />
  </template>
  삭제
</UiButton>
```

- **variant `danger-line`** (빨간 테두리+빨간 글씨, subtle) — 인라인 파괴 액션(행/카드 삭제) 전용. 꽉 찬 `danger`(solid)는 **모달 최종 "삭제 확정" 버튼**에만.
- **아이콘 `<UiIcon name="trash-2" size="14" />`** (lucide) — 로컬 `icon-trashcan` 대신 UiIcon 사용. `danger-line` 버튼 안이면 currentColor로 자동 빨강.
- **삭제↔복구 토글 버튼**: 복구 상태는 비파괴이므로 `outline` 유지 → `:variant="상태 === '비활성' ? 'outline' : 'danger-line'"`.
- **비파괴 액션**(수정/비밀번호 초기화/조직 수정 등)은 중립 `outline` → 파괴(빨강)와 위계 분리.
- 드롭다운 메뉴의 삭제 항목은 `color: 'danger'` + `icon: 'icon-trashcan'`.

> 근거: `danger-line`은 ispark-ui `UiButton` variant(v0.6.5+). 삭제 신호를 앱 전역에서 일관되게. 컴포넌트 계약(variant 의미)은 ispark-ui가, 이 조합 규칙은 team_agent가 소유.

### 아이콘 — `UiIcon`(lucide) 표준

ispark-ui 전환 페이지는 **로컬 `icon-*` 클래스 대신 `<UiIcon>`**(lucide 기반)을 사용한다.

```vue
<UiIcon name="refresh-cw" size="16" />   <!-- name은 kebab-case -->
```

| 액션 | `UiIcon name` | 비고 |
|------|---------------|------|
| 다운로드 | `download` | |
| 업로드 | `upload` | |
| 새로고침 | `refresh-cw` | |
| 삭제 | `trash-2` | `danger-line` 버튼 안에서 currentColor로 빨강 |
| 추가 | `plus` | |
| 펼침(드롭다운) | `chevron-down` | |

- **size**: 버튼 안에서 `16`(md/sm), 작은 버튼(xs)은 `14`.
- **색**: 지정하지 않으면 **currentColor** → 버튼 텍스트 색을 자동 상속. `danger-line` 안이면 빨강.
- **예외**: `UiDropdownMenu`의 `items[].icon`은 UiIcon이 아니라 **ispark 아이콘 클래스**(`'icon-download'`, `'icon-upload'`)를 받는다.

> 근거: 로컬 아이콘과 lucide가 한 화면에 섞이면 선 굵기·스타일이 어긋난다. 전환 페이지는 UiIcon으로 통일한다.

### 헤더 액션 버튼 — 위계

리스트/관리 페이지 헤더의 액션 버튼은 **중요도에 따라 variant를 나눈다.**

| 액션 | variant | 예시 |
|------|---------|------|
| 주 액션(추가/생성) | `primary` | 사용자 추가, 조직 추가 |
| 보조 액션 | `outline` | 다시 시도 |
| **유틸리티** | **`ghost`** | **새로고침, 엑셀 ▾** |

```vue
<!-- 새로고침 = 유틸 → ghost + UiIcon -->
<UiButton variant="ghost" size="md" @click="handleRefresh">
  <template #icon-left>
    <UiIcon name="refresh-cw" size="16" />
  </template>
  새로고침
</UiButton>
```

- **엑셀 다운/업로드는 개별 버튼 2개로 노출하지 않는다.** `UiDropdownMenu` 하나(`엑셀 ▾`, ghost)로 묶는다:
  `items: [{ label: '다운로드', value: 'download', icon: 'icon-download' }, { label: '업로드', value: 'upload', icon: 'icon-upload' }]`
- 유틸 버튼(ghost)이 주 액션(primary)과 **같은 무게를 갖지 않게** 한다.

> 근거: 헤더가 outline 버튼으로 도배되면 주 액션이 묻히고 노이즈가 커진다. 유틸은 ghost로 낮춰 위계를 만든다.

## Props 순서

1. 식별자 (id, name)
2. 데이터 (modelValue, items)
3. 상태 (loading, disabled, error)
4. 스타일 (variant, size)
