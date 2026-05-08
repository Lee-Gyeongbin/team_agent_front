# 회의록 에디터 본문 디자인 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/meeting/:id` 중앙 에디터 본문(`.meeting2-editor-body`)을 사용자 제공 목업과 일치하도록 CSS만 수정하고, 로컬 개발용 mock 회의록 데이터를 새 HTML 구조로 교체한다.

**Architecture:** TipTap 에디터 본문에 적용되는 글로벌 SCSS(`.meeting2-editor-body` 스코프)를 수정한다. `h1`(중앙 타이틀), `h2`(체크박스+primary 헤딩), `table`(정보 표 룩), `ul/li`(primary dot) 4개 블록을 교체·신규 작성. 다른 도메인 에디터에는 영향 없음. mock 회의록 본문(`sampleMinutesContent`)은 새 디자인을 로컬에서 시각 확인하기 위해 목업 구조와 일치시킴.

**Tech Stack:** Nuxt 3 SPA / Vue 3.5 / TipTap / SCSS (CSS 변수 + 디자인 토큰)

**Spec:** `docs/superpowers/specs/2026-05-08-meeting-minutes-design.md`

**프로젝트 운영 규칙(중요):**
- SCSS/Vue 단위 테스트 인프라 없음 → TDD 패턴 미적용. 시각 검수가 검증 수단
- 빌드 / 타입 체크는 사용자가 직접 수행 (프로젝트 메모리 규칙). 본 plan에서 Claude는 `nuxi build` / `tsc` 등 빌드 명령 실행하지 않음
- 커밋 컨벤션: `<type>(<scope>): <한글 제목>` + 본문 번호 리스트
- 한 git 브랜치는 `feat/editor-html-source-view` 위에서 작업(현재 브랜치). 별도 worktree 미사용

---

## File Structure

| 파일 | 역할 | 변경 종류 |
|---|---|---|
| `server/utils/mockMeetingDb.ts` | 로컬 dev mock 회의록 데이터 | `sampleMinutesContent` 상수 교체 (line 111-150) |
| `assets/styles/page/_meeting2.scss` | 회의록 페이지 전체 스타일 | `.meeting2-editor-body` 안의 `h1` / `h2` / `li > p` / `ul` / `table` 규칙 교체·보강 (line 1252-1383) |

손대지 않는 영역(스펙 합의):

- `MeetingEditorPanel.vue`, `MeetingEditorBody.vue`, TipTap 확장
- `composables/meeting/useMeetingStore.ts` 의 `buildMinutesHtml()`
- 기타 `.meeting2-editor-body` 안의 `h3` / `ol` / `blockquote` / `img` / `a` / `mark` / `p` / `pre` / `code` / `.selectedCell::after` / `.column-resize-handle`

---

## Task 1: mock 회의록 본문 교체

**Files:**
- Modify: `server/utils/mockMeetingDb.ts:111-150`

목업과 1:1 매칭되는 새 HTML 구조로 `sampleMinutesContent` 상수를 통째로 교체한다. 이 데이터는 `meeting-1`(meetingId 87 매핑) 의 minutes에 사용되며 로컬에서 새 디자인을 시각 확인하기 위한 픽스처다.

- [ ] **Step 1: 기존 `sampleMinutesContent` 상수 통째로 교체**

`server/utils/mockMeetingDb.ts` 의 line 111-150 (기존 `<h2>1. 회의 개요</h2>` 부터 시작해서 `<li>안건: 실행 계획 진행 상황 점검</li></ul>\`` 까지)을 아래로 치환:

```ts
const sampleMinutesContent = `<h1>회의록</h1>
<table>
  <tbody>
    <tr><th>제목</th><td>퍼블릭 LLM 사용 및 비용 관련 논의</td></tr>
    <tr><th>작성자</th><td>허회진</td></tr>
    <tr><th>일시</th><td></td></tr>
    <tr><th>장소</th><td></td></tr>
    <tr><th>참석자</th><td>SPEAKER_00, SPEAKER_01</td></tr>
  </tbody>
</table>
<h2>안건</h2>
<ul>
  <li>퍼블릭 LLM 사용 가능 여부</li>
  <li>비용 발생 시점과 규모</li>
  <li>방산업체의 제약 사항</li>
