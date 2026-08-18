# ispark-ui 마이그레이션 — Phase 2 (전사 확대) 계획 · v2 (리뷰 반영 개정)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. 실행 단위는 **① W1(안전군 전역 드롭인) → ② 도메인 웨이브(저→고 얽힘 순)**. 도메인 웨이브는 **swap + 파괴 prop 수정 + 해당 도메인 SCSS 정리를 원자적으로** 수행. Wave 진입 전 관련 결정(§3) 확정 필수.

**Goal:** 파일럿(/notice)에서 검증된 alias-import 교체를 team_agent_front 전 도메인으로 확대해, 라이브러리 보유 컴포넌트를 `@leechanyong/ispark-ui`로 교체한다.

**핵심 개정(v1 결함 수정):** 파괴적 prop 치환은 **독립 codemod 웨이브가 아니다**. 로컬 컴포넌트는 삭제된 prop을 아직 지원하므로, prop을 미리 바꾸면 로컬 외형이 변하고, swap만 먼저 하면 라이브러리가 prop을 거부한다. 따라서 **"라이브러리로 교체 + 그 파일의 파괴 prop 수정"은 파일 단위로 함께** 수행한다. 또한 글로벌 SCSS override는 컴포넌트 교체와 얽혀 있어 **도메인 웨이브에 흡수**한다.

**Tech Stack:** Nuxt3(SPA), Vue3.5, TS, SCSS, `@leechanyong/ispark-ui`(git 커밋 핀 의존성), Playwright(시각 검증).

**브랜치:** 파일럿 PR #2가 `develop` 머지 후 `develop`에서 `feature/ispark-ui-phase2` 분기. 웨이브별 커밋(가능하면 도메인별 PR). 검증 = `npm run build` + dev 로드 + Playwright before/after.

---

## 1. 규모 실측 (스캔 결과)

### 1.1 파괴군 (라이브러리가 prop 삭제/개명 → 교체 시 함께 수정)
| 컴포넌트 | 사용 | 파괴적 사용처 |
|---|---|---|
| **UiButton** | 134파일 | `variant`: `line-secondary`~80, `primary-line`9, `primary-dark`5, `dark`~8 (+동적2) / `size`: `xlg`~30, `xxs`~18 |
| **UiModal** | 48파일 | `:is-open` **48 전부**→`v-model:open` / `position="right"`9→UiDrawer / `position="center"`~25 제거 |
| **UiInput** | 76파일 | `size="xs"`6, `spellcheck`3, `radius="base"`1 |
| **UiSelect** | 54파일 | `name=`6, `size="xlg"`1 |

### 1.2 안전군 (additive — prop 호환 드롭인. 단 override 없는 파일만 W1)
UiBadge14 · UiTooltip8 · UiEmpty47 · UiLoading33 · UiPagination4 · UiTab9 · UiTable15 · UiDatePicker7 · UiCheckbox21 · UiToggle17 · UiTextarea34 · UiDropdownMenu9 · UiSelect(name/xlg 없는 파일)

### 1.3 글로벌 SCSS 얽힘 (최대 리스크 — 도메인 웨이브에 흡수)
수십 개 page/component 파셜이 라이브러리 `.ui-*` 내부 클래스를 글로벌 override(옛 로컬 마크업 가정). 컴포넌트 교체 시 함께 정리 안 하면 스타일 깨짐/오적용.
- **바 base-class(직접충돌)**: `_ui-pagination.scss`(비활성·삭제대기), `_repository.scss`(`.ui-button-outline-muted`, `.ui-tooltip-content`)
- **활성 component 파셜**: `_button.scss`, `_com-setting-form.scss`, `_modal.scss` (각 `.ui-button`/`.ui-input-wrap`/`.ui-textarea`/`.ui-select-wrap`/`.ui-chart-legend`)
- **page 파셜(도메인별)**: `_codes`(table/drag-table), `_doc-dataset`(checkbox/table/input), `_repository`(button/tab/input/table/badge), `_meeting`(empty/datepicker/button), `_my-page`(table/button/tab/input), `_data-dashboard`(button/input/select/chart), `_datamart`(tab/tag/input/file-upload), `_dashboard`(chart), `_login`(button/checkbox), `_mail`(input/button), `_org-manage`(file-upload/input/select), `_chat`(button/chart/empty), 외
- **죽은 참조**: `_notice.scss:84-85` `.ui-pagination-total/-range`

