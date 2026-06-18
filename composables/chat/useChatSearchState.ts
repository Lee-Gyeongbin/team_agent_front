import type { ModelOption, SearchModeValue, SubOption } from '~/types/chat'

// 채팅의 검색모드 상태는 `useChatStore`, `useChatRooms`에서 함께 사용하므로 모듈 단일 인스턴스로 공유한다.
const activeSearchModes = ref<SearchModeValue[]>([])
/** 에이전트 관리(TB_AGT) 기준 선택된 에이전트 — 동일 M/S 모드가 여러 개일 때 활성 구분용 */
const selectedChatAgentId = ref<string | null>(null)
const subOptions = ref<SubOption[]>([])
/** M/S 모드 서브옵션(데이터셋·데이터마트) 다중 선택 값 */
const selectedSubOptions = ref<string[]>(['all'])
/**
 * RISK(프로젝트 리스크진단·svcTy='D') 에이전트 활성 여부.
 * 리서처(M)처럼 데이터셋 콤보·첨부를 재사용하되 svcTy만 'D'로 분기하기 위한 플래그.
 */
const riskAgentActive = ref(false)

/** 소켓/API용 refId: 다중 선택 시 콤마로 연결 (백엔드가 단일 문자열 필드 사용) */
const buildRefIdForPayload = (): string => {
  // 일반 채팅(C)에서는 참조 ID를 보내지 않도록 all로 고정
  if (activeSearchModes.value.length === 0) return 'all'

  const validOptionSet = new Set(subOptions.value.map((o) => String(o.value)))
  const validSelected = selectedSubOptions.value.map(String).filter((id) => validOptionSet.has(id))

  if (!validSelected.length) return subOptions.value[0]?.value ?? 'all'
  return validSelected.join(',')
}
const modelOptions = ref<ModelOption[]>([])
const selectedModelOption = ref<string>('all')

// 검색모드 기반 svcTy 결정 (C=일반, M=지식검색, S=데이터분석, D=리스크진단)
const resolveSvcTy = (): string => {
  // RISK 에이전트는 M 모드 머신(데이터셋 콤보·첨부)을 재사용하되 저장 svcTy는 'D'로 분기한다.
  if (riskAgentActive.value) return 'D'
  if (activeSearchModes.value.length === 0) return 'C'
  return activeSearchModes.value[0] === 'M' ? 'M' : 'S'
}

/**
 * M/S 모드인데 API에서 서브 옵션(데이터셋·데이터마트)이 비어 있는 경우.
 * RISK는 RFP 파일이 주 입력이고 자사 역량 데이터셋은 선택적이므로 빈 데이터셋이어도 전송을 막지 않는다.
 */
const isSearchModeMissingSubOptions = computed(
  () => !riskAgentActive.value && activeSearchModes.value.length > 0 && subOptions.value.length === 0,
)

/** 일반 질의(C)·매뉴얼 질의(M)·리스크진단(D, RFP 필수)에서 채팅 파일 첨부 허용 */
const isFileAttachEnabled = computed(() => {
  if (riskAgentActive.value) return true
  if (activeSearchModes.value.includes('M')) return true
  if (activeSearchModes.value.length > 0) return false
  return !selectedChatAgentId.value
})

/** 서브 옵션이 없을 때 입력창·토스트에 쓰는 안내 문구 */
const searchModeSubOptionsEmptyMessage = computed(() => {
  if (!isSearchModeMissingSubOptions.value) return ''
  return activeSearchModes.value[0] === 'M'
    ? '선택할 수 있는 지식 데이터셋이 없습니다.'
    : '선택할 수 있는 데이터마트가 없습니다.'
})

export const useChatSearchState = () => {
  return {
    activeSearchModes,
    selectedChatAgentId,
    subOptions,
    selectedSubOptions,
    riskAgentActive,
    buildRefIdForPayload,
    modelOptions,
    selectedModelOption,
    resolveSvcTy,
    isSearchModeMissingSubOptions,
    searchModeSubOptionsEmptyMessage,
    isFileAttachEnabled,
  }
}
