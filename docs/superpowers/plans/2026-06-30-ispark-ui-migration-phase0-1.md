# ispark-ui 마이그레이션 — Phase 0~1 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `team_agent_front`에 `@leechanyong/ispark-ui`를 로컬 `file:` 링크로 연결하고, `/notice` 페이지를 라이브러리 컴포넌트로 교체해 "설치 + CSS 전역주입 + 드롭인 호환"을 실측 검증한다.

**Architecture:** 라이브러리는 `file:../ispark-ui`로 설치(dist 커밋됨). 파일럿 격리는 `/notice` 한 파일의 **명시적 alias import**로 처리(Nuxt auto-import보다 우선) — 나머지 페이지는 로컬 컴포넌트 유지. CSS는 라이브러리 packaging 특성상 한 컴포넌트만 import해도 전역 주입되므로, 타 페이지 시각 회귀를 스크린샷으로 검증한다.

**Tech Stack:** Nuxt 3 (SPA, `ssr:false`), Vue 3.5, TypeScript, SCSS, `@leechanyong/ispark-ui@0.5.17`, peer: `@internationalized/date`, `@lucide/vue`, `radix-vue`(기존).

**검증 방식 주의:** team_agent_front에는 단위 테스트 러너(vitest 등)가 없다. 따라서 본 플랜의 "검증"은 (1) `npm run build` 통과, (2) dev 서버 정상 로드, (3) Playwright 스크린샷 before/after 비교로 한다. 새 테스트 프레임워크를 도입하지 않는다(YAGNI, 기존 스타일 유지).

**전제:** front dev 서버는 포트 **3001**에서 구동(3000은 타 프로젝트 점유). 모든 URL은 `http://localhost:3001` 기준.

---

## 파일 구조 (생성/수정 대상)

- 수정: `C:\team_agent_front\package.json` — 의존성 3개 추가
- 수정: `C:\team_agent_front\nuxt.config.ts` — `build.transpile` + `css`에 라이브러리 스타일 등록
- 수정: `C:\team_agent_front\pages\notice\index.vue` — alias import 추가 (template 변경 없음 예상)
- 생성(임시, Task 4에서 삭제): `C:\team_agent_front\pages\_ispark-smoke.vue` — 라이브러리 렌더 스모크 테스트용
- 참고(읽기): `C:\ispark-ui\src\components\ui\UiLoading.vue`, `UiPagination.vue` — Task 5에서 prop 호환 확인
- 산출물(문서): `C:\team_agent_front\docs\superpowers\specs\2026-06-30-ispark-ui-migration-design.md` §4 매핑표를 Task 8에서 실측값으로 갱신

---

## Phase 0 — 셋업

### Task 1: 라이브러리 + peer 의존성 설치

**Files:**
- Modify: `C:\team_agent_front\package.json`

- [ ] **Step 1: package.json `dependencies`에 3개 추가**

`dependencies` 객체에 아래 3줄을 추가한다(알파벳 위치 무관, 기존 항목 유지):

```jsonc
"@leechanyong/ispark-ui": "file:../ispark-ui",
"@internationalized/date": "^3.5.0",
"@lucide/vue": ">=1.0.0"
```

- [ ] **Step 2: 설치 실행**

Run:
```bash
cd /c/team_agent_front && npm install
```
Expected: 에러 없이 완료. `node_modules/@leechanyong/ispark-ui`가 `../ispark-ui`로 심볼릭/정션 링크됨.

- [ ] **Step 3: 링크 + peer 해석 확인**

Run:
```bash
ls /c/team_agent_front/node_modules/@leechanyong/ispark-ui/dist/ispark-ui.js && \
ls /c/team_agent_front/node_modules/@internationalized/date >/dev/null && echo "date OK" && \
ls /c/team_agent_front/node_modules/@lucide/vue >/dev/null && echo "lucide OK"
```
Expected: dist 파일 경로 출력 + `date OK` + `lucide OK`.

> 만약 `@lucide/vue`가 레지스트리에 없어 설치 실패하면: ispark-ui의 실제 import 문(`C:\ispark-ui\src` 내 `from '@lucide` 또는 `lucide` grep)으로 정확한 패키지명을 확인하고 그 이름으로 교체한다. 확인 전까지 다음 Task로 넘어가지 않는다.

