/**
 * 화자 목록 컨텍스트 기준 아바타 1글자 계산
 *
 * 규칙:
 * - 같은 성(첫 글자)이 1명뿐이면 → 성 그대로
 * - 같은 성이 2명 이상이면:
 *   - 그룹의 첫 번째 화자 → 성 그대로
 *   - 이후 화자 → 이름 첫 글자(2번째), 그룹 내 중복 시 다음 글자로 진행
 * - 외자(글자 수 부족)는 마지막 글자를 사용
 */

export interface SpeakerLike {
  id: string
  name?: string
}

export const computeSpeakerAvatarMap = (speakers: SpeakerLike[]): Map<string, string> => {
  const result = new Map<string, string>()

  const firstCharCount = new Map<string, number>()
  speakers.forEach((s) => {
    const c = s.name?.charAt(0) || '?'
    firstCharCount.set(c, (firstCharCount.get(c) || 0) + 1)
  })

  const usedByGroup = new Map<string, Set<string>>()
  speakers.forEach((s) => {
    const name = s.name || ''
    const first = name.charAt(0) || '?'

    if (firstCharCount.get(first) === 1) {
      result.set(s.id, first)
      return
    }

    if (!usedByGroup.has(first)) usedByGroup.set(first, new Set())
    const used = usedByGroup.get(first)!

    if (used.size === 0) {
      used.add(first)
      result.set(s.id, first)
      return
    }

    let i = 1
    while (i < name.length && used.has(name.charAt(i))) i++
    const ch = i < name.length ? name.charAt(i) : name.charAt(name.length - 1) || first
    used.add(ch)
    result.set(s.id, ch)
  })

  return result
}
