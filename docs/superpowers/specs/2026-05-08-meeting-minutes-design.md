# 회의록 에디터 본문 디자인 적용 스펙

- 작성일: 2026-05-08
- 대상 페이지: `/meeting/:id` 중앙 에디터 패널
- 접근 방식: CSS 전용 (HTML 템플릿/백엔드/JS 미변경)

## 1. 배경 및 목표

`/meeting/87` 회의록 상세에서 TipTap 에디터(`.meeting2-editor-body`)에 렌더링되는 자동 생성 회의록 콘텐츠를 사용자 제공 목업 디자인과 일치시킨다.

목업의 핵심 요소:

- "회의록" 중앙 타이틀(하단 라인 분리)
- 상단 5행 정보 표(라벨 컬럼 라이트 그레이 / 값 컬럼)
- 체크박스 아이콘 + primary 색상의 섹션 헤딩 5개(안건 / 논의내용 / 결정사항 / 할일목록 (To-Do) / 보류사항)
- primary 색상의 작은 원형 글머리 기호

## 2. 변경 범위

| 영역 | 파일 | 변경 |
|---|---|---|
| 에디터 본문 스타일 | `assets/styles/page/_meeting2.scss` | `.meeting2-editor-body` 안의 `h1` / `h2` / `table` / `ul/li` 규칙 보강·교체 |
| 로컬 mock 회의록 본문 | `server/utils/mockMeetingDb.ts` | `sampleMinutesContent` 를 새 HTML 구조로 교체 |

손대지 않는 영역:

- `MeetingEditorPanel.vue`, `MeetingEditorBody.vue`, TipTap 확장 설정
- `composables/meeting/useMeetingStore.ts` 의 `buildMinutesHtml()` (백엔드 연동 시 사용)
- 백엔드 `tmplHtml` 템플릿
- 다른 도메인의 에디터(`LibraryReportEditor`, `TmplFormPanel` 등)

스코프 격리: 모든 신규 CSS는 `.meeting2-editor-body` 자식 셀렉터로만 작성 → 다른 페이지/에디터에 영향 없음.

## 3. mock HTML 구조

`sampleMinutesContent` 를 아래 형태로 교체한다. 목업 이미지와 1:1 매칭.

```html
<h1>회의록</h1>

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
</ul>
```

구조적 결정:

- 정보 표는 `<thead>` 없이 `<tbody>` + 각 행의 `<th>`(라벨) + `<td>`(값) 패턴 → CSS에서 `tbody tr > th:first-child` 로 라벨 컬럼 분리
- 5개 섹션 모두 `<h2>` + `<ul>` (1단 깊이, 일관)

기존 mock 운영:

- `meeting-2`(주간 개발 스프린트)의 짧은 콘텐츠는 그대로 유지 → 짧은 콘텐츠 회귀 케이스로 활용

## 4. CSS 명세

대상: `assets/styles/page/_meeting2.scss` 의 `.meeting2-editor-body { ... }` 블록(현재 1220-1422 라인) 내부.

### 4.1 H1 — 중앙 타이틀

```scss
h1 {
  margin: 0 0 $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $color-border;
  text-align: center;
  @include typo($body-xlarge-bold, $color-text-dark);
}
```

### 4.2 H2 — 섹션 헤딩(체크박스 + primary)

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

프로젝트 `_icons.mixins.scss` 의 mask-image + currentColor 패턴을 그대로 차용 → 테마 전환 시 자동 반영.

### 4.3 정보 표(Info Table)

```scss
table {
  width: 100%;
  margin: 0 0 $spacing-lg;
  border-collapse: collapse;
  border: 1px solid $color-border;
  table-layout: fixed;

  tbody tr > th:first-child {
    width: 96px;
    padding: 10px 12px;
    background: $color-background;
    border: 1px solid $color-border;
    @include typo($body-small-bold, $color-text-dark);
    text-align: center;
    vertical-align: middle;
  }

  tbody tr > td {
    padding: 10px 12px;
    border: 1px solid $color-border;
    @include typo($body-small, $color-text-dark);
    line-height: 1.6;
    vertical-align: middle;

    p { margin: 0; }
  }
}
```

라벨 컬럼 폭 96px 고정. `$color-background`(라이트 그레이) 배경.

### 4.4 글머리 기호 — primary dot

