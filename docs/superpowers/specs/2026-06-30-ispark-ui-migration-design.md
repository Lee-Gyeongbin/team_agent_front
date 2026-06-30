# ispark-ui 라이브러리 마이그레이션 설계서

- **작성일**: 2026-06-30
- **대상 프로젝트**: `team_agent_front` (Nuxt3, SPA)
- **대상 라이브러리**: `@leechanyong/ispark-ui@0.5.17` (`C:\ispark-ui`)
- **배경 문서**: 융합AI사업부 허희진 작성 「TeamAgent Front 구조 분석 리포트」(2026-06-26)
- **상태**: 승인됨 (설치=로컬 file:, 롤아웃=파일럿 1페이지, 미존재 컴포넌트=상향 기여 포함)

---

## 1. 목표 (Goal)

`team_agent_front`의 로컬 `components/ui/*` 컴포넌트를, 동일 컴포넌트를 디자인 시스템화한 공통 라이브러리 `@leechanyong/ispark-ui`로 **안전하게 교체**한다. 사이드 이펙트를 최소화하기 위해 **파일럿 1페이지 → 검증 → 전사 확대 → 전역 전환** 순으로 진행한다.

### 비목표 (Non-Goals / YAGNI)
- 동작이 동일한 컴포넌트의 불필요한 리팩토링/리디자인
- 라이브러리에 없는 컴포넌트의 신규 개발 (→ Phase 4에서 **별도 스펙**으로 분리)
- 백엔드(team_agent) 변경

---

## 2. 검증된 사실 (PDF 대조 결과)

> 원칙: 리포트 PDF의 가정을 그대로 신뢰하지 않고 **양쪽 실제 코드를 직접 대조**했다. 결과적으로 PDF의 핵심 가정 일부가 뒤집혔다.

### 2.1 PDF가 과대평가한 항목 (실제로는 안전)

| 컴포넌트 | PDF 주장 | 실제 코드 | 판정 |
|---|---|---|---|
| **UiDatePicker** | String/Date ↔ DateValue 변환 프록시 **필수** | 양쪽 다 이미 `@internationalized/date`의 `DateValue` 사용. 차이는 `triggerLabel?` 1개(additive)뿐 | 거의 무위험 |
| **UiTab** | 슬롯형 → 배열주입 구조 변경 필요 | 양쪽 다 이미 `tabs: TabItem[]` 배열 주입식. `icon/count/disabled`, `size/align`, `change` emit만 추가 | 호환 (additive) |
| **UiTable** | 마크업 래퍼 → columns/data 변환 수반 | 양쪽 다 이미 `columns`+`data` 컬럼 설정식. `filterable/empty/bordered`, `filter-change` emit만 추가 | 호환 (additive) |

### 2.2 PDF가 "즉시 교체"로 분류했으나 실제로는 파괴적 변경

| 컴포넌트 | 실제 파괴적 차이 |
|---|---|
| **UiButton** | `variant`에서 `dark`/`primary-dark`/`primary-line`/`line-secondary` 삭제, `danger` 추가. `size`에서 `xxs`/`xlg` 삭제 |
| **UiInput** | `radius`(sm/base/lg) → `shape`(rounded/pill) **개명+값체계 변경**. `size`에서 `xs`/`xlg` 삭제. `spellcheck` 삭제 |
| **UiModal** | `isOpen`(단방향) → `v-model:open`(양방향) **바인딩 변경**. `position="right"`(우측 드로어) **삭제** → `UiDrawer`로 이전 필요. 구현이 radix-vue 기반으로 교체 |

**결론**: "1:1 즉시 교체 16개"는 검증 없이 신뢰 불가. 실제 위험은 가장 많이 쓰이는 Button/Input/Modal에 집중되어 있다.

### 2.3 구조 사실

- ispark-ui는 **이미 배포 가능 상태**: `dist/`(js/cjs/css/d.ts) 커밋됨, `exports`/`main`/`module`/`types` 완비. 빌드/퍼블리시 선행작업 불필요.
- **필요 peer 의존성**: `@internationalized/date ^3.5`, `@lucide/vue >=1.0` (신규 추가 필요). `radix-vue ^1.9`, `vue ^3.5`는 team_agent_front에 이미 존재.
  - ⚠️ team_agent_front의 로컬 `UiDatePicker.vue`는 `@internationalized/date`를 import하지만 `package.json`에 명시 의존성이 없음(전이 의존). 라이브러리 도입 시 **명시적 추가 필수**.
