import type { ModelOption, SearchModeValue, SubOption } from '~/types/chat'

// 채팅의 검색모드 상태는 `useChatStore`, `useChatRooms`에서 함께 사용하므로 모듈 단일 인스턴스로 공유한다.
const activeSearchModes = ref<SearchModeValue[]>([])
const subOptions = ref<SubOption[]>([])
const selectedSubOption = ref<string>('all')
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
    subOptions,
    selectedSubOption,
    modelOptions,
    selectedModelOption,
    resolveSvcTy,
    isSearchModeMissingSubOptions,
    searchModeSubOptionsEmptyMessage,
  }
}