```scss
ul {
  list-style: none;
  padding-left: 0;
  margin: 0 0 $spacing-md;

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
}
```

`list-style: none` 으로 기본 disc 마커 제거 후 `::before` 6px 원형으로 대체.

### 4.5 기존 스타일 처리 방침

`.meeting2-editor-body` 블록 안에서:

- 기존 `h1` / `h2` / `ul` / `table` 규칙은 위 4개 블록으로 교체(병합)
- 기존 `h3` / `ol` / `li > p` / `blockquote` / `img` / `a` / `mark` / `pre` / `code` / `.selectedCell::after` / `.column-resize-handle` 는 그대로 유지

## 5. 엣지 케이스

| 케이스 | 처리 |
|---|---|
| `<thead>` 가 있는 표(추후 백엔드 콘텐츠) | `tbody tr > th:first-child` 셀렉터라 thead th는 매칭 안 됨 → 흰 배경/일반 텍스트로 보이며, 디자인은 어긋나도 깨지지는 않음. 추후 분리 요구 시 셀렉터 추가 |
| 빈 값 `<td></td>` | `padding: 10px 12px` 로 행 높이 유지 |
| 체크박스 없는 h2가 필요한 경우 | 현재 미지원(YAGNI). 필요 시 `h2.no-icon::before { display: none }` 익스케이프 추가 |
| 중첩 `<ul>` | 1단 가정. 중첩 시 상위/하위 모두 동일 primary dot → 시각 구분 약함. 요구 발생 시 보강 |
| 모바일(1024px 미만) | 96px 라벨 폭 그대로 유지(좁은 화면에서도 충분). 별도 반응형 분기 없음 |
| 다크 테마 | `var(--color-primary)` / `$color-background` 토큰 기반 → 테마 추가 시 자동 반영 |
| TipTap 컬럼 리사이즈 | 기존 `.column-resize-handle` 규칙 유지 |
| h1 여러 개 | 모두 동일 스타일. 시각적으로 중복돼 보일 수 있으나 데이터상 문제 없음 |

## 6. 회귀 위험

- 다른 도메인 에디터(`LibraryReportEditor`, `TmplFormPanel`) — 셀렉터가 `.meeting2-editor-body` 자식이라 영향 0
- `meeting-2`(주간 개발 스프린트) 콘텐츠 — 같은 에디터에서 렌더되므로 새 디자인 자동 적용. h2 "스프린트 리뷰"가 체크박스 + primary 색으로 보이는 것은 의도된 동작

## 7. 테스트 절차(수동)

기본 시나리오:

1. `npm run dev` 후 `/meeting/87` 접속(또는 회의 목록에서 임의 회의 클릭)
2. 중앙 에디터 패널이 목업과 일치하는지 확인:
   - 회의록 타이틀 중앙 정렬 + 하단 라인
   - 정보 표 5행, 라벨 컬럼 라이트 그레이
   - 5개 섹션 모두 체크박스 아이콘 + primary 색
   - 글머리 점 primary 색상
3. `/meeting/2` 회귀 — 짧은 콘텐츠 깨지지 않는지

상호작용:

4. h2 줄 끝에서 Enter → 새 라인 정상
5. 새 h2 작성 → 자동으로 체크박스 + primary 색 적용
6. 정보 표의 td 클릭 → 컬럼 리사이즈 핸들 정상

책임 분담:

- 빌드 / 타입 체크: 사용자가 직접 확인(프로젝트 메모리 규칙)
- 시각 검수: 사용자가 브라우저로 직접 확인

## 8. 변경 규모(예상)

- 파일 변경: 2개
- 코드 라인 변경: 약 80-100줄(대부분 SCSS)
- TypeScript / Vue 변경: 0
- 신규 의존성: 0
- TipTap 호환: 그대로

## 9. 후속 작업(스펙 외)

이번 스펙에 포함하지 않는 사항. 요구 발생 시 별도 스펙으로 처리:

- 체크박스 비활성/활성 토글(체크 / 미체크 두 상태)
- 다크 테마 변수 추가
- 인쇄 / PDF 전용 스타일
- 라이브러리(`LibraryReportEditor`)에 동일 디자인 재사용 → 공통 추상화 리팩터
- thead 헤더가 있는 표를 별도 시각으로 분리
