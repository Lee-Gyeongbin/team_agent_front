import { useAgentApi } from '~/composables/agent/useAgentApi'
import type { Agent, AgtDs, AgtDm } from '~/types/agent'

const {
  fetchAgentList,
  fetchModelOptions,
  fetchSaveAgent,
  fetchAgentDetail,
  fetchAgentDetailDataList,
  fetchDeleteAgent,
  fetchToggleAgent,
  fetchUpdateAgentOrder,
} = useAgentApi()

const agentList = ref<Agent[]>([])
/** 에이전트 상세 모달 */
const isSettingOpen = ref(false)
const selectedAgent = ref<Agent | null>(null)
const modelOptions = ref<{ modelId: string; modelName: string }[]>([])
/** 드래그 시작 전 원본 순서 스냅샷 */
const agentListBeforeDrag = ref<Agent[]>([])

/** 에이전트 목록 조회 */
const handleSelectAgentList = async () => {
  try {
    const response = await fetchAgentList()
    agentList.value = response?.dataList ?? []
  } catch {
    openToast({
      message: '에이전트 목록 조회 실패',
      type: 'error',
    })
  }
}

/** 모델 옵션 조회 */
const handleFetchModelOptions = async () => {
  try {
    const response = await fetchModelOptions()
    modelOptions.value = response?.dataList ?? []
  } catch {
    openToast({
      message: '모델 옵션 조회 실패',
      type: 'error',
    })
  }
}

/** 에이전트 활성화/비활성화 */
const handleToggleAgent = async (agentId: string, useYn: 'Y' | 'N') => {
  try {
    await fetchToggleAgent(agentId, useYn)
    openToast({
      message: '에이전트 활성화 상태가 변경되었습니다.',
      type: 'success',
    })
    await handleSelectAgentList()
  } catch {
    openToast({
      message: '에이전트 활성화/비활성화 실패',
      type: 'error',
    })
  }
}

/** 에이전트 상세 조회 */
const handleFetchAgentDetail = async (agent: Agent) => {
  try {
    const response = await fetchAgentDetail(agent)
    selectedAgent.value = response?.data ?? null
    await handleFetchAgentDetailDataList(agent)
    isSettingOpen.value = true
  } catch {
    openToast({
      message: '에이전트 상세 조회 실패',
      type: 'error',
    })
  }
}

/** 에이전트 상세 데이터 목록 조회 */
const handleFetchAgentDetailDataList = async (agent: Agent) => {
  try {
    const response = await fetchAgentDetailDataList(agent)
    if (!selectedAgent.value) return
    if (agent.svcTy === 'M') {
      selectedAgent.value.datasetList = (response?.dataList as AgtDs[]) ?? []
    } else if (agent.svcTy === 'S') {
      selectedAgent.value.datamartList = (response?.dataList as AgtDm[]) ?? []
    }
  } catch {
    openToast({
      message: '데이터 목록 조회 실패',
      type: 'error',
    })
  }
}

/** 에이전트 저장 */
const handleSaveAgent = async (agent: Partial<Agent>) => {
  const valid = validateAgentSave(agent)
  if (!valid.valid) {
    openToast({
      message: valid.msg,
      type: 'warning',
    })
    return
  }
  openConfirm({
    message: '에이전트를 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchSaveAgent(agent)
        await handleSelectAgentList()
        openAlert({ message: '에이전트 정보가 저장되었습니다.' })
        isSettingOpen.value = false
      } catch {
        openToast({
          message: '에이전트 저장 실패',
          type: 'error',
        })
      }
    },
  })
}

