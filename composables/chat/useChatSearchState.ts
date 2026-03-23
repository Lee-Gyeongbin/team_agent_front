import type { SearchModeValue, SubOption } from '~/types/chat'

// 채팅의 검색모드 상태는 `useChatStore`, `useChatRooms`에서 함께 사용하므로 모듈 단일 인스턴스로 공유한다.
const activeSearchModes = ref<SearchModeValue[]>([])
const subOptions = ref<SubOption[]>([])
const selectedSubOption = ref<string>('all')

// 검색모드 기반 svcTy 결정 (C=일반, M=지식검색, S=데이터분석)
const resolveSvcTy = (): string => {
  if (activeSearchModes.value.length === 0) return 'C'
  return activeSearchModes.value[0] === 'M' ? 'M' : 'S'
}

export const useChatSearchState = () => {
  return {
    activeSearchModes,
    subOptions,
    selectedSubOption,
    resolveSvcTy,
  }
}
