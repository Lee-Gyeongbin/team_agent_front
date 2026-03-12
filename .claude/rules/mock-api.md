# Mock API 규칙

## 언제 사용하나?

- 백엔드 API가 아직 없을 때, 프론트에서 먼저 개발하기 위해 사용
- 백엔드 완성되면 Mock 제거하고 실제 API로 교체

## 구조

```
server/routes/mock/          ← /mock/* 경로 (proxy 우회)
└── [도메인]/
    ├── list.post.ts         ← POST /mock/[도메인]/list
    ├── save.post.ts         ← POST /mock/[도메인]/save
    ├── delete.post.ts       ← POST /mock/[도메인]/delete
    └── [하위도메인]/
        └── list.post.ts    ← POST /mock/[도메인]/[하위도메인]/list
```

## 왜 server/api/ 가 아닌 server/routes/ 인가?

- `nuxt.config`의 `devProxy`가 `/api/*`를 백엔드(`localhost:8082`)로 프록시
- `server/api/`에 넣으면 proxy가 가로채서 404 발생
- `server/routes/`는 `/api` prefix 없이 직접 매핑 → **proxy 우회**

```
/mock/*  → server/routes/mock/  (Mock API)
/api/*   → proxy → localhost:8082 (백엔드)
```

## 파일 작성법

```ts
// server/routes/mock/agent/list.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 🔽 더미 데이터 — 백엔드 연결 시 제거
  return {
    result: 'SUCCESS',
    list: [
      { id: '1', name: '...', ... },
    ],
    message: '',
  }
})
```

### 응답 구조 통일

| 용도 | 응답 구조 |
|------|----------|
| 목록 조회 | `{ result, list, message }` |
| 단건 저장/수정 | `{ result, data, message }` |
| 삭제 | `{ result, data: { id }, message }` |

## useApi에서 Mock 호출

```ts
// composables/[도메인]/use[Domain]Api.ts
const MOCK_BASE = '/mock/[도메인]'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

const fetchList = async () => {
  return mockPost<{ list: Type[] }>(`${MOCK_BASE}/list`, {})
}
```

## 백엔드 연결 시 교체 방법

1. `server/routes/mock/[도메인]/` 폴더 삭제
2. `use[Domain]Api.ts`에서 `mockPost` → `useApi`의 `post`로 교체
3. `MOCK_BASE` 삭제, URL을 `/[도메인]/list` 형식으로 변경
4. nuxt.config 변경 없음

```ts
// Before (Mock)
const MOCK_BASE = '/mock/agent'
const fetchAgentList = async () => mockPost(`${MOCK_BASE}/list`, {})

// After (실제 API)
const { post } = useApi()
const fetchAgentList = async () => post('/agent/list', {})
```