</ul>
<h2>논의내용</h2>
<ul>
  <li>방산업체는 퍼블릭 LLM 사용 불가하여 SLM 이동 필요</li>
  <li>일부 기관에서는 퍼블릭 LLM 사용 가능</li>
  <li>과제 비용은 약 3600만원 수준이며 단계별로 지출됨</li>
  <li>필요 시 클라우드 사용 요청 가능하지만 현재는 미확정</li>
  <li>퍼블릭 LLM이 필요 기능을 수행하는 데 필수적임</li>
</ul>
<h2>결정사항</h2>
<ul>
  <li>퍼블릭 LLM 사용 가능한 기관과 비사용 기관 구분하여 적용</li>
  <li>비용 산정은 단계별로 진행하며 구체적 비용 추후 확정</li>
  <li>클라우드 사용 요청은 필요 시에만 진행</li>
</ul>
<h2>할일목록 (To-Do)</h2>
<ul>
  <li>SLM 이동 가능성 검토 및 추진</li>
  <li>비용 세부 산정 자료 준비</li>
  <li>클라우드 사용 요청 절차 마련</li>
</ul>
<h2>보류사항</h2>
<ul>
  <li>정확한 비용 산정 확정</li>
  <li>클라우드 사용 시기 및 범위 결정</li>
</ul>`
```

- [ ] **Step 2: 변경 라인 수 점검**

```bash
git diff --stat server/utils/mockMeetingDb.ts
```

기대치: `server/utils/mockMeetingDb.ts | XX +- ...` 한 파일만 변경. `meetingList` 등 다른 부분은 손대지 않았는지 `git diff server/utils/mockMeetingDb.ts` 로 육안 확인.

- [ ] **Step 3: 커밋**

```bash
git add server/utils/mockMeetingDb.ts
git commit -m "$(cat <<'EOF'
chore(meeting): 회의록 mock 본문을 새 디자인 구조로 교체

1. sampleMinutesContent 를 h1 회의록 / 정보표 / 5개 섹션 구조로 재작성
2. 정보표는 thead 없이 tbody 안에서 th(라벨) + td(값) 2열 패턴 사용
3. 섹션은 안건 / 논의내용 / 결정사항 / 할일목록 (To-Do) / 보류사항
EOF
)"
```

---

## Task 2: SCSS — h1 중앙 타이틀

**Files:**
- Modify: `assets/styles/page/_meeting2.scss:1252-1259` (기존 h1 블록)

`.meeting2-editor-body` 안의 `h1` 규칙을 중앙 정렬 + 하단 라인이 있는 타이틀 스타일로 교체.

- [ ] **Step 1: 기존 h1 블록 교체**

`_meeting2.scss` line 1252-1259 의 기존 h1 블록:

```scss
  h1 {
    margin: $spacing-lg 0 $spacing-md;
    @include typo($body-xlarge-bold, $color-text-dark);

    &:first-child {
      margin-top: 0;
    }
  }
```

을 아래로 교체:

```scss
  h1 {
    margin: 0 0 $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $color-border;
    text-align: center;
    @include typo($body-xlarge-bold, $color-text-dark);
  }
```

기존 `&:first-child` 마진 리셋은 제거(어차피 위 마진을 0으로 두므로 불필요).

- [ ] **Step 2: 변경 확인 (커밋은 Task 3 끝에서 묶음)**

```bash
git diff assets/styles/page/_meeting2.scss
```

h1 블록만 변경되어야 함.

---

## Task 3: SCSS — h2 섹션 헤딩 (체크박스 + primary)

**Files:**
- Modify: `assets/styles/page/_meeting2.scss:1261-1268` (기존 h2 블록)

`.meeting2-editor-body` 안의 `h2` 규칙을 primary 색상 + `::before` 체크박스 SVG mask 아이콘 스타일로 교체.

- [ ] **Step 1: 기존 h2 블록 교체**

line 1261-1268 의 기존 h2 블록:

```scss
  h2 {
    margin: $spacing-lg 0 $spacing-md;
    @include typo($body-large-bold, $color-text-dark);

    &:first-child {
      margin-top: 0;
    }
  }
```

을 아래로 교체:

```scss
  h2 {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin: $spacing-lg 0 $spacing-sm;
    @include typo($body-medium-bold);
    color: var(--color-primary);

    &::before {
      content: '';
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      background-color: var(--color-primary);
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='3'/%3E%3Cpath d='m8 12 3 3 5-6'/%3E%3C/svg%3E");
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='3'/%3E%3Cpath d='m8 12 3 3 5-6'/%3E%3C/svg%3E");
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
      -webkit-mask-size: contain;
    }
  }
```

