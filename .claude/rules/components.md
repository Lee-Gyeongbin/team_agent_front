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

## 컴포넌트 분류

### Radix-vue 사용 (접근성 복잡한 것)
- Dialog/Modal, Dropdown Menu, Tooltip, Toast, Popover, Tabs, Select, Accordion
- Radix가 포커스 트랩, ESC 닫기, aria 속성 처리 → SCSS로 디자인만 입히기

### 직접 제작 (SCSS만으로 충분한 것)
- Button, Input, Textarea, Badge, Avatar, Card, Skeleton, Spinner, Icon wrapper, Form Label, Divider

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

## 라우팅 (자동 생성)

| 파일 | URL |
|------|-----|
| pages/index.vue | / |
| pages/login.vue | /login |
| pages/chat/index.vue | /chat |
| pages/chat/[id].vue | /chat/:id |
| pages/agents/index.vue | /agents |
| pages/agents/new.vue | /agents/new |
| pages/agents/[id].vue | /agents/:id |
