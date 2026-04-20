import { useDatamartApi } from '~/composables/datamart/useDatamartApi'
import type { Datamart, DatamartSummary } from '~/types/datamart'
import type {
  DatamartMetaCodeColumnMapping,
  DatamartMetaRelationship,
  DatamartMetaTableItem,
} from '~/types/datamartMeta'
import { createDatamartMetaCodeMappingsSeed } from '~/utils/datamart/datamartMetaSeed'

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
} = useDatamartApi()

/** 상태 변수 */
const datamartList = ref<Datamart[]>([])

/** 메타 관리 모달 전용 — 테이블·관계·코드 매핑 등 (모달 오픈 시 hydrate) */
const metaModalTables = ref<DatamartMetaTableItem[]>([])
const metaModalRelationships = ref<DatamartMetaRelationship[]>([])
const metaModalTableListError = ref<string | null>(null)
const metaModalSelectedColumnTableId = ref('')
const metaModalCodeMappings = ref<DatamartMetaCodeColumnMapping[]>(createDatamartMetaCodeMappingsSeed())

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
  metaModalSelectedColumnTableId.value = ''
  metaModalCodeMappings.value = createDatamartMetaCodeMappingsSeed()
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
}

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
export const useDatamartStore = () => {
  return {
    datamartList,
    summary,
    metaModalTables,
    metaModalRelationships,
    metaModalTableListError,
    metaModalSelectedColumnTableId,
    metaModalCodeMappings,
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
  }
}