기존 `&:first-child { margin-top: 0 }` 도 제거 (h1 다음에 첫 h2가 와도 `$spacing-lg` 마진이 디자인상 자연스러움).

- [ ] **Step 2: 변경 확인**

```bash
git diff assets/styles/page/_meeting2.scss
```

h1 + h2 블록 변경 확인.

- [ ] **Step 3: 헤딩 변경분 커밋**

```bash
git add assets/styles/page/_meeting2.scss
git commit -m "$(cat <<'EOF'
style(meeting): 에디터 본문 h1/h2를 회의록 디자인 스타일로 교체

1. h1: 중앙 정렬 + 하단 1px border 추가로 회의록 메인 타이틀 분리
2. h2: primary 색상 + ::before mask-image 체크박스 SVG로 섹션 헤딩 강조
3. 체크박스 아이콘은 currentColor 토큰 호환을 위해 mask-image + var(--color-primary) 사용
EOF
)"
```

---

## Task 4: SCSS — 정보 표 (Info Table) 룩

**Files:**
- Modify: `assets/styles/page/_meeting2.scss:1333-1383` (기존 table 블록)

`.meeting2-editor-body` 안의 `table` 블록을 정보 표(2열, 라벨 컬럼 라이트 그레이) 스타일로 교체. TipTap 동작에 필요한 `.selectedCell::after` 와 `.column-resize-handle` 은 그대로 유지.

- [ ] **Step 1: 기존 table 블록 교체**

line 1333-1383 의 기존 table 블록:

```scss
  table {
    width: 100%;
    margin-bottom: $spacing-md;
    border-collapse: collapse;
    border: 1px solid $color-border;
    table-layout: fixed;

    th,
    td {
      padding: 6px 10px;
      border: 1px solid $color-border;
      @include typo($body-small, $color-text-dark);
      line-height: 1.5;
      text-align: left;
      vertical-align: top;
      position: relative;

      // 셀 안쪽 단락(Tiptap이 셀 내용을 <p>로 감싸므로 마진/라인하이트 리셋)
      p {
        margin: 0;
        font-size: inherit;
        line-height: inherit;
      }

      // Tiptap에서 셀 선택 시 표시
      &.selectedCell::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(var(--color-primary-rgb), 0.12);
        pointer-events: none;
      }
    }

    th {
      background: $color-background;
      @include typo($body-small-bold, $color-text-dark);
      line-height: 1.5;
    }

    // Tiptap 표 컬럼 리사이즈 핸들
    .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: -2px;
      width: 4px;
      background: var(--color-primary);
      pointer-events: none;
    }
  }
```

을 아래로 교체:

```scss
  table {
    width: 100%;
    margin: 0 0 $spacing-lg;
    border-collapse: collapse;
    border: 1px solid $color-border;
    table-layout: fixed;

    th,
    td {
      padding: 10px 12px;
      border: 1px solid $color-border;
      @include typo($body-small, $color-text-dark);
      line-height: 1.6;
      vertical-align: middle;
      position: relative;

      // Tiptap이 셀 내용을 <p>로 감싸므로 마진/라인하이트 리셋
      p {
        margin: 0;
        font-size: inherit;
        line-height: inherit;
      }

      // Tiptap에서 셀 선택 시 표시
      &.selectedCell::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(var(--color-primary-rgb), 0.12);
        pointer-events: none;
      }
    }

    // 정보 표 라벨 컬럼 — tbody 행의 첫 번째 th
    tbody tr > th:first-child {
      width: 96px;
      background: $color-background;
      @include typo($body-small-bold, $color-text-dark);
      text-align: center;
    }

    // Tiptap 표 컬럼 리사이즈 핸들
    .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: -2px;
      width: 4px;
      background: var(--color-primary);
      pointer-events: none;
    }
  }
```

핵심 변경:
- `padding: 6px 10px` → `padding: 10px 12px` (목업 행 높이에 맞춤)
- `vertical-align: top` → `vertical-align: middle`
- `text-align: left` 기본 제거 (브라우저 기본 left/th center 그대로 사용)
- 기존 모든 `th` 일괄 그레이 배경 → `tbody tr > th:first-child` 만 그레이 + 폭 96px + center 정렬 (정보 표 라벨 컬럼 분리)
- `margin-bottom: $spacing-md` → `margin: 0 0 $spacing-lg` (섹션 사이 호흡 확장)

- [ ] **Step 2: 변경 확인**

```bash
git diff assets/styles/page/_meeting2.scss
```

