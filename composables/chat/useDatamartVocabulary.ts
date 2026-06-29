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

/** datamartId → { metric, dimension } 엔트리 캐시 */
const termCache = new Map<string, { metric: TermEntry[]; dimension: TermEntry[] }>()

const metricEntries = ref<TermEntry[]>([])
const dimensionEntries = ref<TermEntry[]>([])
const isLoadingVocabulary = ref(false)

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

export const useDatamartVocabulary = () => {
  const { fetchMetaTermDictList } = useDatamartApi()
  const { subOptions, selectedSubOptions } = useChatStore()

  /** 현재 대상 데이터마트 ID (composer와 동일 로직) */
  const currentDatamartId = computed(() => {
    const selected = selectedSubOptions.value.find((id) => id && id !== 'all')
    return selected ?? String(subOptions.value[0]?.value ?? '')
  })

  /** 용어사전 로드 — 지표/구분 분리, 캐시 */
  const loadVocabulary = async (datamartId: string) => {
    if (!datamartId) {
      metricEntries.value = []
      dimensionEntries.value = []
      return
    }
    if (termCache.has(datamartId)) {
      const cached = termCache.get(datamartId)!
      metricEntries.value = cached.metric
      dimensionEntries.value = cached.dimension
      return
    }

    isLoadingVocabulary.value = true
    try {
      const res = await fetchMetaTermDictList(datamartId)
      const rows = (res?.termList ?? []).filter((row) => row.useYn !== 'N' && row.termNm?.trim())
      const metric = rows.filter((r) => r.termType === 'METRIC').map(toEntry)
      const dimension = rows.filter((r) => r.termType === 'DIMENSION').map(toEntry)
      termCache.set(datamartId, { metric, dimension })
      metricEntries.value = metric
      dimensionEntries.value = dimension
    } catch {
      metricEntries.value = []
      dimensionEntries.value = []
    } finally {
      isLoadingVocabulary.value = false
    }
  }

  watch(currentDatamartId, (id) => void loadVocabulary(id), { immediate: true })

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
