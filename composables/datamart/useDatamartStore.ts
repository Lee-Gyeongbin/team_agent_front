import { useDatamartApi } from '~/composables/datamart/useDatamartApi'
import type { Datamart, DatamartSummary } from '~/types/datamart'

const {
  fetchDatamartList,
  fetchDatamartSummary,
  fetchSaveDatamart,
  fetchDeleteDatamart,
  fetchToggleActiveDatamart,
  fetchTestConnection,
} = useDatamartApi()

/** 상태 변수 */
const datamartList = ref<Datamart[]>([])
const summary = ref<DatamartSummary>({
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  dataSourceCount: 0,
  lastScanDate: '',
  connectedSystems: '',
})

/** 조회 */
const handleSelectDatamartList = async () => {
  try {
    const res = await fetchDatamartList()
    datamartList.value = res.dataList
  } catch (error) {
    console.error(error)
  }
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

/** 데이터마트 연결 테스트 */
const handleTestConnection = async (datamart: Datamart) => {
  try {
    const response = await fetchTestConnection(datamart)
    const isSuccess = response.result === 'SUCCESS'
    openToast({
      message: response.msg,
      type: isSuccess ? 'success' : 'error',
    })
  } catch {
    openToast({ message: '연결 테스트에 실패했습니다.', type: 'error' })
  }
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