- **이름 충돌**: Nuxt가 `components/ui/*.vue`를 파일명으로 전역 auto-import(`pathPrefix: false`). 로컬 `<UiButton>`과 라이브러리 `<UiButton>`이 동일 이름 → 페이지 단위 격리 불가능. 해결책은 §3.2.
- **스타일 전역 주입 (중요)**: ispark-ui는 `sideEffects: ["**/*.css","**/*.scss"]` + `src/index.ts`가 `main.scss`를 import. 따라서 **단 한 컴포넌트라도 `import { UiButton } from '@leechanyong/ispark-ui'` 하면 `dist/ispark-ui.css` 전체(:root 토큰 + `[data-theme=dark]` + base/reset + datepicker 등)가 앱 전역에 주입**된다. 파일럿 페이지만 격리해도 CSS는 전역 영향. → Phase 1의 핵심 검증 대상.
- **토큰 출처 동일**: ispark-ui의 `:root` 토큰은 team_agent_front `assets/styles/main.scss`에서 파생(주석 명시). 값 충돌 가능성은 낮고, 주 위험은 **base/reset 및 글로벌 컴포넌트 스타일**(`assets/styles/components/_button.scss`, `_form.scss`, `_modal.scss`).

### 2.4 라이브러리에 없는 로컬 컴포넌트 (Phase 4 후보)

team_agent_front 로컬 29개 중 라이브러리 미존재: **UiDragTable, UiDialogModal, UiConfirmModal, UiFormField, UiCodeBlock, UiSettingSection, UiStatCard, UiStatusBadge, UiTag** (+ PDF가 언급한 UiSkeleton — 단, 현재 로컬 `components/ui/`에 `UiSkeleton.vue` 파일은 **부재**, meeting의 스켈레톤 사용처 별도 확인 필요).

> 참고: 라이브러리에는 있으나 로컬엔 없는 것(UiDrawer, UiAccordion, UiAvatar, UiProgress, UiDateRangePicker, UiRadio, UiCalendarMonth, UiMarkdownEditor 등)도 다수. UiModal `position="right"` 이전처는 라이브러리 **UiDrawer** 활용 가능.

---

## 3. 아키텍처 결정

### 3.1 설치 방식 — 로컬 `file:` 링크

`team_agent_front/package.json`:
```jsonc
"dependencies": {
  "@leechanyong/ispark-ui": "file:../ispark-ui",   // 같은 PC, dist 커밋됨 → 즉시 연결
  "@internationalized/date": "^3.5.0",              // 신규 peer
  "@lucide/vue": "^1.0.0"                            // 신규 peer (실제 호환 버전 확인)
}
```
- 라이브러리가 활발히 수정 중이므로 `file:` 링크로 dist 변경을 빠르게 반영. (필요 시 `npm link` 대안)
- 향후 정식 배포 단계에서 `file:` → `@leechanyong/ispark-ui@^x` 버전 핀으로 교체.

### 3.2 격리 메커니즘 — 명시적 alias import (파일럿 격리)

Nuxt auto-import는 **명시적 import가 있으면 그것을 우선**한다. 파일럿 페이지에서만:
```ts
// pages/notice/index.vue
import { UiButton, UiInput, UiSelect, UiLoading, UiTable, UiPagination } from '@leechanyong/ispark-ui'
```
→ 그 파일 안의 `<UiButton>`은 라이브러리 버전으로 해석되고, **나머지 페이지는 로컬 그대로** 유지(블래스트 반경 0, 단 CSS는 §2.3대로 전역). 전역 전환(Phase 3)에서 로컬 파일 삭제 후 import문 제거.

### 3.3 CSS 충돌 처리 전략

1. Phase 1에서 `dist/ispark-ui.css` 전역 주입의 실제 영향 측정(다른 페이지 회귀 스크린샷 비교).
2. 토큰 중복은 값 동일 가정 → 확인만. 위험원은 base/reset.
3. 충돌 발생 시 우선순위:
   (a) 라이브러리 CSS를 `@layer`로 감싸 우선순위 낮추기, 또는
   (b) team 글로벌 `components/_button.scss` 등 **중복 글로벌 스타일을 제거**(라이브러리가 스코프 스타일로 대체하므로 Phase 3에서 정리),
   (c) 최후수단: 파일럿 동안 라이브러리 CSS를 페이지 스코프로 한정하는 래퍼.

---

## 4. 컴포넌트별 Prop 마이그레이션 매핑

> Phase 1(파일럿)에서 실측 확정. 안전군은 Phase 2 착수 시 동일 방식으로 1차 diff 후 확정.

### 4.1 UiButton (파괴적)
| 변경 | 처리 |
|---|---|
| `variant="dark"` / `"primary-dark"` | → `variant="primary"` 또는 `"secondary"` (디자인 확인) |
| `variant="primary-line"` / `"line-secondary"` | → `variant="outline"` |
| `size="xxs"` | → `size="xs"` |
| `size="xlg"` | → `size="lg"` |
| 신규 `danger`/`shape`/`as`/`href`/`type` | 선택 사용 |
- emit `click`·슬롯(`default`/`icon-left`/`icon-right`) 동일.
- **작업**: 전 코드에서 삭제된 variant/size 사용처 grep → 치환 codemod.

