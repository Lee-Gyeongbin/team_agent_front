# Git 브랜치 전략

## 브랜치 구조

```
main (배포용)
  └── develop (개발 통합)
        ├── feat/기능명       ← 기능 개발
        ├── fix/버그명        ← 버그 수정
        ├── publish/페이지명  ← 퍼블리싱
        ├── refactor/대상명   ← 리팩토링
        └── chore/작업명      ← 설정, 의존성
```

## 브랜치 네이밍

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `feat/` | 새 기능 | `feat/chat-message` |
| `fix/` | 버그 수정 | `fix/scroll-bottom` |
| `publish/` | 퍼블리싱 | `publish/agent-list` |
| `refactor/` | 코드 개선 | `refactor/sidebar` |
| `chore/` | 설정/빌드 | `chore/eslint-config` |

- 커밋 컨벤션의 type과 동일
- 소문자 + kebab-case
- 짧고 명확하게 (영어)

## 작업 흐름

```
1. develop에서 브랜치 생성
   git checkout develop
   git pull origin develop
   git checkout -b feat/chat-message

2. 작업 후 커밋
   git add ...
   git commit -m "feat(chat): 메시지 컴포넌트 구현"

3. develop으로 PR 생성
   gh pr create --base develop

4. 리뷰 후 merge

5. 배포 시 develop → main merge
```

## 규칙

- **main 직접 푸시 금지** — 반드시 develop 거쳐서 merge
- **develop 직접 푸시 금지** — 반드시 PR로 merge
- **브랜치 merge 후 삭제** — 완료된 브랜치는 정리
- **작업 전 develop pull** — 최신 상태에서 시작

## 예외

- 긴급 핫픽스: `fix/xxx` → main 직접 PR 가능 (이후 develop에도 반영)
- CLAUDE.md, 설정 파일 수정 등 사소한 변경: develop 직접 커밋 허용
