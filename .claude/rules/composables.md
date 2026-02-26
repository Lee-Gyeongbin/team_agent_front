# Composables & API Patterns

## 구조

```
composables/
├── useApi.ts          # 공통 fetch 래퍼
├── useChat.ts         # 채팅 API
├── useAgent.ts        # 에이전트 API
└── useAuth.ts         # 인증
```

## 규칙

- `use` 접두사 필수
- 자동 임포트 (import 문 불필요)
- `useApi`를 공통 래퍼로 사용, 도메인 composable에서 활용

## useApi 패턴

- 공통 fetch 함수로 인증 헤더/에러 처리 한 곳 관리
- 401 응답 시 토큰 제거 + `/login` 리다이렉트
- HTTP 메서드별 단축 함수: `get`, `post`, `put`, `del`
- baseURL은 `🔽 백엔드 연결 시 실제 URL로 교체` 주석 표기

## 도메인 composable 패턴

```ts
export const useAgent = () => {
  const { get, post, put, del } = useApi()
  const agents = ref<Agent[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  const fetchAgents = async () => { /* ... */ }
  const createAgent = async (data: Partial<Agent>) => { /* ... */ }
  const updateAgent = async (id: string, data: Partial<Agent>) => { /* ... */ }
  const deleteAgent = async (id: string) => { /* ... */ }

  return { agents, isLoading, hasError, fetchAgents, createAgent, updateAgent, deleteAgent }
}
```

## 페이지에서 사용

```ts
const { agents, isLoading, hasError, fetchAgents } = useAgent()
onMounted(() => fetchAgents())
```
