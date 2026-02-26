# Git 커밋 컨벤션

## 기본 포맷

```
<type>(<scope>): <한글 제목>

1. 상세 내용
2. 상세 내용
```

- 제목: 한글, 50자 이내, 마침표 없음
- 본문: 줄 바꿈 후 번호 리스트로 작업 내역 상세 기술
- 단순 작업은 본문 생략 가능

## Type 정의

- `feat` — 새 기능 추가 (minor)
- `fix` — 버그 수정 (patch)
- `refactor` — 동작 변경 없는 코드 개선
- `style` — SCSS/CSS, 코드 포맷팅 (로직 변경 없음)
- `publish` — 퍼블리싱 작업 (HTML/CSS 마크업) ※ 커스텀 타입
- `docs` — 문서, 주석
- `test` — 테스트 추가/수정
- `perf` — 성능 개선 (patch)
- `chore` — 빌드, 설정, 의존성
- `ci` — CI/CD 파이프라인
- `revert` — 커밋 되돌리기

## Scope 정의

- 기능 도메인: `agent`, `chat`, `dashboard`, `auth`, `settings`
- 기술 레이어: `api`, `composable`, `ui`, `layout`, `types`
- 인프라: `deps`, `config`, `env`
- scope는 권장 (필수 아님), 단순 작업은 생략 가능

## Breaking Change

- type 뒤에 `!` 붙이고 footer에 `BREAKING CHANGE:` 명시
- 예: `feat(api)!: 인증 방식 변경`

## 판단 기준

- HTML/CSS 마크업 신규 작성 → `publish`
- 마크업 완료 후 기능 로직 추가 → `feat`
- 변수명/함수명 변경 (동작 동일) → `refactor`
- CSS만 수정 → `style`
- 컴포넌트 분리 (동작 동일) → `refactor`
- 더미 데이터 → 실제 API 연결 → `feat`
- `.env` 변수 추가 → `chore(env)`
- 타입 정의 추가/수정 → `refactor(types)`

## 커밋 예시

```bash
# 퍼블리싱
git commit -m "publish(page): 메인 페이지 헤더 구조 작성

1. header 태그와 nav 구조 추가
2. 로고 영역과 메뉴 영역 분리
3. 반응형 햄버거 메뉴 버튼 마크업"

# 기능 추가
git commit -m "feat(agent): 에이전트 카드 리스트 컴포넌트 구현

1. AgentCard 컴포넌트 생성
2. 리스트 무한스크롤 적용
3. 빈 상태 UI 처리"

# 버그 수정
git commit -m "fix(chat): 메시지 전송 후 스크롤 미동작 수정

1. nextTick 이후 scrollToBottom 호출로 변경
2. 이미지 메시지 높이 계산 누락 보정"

# 단순 작업 (본문 생략)
git commit -m "style(ui): 사이드바 active 상태 색상 수정"
```