- [ ] **Step 4: 커밋**

```bash
cd /c/team_agent_front && git add package.json package-lock.json && \
git commit -m "chore(ispark-ui): add ispark-ui lib + peer deps (file link)"
```

---

### Task 2: Nuxt 설정 — transpile + 전역 CSS 등록

**Files:**
- Modify: `C:\team_agent_front\nuxt.config.ts`

- [ ] **Step 1: 현재 `css`/`build` 설정 확인**

Run:
```bash
grep -nE "css:|build:|transpile" /c/team_agent_front/nuxt.config.ts
```
Expected: `css: ['gridstack/dist/gridstack.min.css', '~/assets/styles/main.scss']` 라인 확인. `build:` 키는 없을 수 있음.

- [ ] **Step 2: `css` 배열에 라이브러리 스타일 추가**

`css` 배열을 아래처럼 라이브러리 CSS를 **맨 앞**에 추가한다(앱 글로벌 스타일이 뒤에서 우선 적용되도록):

```ts
css: [
  '@leechanyong/ispark-ui/style.css',
  'gridstack/dist/gridstack.min.css',
  '~/assets/styles/main.scss',
],
```

- [ ] **Step 3: `build.transpile` 추가**

`defineNuxtConfig({ ... })` 최상위에 `build` 키를 추가한다(이미 있으면 transpile 배열에 추가):

```ts
build: {
  transpile: ['@leechanyong/ispark-ui'],
},
```

- [ ] **Step 4: dev 재기동 후 로드 확인**

Run (기존 dev 서버 종료 후):
```bash
cd /c/team_agent_front && npm run dev
```
별도 확인: `http://localhost:3001` 접속 시 콘솔 에러 없이 기존 화면 정상. (이 시점엔 아직 라이브러리 컴포넌트 미사용 — 스타일만 로드됨)

- [ ] **Step 5: 커밋**

```bash
cd /c/team_agent_front && git add nuxt.config.ts && \
git commit -m "chore(ispark-ui): register lib css + transpile in nuxt config"
```

---

### Task 3: 스모크 테스트 — 라이브러리 컴포넌트 1개 렌더

**Files:**
- Create: `C:\team_agent_front\pages\_ispark-smoke.vue`

- [ ] **Step 1: 스모크 페이지 작성**

```vue
<template>
  <div style="padding: 40px; display: flex; gap: 12px; align-items: center">
    <UiButton variant="primary" size="md">ispark 버튼</UiButton>
    <UiButton variant="outline" size="md">아웃라인</UiButton>
  </div>
</template>

<script setup lang="ts">
import { UiButton } from '@leechanyong/ispark-ui'
</script>
```

- [ ] **Step 2: 렌더 확인 (Playwright)**

Playwright로 `http://localhost:3001/_ispark-smoke` 접속 → 스크린샷 촬영. 버튼 2개가 깨짐 없이 렌더되고 콘솔 에러가 없는지 확인.
Expected: 라이브러리 스타일이 적용된 primary/outline 버튼 2개 표시.

- [ ] **Step 3: 빌드 통과 확인**

Run:
```bash
cd /c/team_agent_front && npm run build
```
Expected: 빌드 성공(라이브러리 import/transpile/CSS 번들 정상). 실패 시 에러 메시지로 transpile/peer 문제 진단 후 Task 1~2 보정.

- [ ] **Step 4: 스모크 페이지 삭제 + 커밋**

```bash
cd /c/team_agent_front && rm pages/_ispark-smoke.vue && \
git add -A && git commit -m "test(ispark-ui): verify lib renders + build passes (smoke)"
```

> 삭제 이유: 스모크 페이지는 검증용 임시물. 빌드/렌더가 통과한 사실만 커밋 메시지로 남긴다.

---

## Phase 1 — 파일럿: `/notice`

### Task 4: 교체 전 기준 스크린샷(baseline) 확보

**Files:** (없음 — 측정만)

- [ ] **Step 1: dev 서버 구동 확인**

`http://localhost:3001` 접속 가능 확인. 안 되면 `cd /c/team_agent_front && npm run dev`.

- [ ] **Step 2: 대상 + 회귀 감시 페이지 baseline 촬영 (Playwright)**