table 블록만 추가 변경되어 있어야 함.

- [ ] **Step 3: 정보 표 변경분 커밋**

```bash
git add assets/styles/page/_meeting2.scss
git commit -m "$(cat <<'EOF'
style(meeting): 에디터 본문 table을 정보 표 룩으로 교체

1. tbody tr > th:first-child 셀렉터로 라벨 컬럼만 라이트 그레이 + 폭 96px + center 정렬
2. 셀 padding 6px/10px → 10px/12px, vertical-align top → middle 로 행 높이 확장
3. .selectedCell::after / .column-resize-handle TipTap 동작 의존 규칙은 그대로 유지
EOF
)"
```

---

## Task 5: SCSS — ul / li / li > p (primary dot)

**Files:**
- Modify: `assets/styles/page/_meeting2.scss:1280-1296` (기존 ul 블록)
- Modify: `assets/styles/page/_meeting2.scss:1316-1321` (기존 li > p 블록)

`.meeting2-editor-body` 안의 `ul` 블록과 `li > p` 블록을 함께 갱신한다. ul 글머리 점은 `list-style: none + ::before`로 primary 색상 6px 원형으로 교체. `li > p` 는 부모 `li`의 폰트 토큰을 그대로 상속받도록 단순화 (TipTap StarterKit 가 li 안에 p를 자동 삽입하므로 ul/ol 양쪽에 안전하게 적용되어야 함).

- [ ] **Step 1: 기존 ul 블록 교체**

line 1280-1296 의 기존 ul 블록:

```scss
  // 글로벌 reset이 list-style: none 이라 에디터 영역에서만 복원
  ul {
    list-style: disc outside;
    margin: 0 0 $spacing-md;
    padding-left: 26px;

    li {
      margin-bottom: $spacing-xs;
      @include typo($body-medium, $color-text-dark);
      line-height: 1.7;
    }

    // 중첩 리스트
    ul {
      list-style: circle outside;
      margin: $spacing-xs 0 0;
    }
  }
```

을 아래로 교체:

```scss
  ul {
    list-style: none;
    margin: 0 0 $spacing-md;
    padding-left: 0;

    li {
      position: relative;
      padding-left: 18px;
      margin-bottom: 6px;
      @include typo($body-small, $color-text-dark);
      line-height: 1.7;

      &::before {
        content: '';
        position: absolute;
        left: 4px;
        top: 0.65em;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--color-primary);
      }
    }

    // 중첩 리스트 — 1단 가정이지만 들여쓰기는 살림
    ul {
      margin: 6px 0 0;
      padding-left: 12px;
    }
  }
```

- [ ] **Step 2: 기존 li > p 블록 교체**

line 1316-1321 의 기존 li > p 블록:

```scss
  // Tiptap의 li > p (StarterKit BulletList/OrderedList는 li 안에 p를 넣음)
  li > p {
    margin: 0;
    @include typo($body-medium, $color-text-dark);
    line-height: 1.7;
  }
```

을 아래로 교체:

```scss
  // TipTap StarterKit 가 li 안에 p를 자동 삽입하므로 li 의 타이포 토큰을 그대로 상속받도록 단순화
  // (ul li 는 $body-small, ol li 는 $body-medium — 각 부모 li에서 결정)
  li > p {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    color: inherit;
  }
```

- [ ] **Step 3: 변경 확인**

```bash
git diff assets/styles/page/_meeting2.scss
```

ul + li > p 두 블록 추가 변경 확인.

- [ ] **Step 4: ul 변경분 커밋**

```bash
git add assets/styles/page/_meeting2.scss
git commit -m "$(cat <<'EOF'
style(meeting): 에디터 본문 ul 글머리 기호를 primary 원형 점으로 교체

1. list-style: none + li::before 6px 원형(primary)으로 마커 대체
2. ul li 본문 타이포를 $body-small 로 정렬, 좌측 들여쓰기 18px
3. li > p 는 부모 li 토큰 상속 형태로 단순화하여 TipTap p 래핑 회귀 방지
EOF
)"
```

---

## Task 6: 수동 시각 검수 (사용자 수행)

**Files:**
- 변경 없음. 사용자 브라우저 검증 단계.

빌드/타입 체크는 사용자가 별도로 수행 (프로젝트 메모리 규칙). 본 단계는 시각 검수에 한정.

- [ ] **Step 1: 개발 서버 실행 및 접속**

사용자가 직접 수행:

```bash
npm run dev
```