### 1.4 범위 밖
- **Phase 4(로컬 유지·라이브러리 미존재)**: UiDialogModal, UiConfirmModal, UiDragTable, UiFormField, UiTag, UiCodeBlock, UiSettingSection, UiStatCard, UiStatusBadge
- **개별 reconciliation(라이브러리 있으나 구현 상이·드롭인 아님)**: UiMultiSelect, UiChart, UiToast, UiFileUpload → Phase 2 제외

---

## 2. 전략 (개정)

1. **원자적 파일 교체**: 파일을 라이브러리로 교체할 때 그 파일의 파괴 prop을 **동시에** 수정. 전역 prop codemod 패스 없음.
2. **도메인 웨이브**: 파괴군·SCSS override는 페이지 도메인 단위로 묶어 `swap + prop수정 + 도메인 SCSS 정리`를 한 웨이브에서. 저→고 얽힘 순.
3. **W1 선행**: 안전군 × override 없는 파일은 파괴/SCSS 무관 → 전역으로 먼저 드롭인(저위험 대량 진척).
4. **크로스-repo 루프**(§4.3): 라이브러리 변경이 필요한 결정(D1/D3/W-Drawer)은 ispark-ui 수정→빌드→푸시→team 핀 bump→재설치 절차를 밟는다.

---

## 3. 착수 전 결정 (확정됨 — 2026-06-30)