### 4.2 UiInput (파괴적)
| 변경 | 처리 |
|---|---|
| `radius="sm|base|lg"` | → `shape="rounded"`(기본) / `"pill"` (값 매핑 정의 필요) |
| `size="xs"` | → `size="sm"` |
| `size="xlg"` | → `size="lg"` (또는 `auth`) |
| `spellcheck` | 제거 (라이브러리 미지원) |
- v-model 동일(`modelValue`). emit value 타입 `string`→`string|number`. `clear` emit·`label` 슬롯 추가(선택).

### 4.3 UiSelect (경미)
| 변경 | 처리 |
|---|---|
| `radius` | → `shape` |
| `size="xlg"` | → `size="lg"`/`auth` |
| `name` prop | 제거됨 — 사용처 확인 |
- `change` emit, `label`/`error`/`desc` 추가(선택). `SelectOption`에 `disabled?` 추가.

### 4.4 UiModal (파괴적)
| 변경 | 처리 |
|---|---|
| `:is-open="x"` + `@close` | → `v-model:open="x"` (양방향). 닫기 로직 재배선 |
| `position="right"` | **삭제** → 우측 드로어는 라이브러리 `UiDrawer`로 이전 |
| `position="center"` | 기본값, prop 제거 |
| size 자유값/`maxWidth` | → `size="sm|md|lg|xl"` 토큰 우선, 필요 시 `maxWidth` 유지 |
- 슬롯(`header`/`default`/`footer`) 동일. 신규 `closeOnOverlayClick`/`closeOnEscape`.

### 4.5 UiTab / UiTable / UiDatePicker (호환 — additive)
- **UiTab**: 그대로 동작. 원하면 `icon/count`, `size/align`, `change` 추가 활용.
- **UiTable**: 그대로 동작. `TableColumn` 타입을 `~/types/table` import → 라이브러리 export(`import type { TableColumn } from '@leechanyong/ispark-ui'`)로 전환 검토. `selectedRowValue` 타입 `string`→`unknown`. 신규 `filterable/empty/bordered`.
- **UiDatePicker**: 그대로 동작. `@internationalized/date` 명시 의존성 추가만 필수. 신규 `triggerLabel?`.

### 4.6 1차 미검증(저위험 추정, Phase 2에서 diff 확정)
UiTextarea, UiLoading, UiEmpty, UiCheckbox, UiToggle, UiBadge, UiTooltip, UiDropdownMenu, UiPagination — additive 추정이나 **교체 전 prop/emit diff 1회 필수**.

---

## 5. 단계별 실행 계획

### Phase 0 — 셋업 (라이브러리 연결, 빌드 통과)
1. `team_agent_front/package.json`에 `@leechanyong/ispark-ui` (`file:../ispark-ui`), `@internationalized/date`, `@lucide/vue` 추가 → `npm install`.
2. `nuxt.config.ts`:
   - `build: { transpile: ['@leechanyong/ispark-ui'] }` (ESM/SSR 안전).
   - CSS 전역 주입 확인 (index.ts side-effect로 자동 주입되는지 vs `css: [...,'@leechanyong/ispark-ui/style.css']` 명시 추가 필요한지 실측).
3. 임시 검증 페이지에서 라이브러리 `UiButton` 1개 렌더 → 빌드/런타임/타입 통과 확인.
- **완료 기준**: `npm run dev` 정상, 라이브러리 컴포넌트 1개가 화면에 정상 렌더, 콘솔 에러 없음.

### Phase 1 — 파일럿: `/notice` (저위험 CRUD, 6종 커버: Input·Select·Button·Loading·Table·Pagination)
1. `pages/notice/index.vue`에 §3.2 alias import 추가.
2. 사용 중인 prop을 §4 매핑표대로 치환(특히 Button variant/size, Input radius→shape).
3. **검증**:
   - 기능: 검색/등록/페이지네이션/테이블 클릭 동작 동일.
   - 스타일: `/notice`와 **다른 대표 페이지 3곳**(예: /agent, /library, /mail) before/after 스크린샷 비교 → CSS 전역 주입 회귀 여부 판정.
   - 빌드/타입: `npm run build` 통과.
4. CSS 충돌 발견 시 §3.3 전략 적용 후 재검증.
- **완료 기준**: /notice 기능·시각 동등 + 타 페이지 시각 회귀 없음 + 빌드 통과. §4 매핑표 실측 확정.

