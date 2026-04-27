import type { ModelOption, SearchModeValue, SubOption } from '~/types/chat'

// 채팅의 검색모드 상태는 `useChatStore`, `useChatRooms`에서 함께 사용하므로 모듈 단일 인스턴스로 공유한다.
const activeSearchModes = ref<SearchModeValue[]>([])
/** 에이전트 관리(TB_AGT) 기준 선택된 에이전트 — 동일 M/S 모드가 여러 개일 때 활성 구분용 */
const selectedChatAgentId = ref<string | null>(null)
const subOptions = ref<SubOption[]>([])
/** M/S 모드 서브옵션(데이터셋·데이터마트) 다중 선택 값 */
const selectedSubOptions = ref<string[]>(['all'])

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

// 검색모드 기반 svcTy 결정 (C=일반, M=지식검색, S=데이터분석)
const resolveSvcTy = (): string => {
  if (activeSearchModes.value.length === 0) return 'C'
  return activeSearchModes.value[0] === 'M' ? 'M' : 'S'
}

/** M/S 모드인데 API에서 서브 옵션(데이터셋·데이터마트)이 비어 있는 경우 */
const isSearchModeMissingSubOptions = computed(
  () => activeSearchModes.value.length > 0 && subOptions.value.length === 0,
)

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
    buildRefIdForPayload,
    modelOptions,
    selectedModelOption,
    resolveSvcTy,
    isSearchModeMissingSubOptions,
    searchModeSubOptionsEmptyMessage,
  }
}