- **D1 — Button variant 매핑** ✅: `primary-line`/`line-secondary` → **`outline`**, `primary-dark` → **`primary`**, `dark` → **라이브러리에 `dark` variant 신규 추가**(진회색 solid #58616a 계열 보존, 크로스-repo).
- **D2 — Modal `:is-open` 처리** ✅: **라이브러리 UiModal에 `isOpen`→`open` 한시 alias 추가**. 48곳 재배선 없이 `position` 정리만 진행, `v-model:open` 정식 전환은 후속 집중 작업으로 분리.
- **D3 — Select `name` 6곳** ✅: 전부 form 제출 없는 v-model → **제거**(라이브러리 변경 불필요).
- **D4 — SCSS 정리** ✅: 도메인별로 **라이브러리 prop/slot으로 대체해 override 제거 우선**, 불가피할 때만 재작성.

> D1·D2는 라이브러리 선행 변경(§4.3 크로스-repo) 필요 → 도메인 웨이브 전에 ispark-ui에 `dark` variant + Modal `isOpen` alias를 추가하고 핀을 bump한다.

---

## 4. 공용 레퍼런스

### 4.1 파괴 prop 매핑표 (파일 교체 시 그 파일에만 적용)
| 컴포넌트 | 기존 | 교체 |
|---|---|---|
| UiButton | `variant="primary-line"` / `"line-secondary"` | `variant="outline"` |
| UiButton | `variant="dark"` / `"primary-dark"` | **D1 결정값** |
| UiButton | `size="xxs"` / `"xlg"` | `size="xs"` / `"lg"` |
| UiInput | `size="xs"` | `size="sm"` |
| UiInput | `radius="base"` | `shape="rounded"` |
| UiInput | `:spellcheck="false"` | 제거 |
| UiSelect | `size="xlg"` | `size="lg"` |
| UiSelect | `name="..."` | **D3 결정**(제거 or 유지) |
| UiModal | `:is-open="x"` (+ x=false만 하는 `@close`) | `v-model:open="x"` (@close 제거) |
| UiModal | `@close`(사이드이펙트 있음) | 유지 |
| UiModal | `position="center"` | 제거(기본) |
| UiModal | `position="right"` | **UiDrawer로 전환**(W-Drawer) |

### 4.2 라인 지정 치환 (over-replace 방지)
> per-file `sed` 금지(한 파일에 다른 컴포넌트가 같은 prop을 쓰면 오치환). 스캔이 준 **file:line**을 이용해 해당 라인만 치환하거나, 도메인 파일 수가 적으므로 **직접 편집(Edit)로 정확히** 수정. 반드시 `git diff` 전건 리뷰.

### 4.3 크로스-repo 절차 (라이브러리 변경 필요 시)
1. `C:\ispark-ui`에서 브랜치 → 컴포넌트 수정
2. `npm run build`(dist 재생성) + version bump + CHANGELOG
3. 커밋 → main 머지 → `git push origin main`
4. team_agent_front `package.json` 핀 갱신: `github:box3101/ispark-ui#<새 커밋>`
5. `npm install` → dev 재기동 → 검증

### 4.4 도메인 웨이브 검증 절차
- 교체 전 대상 도메인 대표 페이지 + 무관 페이지 2곳 **before 스크린샷**
- `npm run build` 통과
- 교체 후 **after 비교**(시각 회귀 0), 기능 스팟(모달 열림/닫힘, 폼, 테이블, 페이지네이션)
- 회귀 시 원인이 SCSS override면 그 도메인 SCSS를 D4 방식으로 정리 후 재검증

---

## 5. Wave 1 — 안전군 전역 드롭인 (즉시, 상세)

**원칙**: 안전군 컴포넌트를 **그 컴포넌트를 override하지 않는 파일**에서만 교체(파괴 prop·SCSS 무관 → 순수 드롭인). override 있는 파일은 해당 도메인 웨이브로 이관.

### Task W1-0: 브랜치/서버
- [ ] **Step 1**: PR #2 develop 머지 확인 → `git checkout develop && git pull && git checkout -b feature/ispark-ui-phase2`
- [ ] **Step 2**: `npm run dev`(3001) 기동, Playwright 준비.

### Task W1-1: 컴포넌트별 override-free 대상 산출
- [ ] **Step 1**: 각 안전군 C에 대해, §1.3 override 도메인을 제외한 사용 파일 목록 산출. 예:
```bash
# UiEmpty: override 도메인(meeting/my-documents/data-dashboard/menu-manage/chat) 제외
grep -rl "<UiEmpty" components pages | grep -vE "meeting|my-documents|data-dashboard|menu-manage|/chat/"
```
- [ ] **Step 2**: 컴포넌트별 워크리스트(파일 체크박스) 확정.

### Task W1-2: 드롭인 (C × 대상파일 F 반복)
- [ ] **Step 1**: F의 `<script setup>`에 `import { C } from '@leechanyong/ispark-ui'` 추가(기존 import에 합침).
- [ ] **Step 2**: template 무변경. (UiSelect는 `name`/`size="xlg"` 없는 파일만; 있으면 도메인 웨이브로.)
- [ ] **Step 3**: `npm run build` 통과. 타입에러 파일은 보류 목록.
- [ ] **Step 4**: 도메인/컴포넌트 묶음 커밋 `feat(ispark-ui): W1 safe drop-in <C or domain>`.

### Task W1-3: 검증(§4.4 도메인 단위)
- [ ] before/after 회귀 0 확인. 회귀 시 SCSS 원인이면 도메인 웨이브로 이관·되돌림.

**완료 기준**: override-free 안전군 전부 교체, 회귀 0, 나머지는 도메인 웨이브로 분류.

---

## 6. 도메인 웨이브 — 반복 패턴 (모든 도메인 공통 절차)

> 각 도메인 D에 대해 아래를 1개 웨이브(가능하면 1 PR)로 수행. 도메인 = 페이지 폴더 + 그 컴포넌트 폴더 + 그 도메인 SCSS 파셜.

### Step 1 — 도메인 범위 확정
- 대상 파일: `pages/<D>/**` + `components/<D>/**`
- 그 안의 라이브러리 대상 컴포넌트 사용처(안전군 잔여 + 파괴군) 목록화
- 파괴 prop 사용처(§4.1)와 도메인 SCSS override 파일(§1.3) 식별

### Step 2 — before 스크린샷 (§4.4)

### Step 3 — 파일별 원자 교체
각 파일에서: `import { ... } from '@leechanyong/ispark-ui'` 추가 **+** 그 파일의 파괴 prop을 §4.1대로 **동시 수정**(라인 지정/직접 편집). Modal은 §7, position=right는 §8 절차.

### Step 4 — 도메인 SCSS 정리 (D4)
그 도메인 파셜(`page/_<D>.scss` 및 관련 component 파셜)의 `.ui-*` override를 라이브러리 새 마크업 기준으로 재작성 또는 prop/slot 대체로 제거.

### Step 5 — 빌드 + 검증(§4.4) + 커밋
`npm run build` → after 회귀 0 + 기능 스팟 → 커밋 `feat(ispark-ui): migrate <D> domain (swap+props+scss)`.

---

## 7. UiModal 전환 서브 절차 (도메인 웨이브 내)

### 유형 분류
- **유형 A (로컬 ref로 열림 제어)**: `:is-open="x"`→`v-model:open="x"`, x=false만 하는 `@close` 제거, `position="center"` 제거. 기계적.
- **유형 B (부모가 is-open prop 하달하는 래퍼: NoticeFormPanel/DetailPanel 등)**: 래퍼의 open 계약을 `v-model:open` 또는 `open`+`update:open` emit으로 재설계 → 부모 사용부까지 수정. **래퍼별 개별 커밋.**

### D2 대안
라이브러리에 `open`이 `isOpen`도 허용하는 한시 alias를 두면 유형 A/B 모두 `:is-open` 유지 가능 → position만 정리하고 v-model 전환은 후속으로 미룰 수 있음. (크로스-repo §4.3 필요)

---

## 8. `position="right"` → UiDrawer (9곳, 각 도메인 웨이브 내)

대상: TmplFormPanel:4, LlmSettingModal:4, LibraryTrashModal:4, LibraryArchiveModal:4, UrlRegisterPanel:4, RepositoryFileFormModal:5, AgentSettingModal:4, NoticeFormPanel:5, NoticeDetailPanel:5.
- [ ] 라이브러리 `UiDrawer`(`C:\ispark-ui\src\components\ui\UiDrawer.vue`) props/slots 확인
- [ ] 저위험 1곳(NoticeDetailPanel) 파일럿 전환 + 검증 → 나머지 8곳 동일 패턴(각 도메인 웨이브에서 처리)

---

## 9. 도메인 진행 순서 (저→고 얽힘) + 도메인별 스코프

> 각 항목 = 하나의 도메인 웨이브. 착수 시 §6 패턴 적용. SCSS 얽힘·파괴군 밀도로 정렬.

| 순서 | 도메인 | 주요 파괴군 | SCSS override | 게이트 |
|---|---|---|---|---|
| ① | **login / signup / login-history** | Button(소), Input, Select(name: login-history date-range), Checkbox, Table | `_login`(button/checkbox) | D3(name) |
| ② | **chat-guide / menu-manage / my-page / mtlcare** | Button, Tab, Empty, Textarea, Select | `_my-page`(table/button/tab/input), `_menu-manage`(tab/empty), `_mtlcare`(loading) | — |
| ③ | **notice(잔여) / prompt** | Button(primary-line/line-secondary), Modal(PromptTestModal is-open/center/xlg), Select, Tab, Empty | `_prompt`(input), `_notice` 죽은참조 | D1일부 |
| ④ | **mail / my-documents / org-manage** | Input, Button, DatePicker, Modal(is-open/center), Select, Split | `_mail`(input/button), `_org-manage`(file-upload/input/select) | UiFileUpload 제외경계 |
| ⑤ | **meeting** | Button(line-secondary), Badge, Empty, DatePicker, Modal | `_meeting`(empty/datepicker/button) | D1 |
| ⑥ | **repository** | Button(line-secondary/xxs), Input(radius), Tab, Table, Tooltip, Pagination, Modal(is-open/right×2) | `_repository`(button/tab/input/table/badge, `.ui-button-outline-muted`, `.ui-tooltip-content`) | D1, Drawer |
| ⑦ | **doc-dataset** | Button(line-secondary), Toggle, Checkbox, Table, Modal(is-open/right?) | `_doc-dataset`(checkbox/table/input) | D1 |
| ⑧ | **datamart** | Button(line-secondary 다수), Input(xs/spellcheck), Tab, Modal | `_datamart`(tab/tag/input/file-upload) | D1 |
| ⑨ | **agent** | Button(line-secondary 다수), Checkbox, Select, Modal(is-open/right) | `_agent`(select-wrap) | D1, Drawer |
| ⑩ | **library** | Button(primary-line/line-secondary/primary-dark), Badge, Select, Dropdown, Modal(is-open/right×2) | `_library`(dropdown-trigger) | D1, Drawer |
| ⑪ | **chat** | Button(dark/line-secondary), Textarea, Select, Tooltip, Modal | `_chat`(button/chart/empty) | D1, UiChart 경계 |
| ⑫ | **codes / data-dashboard** | Button, Table, Dropdown, Modal, Input, Select, (DragTable·Chart 로컬 유지) | `_codes`(table/drag-table), `_data-dashboard`(button/input/select/chart) | UiChart·UiDragTable 경계 |

> ①②는 게이트 거의 없어 D1 확정 전에도 착수 가능. ③부터 D1 필요.

### Task DW-①: 첫 도메인 웨이브 (login / signup / login-history) — 템플릿 상세
- [ ] **Step 1**: 대상 파일 목록 — `pages/login.vue`, `pages/signup.vue`, `pages/login-history/index.vue` + 관련 컴포넌트.
- [ ] **Step 2**: before 스크린샷 3페이지(§4.4).
- [ ] **Step 3**: 파일별 원자 교체:
  - `pages/login.vue`: `import { UiInput, UiCheckbox, UiButton } from '@leechanyong/ispark-ui'` 추가. 파괴 prop 확인(로그인 버튼 variant/size — 스캔상 dark/line 없으면 무변경).
  - `pages/login-history/index.vue`: `import { UiInput, UiSelect, UiLoading, UiTable }`. **UiSelect `name="date-range"`(23행) → D3 결정 적용**.
  - `pages/signup.vue`: `import { UiInput, UiButton }`. 파괴 prop 확인.
- [ ] **Step 4**: `_login.scss`의 `.btn-auth-submit.ui-button`/`.ui-button-text`/`.ui-button-icon`(68–84), `.login-save-checkbox.ui-checkbox`(95–106) override를 라이브러리 마크업 기준 재검증/정리(D4).
- [ ] **Step 5**: `npm run build` → 로그인/가입/이력 화면 시각 회귀 + 기능(로그인 폼, 이력 검색/테이블) 확인 → 커밋 `feat(ispark-ui): migrate login/signup/login-history domain`.

> ②~⑫ 각 도메인 웨이브는 착수 시 §6 패턴 + 위 표의 스코프로 **하위 플랜 분할**(대상 구조 확인 후 상세화). 지금 전부 하드코딩하면 플레이스홀더가 되므로 의도적 분해.

---

## 10. 리스크
| 리스크 | 완화 |
|---|---|
| SCSS override 깨짐(최대) | 도메인 웨이브에 SCSS 정리 흡수 + 도메인별 Playwright 회귀 |
| 원자 교체 누락(swap만/prop만) | §6 Step3에서 파일별 import+prop 동시, diff 리뷰 |
| Modal 유형 B 파급 | §7 A/B 분류, 래퍼별 커밋, D2 alias 대안 |
| dark 임의 매핑 | D1 전 착수 금지 |
| codemod over-replace | §4.2 라인 지정/직접 편집 |
| 라이브러리·로컬 혼재 도메인(Chart/FileUpload/DragTable) | 해당 컴포넌트는 경계 유지, Phase 2 제외 명시 |
| 크로스-repo 핀 갱신 누락 | §4.3 절차 준수 |

## 11. 성공 기준
- [ ] W1: override-free 안전군 전량 교체, 회귀 0
- [ ] 도메인 웨이브 ①~⑫: 각 도메인 swap+prop+SCSS 완료, 빌드/시각/기능 통과
- [ ] Modal 48곳 v-model:open 전환(or D2 alias 결정), position=right 9곳 UiDrawer
- [ ] `_ui-pagination.scss` 삭제 + `_notice.scss` 죽은참조 제거 + 도메인 override 정리
- [ ] keep-local 9종·reconciliation 4종 범위 밖 유지

## 12. Self-Review 메모
- **v1 결함 수정 확인**: 파괴 prop을 독립 codemod 웨이브에서 분리 → 파일 단위 원자 교체(§2·§6)로 정정. SCSS를 도메인 웨이브에 흡수(§6 Step4). codemod는 라인 지정(§4.2). 크로스-repo 절차 추가(§4.3).
- **비-플레이스홀더**: W1·DW-①·매핑표·순서표는 실 데이터로 구체화. ②~⑫ 상세는 각 착수 시 하위 플랜 분할로 명시(의도적 분해 — 지금 쓰면 추정 태스크).
- **결정 게이트**: D1~D4를 도메인별 전제(순서표 "게이트" 열)로 매핑.
- **잔여 불확실**: Modal 유형 A/B 비율, 도메인별 SCSS 정리 실공수는 각 웨이브 Step1에서 확정.
