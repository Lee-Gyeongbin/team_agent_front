# Mock API 규칙

## 언제 사용하나?

- 백엔드 API가 아직 없을 때, 프론트에서 먼저 개발하기 위해 사용
- 백엔드 완성되면 Mock 제거하고 실제 API로 교체

## 구조

```
server/
├── utils/
│   └── mock[Domain]Db.ts       ← Mock DB (메모리 저장, CRUD 헬퍼)
└── routes/mock/
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

## Mock DB 패턴 (server/utils/)

### 왜 Mock DB를 쓰나?

- 라우트에 하드코딩하면 저장/삭제가 **실시간 반영 안 됨** (항상 같은 데이터 반환)
- Mock DB를 쓰면 서버 메모리에 저장 → **CRUD가 실제로 동작**
- 서버 재시작 시 초기 데이터로 리셋 (진짜 DB가 아님)

### Mock DB 파일 작성법

```ts
// server/utils/mock[Domain]Db.ts

interface MockItem {
  id: string
  name: string
  // ... 타입 정의
}

// 초기 데이터
const itemList: MockItem[] = [
  { id: '1', name: '샘플1', ... },
  { id: '2', name: '샘플2', ... },
]

const today = () => new Date().toISOString().slice(0, 10)

// CRUD 헬퍼
export const mockItemDb = {
  // 목록 조회
  getList: () => [...itemList],

  // 추가/수정
  save: (item: Partial<MockItem>) => {
    const index = itemList.findIndex((i) => i.id === item.id)
    if (index > -1) {
      // 수정
      itemList[index] = { ...itemList[index], ...item, updatedAt: today() }
      return itemList[index]
    } else {
      // 추가
      const newItem: MockItem = {
        id: `item-${Date.now()}`,
        name: '',
        // ... 기본값
        ...item,
      }
      itemList.push(newItem)
      return newItem
    }
  },

  // 삭제
  delete: (id: string) => {
    const index = itemList.findIndex((i) => i.id === id)
    if (index > -1) itemList.splice(index, 1)
    return { id }
  },

  // 순서 변경
  updateOrder: (orderList: { id: string; order: number }[]) => {
    orderList.forEach(({ id, order }) => {
      const item = itemList.find((i) => i.id === id)
      if (item) item.priority = order
    })
    itemList.sort((a, b) => a.priority - b.priority)
  },
}
```

### 규칙

- `server/utils/`에 넣으면 Nitro가 **자동 import** 해줌 (라우트에서 import 없이 사용)
- 도메인별로 DB 파일 분리: `mockAgentDb.ts`, `mockChatDb.ts` 등
- 하위 도메인은 같은 파일에 별도 export: `mockAgentDb`, `mockDatasetDb`
- 초기 데이터는 DB 파일 상단에 배열로 정의
- `getList()`는 `[...list]` 스프레드로 복사본 반환 (원본 보호)

## 라우트에서 Mock DB 사용

```ts
// server/routes/mock/agent/list.post.ts
export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockAgentDb.getList(),
    message: '',
  }
})

// server/routes/mock/agent/save.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockAgentDb.save(body),
    message: '',
  }
})

// server/routes/mock/agent/delete.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockAgentDb.delete(body.id),
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

## 새 도메인 추가 체크리스트

1. `types/[도메인].ts` — 타입 정의
2. `server/utils/mock[Domain]Db.ts` — Mock DB + 초기 데이터 + CRUD 헬퍼
3. `server/routes/mock/[도메인]/` — 라우트 파일 (list, save, delete 등)
4. `composables/[도메인]/use[Domain]Api.ts` — mockPost로 API 함수
5. `composables/[도메인]/use[Domain]Store.ts` — 상태 관리 + handle 함수
6. 페이지/컴포넌트에서 store 연결

## 백엔드 연결 시 교체 방법

1. `server/utils/mock[Domain]Db.ts` 삭제
2. `server/routes/mock/[도메인]/` 폴더 삭제
3. `use[Domain]Api.ts`에서 `mockPost` → `useApi`의 `post`로 교체
4. `MOCK_BASE` 삭제, URL을 `/[도메인]/list` 형식으로 변경
5. nuxt.config 변경 없음

```ts
// Before (Mock)
const MOCK_BASE = '/mock/agent'
const fetchAgentList = async () => mockPost(`${MOCK_BASE}/list`, {})

// After (실제 API)
const { post } = useApi()
const fetchAgentList = async () => post('/agent/list', {})
```
