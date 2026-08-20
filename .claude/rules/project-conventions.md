# Project Conventions

## Tech Stack

- **Framework**: Nuxt 3 (SPA 모드, `ssr: false`)
- **UI**: Vue 3.5 + Composition API + TypeScript 5
- **Styling**: SCSS (변수/믹스인/네스팅), Radix-vue (접근성 컴포넌트)
- **Build**: Vite 7 (Nuxt 내장)
- **Lint/Format**: ESLint (flat config) + Prettier

## Project Structure

```
team-agent/
├── assets/scss/          # 디자인 토큰, 믹스인, 리셋
├── components/
│   ├── common/           # AppHeader, AppSidebar
│   ├── chat/             # ChatWindow, ChatMessage
│   ├── agent/            # AgentCard, AgentBuilder
│   └── ui/               # AppButton, AppInput (직접 제작)
├── composables/          # useApi, useChat, useAgent (자동 임포트)
├── layouts/              # default(대시보드), auth(로그인), blank
├── pages/                # 자동 라우팅
├── types/                # chat.ts, agent.ts
└── utils/
```

## Key Rules

- 퍼블리싱 단계: 더미 데이터는 `🔽 더미 데이터 — 백엔드 연결 시 API로 교체` 주석 표기
- 상태별 UI 필수: 로딩 / 빈 상태 / 에러 / 데이터 있음 모두 구현
- 한국어 주석 사용
- 변경 사항은 명확하게 설명
- 기존 코드 스타일 유지

## Commands

- **Sync (작업 시작 전 필수): `npm run sync`**
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint:fix`
- Format: `npm run format`

### `npm run sync` — 작업 시작 전 한 번

이 브랜치와 `@leechanyong/ispark-ui` 둘 다 **팀원과 동시 작업 중**이다. 코드를 만지기 전에 반드시 실행한다.

1. `git fetch` 후 현재 브랜치가 origin보다 뒤처졌으면 **merge**
2. `package.json`의 ispark 핀 ↔ `node_modules` 설치본 비교 후 **`npm install`로 동기화**
3. ispark 버전이 바뀌었으면 **dev 서버 재시작 안내** (Vite 의존성 재최적화 필요)

> 왜: "package.json 핀은 최신인데 node_modules는 구버전"인 stale 상태가 반복 발생했다. 그 상태로 작업하면 새 컴포넌트/variant가 없어 화면이 깨진다.
