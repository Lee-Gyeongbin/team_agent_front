import { useDatamartApi } from '~/composables/datamart/useDatamartApi'
import type { Datamart, DatamartSummary } from '~/types/datamart'
import type {
  DatamartMetaCodeColumnMapping,
  DatamartMetaFewshot,
  DatamartMetaRelationship,
  DatamartMetaSynonymGroup,
  DatamartMetaSynonymItem,
  DatamartMetaSynonymPayload,
  DatamartMetaTableItem,
} from '~/types/datamartMeta'

/** 폼 적용 전 빈 draft */
const isEmptyDraftFewshotRow = (row: DatamartMetaFewshot) =>
  !row.fewshotId?.trim() &&
  !row.userQuestion?.trim() &&
  !row.aiUnderstand?.trim() &&
  !row.aiRefExam?.trim() &&
  !row.sqlExam?.trim()

const toFewshotSignature = (row: DatamartMetaFewshot) => {
  const id = row.fewshotId?.trim() ?? ''
  return [
    id,
    row.userQuestion?.trim() ?? '',
    row.aiUnderstand?.trim() ?? '',
    row.aiRefExam?.trim() ?? '',
    row.sqlExam?.trim() ?? '',
    row.useYn ?? 'Y',
  ].join('|')
}

const toFewshotSignatureForChange = (row: DatamartMetaFewshot) =>
  isEmptyDraftFewshotRow(row) ? '' : toFewshotSignature(row)

const toSynonymItemSignature = (item: DatamartMetaSynonymItem) => {
  const word = item.synonymWord?.trim() ?? ''
  if (!word) return ''
  return `${item.synonymId?.trim() ?? ''}|${word}|${item.representYn ?? 'N'}|${item.useYn ?? 'Y'}`
}

/** 동의어 그룹 변경 시그니처 */
const toSynonymGroupSignature = (group: DatamartMetaSynonymGroup) => {
  const groupId = group.synonymId?.trim() || group.clientKey?.trim() || ''
  const itemSigs = group.synonymList
    .filter((item) => item.synonymWord?.trim())
    .map(toSynonymItemSignature)
    .sort()
    .join('||')
  return `${groupId}|${itemSigs}`
}

/** 동의어 조회 응답 → UI 그룹 배열 */
const parseMetaSynonymGroupsFromApi = (
  res: DatamartMetaSynonymPayload | DatamartMetaSynonymGroup[] | null | undefined,
  datamartId: string,
): DatamartMetaSynonymGroup[] | null => {
  if (!res) return null

  if (Array.isArray(res)) {
    if (res.length > 0 && res.every((group) => Array.isArray(group?.synonymList))) {
      return res.map((group) => ({
        ...group,
        datamartId: group.datamartId?.trim() || datamartId,
      }))
    }
    return null
  }

  const groupedList = res.synonymGroupList ?? res.dataList
  if (Array.isArray(groupedList) && groupedList.length > 0) {
    return groupedList.map((group) => ({
      ...group,
      datamartId: group.datamartId?.trim() || res.datamartId?.trim() || datamartId,
    }))
  }

  if (Array.isArray(res.synonymList)) {
    return [{ datamartId: res.datamartId?.trim() || datamartId, synonymList: res.synonymList }]
  }

  return null
}

const {
  fetchDatamartList,
  fetchDatamartSummary,
  fetchSaveDatamart,
  fetchDeleteDatamart,
  fetchTestConnection,
  fetchMetaTableList,
  fetchSaveMetaTable,
  fetchSaveMetaColumn,
  fetchSaveMetaRelationship,
  fetchMetaRelationshipList,
  fetchSaveMetaCodeMapping,
  fetchMetaCodeMappingList,
  fetchMetaSynonymList,
  fetchSaveMetaSynonym,
  fetchMetaFewshotList,
  fetchSaveMetaFewshot,
} = useDatamartApi()

/** 상태 변수 */
const datamartList = ref<Datamart[]>([])

/** 메타 관리 모달 전용 — 테이블·관계·코드 매핑 등 (모달 오픈 시 hydrate) */
const metaModalTables = ref<DatamartMetaTableItem[]>([])
const metaModalRelationships = ref<DatamartMetaRelationship[]>([])
const metaModalTableListError = ref<string | null>(null)
const metaModalSynonymListError = ref<string | null>(null)
const metaModalSelectedColumnTableId = ref('')
const metaModalCodeMappings = ref<DatamartMetaCodeColumnMapping[]>([])
const metaModalSynonymGroups = ref<DatamartMetaSynonymGroup[]>([])
const metaModalFewshotList = ref<DatamartMetaFewshot[]>([])
const metaModalFewshotListError = ref<string | null>(null)

