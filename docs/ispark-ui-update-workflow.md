# ispark-ui 수정 → 프로젝트 적용 워크플로우

> `@leechanyong/ispark-ui` 라이브러리를 고치고, 그 변경을 `team_agent_front`에 받아 적용하는 절차.
> 현재 의존성 형태: **git 커밋 핀** — `package.json`에 `"@leechanyong/ispark-ui": "github:box3101/ispark-ui#<커밋해시>"`
> (npm 미배포 상태. dist가 repo에 커밋돼 있고 `prepare` 스크립트가 설치 시 자동 빌드하므로 git으로 소비 가능)

---

## 큰 그림

```
[A] ispark-ui 수정 ──build──> dist 커밋 ──push──> main(GitHub)
                                                      │
                                                      ↓ (커밋 해시)
[B] team_agent_front: package.json 핀 갱신 ──install──> dev 재기동 ──> 적용 확인
```

라이브러리(`C:\ispark-ui`)와 소비 프로젝트(`C:\team_agent_front`)는 **별도 repo**. 둘을 잇는 건 `package.json`의 **커밋 핀** 한 줄.

---

## [A] ispark-ui 라이브러리 수정 (C:\ispark-ui)

1. **브랜치 생성** (main 직접 커밋 지양)
   ```bash
   cd /c/ispark-ui && git checkout -b fix/무엇무엇
   ```
2. **컴포넌트 수정** — `src/components/ui/UiX.vue` 등
3. **빌드 (필수)** — dist 재생성
   ```bash
   npm run build      # build:icons + vue-tsc 타입체크 + vite build → dist/*
   ```
   > ⚠️ **dist는 git 추적 대상**. 소스만 고치고 dist를 안 만들면 소비처에 반영 안 됨.
4. **버전 + CHANGELOG**
   - `package.json` version 올림 (예: 0.5.20 → 0.5.21)
   - `CHANGELOG.md` 최상단에 항목 추가
5. **테스트** (선택이지만 권장)
   ```bash
   npm test           # 32 files / 248 tests
   ```
6. **커밋 — 소스 + dist + version + changelog 함께**
   ```bash
   git add src/components/ui/UiX.vue dist/ package.json CHANGELOG.md
   git commit -m "fix(UiX): ... (v0.5.21)"
   ```
7. **main 머지 + 푸시**
   ```bash
   git checkout main && git merge fix/무엇무엇 && git push origin main
   git branch -d fix/무엇무엇
   ```
   → 새 **커밋 해시** 확보 (예: `0b291b2`). 이게 [B]에서 핀으로 쓸 값.

---

## [B] team_agent_front에 받아 적용 (C:\team_agent_front)

1. **package.json 핀을 새 커밋 해시로 변경**
   ```jsonc
   "@leechanyong/ispark-ui": "github:box3101/ispark-ui#0b291b2"
   ```
2. **⚠️ 캐시 정리 후 재설치 (핵심 함정)**
   ```bash
   cd /c/team_agent_front
   npm cache clean --force
   npm install "github:box3101/ispark-ui#0b291b2"
   ```
   > npm은 git 의존성을 캐시함. **핀만 바꾸고 `npm install`하면 옛 커밋을 재사용**해서 반영이 안 됨.
   > → `npm cache clean --force` + **커밋 명시 install**로 강제 재-clone.
3. **반영 확인**
   ```bash
   # 설치본 dist에 변경 들어왔나
   grep -c "바뀐거" node_modules/@leechanyong/ispark-ui/dist/ispark-ui.css
   # lock이 새 커밋 가리키나
   grep -m1 "ispark-ui.git#" package-lock.json
   ```
4. **dev 서버 재기동** — 전역 CSS/컴포넌트 반영
   ```bash
   # 3001 프로세스 종료 후
   npm run dev
   ```
5. **커밋** — `package.json` + `package-lock.json`
   ```bash
   git add package.json package-lock.json
   git commit -m "chore(ispark-ui): bump 핀 0b291b2 (v0.5.21)"
   ```

---

## 적용 검증

- **빌드**: `npm run build` 통과 (타입 호환)
- **시각**: 바뀐 컴포넌트 쓰는 페이지를 브라우저로 확인. 특히 모달/탭 등은 스크린샷만으론 간격 회귀를 놓치기 쉬움 → 실측 권장

---

## 자주 밟는 함정

| 함정 | 증상 | 대응 |
|---|---|---|
| **dist 안 빌드** | 소스 고쳤는데 소비처 무변화 | [A]-3 `npm run build` 후 dist 커밋 |
| **npm git 캐시** | 핀 바꿔도 옛 코드 | [B]-2 `npm cache clean --force` + 커밋 명시 install |
| **dev manifest stale** | 재빌드 반복 후 페이지 백지(_nuxt 404) | dev 서버 재기동 (`.nuxt` 삭제 후 `npm run dev`) |
| **제네릭 클래스 충돌** | 라이브러리 모달/탭이 32px로 찌부러짐 | 호스트 `.size-md` 같은 제네릭 글로벌과 충돌 → 스코프. 자세히는 memory `project_ispark_migration_scss_gotchas` |

---

## 향후 개선 (권장)

**npm 퍼블리시로 전환**하면 위 git-핀·캐시 함정이 사라짐:
1. ispark-ui `package.json`에 `publishConfig`(공개) 이미 설정됨 → `npm publish`
2. team_agent_front: `"@leechanyong/ispark-ui": "^0.5.21"` (버전 의존성)
3. 업데이트 시 `npm install @leechanyong/ispark-ui@latest`만 → 캐시 문제 없음, 재현성 보장