### Phase 2 — 컴포넌트별 전사 확대 (검증된 매핑표 기반)
- 순서: **저위험군 먼저** → 파괴군 나중.
  1. 안전/additive: UiBadge, UiTooltip, UiEmpty, UiLoading, UiPagination, UiTab, UiTable, UiDatePicker, UiCheckbox, UiToggle, UiTextarea, UiSelect, UiDropdownMenu (각 교체 전 1차 diff).
  2. 파괴군: UiInput → UiButton → UiModal(+`position="right"`→UiDrawer 이전).
- 페이지별로 alias import 추가 + 매핑 치환 + 페이지 단위 검증·커밋(원자적).
- 사용처 grep 기준(리포트 §4 사용 메뉴표 + 실제 `<UiX` grep).

### Phase 3 — 전역 전환 & 정리
1. 교체 완료된 로컬 `components/ui/*.vue` 삭제.
2. 라이브러리 컴포넌트를 전역 등록(Nuxt plugin 또는 명시 import 유지 결정) — 삭제로 이름 충돌 해소되면 alias import를 표준 import로 정리하거나 전역 등록.
3. 글로벌 SCSS 중복 제거: `assets/styles/components/_button.scss`, `_form.scss`, `_modal.scss`, `_ui-pagination.scss` 등 라이브러리가 대체하는 부분 정리.
4. 전체 회귀 테스트(주요 페이지 스크린샷 비교) + 빌드.
- **완료 기준**: 로컬 중복 컴포넌트 제거, 빌드/주요 플로우 정상, CSS 중복 정리.

### Phase 4 — 라이브러리 상향 기여 (별도 스펙 사이클, 라이브러리 측 작업)
> brainstorming 원칙(대형 작업 분해)에 따라 **각 컴포넌트는 ispark-ui repo에서 독립 spec→plan→구현**. 본 스펙엔 우선순위만 기록.

| 우선순위 | 컴포넌트 | 근거 |
|---|---|---|
| 높음 | UiExcelUploadModal | OrgManage/UserManage/DatamartMetaColumn 3곳 반복 |
| 높음 | UiTreeView / TreeNode | OrgManage 조직도 (B2B 핵심 패턴) |
| 중간 | UiDragTable | codes 등 — vuedraggable 의존 |
| 중간 | UiStepper | MeetingStepper |
| 중간 | UiSplitPanel | mail/my-documents/org-manage 좌우 분할 |
| 검토 | UiSkeleton, UiDialogModal, UiConfirmModal(→`UiConfirm`/`openConfirm` 검토), UiFormField, UiTag, UiCodeBlock, UiSettingSection, UiStatCard, UiStatusBadge, UiChart(라이브러리 기존 UiChart와 스펙 비교) | 사용처/중복도 검토 후 결정 |

---

## 6. 리스크 & 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| 라이브러리 CSS 전역 주입으로 타 페이지 회귀 | 중~높음 | Phase 1에서 대표 페이지 스크린샷 비교, §3.3 `@layer`/글로벌 정리 |
| Button/Input/Modal 파괴적 prop, 사용처 광범위 | 높음 | 매핑표 codemod + 페이지 단위 원자 커밋 + 저위험군 선행 |
| `position="right"` 드로어 사용처 누락 | 중간 | grep으로 전수 확인 후 UiDrawer 이전 |
| `@internationalized/date`/`@lucide/vue` 버전 비호환 | 중간 | Phase 0에서 peer 버전 실측 |
| `file:` 링크의 dist 갱신 누락 | 낮음 | 라이브러리 수정 시 `npm run build`(또는 watch) 절차 명시 |
| 미검증 9개(§4.6) 숨은 차이 | 중간 | 교체 직전 컴포넌트별 diff 필수 |

---

## 7. 성공 기준 (Definition of Done)

- [ ] Phase 0: 라이브러리 연결 + 빌드/런타임 통과
- [ ] Phase 1: /notice 기능·시각 동등, 타 페이지 회귀 없음, 매핑표 확정
- [ ] Phase 2: 라이브러리 보유 컴포넌트 전 사용처 교체, 페이지별 검증 통과
- [ ] Phase 3: 로컬 중복 제거 + 글로벌 SCSS 정리 + 전체 회귀 통과
- [ ] Phase 4: 상향 기여 우선순위 확정 및 별도 스펙 착수(컴포넌트별)

---

## 8. 미해결/후속 확인 사항

1. Phase 0에서 CSS가 side-effect로 자동 주입되는지 vs 명시 import 필요한지 실측.
2. `UiInput.radius` → `shape` 값 매핑 규칙(sm/base/lg ↔ rounded/pill) 디자인 확정.
3. 삭제된 Button variant(`dark` 등)의 정확한 대체 디자인 매핑 — 디자인팀 확인.
4. meeting의 UiSkeleton 실제 사용처/구현 확인(로컬 파일 부재).
5. Phase 3에서 라이브러리 전역 등록 방식(Nuxt plugin vs 페이지별 import 유지) 결정.