브라우저에서 `http://localhost:3001/meeting/87` 접속.

- [ ] **Step 2: 시각 체크리스트**

다음 4개 모두 통과해야 합격:

- [ ] 회의록 타이틀 중앙 정렬 + 하단 라인 분리
- [ ] 정보 표 5행, 라벨 컬럼(제목 / 작성자 / 일시 / 장소 / 참석자) 라이트 그레이 배경 + 96px 폭 + 굵은 글씨
- [ ] 5개 섹션(안건 / 논의내용 / 결정사항 / 할일목록 (To-Do) / 보류사항) 모두 primary 색상 + 좌측 체크박스 아이콘
- [ ] 글머리 점이 primary 색상의 작은 원형(disc 아님)

- [ ] **Step 3: 회귀 체크**

`/meeting/2` (주간 개발 스프린트) 접속:

- [ ] 짧은 콘텐츠가 깨지지 않음 (h2 "스프린트 리뷰" 가 체크박스 + primary 색으로 보이는 것은 의도된 동작)
- [ ] 다른 페이지(라이브러리, 에이전트 등) 진입 시 본 변경의 영향 없음

- [ ] **Step 4: 상호작용 검증**

에디터 안에서 직접 입력:

- [ ] h2 줄 끝에서 Enter → 새 라인 정상
- [ ] 새로 만든 h2 도 자동으로 체크박스 + primary 색 적용
- [ ] 정보 표 td 클릭 시 컬럼 리사이즈 핸들 정상 표시

- [ ] **Step 5: 검수 결과에 따른 분기**

- 모두 통과 → Task 완료, 종료
- 미세 조정 필요 → 해당 Task의 SCSS 값(여백 / 폭 / 색상 토큰)을 픽스 후 같은 Task 의 커밋 메시지 형식으로 추가 커밋
- 큰 회귀 발생 → 해당 Task 커밋(`git revert <hash>`) 후 원인 분석

---

## Self-Review

본 계획을 스펙(`docs/superpowers/specs/2026-05-08-meeting-minutes-design.md`)과 대조한 결과:

**1. Spec coverage**
- §3 mock HTML 구조 → Task 1
- §4.1 H1 → Task 2
- §4.2 H2 (체크박스 + primary) → Task 3
- §4.3 정보 표 → Task 4
- §4.4 글머리 기호 → Task 5
- §4.5 기존 스타일 처리 방침 → Task 2~5에서 교체 대상 명시(h1/h2/ul/li>p/table) + 유지 대상 SCSS 블록은 손대지 않음
- §5 엣지 케이스 → Task 4 (tbody tr > th:first-child 로 thead 분리), Task 5 (li > p 토큰 상속으로 ol/ul 폰트 충돌 방지)
- §6 회귀 위험, §7 테스트 절차 → Task 6 (시각 검수)

스펙 §5에 명시된 "thead가 있는 표는 디자인 어긋나도 깨지지는 않음" 은 새 셀렉터 `tbody tr > th:first-child` 로 자동 충족 (thead th 매칭 안 됨).

**2. Placeholder scan**
TBD / TODO / "fill in details" / "similar to Task N" 없음. 모든 Task 가 실제 코드/명령을 포함.

**3. Type consistency**
- Task 1 의 mock HTML 구조(h1 / table tbody tr th+td / h2 + ul) → Task 2~5 의 CSS 셀렉터와 매칭 확인
- Task 4 의 셀렉터 `tbody tr > th:first-child` 와 mock HTML 의 `<tbody><tr><th>...</th><td>...` 매칭 ✓
- Task 5 의 `li > p` 토큰 상속과 Task 4 의 `td p` 마진 리셋이 충돌하지 않음 (서로 다른 부모 셀렉터) ✓
- 모든 SCSS 토큰 사용 검증: `$spacing-*`, `$color-*`, `var(--color-primary)`, `@include typo($body-*)` 모두 프로젝트 변수 / 믹스인 시스템에 존재

---

## Execution Handoff

**프로젝트 메모리 규칙(`feedback_execution_speed.md`)에 따라 작은~중간 task는 인라인 직접 실행을 선호.**

본 plan 은 SCSS 4 블록 + mock 1 블록 = 매우 작은 변경이라 **인라인 실행(superpowers:executing-plans)** 이 적합.

대안: 시각 회귀 위험을 더 분리하고 싶다면 subagent-driven-development 로 Task 별 격리도 가능하지만 본 작업 규모 대비 과한 절차.
