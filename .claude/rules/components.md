# Component Rules

## Alert/Confirm 다이얼로그 규칙

- **네이티브 `alert()`, `confirm()` 사용 금지** → 공통 다이얼로그 함수 사용
- `openAlert()` — 단순 알림 (확인 버튼만)
- `openConfirm()` — 확인/취소 선택 (Promise\<boolean\> 반환)
- import 경로: `import { openAlert, openConfirm } from '~/composables/useDialog'`

```ts
// ❌ 금지
if (!confirm('삭제하시겠습니까?')) return

// ✅ 올바른 사용
const confirmed = await openConfirm({
  title: '삭제',
  message: '삭제하시겠습니까?',
})
if (!confirmed) return
```

## 폼 유효성 검사 + 포커스 이동 규칙

- 필수 필드 미입력 시 `openToast` (warning) + 해당 필드로 **스크롤 이동 + 포커스**
- 모달(`openAlert`) 대신 **토스트(`openToast`)** 사용 — 모달은 포커스를 뺏으므로 토스트로 통일
- `scrollIntoView({ behavior: 'smooth', block: 'center' })` + `focus()` 조합 사용
- UiInput 컴포넌트는 template ref로 접근, `$el.querySelector('input').focus()`
- 저장 성공 시 `openToast({ message: '...' })` 사용

```ts
// ❌ 금지 — openAlert 사용 (모달이 포커스 뺏음)
if (!form.value.name.trim()) {
  openAlert({ title: '알림', message: '이름을 입력해주세요.' })
  return
}

// ✅ 올바른 사용 — 토스트 + 포커스 이동
if (!form.value.name.trim()) {
  openToast({ message: '이름을 입력해주세요.', type: 'warning' })
  focusField(nameRef)
  return
}

// ✅ 저장 성공 시 토스트
openToast({ message: '저장되었습니다.' })
```

## 퍼블리싱 단계 원칙

- 더미 데이터에는 반드시 주석 표기:
  ```
  // ============================================
  // 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
  // ============================================
  ```
- 상태별 UI 모두 구현: 로딩(Skeleton), 빈 상태(Empty), 에러, 데이터 있음
- **빈 상태(Empty)**: 모든 빈 상태 UI는 반드시 `UiEmpty` 컴포넌트 사용 — 개별 empty 마크업, 인라인 텍스트, 조건부 메시지 등 직접 작성 금지
  ```vue
  <!-- ❌ 금지 — 개별 empty 마크업 -->
  <div class="xxx-empty">
    <i class="icon-search size-24" />
    <p>데이터가 없습니다.</p>
  </div>

  <!-- ❌ 금지 — 인라인 빈 상태 텍스트 -->
  <p v-if="list.length === 0">검색 결과가 없습니다.</p>
  <div v-if="!data" class="no-data">데이터가 없습니다</div>

  <!-- ✅ 올바른 사용 -->
  <UiEmpty />
  <UiEmpty icon="icon-search" title="검색 결과가 없습니다." />
  <UiEmpty icon="icon-arrow-right" title="좌측에서 그룹을 선택하세요" />
  ```
  - 넓은 영역 (페이지, 패널): `icon` + `title` 권장 (시각적 인지)
  - 좁은 영역 (모달, 카드): `title`만 사용 가능
  - 하단 액션 필요 시 default 슬롯 활용
  - **UiTable 빈 상태도 포함**: 테이블에 데이터가 없을 때 `emptyText` prop 대신, 데이터 0건이면 테이블 자체를 숨기고 `UiEmpty`를 표시하는 것을 우선 고려
- TypeScript 타입 정의 필수 (`types/` 디렉토리)
- **Input 설명 텍스트**: `<p class="hint">` 등 별도 태그 사용 금지 → `UiInput`의 `desc` prop 사용
  ```vue
  <!-- ❌ 금지 -->
  <UiInput v-model="value" />
  <p class="com-setting-hint">설명 텍스트</p>

  <!-- ✅ 올바른 사용 -->
  <UiInput v-model="value" desc="설명 텍스트" />
  ```

## 숫자 입력 규칙

- **`type="number"` 사용 금지** — 한글 IME 환경에서 자음이 깜빡이는 브라우저 버그 발생
- 숫자 입력이 필요하면 `UiInput`의 `number-only` prop 사용
- `number-only`: 정수만 허용
- `number-only allow-decimal`: 소수점 포함 허용 (temperature, cost 등)
- `number-only allow-negative`: 음수 포함 허용

```vue
<!-- ❌ 금지 -->
<UiInput v-model="value" type="number" />

<!-- ✅ 올바른 사용 -->
<UiInput v-model="value" number-only />
<UiInput v-model="value" number-only allow-decimal />
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