const cloneMetaModalFewshotList = (rows: DatamartMetaFewshot[]) => rows.map((row) => ({ ...row }))

const cloneMetaModalSynonymGroups = (groups: DatamartMetaSynonymGroup[]): DatamartMetaSynonymGroup[] =>
  groups.map((group) => ({
    ...group,
    synonymList: group.synonymList.map((item) => ({ ...item })),
  }))

/** 동일 시그니처 수정은 1건으로 집계 */
const countSignatureListDiff = (base: string[], current: string[]): number => {
  const toCountMap = (sigs: string[]) => sigs.reduce((m, s) => m.set(s, (m.get(s) ?? 0) + 1), new Map<string, number>())
  const baseMap = toCountMap(base)
  const currentMap = toCountMap(current)
  const allKeys = new Set([...baseMap.keys(), ...currentMap.keys()])
  let added = 0
  let removed = 0
  allKeys.forEach((key) => {
    const b = baseMap.get(key) ?? 0
    const c = currentMap.get(key) ?? 0
    if (c > b) added += c - b
    else if (b > c) removed += b - c
  })
  return Math.max(added, removed)
}

/** 메타 모달 탭 — baseline·미저장 변경 건수 (퓨샷/동의어 공통) */
const createMetaModalDraftTracker = <T>(
  current: Ref<T[]>,
  options: { clone: (items: T[]) => T[]; toSignatures: (items: T[]) => string[] },
) => {
  const initial = ref<T[]>([]) as Ref<T[]>
  const ready = ref(false)

  const pendingChangeCount = computed(() => {
    if (!ready.value) return 0
    return countSignatureListDiff(options.toSignatures(initial.value), options.toSignatures(current.value))
  })
  const hasPendingChanges = computed(() => pendingChangeCount.value > 0)

  const commitBaseline = () => {
    initial.value = options.clone(current.value)
    ready.value = true
  }
  const revert = () => {
    current.value = options.clone(initial.value)
  }
  const clear = () => {
    ready.value = false
    initial.value = []
  }

  return { initial, ready, pendingChangeCount, hasPendingChanges, commitBaseline, revert, clear }
}

const metaModalFewshotDraft = createMetaModalDraftTracker(metaModalFewshotList, {
  clone: cloneMetaModalFewshotList,
  toSignatures: (rows) => rows.map(toFewshotSignatureForChange).filter(Boolean),
})

const metaModalSynonymDraft = createMetaModalDraftTracker(metaModalSynonymGroups, {
  clone: cloneMetaModalSynonymGroups,
  toSignatures: (groups) => groups.map(toSynonymGroupSignature),
})

const summary = ref<DatamartSummary>({
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  dataSourceCount: 0,
  lastScanDate: '',
  connectedSystems: '',
})

/** 데이터마트 목록 조회 */
const handleSelectDatamartList = async () => {
  try {
    const response = await fetchDatamartList()
    datamartList.value = response.dataList
  } catch {
    openToast({ message: '데이터마트 목록 조회에 실패했습니다.', type: 'error' })
  }
}

/** 데이터마트 요약 정보 조회 */
const handleSelectDatamartSummary = async () => {
  try {
    const response = await fetchDatamartSummary()
    summary.value = response.data
  } catch {
    openToast({ message: '데이터마트 요약 정보 조회에 실패했습니다.', type: 'error' })
  }
}

/** 데이터마트 목록 및 요약 정보 조회 */
const handleSelectAll = async () => {
  await Promise.all([handleSelectDatamartList(), handleSelectDatamartSummary()])
}

/** 데이터마트 저장 */
const handleSaveDatamart = async (datamart: Partial<Datamart>) => {
  try {
    await fetchSaveDatamart(datamart)
    await handleSelectAll()
    openToast({ message: '데이터마트가 저장되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '데이터마트 저장에 실패했습니다.', type: 'error' })
  }
}

/** 데이터마트 삭제 */
const handleDeleteDatamart = async (id: string) => {
  openConfirm({
    message: '데이터마트를 삭제하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchDeleteDatamart(id)
        await handleSelectAll()
        openToast({ message: '데이터마트가 삭제되었습니다.', type: 'success' })
      } catch {
        openToast({ message: '데이터마트 삭제에 실패했습니다.', type: 'error' })
      }
    },
  })
}

