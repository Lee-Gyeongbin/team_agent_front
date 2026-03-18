import { useDatamartApi } from '~/composables/datamart/useDatamartApi'
import type { Datamart, DatamartSummary } from '~/types/datamart'

const { fetchDatamartList, fetchDatamartSummary, fetchSaveDatamart, fetchDeleteDatamart, fetchToggleActiveDatamart, fetchTestConnection } =
  useDatamartApi()

// ===== 상태 변수 =====
const datamartList = ref<Datamart[]>([])
const summary = ref<DatamartSummary>({
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  dataSourceCount: 0,
  lastScanDate: '',
  connectedSystems: '',
})

// ===== 조회 =====
const handleSelectDatamartList = async () => {
  const res = await fetchDatamartList()
  datamartList.value = res.list
}

const handleSelectDatamartSummary = async () => {
  const res = await fetchDatamartSummary()
  summary.value = res.data
}

const handleSelectAll = async () => {
  await Promise.all([handleSelectDatamartList(), handleSelectDatamartSummary()])
}

// ===== 추가/수정/삭제 =====
const handleSaveDatamart = async (datamart: Partial<Datamart>) => {
  await fetchSaveDatamart(datamart)
  await handleSelectAll()
}

const handleDeleteDatamart = async (id: string) => {
  await fetchDeleteDatamart(id)
  await handleSelectAll()
}

const handleToggleActiveDatamart = async (id: string) => {
  await fetchToggleActiveDatamart(id)
  await handleSelectAll()
}

const handleTestConnection = async (id: string) => {
  const res = await fetchTestConnection(id)
  return res.data
}

export const useDatamartStore = () => {
  return {
    datamartList,
    summary,
    handleSelectAll,
    handleSaveDatamart,
    handleDeleteDatamart,
    handleToggleActiveDatamart,
    handleTestConnection,
  }
}
