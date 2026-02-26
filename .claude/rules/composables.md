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

## API 호출 규칙

### 필수: useApi 커스텀 래퍼 사용

- `useFetch`, `$fetch` 직접 사용 금지
- 일반 요청: `useApi`
- 파일/HTML 포함: `useApi_multipart`

### 전송 방식 선택

| 상황                | 방식                              | 헤더                                     |
| ------------------- | --------------------------------- | ---------------------------------------- |
| 일반 조회/저장/삭제 | `URLSearchParams` → `.toString()` | `application/x-www-form-urlencoded` 명시 |
| 단순 GET 조회       | `query` 파라미터                  | 없음                                     |
| 배열 데이터 저장    | `FormData`                        | 생략 (자동 인식)                         |
| 파일 업로드         | `FormData` + `useApi_multipart`   | 생략 (자동 인식)                         |
| HTML 에디터 내용    | `FormData` + `useApi_multipart`   | `Html-Tag-Escape: N` 추가                |

## API 함수 패턴 (use[Domain]Api.ts)

```ts
import { useApi } from '~/composables/useApi'

export const useKpiApi = () => {
  const fetchKpiList = (params: URLSearchParams) => {
    return useApi('/api/hcm/kpi/selectKpiList.do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
  }
  return { fetchKpiList }
}
```

## Store 패턴 (use[Domain]Store.ts)

### 필수 규칙

- **Pinia `defineStore` 사용 금지** → composable 반환 패턴 사용
- **`storeToRefs` 사용 금지** → 직접 구조분해
- loading/error state 추가 불필요 (useApi가 자동 처리)

### 기본 패턴

```ts
const kpiList = ref([])
const selectedYear = ref('')

const buildParams = (obj: Record<string, string>) => {
  const params = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => params.append(k, v))
  return params
}

const handleSelectKpiList = async () => {
  kpiList.value = []
  const params = buildParams({ findYear: selectedYear.value })
  const res = await fetchKpiList(params)
  kpiList.value = res.list
}

export const useKpiStore = () => {
  return { kpiList, handleSelectKpiList }
}
```

## 페이지에서 사용

```ts
// storeToRefs 안 씀 — composable이라 직접 구조분해
const { kpiList, handleSelectKpiList } = useKpiStore()
onMounted(() => handleSelectKpiList())
```