/** 데이터마트 활성화 상태 변경 */
const handleToggleActiveDatamart = async (datamart: Datamart) => {
  const saveData: Partial<Datamart> = { ...datamart, useYn: datamart.useYn === 'Y' ? 'N' : 'Y' }
  try {
    await fetchSaveDatamart(saveData)
    await handleSelectAll()
    openToast({ message: '활성화 상태가 변경되었습니다.' })
  } catch {
    openToast({ message: '활성화 상태 변경에 실패했습니다.', type: 'error' })
  }
}

/** 데이터마트 연결 테스트 */
const handleTestConnection = async (datamart: Datamart, testType: 'saved' | 'form') => {
  try {
    openLoading({ text: '연결 중...' })
    const response = await fetchTestConnection(datamart)
    const isSuccess = response.result === 'SUCCESS'
    openToast({
      message: response.msg,
      type: isSuccess ? 'success' : 'error',
    })
    await handleSelectAll()
    if (testType === 'form') {
      return response
    }
  } catch {
    openToast({ message: '연결 테스트에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
  }
}

/** 테이블 목록 조회 */
const handleFetchMetaTableList = async (datamartId: string) => {
  try {
    const res = await fetchMetaTableList(datamartId)
    return res.dataList
  } catch {
    openToast({ message: '메타 테이블 목록 조회에 실패했습니다.', type: 'error' })
  }
}

/** 관계 메타 목록 조회 */
const handleFetchMetaRelationshipList = async (datamartId: string) => {
  try {
    openLoading({ text: '관계 메타 목록 조회 중...' })
    const res = await fetchMetaRelationshipList(datamartId)
    return res.dataList
  } catch {
    openToast({ message: '관계 메타 목록 조회에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
  }
}

/** 메타 관리 모달 — 스키마(테이블) 목록만 로드 (로딩 포함, hydrate 내부용) */
const loadMetaModalTableListWithSpinner = async (datamartId: string) => {
  const id = datamartId?.trim() ?? ''
  if (!id) {
    return { ok: false as const, errorMessage: '데이터마트 정보가 없습니다.' }
  }
  openLoading({ text: '스키마정보를 불러오는 중...' })
  try {
    const list = await handleFetchMetaTableList(id)
    if (!Array.isArray(list)) {
      return { ok: false as const, errorMessage: '테이블 목록을 불러오지 못했습니다.' }
    }
    return { ok: true as const, errorMessage: null, list }
  } finally {
    closeLoading()
  }
}

const resetDatamartMetaModal = () => {
  metaModalTables.value = []
  metaModalRelationships.value = []
  metaModalTableListError.value = null
  metaModalSynonymListError.value = null
  metaModalSelectedColumnTableId.value = ''
  metaModalCodeMappings.value = []
  metaModalSynonymGroups.value = []
  metaModalFewshotList.value = []
  metaModalFewshotListError.value = null
  metaModalFewshotDraft.clear()
  metaModalSynonymDraft.clear()
}

/** 모달 오픈·테이블 탭 재시도 — 테이블 스키마 + JOIN 관계 목록 조회 후 스토어 상태 반영 */
const hydrateDatamartMetaModal = async (datamartId: string) => {
  const id = datamartId?.trim() ?? ''
  if (!id) {
    metaModalTableListError.value = '데이터마트 정보가 없습니다.'
    return
  }
  metaModalTableListError.value = null
  const res = await loadMetaModalTableListWithSpinner(id)
  if (!res.ok) {
    metaModalTableListError.value = res.errorMessage
    return
  }
  metaModalTables.value = res.list
  metaModalSelectedColumnTableId.value =
    metaModalTables.value.find((t) => t.useYn === 'Y')?.id ?? metaModalTables.value[0]?.id ?? ''
  const rels = await handleFetchMetaRelationshipList(id)
  metaModalRelationships.value = Array.isArray(rels) ? rels : []

  const codes = await handleFetchMetaCodeMappingList(id)
  metaModalCodeMappings.value = Array.isArray(codes) ? codes : []

  const synonymRes = await handleFetchMetaSynonymList(id)
  const parsedSynonymGroups = parseMetaSynonymGroupsFromApi(synonymRes, id)
  if (parsedSynonymGroups) {
    metaModalSynonymGroups.value = parsedSynonymGroups
    metaModalSynonymListError.value = null
    /** baseline은 동의어 탭 normalize 후 commit (flat → 카드 변환 시 오탐 방지) */
    metaModalSynonymDraft.clear()
  } else {
    metaModalSynonymGroups.value = []
    metaModalSynonymListError.value = '동의어 목록을 불러오지 못했습니다.'
    metaModalSynonymDraft.clear()
  }

  const fewshots = await handleFetchMetaFewshotList(id)
  if (fewshots === undefined) {
    metaModalFewshotList.value = []
    metaModalFewshotListError.value = '질문 예시 목록을 불러오지 못했습니다.'
    metaModalFewshotDraft.clear()
    return
  }
  metaModalFewshotList.value = fewshots
  metaModalFewshotListError.value = null
  metaModalFewshotDraft.commitBaseline()
}

/** 메타 관리 모달 — 테이블 사용 상태 변경 */
const setDatamartMetaModalTableUseYn = (payload: { id: string; useYn: 'Y' | 'N' }) => {
  const row = metaModalTables.value.find((t) => t.id === payload.id)
  if (!row || row.useYn === payload.useYn) return
  row.useYn = payload.useYn
  if (payload.useYn === 'N' && metaModalSelectedColumnTableId.value === payload.id) {
    metaModalSelectedColumnTableId.value = metaModalTables.value.find((t) => t.useYn === 'Y')?.id ?? ''
  }
}

/** 메타 관리 > 테이블 저장 (테이블 선택 탭) */
const handleSaveMetaTableSelection = async (datamartId: string, tables: DatamartMetaTableItem[]) => {
  if (!datamartId) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return false
  }

  const payload = {
    datamartId: datamartId,
    tableList: tables,
  }

  try {
    await fetchSaveMetaTable(payload)
    openToast({ message: '테이블 저장에 성공했습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '테이블 저장에 실패했습니다.', type: 'error' })
    return false
  }
}

/** 컬럼 메타데이터 저장 (useYn=Y 테이블만, 각 테이블의 columns 포함) */
const handleSaveMetaColumnSelection = async (datamartId: string, tables: DatamartMetaTableItem[]) => {
  if (!datamartId) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return false
  }

  const activeTables = tables.filter((t) => t.useYn === 'Y')
  if (!activeTables.length) {
    openToast({
      message: '활성화된 테이블이 없습니다. 테이블 선택 탭에서 사용할 테이블을 켜 주세요.',
      type: 'warning',
    })
    return false
  }

  const payload = {
    datamartId,
    tableList: activeTables,
  }

  try {
    await fetchSaveMetaColumn(payload)
    openToast({ message: '컬럼 메타데이터 저장에 성공했습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '컬럼 메타데이터 저장에 실패했습니다.', type: 'error' })
    return false
  }
}

/** 관계 메타데이터 저장 */
const handleSaveMetaRelationship = async (datamartId: string, relationships: DatamartMetaRelationship[]) => {
  if (!datamartId) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return false
  }

  const payload = {
    datamartId,
    relationshipList: relationships,
  }

  try {
    await fetchSaveMetaRelationship(payload)
    openToast({ message: '관계 메타데이터 저장에 성공했습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '관계 메타데이터 저장에 실패했습니다.', type: 'error' })
    return false
  }
}

/** 코드 매핑 메타데이터 저장 */
const handleSaveMetaCodeMapping = async (datamartId: string, mappings: DatamartMetaCodeColumnMapping[]) => {
  if (!datamartId) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return false
  }
  const payload = {
    datamartId,
    codeColumnMappingList: mappings,
  }
  try {
    await fetchSaveMetaCodeMapping(payload)
    openToast({ message: '코드 매핑 메타데이터 저장에 성공했습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '코드 매핑 메타데이터 저장에 실패했습니다.', type: 'error' })
    return false
  }
}

/** 코드 매핑 메타데터 목록 조회 */
const handleFetchMetaCodeMappingList = async (datamartId: string) => {
  try {
    openLoading({ text: '코드 매핑 메타데터 목록 조회 중...' })
    const res = await fetchMetaCodeMappingList(datamartId)
    return res.dataList
  } catch {
    openToast({ message: '코드 매핑 메타데터 목록 조회에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
  }
}

/** 동의어 목록 조회 */
const handleFetchMetaSynonymList = async (datamartId: string) => {
  try {
    openLoading({ text: '동의어 목록 조회 중...' })
    const res = await fetchMetaSynonymList(datamartId)
    return res
  } catch {
    openToast({ message: '동의어 목록 조회에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
  }
}

/** 퓨샷 목록 조회 — 성공 시 배열(빈 배열 포함), HTTP 실패 시 undefined */
const handleFetchMetaFewshotList = async (datamartId: string) => {
  try {
    openLoading({ text: '질문 예시 목록 조회 중...' })
    const res = await fetchMetaFewshotList(datamartId)
    return Array.isArray(res?.fewshotList) ? res.fewshotList : []
  } catch {
    openToast({ message: '질문 예시 목록 조회에 실패했습니다.', type: 'error' })
    return undefined
  } finally {
    closeLoading()
  }
}

/** 퓨샷 저장 */
const handleSaveMetaFewshot = async (datamartId: string, fewshotList: DatamartMetaFewshot[]) => {
  if (!datamartId) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return false
  }

  /** 미입력 신규 draft(빈 fewshotId·질문 없음)는 저장 요청에서 제외 */
  const payloadList = fewshotList.filter((row) => row.fewshotId?.trim() || row.userQuestion?.trim())

  const payload = {
    datamartId,
    fewshotList: payloadList,
  }

  try {
    await fetchSaveMetaFewshot(payload)
    const fewshots = await handleFetchMetaFewshotList(datamartId)
    if (fewshots === undefined) {
      metaModalFewshotListError.value = '질문 예시 목록을 불러오지 못했습니다.'
      openToast({ message: '저장 후 목록 갱신에 실패했습니다.', type: 'error' })
      return false
    }
    metaModalFewshotList.value = fewshots
    metaModalFewshotListError.value = null
    metaModalFewshotDraft.commitBaseline()
    openToast({ message: '질문 예시 저장에 성공했습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '질문 예시 저장에 실패했습니다.', type: 'error' })
    return false
  }
}

/** 동의어 저장 */
const handleSaveMetaSynonym = async (datamartId: string, synonymGroups: DatamartMetaSynonymGroup[]) => {
  if (!datamartId) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return false
  }

  const payload = {
    datamartId,
    synonymList: synonymGroups.flatMap((group) => group.synonymList),
  }

  try {
    await fetchSaveMetaSynonym(payload)
    const synonymRes = await handleFetchMetaSynonymList(datamartId)
    const parsedSynonymGroups = parseMetaSynonymGroupsFromApi(synonymRes, datamartId)
    if (parsedSynonymGroups) {
      metaModalSynonymGroups.value = parsedSynonymGroups
      metaModalSynonymListError.value = null
    } else {
      metaModalSynonymGroups.value = []
      metaModalSynonymListError.value = '동의어 목록을 불러오지 못했습니다.'
      openToast({ message: '저장 후 목록 갱신에 실패했습니다.', type: 'error' })
      return false
    }
    openToast({ message: '동의어 저장에 성공했습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '동의어 저장에 실패했습니다.', type: 'error' })
    return false
  }
}

export const useDatamartStore = () => {
  return {
    datamartList,
    summary,
    metaModalTables,
    metaModalRelationships,
    metaModalTableListError,
    metaModalSynonymListError,
    metaModalSelectedColumnTableId,
    metaModalCodeMappings,
    metaModalSynonymGroups,
    metaModalFewshotList,
    metaModalFewshotListError,
    metaModalFewshotDraft,
    metaModalSynonymDraft,
    handleSelectAll,
    handleSaveDatamart,
    handleDeleteDatamart,
    handleToggleActiveDatamart,
    handleTestConnection,
    handleFetchMetaTableList,
    handleFetchMetaRelationshipList,
    resetDatamartMetaModal,
    hydrateDatamartMetaModal,
    setDatamartMetaModalTableUseYn,
    handleSaveMetaTableSelection,
    handleSaveMetaColumnSelection,
    handleSaveMetaRelationship,
    handleSaveMetaCodeMapping,
    handleSaveMetaSynonym,
    handleSaveMetaFewshot,
  }
}
