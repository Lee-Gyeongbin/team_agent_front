import { useDatamartApi } from '~/composables/datamart/useDatamartApi'
import type { Datamart, DatamartSummary } from '~/types/datamart'

const { fetchDatamartList, fetchDatamartSummary, fetchSaveDatamart, fetchDeleteDatamart, fetchTestConnection } =
  useDatamartApi()

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