아래 5개 URL을 순서대로 접속하여 전체 페이지 스크린샷을 저장한다. 파일명에 `before-` 접두사.
- `http://localhost:3001/notice` (교체 대상)
- `http://localhost:3001/agent` (회귀 감시 — Button/Loading 사용)
- `http://localhost:3001/library` (회귀 감시 — Input/Select/Modal 사용)
- `http://localhost:3001/mail` (회귀 감시 — Input/Button/DatePicker)
- `http://localhost:3001/login` (회귀 감시 — Input/Checkbox/Button)

Expected: 5장 `before-*.png` 확보. 이게 CSS 전역주입 회귀 판정 기준.

> 인증이 필요해 일부 페이지 접근이 막히면, 접근 가능한 공개 페이지(예: /login)로 대체하고 막힌 URL은 기록만 남긴다.

---

### Task 5: `/notice`가 쓰는 라이브러리 컴포넌트의 prop 호환 확인

**Files:**
- 참고(읽기): `C:\ispark-ui\src\components\ui\UiLoading.vue`, `C:\ispark-ui\src\components\ui\UiPagination.vue`

`/notice`는 UiInput·UiSelect·UiButton·UiTable은 호환 확인 완료(설계서 §4). 미확인은 **UiLoading**(`overlay`, `text` prop)과 **UiPagination**(`v-model`, `total-count`, `page-size`, `total-label` prop)뿐이다.

- [ ] **Step 1: UiLoading prop 확인**

Run:
```bash
grep -nE "defineProps|overlay|text" /c/ispark-ui/src/components/ui/UiLoading.vue
```
확인할 것: `overlay: boolean`, `text: string` prop이 동일 이름으로 존재하는가. 없으면 대체 prop명을 기록(예: `text`→`label`).

- [ ] **Step 2: UiPagination prop 확인**

Run:
```bash
grep -nE "defineProps|defineEmits|totalCount|pageSize|totalLabel|modelValue" /c/ispark-ui/src/components/ui/UiPagination.vue
```
확인할 것: `modelValue`(v-model), `totalCount`, `pageSize`, `totalLabel` prop이 동일 이름으로 존재하는가. 다르면 매핑을 기록.

- [ ] **Step 3: 차이 기록**

발견한 prop 차이(있으면)를 Task 6 교체 시 반영할 메모로 남긴다. 차이가 없으면 "/notice 6종 모두 prop 호환"으로 확정.

---

### Task 6: `/notice`에 alias import 추가 + prop 보정

**Files:**
- Modify: `C:\team_agent_front\pages\notice\index.vue`

- [ ] **Step 1: `<script setup>` 상단에 alias import 추가**

`pages/notice/index.vue`의 `<script setup lang="ts">` 블록 첫 import 위(167행 `import type { NoticeRow }` 위)에 추가:

```ts
import {
  UiInput,
  UiSelect,
  UiButton,
  UiLoading,
  UiTable,
  UiPagination,
} from '@leechanyong/ispark-ui'
```

이 명시적 import로 해당 파일 내 6개 태그가 라이브러리 버전으로 해석된다(다른 페이지 영향 없음).

- [ ] **Step 2: Task 5에서 발견된 prop 차이만 보정**

Task 5 결과 차이가 있던 prop만 template에서 수정한다. 차이가 없었다면 **template 변경 없음**(현재 사용 prop은 전부 호환: Button `variant="primary"|"outline"`/`size="md"`/`#icon-left`, Select `size="md"`, Input `type="search"`/`@search`/`@enter`, Table `:columns`/`:data`/`sticky-header`/`empty-text`/`#cell-*`).

- [ ] **Step 3: 타입/빌드 통과 확인**

Run:
```bash
cd /c/team_agent_front && npm run build
```
Expected: 빌드 성공. 타입 에러 발생 시 해당 prop을 Task 5 매핑대로 수정.

---

### Task 7: 기능 + 시각 회귀 검증

**Files:** (없음 — 검증만)

- [ ] **Step 1: `/notice` 기능 검증 (Playwright)**

`http://localhost:3001/notice` 접속 후 확인:
- 목록 테이블 정상 렌더(고정 헤더, 핀 공지 아이콘, 날짜 셀)
- 검색창에 텍스트 입력 후 Enter → 목록 갱신
- 카테고리 Select 변경 → 목록 갱신
- 페이지네이션 노출 시 페이지 이동 동작
- "등록"/"새로고침" 버튼 클릭 동작

