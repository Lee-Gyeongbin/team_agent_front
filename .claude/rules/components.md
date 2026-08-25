# Component Rules

## ispark-ui 우선 사용 (최우선 규칙)

> 아이콘과 UI 컴포넌트는 **ispark-ui(`@leechanyong/ispark-ui`)를 기본**으로 쓴다.
> 로컬 `components/ui/*`와 로컬 아이콘 클래스는 ispark-ui에 없는 것에만 사용한다.

### 아이콘 — 항상 `UiIcon`

```vue
<script setup lang="ts">
import { UiIcon } from '@leechanyong/ispark-ui'
</script>

<template>
  <UiIcon name="trash-2" size="14" />
</template>
```

- **`<i class="icon-*">` 신규 작성 금지** — 기존 코드를 만질 때도 UiIcon으로 교체
- `name`은 **lucide kebab-case** (`plus`, `pencil`, `trash-2`, `info`, `arrow-right`, `grip-vertical`, `ellipsis-vertical`, `refresh-cw`, `download`, `upload`, `chevron-down`)
- **색은 지정하지 않는다** — 미지정 시 `currentColor`라 부모 버튼/텍스트 색을 상속한다 (`danger-line` 버튼 안이면 자동 빨강)
- `size`: 버튼 안이면 `14`(xs/sm) ~ `16`(md), 단독 아이콘은 `16`~`20`
- 존재하지 않는 이름을 주면 에러가 아니라 **콘솔 경고 후 아무것도 안 나온다** — 이름 확인 필수
- **예외**: `UiDropdownMenu`의 `items[].icon`은 UiIcon이 아니라 아이콘 클래스 문자열(`'icon-download'`)을 받는다

| 액션 | UiIcon name |
|------|-------------|
| 수정 | `pencil` |
| 삭제 | `trash-2` |
| 추가 | `plus` |
| 닫기/취소 | `x` |
| 확인 | `check` |
| 안내 | `info` |
| 더보기(⋮) | `ellipsis-vertical` |
| 드래그 핸들 | `grip-vertical` |
| 새로고침 | `refresh-cw` |
| 다운로드 / 업로드 | `download` / `upload` |

### 컴포넌트 — ispark-ui 명시적 import

```ts
import { UiButton, UiIcon, UiBadge } from '@leechanyong/ispark-ui'
```

- 로컬 `components/ui/UiButton.vue` 등이 **Nuxt 자동 임포트로 먼저 잡히므로**, ispark를 쓰려면 반드시 명시적 import를 적어야 한다
- import는 **파일 전체에 적용**된다(로컬 동명 컴포넌트를 shadow) → 한 파일 안에서 로컬/ispark를 섞을 수 없다. **파일 단위로 전환**하고, 전환 시 그 파일의 모든 사용처 variant·size가 ispark에 존재하는지 확인한다
- 전환 전 확인: 로컬 전용 값(예: UiButton `primary-dark`, UiBadge `category`·`manual-ai`)을 쓰고 있으면 먼저 ispark 값으로 치환

| 로컬 | ispark 대응 |
|------|-------------|
| `.pt-badge.is-gray` | UiBadge `variant="default"` |
| `.is-blue` | `variant="info"` |
| `.is-ok` | `variant="success"` |
| `.is-warn` | `variant="warning"` |
| `.is-danger` | `variant="danger"` |
| UiButton size | `xxs`(24) `xs`(26) `sm`(30) `md`(32) `lg`(34) `xlg`(36) |

### CSS 오버라이드 시 특이도 주의

ispark 스타일은 `[data-v-...]`가 붙어 hover 규칙이 **6단계 특이도**다.
전역 SCSS(`assets/styles/page/*.scss`)에서 덮으려면 같은 단계 이상으로 선택자를 늘려야 한다.

```scss
// 안 먹음 (2단계)
.pt-btn-del:hover { color: $color-error; }

// 6단계로 맞춤 — main.scss가 ispark CSS 뒤에 로드되므로 동점이면 이김
.pt-toc-item .pt-btn-del.ui-button.variant-ghost:hover:not(:disabled) {
  color: $color-error;
}
```

컴포넌트 `<style scoped>` 안에 쓰면 우리 쪽 `[data-v]`가 붙어 자동으로 한 단계 높아진다.


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
