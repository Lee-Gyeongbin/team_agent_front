import { useDatamartApi } from '~/composables/datamart/useDatamartApi'
import { useChatStore } from '~/composables/chat/useChatStore'
import type { DatamartMetaTermItem } from '~/types/datamartMeta'

/**
 * 데이터마트 용어사전 — 지표/구분 입력 추천·검증용
 *
 * 메타관리 > 용어사전 탭(TB_DM_TERM_DICT)에서 직접 등록한 용어를 단일 소스로 사용한다.
 * - METRIC(지표) / DIMENSION(구분)을 분리해 슬롯별로 추천
 * - 대표어(termNm) + 유사어(synonyms) + 예시값(sampleValues)으로 매칭, 제안은 대표어로 환원
 *
 * 한계: 키워드 겹침 수준의 소프트 검증. 확정 검증은 백엔드 Tier 2.
 * 어휘 미로딩(권한·실패) 시 isRecognized는 항상 true(경고 오탐 방지).
 */

interface TermEntry {
  /** 화면에 제안할 대표 용어 */
  display: string
  /** 매칭에 쓰는 토큰 (대표어 + 유사어 + 예시값) */
  tokens: string[]
}

/** datamartId → { metric, dimension } 엔트리 캐시 (모듈 공유) */
const termCache = new Map<string, { metric: TermEntry[]; dimension: TermEntry[] }>()

const MAX_SUGGESTIONS = 6

const splitCsv = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const toEntry = (row: DatamartMetaTermItem): TermEntry => ({
  display: row.termNm.trim(),
  tokens: [row.termNm.trim(), ...splitCsv(row.synonyms), ...splitCsv(row.sampleValues)].filter(Boolean),
})

/**
 * @param source 추천·검증 대상 데이터마트.
 *               - `Ref<string>`: 단일(탭 단위) — 가이드 패널 활성 탭 등
 *               - `Ref<string[]>`: 다중 합산 — 인라인 자동완성 등
 *               미지정 시 선택 콤보 기준 단일 데이터마트로 폴백한다.
 */
export const useDatamartVocabulary = (source?: Ref<string> | Ref<string[]>) => {
  const { fetchMetaTermDictList } = useDatamartApi()
  const { subOptions, selectedSubOptions } = useChatStore()

  // 인스턴스별 현재 엔트리 — 가이드 패널/인라인 자동완성이 서로 다른 데이터마트를 봐도 충돌하지 않도록 분리
  const metricEntries = ref<TermEntry[]>([])
  const dimensionEntries = ref<TermEntry[]>([])
  const isLoadingVocabulary = ref(false)

  /** 폴백: 선택 콤보 기준 단일 데이터마트 (composer와 동일 로직) */
  const fallbackDatamartId = computed(() => {
    const selected = selectedSubOptions.value.find((id) => id && id !== 'all')
    return selected ?? String(subOptions.value[0]?.value ?? '')
  })

  /** 대상 데이터마트 ID 목록 (단일/다중 모두 배열로 정규화) */
  const targetIds = computed<string[]>(() => {
    if (source) {
      const v = source.value
      const list = Array.isArray(v) ? v : [v]
      return list.map(String).filter(Boolean)
    }
    const id = fallbackDatamartId.value
    return id ? [id] : []
  })

  /** 단일 데이터마트 용어 적재 (캐시 우선) */
  const fetchIntoCache = async (datamartId: string) => {
    if (termCache.has(datamartId)) return
    try {
      const res = await fetchMetaTermDictList(datamartId)
      const rows = (res?.termList ?? []).filter((row) => row.useYn !== 'N' && row.termNm?.trim())
      termCache.set(datamartId, {
        metric: rows.filter((r) => r.termType === 'METRIC').map(toEntry),
        dimension: rows.filter((r) => r.termType === 'DIMENSION').map(toEntry),
      })
    } catch {
      termCache.set(datamartId, { metric: [], dimension: [] })
    }
  }

  /** 용어사전 로드 — 대상 데이터마트 전체를 합산해 엔트리 구성 */
  const loadVocabulary = async (ids: string[]) => {
    const unique = [...new Set(ids)]
    if (!unique.length) {
      metricEntries.value = []
      dimensionEntries.value = []
      return
    }

    const missing = unique.filter((id) => !termCache.has(id))
    if (missing.length) {
      isLoadingVocabulary.value = true
      try {
        await Promise.all(missing.map(fetchIntoCache))
      } finally {
        isLoadingVocabulary.value = false
      }
    }

    const metric: TermEntry[] = []
    const dimension: TermEntry[] = []
    for (const id of unique) {
      const cached = termCache.get(id)
      if (!cached) continue
      metric.push(...cached.metric)
      dimension.push(...cached.dimension)
    }
    metricEntries.value = metric
    dimensionEntries.value = dimension
  }

  watch(
    () => targetIds.value.join(','),
    () => void loadVocabulary(targetIds.value),
    { immediate: true },
  )

  const normalize = (text: string) => text.replace(/\s+/g, '').toLowerCase()

  /** 입력이 엔트리 토큰과 양방향 부분일치하는지 */
  const matchEntry = (entry: TermEntry, value: string) =>
    entry.tokens.some((token) => {
      const t = normalize(token)
      return !!t && (value.includes(t) || t.includes(value))
    })

  const recognize = (entries: TermEntry[], input: string): boolean => {
    const value = normalize(input)
    if (!value || entries.length === 0) return true // 미로딩 시 경고 끔
    return entries.some((entry) => matchEntry(entry, value))
  }

  const suggestFrom = (entries: TermEntry[], input: string): string[] => {
    const value = normalize(input)
    if (entries.length === 0) return []
    // 빈 입력: 대표어 상위 N개
    if (!value) return [...new Set(entries.map((e) => e.display))].slice(0, MAX_SUGGESTIONS)

    const prefix: string[] = []
    const includes: string[] = []
    for (const entry of entries) {
      if (normalize(entry.display) === value) continue
      const matchedPrefix = entry.tokens.some((t) => normalize(t).startsWith(value))
      if (matchedPrefix) prefix.push(entry.display)
      else if (matchEntry(entry, value)) includes.push(entry.display)
    }
    return [...new Set([...prefix, ...includes])].slice(0, MAX_SUGGESTIONS)
  }

  return {
    isLoadingVocabulary,
    /** 지표 슬롯용 */
    suggestMetric: (input: string) => suggestFrom(metricEntries.value, input),
    isMetricRecognized: (input: string) => recognize(metricEntries.value, input),
    /** 구분 슬롯용 */
    suggestDimension: (input: string) => suggestFrom(dimensionEntries.value, input),
    isDimensionRecognized: (input: string) => recognize(dimensionEntries.value, input),
  }
}
