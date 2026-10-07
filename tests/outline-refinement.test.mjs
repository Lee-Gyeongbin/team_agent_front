import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const exports = {}
vm.runInNewContext(
  ts.transpileModule(readFileSync(new URL('../utils/proposal/outlineRefinement.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports },
)
const { splitOutlineSections } = exports

test('sections preserve exact Korean/CRLF offsets including nested lists and preface', () => {
  const text = '개요\r\n\r\n1. **설치 전 점검**\r\n  1. 하위 항목\r\n\r\n2. 운영 지원\r\n- 상세 내용\r\n'
  const sections = splitOutlineSections(text)
  assert.equal(sections.length, 2)
  assert.equal(sections[0].title, '1. 설치 전 점검')
  assert.equal(text.slice(sections[0].start, sections[0].end), sections[0].text)
  assert.ok(sections[0].text.includes('하위 항목'))
  assert.equal(text.slice(0, sections[0].start) + sections.map((item) => item.text).join(''), text)
})

test('fenced numbered examples are not sections; unstructured prose has whole-outline fallback', () => {
  assert.equal(splitOutlineSections('일반 개요\n본문입니다.').length, 0)
  const sections = splitOutlineSections('## 설치\n```text\n1. 예제\n```\n## 운영\n내용')
  assert.equal(sections.length, 2)
  assert.equal(sections[1].title, '운영')
})
