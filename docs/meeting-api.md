# 회의록(Meeting) API 명세서

> **작성일**: 2026-04-27
> **대상**: 백엔드 개발자
> **프론트 위치**: `composables/meeting/`, `components/meeting/`, `pages/meeting/`, `types/meeting.ts`
> **현재 상태**: Mock API 기반 프론트 구현 완료. 실제 API 연결 대기.

---

## 목차

1. [개요](#1-개요)
2. [공통 응답 구조](#2-공통-응답-구조)
3. [타입 정의](#3-타입-정의)
4. [엔드포인트 명세 (구현된 것)](#4-엔드포인트-명세-구현된-것)
5. [미구현 — 추가 필요한 엔드포인트](#5-미구현--추가-필요한-엔드포인트)
6. [백엔드와 합의해야 할 결정 항목](#6-백엔드와-합의해야-할-결정-항목)
7. [5단계 진행 흐름과 API 매핑](#7-5단계-진행-흐름과-api-매핑)
8. [샘플 응답 데이터](#8-샘플-응답-데이터)
9. [Mock → 실제 API 전환 가이드](#9-mock--실제-api-전환-가이드)

---

## 1. 개요

### 도메인

회의록 관리 시스템. 사용자가 회의를 녹음하면 STT로 발화가 텍스트화되고, 화자가 자동 분리됩니다. AI가 회의록을 자동 생성하고, 사용자는 화자 이름을 매핑한 뒤 본문을 편집해서 파일로 저장하거나 메일로 발송합니다.

### 5단계 진행 (Stepper)

| # | key | label | 설명 |
|---|-----|-------|------|
| 1 | `record` | 회의 녹음 / 실시간 STT | 마이크로 녹음 + 실시간 STT |
| 2 | `speaker` | 화자 분리 | STT가 자동 분리한 화자(`화자1`, `화자2`...)를 사용자가 실명으로 매핑 |
| 3 | `generate` | 회의록 자동 생성 | LLM이 STT 발화를 기반으로 회의록 초안 생성 |
| 4 | `edit` | 회의록 편집 | WYSIWYG 에디터로 본문 편집 (자동 저장) |
| 5 | `share` | 저장 및 공유 | 파일 저장 (PDF/DOCX/HWP/TXT/MD) / 메일 발송 / 링크 공유 |

### 화면 구성 (3분할)

```
┌──────────────┬─────────────────────────┬──────────────┐
│  좌측 패널    │      중앙 (에디터)       │  우측 패널    │
│  녹음/STT    │                         │  회의 정보    │
│  화자 목록   │  자동 생성된 회의록       │  화자 목록    │
│              │  (Tiptap, 자동 저장)     │  작업 메뉴    │
└──────────────┴─────────────────────────┴──────────────┘
```

---

## 2. 공통 응답 구조

모든 API는 다음 형태의 JSON을 반환합니다.

```ts
// 단건 응답
{
  result: 'SUCCESS' | 'FAIL',
  data?: T,           // 단건 객체일 때
  message: string     // 실패 시 사유
}

// 목록 응답
{
  result: 'SUCCESS' | 'FAIL',
  list?: T[],         // 목록일 때
  message: string
}
```

- 성공 시 `result: 'SUCCESS'`, `message: ''`
- 실패 시 `result: 'FAIL'`, `message: '에러 사유'`
- HTTP 상태 코드와 무관하게 응답 본문의 `result`로 판정

### 에러 처리

- `401` → 프론트(`useApi`)가 토큰 제거 + `/login` 리다이렉트 (자동)
- 그 외 에러 → 프론트가 toast로 표시

---

## 3. 타입 정의

> 이 타입 정의는 `types/meeting.ts`에 그대로 존재합니다. 백엔드 DTO 베이스로 사용 가능합니다.

### 3.1. 진행 단계

```ts
type MeetingStepStatus = 'wait' | 'progress' | 'done'
type MeetingStepKey = 'record' | 'speaker' | 'generate' | 'edit' | 'share'

interface MeetingStep {
  key: MeetingStepKey
  label: string
  status: MeetingStepStatus
}
```

### 3.2. 화자

```ts
interface MeetingSpeaker {
  id: string
  name: string         // 표시 이름 (인라인 매핑으로 변경 가능)
  alias?: string       // (나) 같은 표시용 별칭
  colorIndex: number   // 0~7 색상 팔레트 인덱스
}
```

### 3.3. STT 발화

```ts
interface MeetingSttItem {
  id: string
  speakerId: string    // MeetingSpeaker.id 참조
  speakerName: string  // 매핑된 화자 이름 (캐시 — 화자 이름 변경 시 백엔드에서 동기화)
  time: string         // HH:MM:SS
  text: string
}
```

### 3.4. 메일 수신자

```ts
interface MeetingRecipient {
  id: string           // 내부 사용자 id 또는 외부 메일 식별자(`ext-{timestamp}`)
  name: string
  email?: string       // 외부 메일은 필수, 내부 사용자는 선택
}
```

### 3.5. 사용자 (메일 발송 대상 검색용)

```ts
interface MeetingUser {
  id: string
  name: string
  email: string
  dept: string         // 부서명
}
```

### 3.6. 파일 저장 폼

```ts
type MeetingFileFormat = 'docx' | 'pdf' | 'hwp' | 'txt' | 'md'

interface MeetingFileSaveForm {
  format: MeetingFileFormat
  fileName: string
}
```

### 3.7. 녹음 상태 (프론트 전용)

```ts
type RecordStatus = 'idle' | 'recording' | 'paused' | 'stopped'
```

### 3.8. 회의 단건 ⭐

```ts
interface Meeting {
  id: string
  title: string                      // 회의명
  date: string                       // 회의 일시 — "YYYY.MM.DD (요일) HH:MM ~ HH:MM"
  location?: string                  // 회의실
  participants: string[]             // 참석자 이름 배열 (정규화 검토 필요 — 6번 항목 참조)
  purpose?: string                   // 회의 목적
  steps: MeetingStep[]               // 진행 단계 5개
  speakers: MeetingSpeaker[]         // 화자 목록
  sttList: MeetingSttItem[]          // 실시간 STT 발화 리스트
  minutesContent: string             // WYSIWYG 회의록 본문 (HTML)
  fileFormat: MeetingFileFormat      // 마지막에 선택한 파일 형식
  recipients: MeetingRecipient[]     // 메일 발송 대상
  templateId: string                 // 회의록 템플릿 id
  language: string                   // STT 언어 (ko, en, ja 등)
  createdAt: string                  // ISO 8601 (예: "2026-04-26")
  updatedAt: string                  // ISO 8601 datetime (예: "2026-04-27T10:23:45.123Z")
}
```

> ⚠ `Meeting`에 추가 필요 가능성 있는 필드는 [6.3 스키마 추가 후보](#63-meeting-스키마-추가-후보) 참조

---

## 4. 엔드포인트 명세 (구현된 것 — 8개)

> 현재 프론트는 Mock으로 `POST /mock/meeting/*`을 호출합니다. 실제 API는 `POST /api/meeting/*`로 전환됩니다 (proxy 설정).

### 4.1. 회의 목록 조회

```
POST /meeting/list
Body: {} (필요 시 검색 파라미터 추가)
```

**응답**

```ts
{ result: 'SUCCESS', list: Meeting[], message: '' }
```

### 4.2. 회의 단건 조회

```
POST /meeting/detail
Body: { id: string }
```

**응답**

```ts
{ result: 'SUCCESS', data: Meeting | null, message: '' }
```

### 4.3. 회의 저장 (신규/수정)

```
POST /meeting/save
Body: Partial<Meeting>     // id 없으면 신규, 있으면 수정
```

**응답**

```ts
{ result: 'SUCCESS', data: Meeting, message: '' }
```

**프론트 사용 패턴**
- 새 회의: `body = {}` → 서버에서 default 값으로 신규 생성 → `data.id`로 navigate
- 부분 수정: `body = { id, title }` 또는 `{ id, minutesContent }` 등 변경 필드만 전달
- **자동 저장(silent 모드)**: 800ms 디바운스로 본문 자동 저장. 서버는 응답에서 `updatedAt`만 갱신

### 4.4. 회의 삭제

```
POST /meeting/delete
Body: { id: string }
```

**응답**

```ts
{ result: 'SUCCESS', data: { id: string }, message: '' }
```

### 4.5. 화자 정보 저장 (단건 — 색상/별칭 변경)

```
POST /meeting/speaker/save
Body: { meetingId: string, speaker: Partial<MeetingSpeaker> }
```

**응답**

```ts
{ result: 'SUCCESS', data: MeetingSpeaker, message: '' }
```

### 4.6. 화자 일괄 저장 (인라인 편집 — 이름 매핑) ⭐

```
POST /meeting/speaker/save-batch
Body: { meetingId: string, speakers: Partial<MeetingSpeaker>[] }
```

**응답**

```ts
{ result: 'SUCCESS', list: MeetingSpeaker[], message: '' }
```

**프론트 사용 시나리오**
- 사용자가 STT의 `화자1`, `화자2`를 보고 → 인라인 편집 모드 → 실명 일괄 입력 → 저장
- 백엔드는 화자 이름 업데이트 + **STT 발화의 `speakerName` 캐시도 동기화** 필요
  - 이 부분이 Mock에선 같은 트랜잭션 안에서 함께 갱신됨

### 4.7. 사용자 검색 (메일 수신자용)

```
POST /meeting/user/search
Body: { keyword: string }      // 빈 문자열이면 전체
```

**응답**

```ts
{ result: 'SUCCESS', list: MeetingUser[], message: '' }
```

**검색 대상**: 이름, 이메일, 부서명 부분 일치

### 4.8. 참석자 이름 → 사용자 매칭

```
POST /meeting/user/match-names
Body: { names: string[] }
```

**응답**

```ts
{ result: 'SUCCESS', list: MeetingUser[], message: '' }
```

**프론트 사용**: 메일 발송 모달 열 때 `Meeting.participants`(이름 배열)을 사용자 정보로 자동 매칭

---

## 5. 미구현 — 추가 필요한 엔드포인트

> 아래 기능은 프론트에서 UI는 있지만 더미 토스트로만 동작하고 있습니다. 백엔드 endpoint가 정해지면 프론트를 연결합니다.

### 5.1. 녹음 오디오 업로드

- **트리거**: 사용자가 녹음 중지 직후
- **방식 후보**: 
  - 청크 업로드 (실시간) — STT 스트리밍과 함께
  - 단일 파일 업로드 (녹음 종료 후 일괄) — multipart/form-data
- **응답**: `{ data: { audioFileId, audioUrl } }`

### 5.2. STT 처리 (실시간 또는 일괄)

[6.1 STT 처리 방식](#61-stt-처리-방식-가장-큰-결정) 참조

### 5.3. 회의록 자동 생성 (LLM)

- **트리거**: 녹음 종료 + STT 완료 후
- **응답**: `{ data: { minutesContent: string } }` (HTML)
- **고려**: 처리 시간이 길면 비동기 잡으로 → 진행 상태 polling 필요?

### 5.4. 파일 다운로드 (PDF/DOCX/HWP 변환)

```
POST /meeting/download
Body: { meetingId: string, format: MeetingFileFormat, fileName: string }
```

- **응답 방식 협의 필요**:
  - (a) Binary (Content-Disposition 헤더로 직접 다운로드)
  - (b) URL (S3 등에 저장된 변환 파일 URL 응답 → 프론트가 `<a href>` 다운로드)
  - 권장: (b) — 큰 파일 처리 + 재다운로드 가능
- **현재**: `txt` / `md`는 클라이언트 변환으로 동작. `pdf` / `docx` / `hwp`는 백엔드 변환 필요

### 5.5. 메일 발송

```
POST /meeting/mail/send
Body: { meetingId: string, recipients: MeetingRecipient[], format?: MeetingFileFormat }
```

- 회의록을 첨부 또는 본문에 임베드해서 발송
- 첨부 파일 형식 협의 필요 (PDF가 일반적)

---

## 6. 백엔드와 합의해야 할 결정 항목

### 6.1. STT 처리 방식 (가장 큰 결정)

**옵션 A: WebSocket 스트리밍**
- 클라이언트 → 서버: 오디오 청크 실시간 전송
- 서버 → 클라이언트: STT 결과 발화 단위로 push
- 장점: 실시간 표시. 사용자 체감 좋음
- 단점: 인프라 복잡 (WebSocket / SSE)

**옵션 B: SSE (Server-Sent Events)**
- 오디오는 별도 업로드, STT 결과만 SSE로 push
- 옵션 A보다 단순

**옵션 C: 일괄 처리**
- 녹음 종료 후 오디오 업로드 → 서버에서 STT 처리 → 완료 시 결과 반환
- 장점: 가장 단순
- 단점: 사용자가 실시간 STT를 못 봄 (현재 UI는 실시간 표시 가정)

**프론트 현재 구조**: 옵션 A/B에 적합 (Mock으로 polling 사용 중이지만 쉽게 교체 가능)

### 6.2. 화자 빈 이름 허용 여부

- 프론트는 **빈 이름 허용**(점진적 매핑) 가정. `화자1`, `화자2` 등을 부분만 매핑하고 저장 가능
- 백엔드 정책:
  - (a) NULL/빈 string 허용
  - (b) 빈 값이면 자동 placeholder(`화자N`) 채움
  - 권장: (b) — 일관성 있는 데이터

### 6.3. `Meeting` 스키마 추가 후보

다음 필드 추가가 필요할 가능성이 큽니다:

```ts
interface Meeting {
  // ... 기존 필드 ...

  audioFile?: string              // 녹음 파일 경로/URL
  audioFileSize?: number          // 용량 (bytes)
  audioDuration?: number          // 녹음 시간 (seconds)

  organizer?: string              // 작성자/소유자 userId — 권한 체크용
  createdBy?: string              // (organizer와 같다면 1개로 통합)

  sttJobId?: string               // STT 작업 추적 id (비동기 처리 시)
  aiGenerationStatus?: 'pending' | 'generating' | 'done' | 'failed'

  // 정렬/필터용
  startedAt?: string              // 회의 시작 시각 (ISO)
  endedAt?: string                // 회의 종료 시각
}
```

### 6.4. `participants` 정규화

- 현재: `participants: string[]` (이름만)
- 권장: `participants: { id?: string, name: string, email?: string }[]` 또는 별도 테이블
  - 이유: 외부 참석자도 가능 + 메일 발송 시 매번 검색하지 않아도 됨
  - 마이그레이션 비용 작음 (프론트 매핑 함수만 추가)

### 6.5. 자동 저장 호출 빈도

- 프론트 현재: 본문 편집 시 800ms 디바운스 (사용자 입력 멈추면 1번 호출)
- 서버 부담 검토:
  - 1명이 1분에 ~5번 호출 가능
  - 서버 측 디바운스나 throttle 추가 검토
- DB 저장 vs 캐시 저장 분리도 고려 가능 (Redis로 캐시 → 일정 주기 DB flush)

### 6.6. 응답 구조의 `result` 필드

- 프론트는 현재 `try/catch`만 사용 (HTTP 200/4xx로 분기)
- 권장: 백엔드도 4xx HTTP status + `{ result: 'FAIL', message: '...' }` 페이로드 함께 반환
  - 프론트가 catch에서 `message` 토스트로 표시 가능

### 6.7. 페이지네이션

- 현재 프론트: 회의 목록 전체 조회 후 클라이언트 필터
- 회의 수가 많아지면 서버 페이지네이션 필요:
  ```
  Body: { page, pageSize, keyword }
  Response: { list, total, page }
  ```

### 6.8. 사용자 검색 limit

- 현재 프론트: 결과 8건만 표시 (클라이언트 슬라이스)
- 권장: 서버에서 limit 정책 (예: 20건) → 프론트 슬라이스 제거

---

## 7. 5단계 진행 흐름과 API 매핑

```
[1. 회의 녹음]
    │
    │ (녹음 시작) → 클라이언트 마이크 → 오디오 청크
    │ (실시간 STT) → 서버 STT 엔진 → /meeting/stt/* (방식 협의)
    │ (녹음 종료) → 오디오 업로드 → /meeting/upload-audio
    │
    ▼
[2. 화자 분리]
    │
    │ 서버: STT 결과를 화자 단위로 분리 (자동) → speakers[] 채움 (이름 = "화자1", "화자2"...)
    │ 사용자: 인라인 편집으로 실명 매핑 → POST /meeting/speaker/save-batch
    │   → STT의 speakerName 동기화 (서버에서 처리)
    │
    ▼
[3. 회의록 자동 생성]
    │
    │ 서버: STT 종료 후 LLM이 minutesContent 자동 생성 (트리거/방식 협의)
    │
    ▼
[4. 회의록 편집]
    │
    │ 사용자: WYSIWYG 에디터(Tiptap)로 본문 편집
    │ → 800ms 디바운스 자동 저장 → POST /meeting/save (silent)
    │
    │ 사용자: 화자 이름 추가 매핑/색상 변경
    │ → POST /meeting/speaker/save 또는 save-batch
    │
    ▼
[5. 저장 및 메일 발송]
    │
    │ 파일 저장(PDF/DOCX/HWP): → POST /meeting/download (서버 변환)
    │ 파일 저장(TXT/MD):       → 클라이언트 변환 (API 불필요)
    │ 메일 발송: → POST /meeting/user/match-names (참석자 매칭)
    │           → POST /meeting/user/search (수신자 추가 검색)
    │           → POST /meeting/mail/send
    │
    ▼ (단계별 status 갱신은 백엔드가 처리 권장)
   [완료]
```

---

## 8. 샘플 응답 데이터

### 8.1. `Meeting` 단건 (POST /meeting/detail 응답)

```json
{
  "result": "SUCCESS",
  "message": "",
  "data": {
    "id": "meeting-1",
    "title": "2026년 5월 마케팅 전략 회의",
    "date": "2026.05.20 (월) 10:00 ~ 11:30",
    "location": "회의실 A / 온라인",
    "participants": ["김지현", "박상우", "이수진", "최민호", "정우영", "한지혜"],
    "purpose": "5월 마케팅 전략 논의 및 실행 계획 수립",
    "steps": [
      { "key": "record", "label": "회의 녹음 / 실시간 STT", "status": "progress" },
      { "key": "speaker", "label": "화자 분리", "status": "done" },
      { "key": "generate", "label": "회의록 자동 생성", "status": "done" },
      { "key": "edit", "label": "회의록 편집", "status": "progress" },
      { "key": "share", "label": "저장 및 공유", "status": "wait" }
    ],
    "speakers": [
      { "id": "sp-1", "name": "김지현", "alias": "나", "colorIndex": 0 },
      { "id": "sp-2", "name": "박상우", "colorIndex": 1 },
      { "id": "sp-3", "name": "이수진", "colorIndex": 2 }
    ],
    "sttList": [
      {
        "id": "stt-1",
        "speakerId": "sp-1",
        "speakerName": "김지현",
        "time": "10:00:15",
        "text": "안녕하세요. 오늘 회의는 5월 마케팅 전략에 대해 논의하고 실행 계획을 수립하는 자리입니다."
      },
      {
        "id": "stt-2",
        "speakerId": "sp-2",
        "speakerName": "박상우",
        "time": "10:01:02",
        "text": "5월 프로모션 목표는 신규 고객 유입 20% 증가시키는 것으로 설정했습니다."
      }
    ],
    "minutesContent": "<h2>1. 회의 개요</h2><ul><li>회의명: ...</li></ul><h2>2. 주요 논의 내용</h2><table>...</table>",
    "fileFormat": "pdf",
    "recipients": [
      { "id": "rc-1", "name": "김지현" }
    ],
    "templateId": "default",
    "language": "ko",
    "createdAt": "2026-04-26",
    "updatedAt": "2026-04-27T10:23:45.123Z"
  }
}
```

### 8.2. `Meeting` 목록 (POST /meeting/list 응답)

```json
{
  "result": "SUCCESS",
  "message": "",
  "list": [
    {
      "id": "meeting-1",
      "title": "2026년 5월 마케팅 전략 회의",
      "date": "2026.05.20 (월) 10:00 ~ 11:30",
      "...": "(나머지 필드)"
    },
    {
      "id": "meeting-2",
      "title": "주간 개발 스프린트 리뷰",
      "...": "(나머지 필드)"
    }
  ]
}
```

### 8.3. 화자 일괄 저장 (POST /meeting/speaker/save-batch 응답)

**요청**

```json
{
  "meetingId": "meeting-1",
  "speakers": [
    { "id": "sp-1", "name": "허희진", "colorIndex": 0 },
    { "id": "sp-2", "name": "김충환", "colorIndex": 1 }
  ]
}
```

**응답**

```json
{
  "result": "SUCCESS",
  "message": "",
  "list": [
    { "id": "sp-1", "name": "허희진", "alias": "나", "colorIndex": 0 },
    { "id": "sp-2", "name": "김충환", "colorIndex": 1 }
  ]
}
```

> 응답 후 백엔드는 **STT 발화 리스트의 `speakerName`도 동기화**해야 합니다. 다음 `/meeting/detail` 호출 시 갱신된 이름이 반영되어야 합니다.

### 8.4. 사용자 검색 (POST /meeting/user/search 응답)

**요청**

```json
{ "keyword": "마케팅" }
```

**응답**

```json
{
  "result": "SUCCESS",
  "message": "",
  "list": [
    { "id": "u-1", "name": "김지현", "email": "jihyun.kim@company.com", "dept": "마케팅" },
    { "id": "u-2", "name": "박상우", "email": "sangwoo.park@company.com", "dept": "마케팅" },
    { "id": "u-3", "name": "이수진", "email": "sujin.lee@company.com", "dept": "마케팅" }
  ]
}
```

---

## 9. Mock → 실제 API 전환 가이드

> **백엔드 개발자가 작업할 부분이 아닙니다.** 프론트가 백엔드 endpoint 완성 후 자체적으로 진행하는 작업입니다.

### 9.1. 변경 영역

| 파일 | 작업 |
|------|------|
| `composables/meeting/useMeetingApi.ts` | `mockPost` → `useApi`의 `post`로 교체 |
| `server/utils/mockMeetingDb.ts` | 삭제 |
| `server/routes/mock/meeting/` | 폴더 전체 삭제 |
| `nuxt.config.ts` | 변경 없음 (devProxy가 이미 `/api/*` 설정됨) |

### 9.2. 코드 변경 예시

**Before (Mock)**
```ts
const MOCK_BASE = '/mock/meeting'
const fetchMeetingList = async () => mockPost<{ list: Meeting[] }>(`${MOCK_BASE}/list`)
```

**After (실제)**
```ts
import { useApi } from '~/composables/com/useApi'
const { post } = useApi()
const fetchMeetingList = async () => post<{ list: Meeting[] }>('/meeting/list', {})
```

### 9.3. 인증/토큰

- 백엔드는 모든 `/api/meeting/*` 요청에 `Authorization` 헤더 검증
- 프론트의 `useApi`가 자동으로 토큰 부착 + 401 시 `/login` 리다이렉트 처리

---

## 10. 프론트 구조 참고

```
team-agent-front/
├── types/meeting.ts                          # ⭐ 타입 정의
├── composables/meeting/
│   ├── useMeetingApi.ts                      # ⭐ API 함수
│   ├── useMeetingStore.ts                    # ⭐ 상태 + 액션
│   └── meetingEditorKey.ts                   # Tiptap 인스턴스 inject key
├── components/meeting/
│   ├── MeetingStepper.vue                    # 5단계 진행바
│   ├── MeetingRecordPanel.vue                # 좌측 패널 (녹음 + STT)
│   │   ├── MeetingRecordControl.vue          # 녹음 시작/정지 버튼
│   │   ├── MeetingWaveformDummy.vue          # 파형 (더미)
│   │   ├── MeetingSttToolbar.vue             # 언어 선택 등
│   │   ├── MeetingSttList.vue                # 발화 리스트
│   │   └── MeetingSpeakerList.vue            # ⭐ 화자 인라인 편집
│   ├── MeetingEditorPanel.vue                # ⭐ 중앙 에디터 (자동 저장)
│   │   ├── MeetingEditorToolbar.vue          # 에디터 툴바
│   │   └── MeetingEditorBody.vue             # Tiptap 본문
│   ├── MeetingSidePanel.vue                  # 우측 패널 (회의 정보 + 작업)
│   │   ├── MeetingMeta.vue                   # 일시/장소/목적/참석자
│   │   └── MeetingActionMenu.vue             # 파일 저장/공유/메일
│   ├── MeetingFileSaveModal.vue              # 파일 저장 모달
│   ├── MeetingMailSendModal.vue              # 메일 발송 모달
│   └── MeetingSpeakerEditModal.vue           # 화자 색상/별칭 편집 모달
├── pages/meeting/
│   ├── index.vue                             # 회의 목록
│   └── [id].vue                              # 회의 상세 (3분할)
└── server/
    ├── utils/mockMeetingDb.ts                # Mock DB (서버 메모리)
    └── routes/mock/meeting/                  # Mock API 라우트
```

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-27 | 초안 작성 — Mock API 기반 프론트 구현 후 백엔드 협의용 |
| 2026-04-27 | 더미 UI/액션 정리: STT Mock(`/stt/dummy`), AI 재생성, 공유 링크, 템플릿 제거. 8개 endpoint로 슬림화 |