/** 에이전트 저장 검증 */
const validateAgentSave = (agent: Partial<Agent>) => {
  let valid = true
  let msg = ''
  if (isEmpty(agent.svcTy)) {
    valid = false
    msg = '에이전트 유형을 선택해주세요.'
    return { valid, msg }
  }
  if (isEmpty(agent.agentNm)) {
    valid = false
    msg = '에이전트 이름을 입력해주세요.'
    return { valid, msg }
  }
  if (isEmpty(agent.description)) {
    valid = false
    msg = '에이전트 설명을 입력해주세요.'
    return { valid, msg }
  }

  if (agent.svcTy === 'M') {
    // RAG Agent 설정 검증
    if (isEmpty(agent.simThresh)) {
      valid = false
      msg = '유사도 임계치를 입력해주세요.'
      return { valid, msg }
    }
    if (Number(agent.simThresh) < 0 || Number(agent.simThresh) > 1) {
      valid = false
      msg = '유사도 임계값은 0~1 사이의 값이어야 합니다.'
      return { valid, msg }
    }
    if (isEmpty(agent.maxSrchRslt)) {
      valid = false
      msg = '최대 검색 결과 수를 입력해주세요.'
      return { valid, msg }
    }
  } else if (agent.svcTy === 'S') {
    // TextToSQL Agent 설정 검증
    if (isEmpty(agent.datamartList)) {
      valid = false
      msg = '데이터마트를 선택해주세요.'
      return { valid, msg }
    }
    if (isEmpty(agent.modelId)) {
      valid = false
      msg = 'SQL 생성 모델을 선택해주세요.'
      return { valid, msg }
    }
    if (isEmpty(agent.maxQrySec)) {
      valid = false
      msg = '최대 쿼리 실행 시간을 입력해주세요.'
      return { valid, msg }
    }
    if (isEmpty(agent.sqlValidYn)) {
      valid = false
      msg = 'SQL 유효성 검사 여부를 선택해주세요.'
      return { valid, msg }
    }
    if (isEmpty(agent.readonlyYn)) {
      valid = false
      msg = '읽기 전용 여부를 선택해주세요.'
      return { valid, msg }
    }
    if (isEmpty(agent.userCfrmYn)) {
      valid = false
      msg = '사용자 확인 여부를 선택해주세요.'
      return { valid, msg }
    }
  }

  return { valid, msg }
}

/** 에이전트 유형 변경 → 해당 유형의 데이터 목록 반환 */
const handleChangeAgentType = async (svcTy: string) => {
  try {
    const response = await fetchAgentDetailDataList({ svcTy } as Agent)
    return {
      datasetList: svcTy === 'M' ? ((response?.dataList as AgtDs[]) ?? []) : [],
      datamartList: svcTy === 'S' ? ((response?.dataList as AgtDm[]) ?? []) : [],
    }
  } catch {
    openToast({
      message: '에이전트 상세 데이터 목록 조회 실패',
      type: 'error',
    })
    return { datasetList: [], datamartList: [] }
  }
}

/** 에이전트 삭제 */
const handleDeleteAgent = async (agent: Agent) => {
  openConfirm({
    message: '에이전트를 삭제하시겠습니까?',
    onConfirm: async () => {
      await fetchDeleteAgent(agent)
      openToast({ message: '에이전트가 삭제되었습니다.', type: 'success' })
      await handleSelectAgentList()
    },
  })
}

/** 에이전트 드래그 시작 시 순서 저장 (취소 시 복원용) */
const onAgentDragStart = () => {
  agentListBeforeDrag.value = [...agentList.value]
}

/** 에이전트 순서 변경 */
const handleUpdateAgentOrder = async (orderList: { agentId: string; sortOrd: number }[]) => {
  openConfirm({
    message: '에이전트 순서를 변경하시겠습니까?',
    onConfirm: async () => {
      await fetchUpdateAgentOrder(orderList)
      await handleSelectAgentList()
      openToast({ message: '에이전트 순서가 변경되었습니다.', type: 'info' })
    },
    onCancel: () => {
      agentList.value = [...agentListBeforeDrag.value]
    },
  })
}

export const useAgentStore = () => {
  return {
    agentList,
    isSettingOpen,
    selectedAgent,
    modelOptions,
    handleSelectAgentList,
    handleFetchModelOptions,
    handleToggleAgent,
    handleFetchAgentDetail,
    handleSaveAgent,
    handleChangeAgentType,
    handleDeleteAgent,
    onAgentDragStart,
    handleUpdateAgentOrder,
  }
}
