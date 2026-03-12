# Composables & API Patterns

## 구조

```
composables/
├── com/
│   ├── useApi.ts            # 공통 fetch 래퍼 ({ get, post, put, del })
│   └── useApi_multipart.ts  # 파일/HTML 업로드용
├── agent/
│   ├── useAgentApi.ts       # Agent API 함수
│   └── useAgentStore.ts     # Agent 상태 관리
├── chat/
│   └── ...
└── ...
```

## 규칙

- `use` 접두사 필수
- 도메인별 폴더 분리 (`agent/`, `chat/` 등)
- `useApi`를 공통 래퍼로 사용, 도메인 Api에서 활용
- 하위 폴더 composable은 **자동 임포트 안 됨** → 명시적 import 필요

## useApi 패턴

- 위치: `composables/com/useApi.ts`
- 공통 fetch 함수로 인증 헤더/에러 처리 한 곳 관리
- 401 응답 시 토큰 제거 + `/login` 리다이렉트
- HTTP 메서드별 단축 함수: `get`, `post`, `put`, `del`
- baseURL: `/api` (내부에서 자동 prefix)

## API 호출 규칙

### 필수: useApi 커스텀 래퍼 사용

- `useFetch`, `$fetch` 직접 사용 금지
- 일반 요청: `useApi`
- 파일/HTML 포함: `useApi_multipart`

### 전송 방식

- useApi 내부에서 `JSON.stringify(body)` + `Content-Type: application/json` 자동 처리
- 파일 업로드만 `useApi_multipart` 사용

## API 함수 패턴 (use[Domain]Api.ts)

```ts
import { useApi } from '~/composables/com/useApi'
import type { Agent } from '~/types/agent'

export const useAgentApi = () => {
  const { get, post } = useApi()

  const fetchAgentList = async (): Promise<{ list: Agent[] }> => {
    return post<{ list: Agent[] }>('/agent/list', {})
  }

  const fetchSaveAgent = async (agent: Partial<Agent>): Promise<{ data: Agent }> => {
    return post<{ data: Agent }>('/agent/save', agent)
  }

  return { fetchAgentList, fetchSaveAgent }
}
```

## Store 패턴 (use[Domain]Store.ts)

### 필수 규칙

- **Pinia `defineStore` 사용 금지** → composable 반환 패턴 사용
- **`storeToRefs` 사용 금지** → 직접 구조분해
- loading/error state 추가 불필요 (useApi가 자동 처리)

### 기본 패턴

```ts
import { useAgentApi } from '~/composables/agent/useAgentApi'
import type { Agent } from '~/types/agent'

const { fetchAgentList } = useAgentApi()
const agentList = ref<Agent[]>([])

const handleSelectAgentList = async () => {
  agentList.value = []
  const res = await fetchAgentList()
  agentList.value = res.list
}

export const useAgentStore = () => {
  return { agentList, handleSelectAgentList }
}
```

## 페이지에서 사용

```ts
import { useAgentStore } from '~/composables/agent/useAgentStore'

const { agentList, handleSelectAgentList } = useAgentStore()
onMounted(() => handleSelectAgentList())
```

## Mock API (백엔드 미완성 시)

### 구조

```
server/routes/mock/     ← /mock/* 경로 (proxy 우회)
├── agent/
│   ├── list.post.ts    ← POST /mock/agent/list
│   ├── save.post.ts
│   ├── delete.post.ts
│   ├── order.post.ts
│   └── dataset/
│       ├── list.post.ts
│       ├── save.post.ts
│       └── sync.post.ts
```

### 왜 server/routes/ 인가?

- `nuxt.config`의 `devProxy`가 `/api/*`를 백엔드로 프록시
- `server/api/`에 넣으면 proxy가 가로채서 404 발생
- `server/routes/`는 `/api` prefix 없이 직접 매핑 → proxy 우회

### useAgentApi에서 Mock 사용

```ts
// 🔽 Mock — 백엔드 API 완성 시 useApi 패턴으로 교체
const MOCK_BASE = '/mock/agent'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

const fetchAgentList = async () => {
  return mockPost<{ list: Agent[] }>(`${MOCK_BASE}/list`, {})
}
```

### 백엔드 연결 시 교체

```ts
// Mock 코드 삭제하고 useApi 패턴으로 교체
import { useApi } from '~/composables/com/useApi'
const { post } = useApi()
const fetchAgentList = async () => post<{ list: Agent[] }>('/agent/list', {})
```

- `server/routes/mock/` 폴더 삭제
- `useAgentApi.ts`에서 mockPost → useApi 교체
- nuxt.config 변경 없음