Expected: 교체 전과 동일 동작. 콘솔 에러 없음.

- [ ] **Step 2: `/notice` 시각 비교 (Playwright)**

`/notice` `after-notice.png` 촬영 → Task 4 `before-notice.png`와 비교. 버튼/인풋/셀렉트/테이블/페이지네이션의 크기·색·간격이 시각적으로 동등한지 확인. 차이가 있으면 원인(토큰/리셋/클래스 충돌)을 기록.

- [ ] **Step 3: 타 페이지 회귀 비교 (Playwright)**

Task 4의 나머지 4개 페이지(`/agent`, `/library`, `/mail`, `/login`)를 다시 촬영하여 `before-*`와 비교. **라이브러리 CSS 전역주입으로 인한 회귀가 없는지** 판정.
Expected: 4개 페이지 모두 before와 시각적으로 동일.

- [ ] **Step 4: 회귀 발견 시 대응 (설계서 §3.3)**

회귀가 있으면 우선순위대로 적용 후 재검증:
1. 충돌 원인이 토큰이면: 값 차이 확인(거의 동일 예상).
2. 충돌 원인이 글로벌 reset/`components/_button.scss` 등이면: 라이브러리 CSS를 `@layer`로 낮추거나, 충돌 글로벌 규칙을 Phase 3 정리 대상으로 기록(파일럿에선 최소 개입).
3. 즉시 해결 불가한 회귀는 문서에 "Phase 3 정리 필요"로 명시.

---

### Task 8: 파일럿 결과 반영 + 커밋

**Files:**
- Modify: `C:\team_agent_front\pages\notice\index.vue` (확정 상태)
- Modify: `C:\team_agent_front\docs\superpowers\specs\2026-06-30-ispark-ui-migration-design.md`

- [ ] **Step 1: 설계서 §4 매핑표를 실측값으로 갱신**

Task 5·7에서 확인된 실제 prop 차이(UiLoading/UiPagination 포함)와 CSS 회귀 유무를 설계서 §4·§3.3에 반영한다. "추정"으로 적힌 §4.6 항목 중 검증된 것은 "확정"으로 표기.

- [ ] **Step 2: 파일럿 결론 기록**

설계서 하단에 "## 9. 파일럿(/notice) 결과" 섹션 추가:
- 교체된 컴포넌트 6종 동작 동등 여부
- 타 페이지 시각 회귀 유무 + 발견 시 항목
- Phase 2 진입 가능 여부 판단(go/no-go)

- [ ] **Step 3: 커밋**

```bash
cd /c/team_agent_front && git add pages/notice/index.vue docs/superpowers/specs/2026-06-30-ispark-ui-migration-design.md && \
git commit -m "feat(notice): migrate /notice to ispark-ui components (pilot)"
```

---

## 후속 (이 플랜 범위 밖)

- **Phase 2~3**: 파일럿이 go이면, 확정된 매핑표로 컴포넌트별 전사 교체 + 전역 전환 플랜을 별도 작성(`2026-MM-DD-ispark-ui-migration-phase2-3.md`). 파괴군(Button variant `dark` 등, Input `radius→shape`, Modal `isOpen→v-model:open` / `position="right"→UiDrawer`)은 그때 사용처 grep 기반으로 정밀 task화.
- **Phase 4**: 미존재 컴포넌트 상향 기여는 ispark-ui repo에서 컴포넌트별 독립 spec→plan.

---

## Self-Review 메모

- **Spec 커버리지**: 본 플랜은 설계서 Phase 0·Phase 1 전체(설치/transpile/CSS/파일럿/검증/매핑표 갱신)를 task화함. Phase 2~4는 의도적으로 후속 플랜으로 분리(파일럿 결과 의존 → 지금 쓰면 플레이스홀더가 됨).
- **플레이스홀더 스캔**: prop 보정은 "Task 5 결과에 따라"로 조건화했으나, 그 분기를 만들기 위한 **확인 명령(grep)과 판정 기준**을 Task 5에 명시했으므로 빈 지시가 아님.
- **타입 일관성**: 컴포넌트/ prop 이름은 설계서 §4 및 Agent 실측과 일치. 검증 미완 prop(UiLoading/UiPagination)은 Task 5에서 확정하도록 선행 배치.
