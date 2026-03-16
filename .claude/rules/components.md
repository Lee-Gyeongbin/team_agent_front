# Component Rules

## 퍼블리싱 단계 원칙

- 더미 데이터에는 반드시 주석 표기:
  ```
  // ============================================
  // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
  // ============================================
  ```
- 상태별 UI 모두 구현: 로딩(Skeleton), 빈 상태(Empty), 에러, 데이터 있음
- TypeScript 타입 정의 필수 (`types/` 디렉토리)
- **Input 설명 텍스트**: `<p class="hint">` 등 별도 태그 사용 금지 → `UiInput`의 `desc` prop 사용
  ```vue
  <!-- ❌ 금지 -->
  <UiInput v-model="value" />
  <p class="com-setting-hint">설명 텍스트</p>

  <!-- ✅ 올바른 사용 -->
  <UiInput v-model="value" desc="설명 텍스트" />
  ```

## 컴포넌트 분류

### Radix-vue 사용 (접근성 복잡한 것)

- Dialog/Modal, Dropdown Menu, Tooltip, Toast, Popover, Tabs, Select, Accordion
- Radix가 포커스 트랩, ESC 닫기, aria 속성 처리 → SCSS로 디자인만 입히기

### 직접 제작 — `Ui` 접두사 (`components/ui/`)

- Button, Input, Textarea, Select, Badge, Avatar, Card, Skeleton, Spinner, Icon wrapper, Form Label, Divider
- 파일명: `Ui` + PascalCase → `UiButton.vue`, `UiInput.vue`, `UiTextarea.vue`
- CSS 클래스: `ui-` + kebab-case → `.ui-button`, `.ui-input`, `.ui-textarea`
- 글로벌 `.inp` 클래스 위에 scoped 스타일 추가
- v-model 지원 필수 (`modelValue` prop + `update:modelValue` emit)
- `<style lang="scss" scoped>` 필수
- **가이드 페이지 필수**: UI 컴포넌트 생성/수정 시 아래 작업 함께 수행
  1. `pages/guide/ui-{컴포넌트명}.vue` 가이드 페이지 생성 (데모 + Props 테이블)
  2. `pages/guide/index.vue`의 `componentList`에 카드 추가
  3. `pages/guide/index.vue`의 `statusList`에 작업 현황 추가

## 타입 정의 예시

```ts
// types/chat.ts
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  isStreaming?: boolean
}

// types/agent.ts
export interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  model: string
  systemPrompt: string
  temperature: number
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}
```

## 레이아웃 구조

- `default.vue`: 사이드바 + 헤더 (대시보드)
- `auth.vue`: 빈 레이아웃 (로그인/회원가입)
- `blank.vue`: 빈 레이아웃

페이지에서 레이아웃 변경:

```ts
definePageMeta({ layout: 'auth' })
```

## watch / onMounted 위치

- `index.vue` (페이지) 또는 `PageHeader` 컴포넌트에서만 정의
- 하위 컴포넌트에서는 props/emit으로 통신

## 라우팅 (자동 생성)

| 파일                   | URL         |
| ---------------------- | ----------- |
| pages/index.vue        | /           |
| pages/login.vue        | /login      |
| pages/chat/index.vue   | /chat       |
| pages/chat/[id].vue    | /chat/:id   |
| pages/agents/index.vue | /agents     |
| pages/agents/new.vue   | /agents/new |
| pages/agents/[id].vue  | /agents/:id |
