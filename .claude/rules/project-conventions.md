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

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint:fix`
- Format: `npm run format`
