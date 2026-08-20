// ============================================
// team_agent 작업 시작 전 동기화 스크립트
// --------------------------------------------
// 사용법:
//   npm run sync
//
// 하는 일:
//   1) 작업트리 dirty 확인 (merge 전 안전장치)
//   2) git fetch (모든 원격) → 현재 브랜치가 origin보다 뒤처졌으면 merge
//   3) package.json의 @leechanyong/ispark-ui 핀 ↔ node_modules 실제 설치본 비교
//   4) npm install 로 동기화 (핀과 설치본이 어긋나면 여기서 맞춰짐)
//   5) ispark 버전이 바뀌었으면 dev 서버 재시작 안내 (Vite 의존성 재최적화 필요)
//
// 왜 필요한가:
//   - 이 브랜치(feature/ispark-ui-w1)와 ispark-ui 둘 다 팀원과 동시 작업 중.
//   - "package.json 핀은 최신인데 node_modules는 구버전"인 stale 상태가 반복 발생함.
//     (그 상태로 작업하면 새 컴포넌트/variant가 없어서 화면이 깨진다)
// ============================================

import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PKG = '@leechanyong/ispark-ui'

// ---- 로그 헬퍼 ----
const c = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
}
const log = (m) => console.log(`${c.cyan}▶ ${m}${c.reset}`)
const ok = (m) => console.log(`${c.green}✔ ${m}${c.reset}`)
const warn = (m) => console.log(`${c.yellow}! ${m}${c.reset}`)
const die = (m) => {
  console.error(`${c.red}✖ ${m}${c.reset}`)
  process.exit(1)
}
const run = (cmd, opts = {}) => {
  console.log(`${c.gray}$ ${cmd}${c.reset}`)
  return execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts })
}
const capture = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', cwd: ROOT, ...opts }).trim()

// ---- ispark 버전/핀 조회 ----
const installedVersion = () => {
  const p = resolve(ROOT, 'node_modules', PKG, 'package.json')
  if (!existsSync(p)) return '(미설치)'
  try {
    return JSON.parse(readFileSync(p, 'utf8')).version
  } catch {
    return '(읽기실패)'
  }
}
const pinnedSpec = () => {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
  return (pkg.dependencies || {})[PKG] || '(핀 없음)'
}

// ============================================
// 1) 작업트리 확인
// ============================================
const dirty = capture('git status --porcelain')
if (dirty) {
  warn('작업트리에 커밋 안 된 변경이 있습니다:')
  console.log(`${c.gray}${dirty}${c.reset}`)
}

// ============================================
// 2) fetch + 현재 브랜치 동기화
// ============================================
const branch = capture('git rev-parse --abbrev-ref HEAD')
log(`fetch (모든 원격) — 현재 브랜치: ${branch}`)
try {
  run('git fetch --all --prune')
} catch {
  warn('git fetch 실패(오프라인?) — 브랜치 동기화 건너뜀')
}

let behind = '0'
try {
  behind = capture(`git rev-list --count HEAD..origin/${branch}`)
} catch {
  behind = '0' // 원격에 해당 브랜치 없음 → 통과
}

if (Number(behind) > 0) {
  if (dirty) {
    die(
      `origin/${branch} 보다 ${behind}커밋 뒤처졌는데 작업트리가 dirty합니다.\n` +
        `   커밋 또는 stash 후 다시 실행하세요.`,
    )
  }
  log(`origin/${branch} 보다 ${behind}커밋 뒤처짐 → merge`)
  try {
    run(`git merge origin/${branch} --no-edit`)
    ok('브랜치 merge 완료')
  } catch {
    die('merge 충돌 — 충돌 해결 후 `git commit` 하고 다시 실행하세요.')
  }
} else {
  ok(`브랜치 최신 (origin/${branch})`)
}

// ============================================
// 3~4) ispark 핀 ↔ 설치본 동기화
// ============================================
const before = installedVersion()
const pin = pinnedSpec()
log(`ispark 확인 — 핀: ${pin}  /  설치본: v${before}`)

run('npm install')

const after = installedVersion()

// ============================================
// 5) 결과 안내
// ============================================
if (after !== before) {
  ok(`ispark 갱신됨: v${before} → v${after}`)
  console.log(`\n${c.yellow}⚠ dev 서버를 재시작하세요 — Vite 의존성 재최적화가 필요합니다.${c.reset}`)
  console.log(`${c.gray}   npm run dev${c.reset}\n`)
} else {
  ok(`ispark 최신 (v${after})`)
}

const lockChanged = capture('git status --porcelain -- package-lock.json')
if (lockChanged) {
  warn('npm install 로 package-lock.json이 갱신됐습니다 — 커밋하세요.')
}

console.log(`\n${c.green}🎉 sync 완료${c.reset}  브랜치 ${branch} · ispark v${after}\n`)
