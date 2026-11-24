import type { ComputedRef } from 'vue'
import { useAgentApi } from '~/composables/agent/useAgentApi'
import { useAuth } from '~/composables/com/useAuth'
import { useIdeaApi } from '~/composables/idea/useIdeaApi'
import { openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'
import type { UserInfo } from '~/types/auth'
import type { IdeaAgent, IdeaCode, IdeaDetail, IdeaFormData, IdeaListItem, IdeaResult } from '~/types/idea'
import { IDEA_TYPE_CD_AGENT } from '~/types/idea'
import { getCodes } from '~/utils/global/comCodesUtil'

const {
  fetchIdeaList,
  fetchIdeaDetail,
  fetchSaveIdea,
  fetchDeleteIdea,
  fetchToggleIdeaLike,
} = useIdeaApi()
const { fetchAgentList } = useAgentApi()

const IDEA_PAGE_SIZE = 15

// ============================================
// 공통 — 구분·진행상태 공통코드, 에이전트 목록 (사용자·관리자 화면 공유)
// ============================================

const ideaTypeList = ref<IdeaCode[]>([])
const ideaAgentList = ref<IdeaAgent[]>([])

const ideaTypeFilterOptions = computed(() => [
  { label: '전체 구분', value: 'ALL' },
  ...ideaTypeList.value.map(({ codeId, codeNm }) => ({ label: codeNm, value: codeId })),
])
const ideaTypeOptions = computed(() =>
  ideaTypeList.value.map(({ codeId, codeNm }) => ({ label: codeNm, value: codeId })),
)
const ideaAgentOptions = computed(() =>
  ideaAgentList.value.map(({ agentId, agentNm }) => ({ label: agentNm, value: agentId })),
)
/** 구분 코드가 '에이전트'인지 (코드값으로 판단) */
const isAgentType = (ideaTypeCd: string) => ideaTypeCd === IDEA_TYPE_CD_AGENT

/** 공통코드·에이전트 목록 조회 (한 번만) */
export const handleSelectIdeaCodeList = async () => {
  const [typeList, { dataList: agentList }] = await Promise.all([
    getCodes('ID000002'),
    fetchAgentList(),
  ])
  ideaTypeList.value = typeList
  ideaAgentList.value = (agentList ?? []).filter(({ useYn }) => useYn === 'Y')
}

export const getIdeaAgentName = (agentId?: string | null) =>
  ideaAgentList.value.find((agent) => agent.agentId === agentId)?.agentNm

/** 구분 이름 — 공통코드에서 찾고, 없으면 코드값 표시 */
export const getIdeaCodeNames = (idea: Partial<Pick<IdeaListItem, 'ideaTypeCd'>>) => ({
  ideaTypeNm: ideaTypeList.value.find(({ codeId }) => codeId === idea.ideaTypeCd)?.codeNm ?? idea.ideaTypeCd ?? '',
})

/** result FAIL이면 사유를 알리고 true */
export const isIdeaFail = (res: Pick<IdeaResult, 'result' | 'msg'> | null | undefined) => {
  if (res?.result !== 'FAIL') return false
  openToast({ message: res.msg || '요청을 처리하지 못했습니다.', type: 'error' })
  return true
}

/** 로그인 사용자 — 페이지 setup에서 useIdeaStore 호출 시 연결 */
let loginUser: ComputedRef<UserInfo | null> | null = null
export const bindIdeaLoginUser = () => {
  if (!loginUser) loginUser = useAuth().user
}
const getLoginUserId = () => loginUser?.value?.userId ?? ''

/**
 * 목록 조회 조건 + 서버 조회 (화면마다 따로 생성)
 * - 검색어는 Enter·검색 아이콘을 눌러야 반영(searchInput → searchKeyword)
 * - 진행상태 필터는 관리자 화면에서만 사용
 */
export const createIdeaListState = () => {
  const searchInput = ref('')
  const searchKeyword = ref('')
  const searchTypeCd = ref('ALL')
  const currentPage = ref(1)
  const ideaList = ref<IdeaListItem[]>([])
  const totalCount = ref(0)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / IDEA_PAGE_SIZE)))

  const getSearchParams = () => ({
    searchKeyword: searchKeyword.value.trim(),
    searchTypeCd: searchTypeCd.value === 'ALL' ? '' : searchTypeCd.value,
  })

  /** 목록 조회 — 번호는 최신 글이 큰 번호 */
  const handleSelectIdeaList = async () => {
    const res = await fetchIdeaList({ ...getSearchParams(), pageIndex: currentPage.value })
    totalCount.value = res.totalCnt ?? 0
    const startNo = totalCount.value - (currentPage.value - 1) * IDEA_PAGE_SIZE
    ideaList.value = (res.dataList ?? []).map((item, idx) => ({
      ...item,
      ...getIdeaCodeNames(item),
      rowNo: startNo - idx,
    }))
    // 삭제 등으로 현재 페이지가 비면 앞 페이지로 (페이지 watch가 다시 조회)
    if (!ideaList.value.length && currentPage.value > 1) currentPage.value = totalPages.value
  }

  /**
   * 1페이지부터 다시 조회
   * - 이미 1페이지면 바로 조회, 아니면 페이지만 바꾸고 조회는 페이지의 currentPage watch가 담당 (중복 조회 방지)
   */
  const handleSelectFirstPage = async () => {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }
    await handleSelectIdeaList()
  }

  /** 검색 실행 (Enter·검색 아이콘) */
  const onSearch = () => {
    searchKeyword.value = searchInput.value
    handleSelectFirstPage()
  }

  /** 구분·진행상태 선택 변경 */
  const onFilterChange = () => {
    handleSelectFirstPage()
  }

  /** 새로고침 — 조회 조건 초기화 후 다시 조회 */
  const handleRefresh = async () => {
    searchInput.value = ''
    searchKeyword.value = ''
    searchTypeCd.value = 'ALL'
    await handleSelectFirstPage()
    openToast({ message: '조회 조건을 초기화하고 새로고침했습니다.', type: 'info' })
  }

  return {
    searchInput,
    searchKeyword,
    searchTypeCd,
    currentPage,
    ideaList,
    totalCount,
    totalPages,
    getSearchParams,
    handleSelectIdeaList,
    handleSelectFirstPage,
    onSearch,
    onFilterChange,
    handleRefresh,
  }
}

/** 상세 조회 */
export const handleSelectIdeaDetail = async (ideaId: string): Promise<IdeaDetail | null> => {
  const res = await fetchIdeaDetail(ideaId)
  if (isIdeaFail(res) || !res.data) return null
  return { ...res.data, ...getIdeaCodeNames(res.data), fileList: res.data.fileList ?? [] }
}

/** 삭제 확인창 (제목 굵게) */
export const confirmDeleteIdea = (title: string) =>
  openConfirm({
    title: '아이디어 삭제',
    emphasis: title,
    message: '삭제하시겠습니까? 삭제한 글은 복구할 수 없습니다.',
    confirmText: '삭제',
  })

/** 추천 토글 — 상세의 추천 수·여부를 서버 값으로 갱신 */
export const handleToggleIdeaLike = async (detail: IdeaDetail) => {
  const res = await fetchToggleIdeaLike(detail.ideaId)
  if (isIdeaFail(res) || !res.data) return
  detail.likeCnt = res.data.likeCnt
  detail.likedYn = res.data.likedYn
}

export const useIdeaCodeStore = () => ({
  ideaTypeFilterOptions,
  ideaTypeOptions,
  ideaAgentOptions,
  isAgentType,
  ideaPageSize: IDEA_PAGE_SIZE,
})

// ============================================
// 사용자 화면(아이디어)
// ============================================

const userList = createIdeaListState()

const selectedIdea = ref<IdeaDetail | null>(null)
const isIdeaDetailPanelOpen = ref(false)
const isIdeaFormPanelOpen = ref(false)

const createEmptyForm = (): IdeaFormData => ({
  ideaId: null,
  ideaTypeCd: '',
  agentId: '',
  title: '',
  content: '',
  files: [],
  deleteFileIds: [],
})
const ideaForm = ref<IdeaFormData>(createEmptyForm())
const panelActionLabel = computed<'등록' | '수정'>(() => (ideaForm.value.ideaId ? '수정' : '등록'))

/** 본인 글 여부 */
const isMyIdea = (idea: Pick<IdeaListItem, 'createId'>) => !!idea.createId && idea.createId === getLoginUserId()

const onOpenIdeaDetail = async (idea: IdeaListItem) => {
  const detail = await handleSelectIdeaDetail(idea.ideaId)
  if (!detail) return
  selectedIdea.value = detail
  isIdeaDetailPanelOpen.value = true
}

const onCloseIdeaDetail = () => {
  isIdeaDetailPanelOpen.value = false
}

const onRegisterIdea = () => {
  ideaForm.value = createEmptyForm()
  isIdeaFormPanelOpen.value = true
}

const onEditIdea = () => {
  const idea = selectedIdea.value
  if (!idea) return
  ideaForm.value = {
    ideaId: idea.ideaId,
    ideaTypeCd: idea.ideaTypeCd,
    agentId: idea.agentId ?? '',
    title: idea.title,
    content: idea.content,
    files: idea.fileList.map((file) => ({ ...file })),
    deleteFileIds: [],
  }
  isIdeaDetailPanelOpen.value = false
  isIdeaFormPanelOpen.value = true
}

const onCloseIdeaForm = () => {
  isIdeaFormPanelOpen.value = false
}

/** 등록·수정 저장 */
const handleSaveIdea = async (form: IdeaFormData) => {
  const isEdit = !!form.ideaId
  const res = await fetchSaveIdea({
    ...form,
    agentId: isAgentType(form.ideaTypeCd) ? form.agentId : '',
    title: form.title.trim(),
    content: form.content.trim(),
  })
  if (isIdeaFail(res)) return
  isIdeaFormPanelOpen.value = false
  if (isEdit) await userList.handleSelectIdeaList()
  else await userList.handleSelectFirstPage()
  openToast({ message: isEdit ? '수정되었습니다.' : '등록되었습니다.', type: 'success' })
}

/** 상세에서 삭제 */
const handleDeleteIdea = async () => {
  const idea = selectedIdea.value
  if (!idea || !(await confirmDeleteIdea(idea.title))) return
  const res = await fetchDeleteIdea(idea.ideaId)
  if (isIdeaFail(res)) return
  isIdeaDetailPanelOpen.value = false
  selectedIdea.value = null
  await userList.handleSelectIdeaList()
  openToast({ message: '삭제되었습니다.', type: 'success' })
}

/** 추천 — 목록의 추천 수도 함께 갱신 */
const toggleIdeaLike = async () => {
  const idea = selectedIdea.value
  if (!idea) return
  await handleToggleIdeaLike(idea)
  const row = userList.ideaList.value.find((item) => item.ideaId === idea.ideaId)
  if (row) row.likeCnt = idea.likeCnt
}

export const useIdeaStore = () => {
  bindIdeaLoginUser()
  return {
    ...useIdeaCodeStore(),
    searchInput: userList.searchInput,
    searchKeyword: userList.searchKeyword,
    searchTypeCd: userList.searchTypeCd,
    currentPage: userList.currentPage,
    ideaList: userList.ideaList,
    totalIdeaCount: userList.totalCount,
    ideaTotalPages: userList.totalPages,
    isIdeaDetailPanelOpen,
    isIdeaFormPanelOpen,
    ideaForm,
    selectedIdea,
    panelActionLabel,
    isMyIdea,
    handleSelectIdeaCodeList,
    handleSelectIdeaList: userList.handleSelectIdeaList,
    onSearchIdea: userList.onSearch,
    onFilterChange: userList.onFilterChange,
    handleRefreshIdea: userList.handleRefresh,
    onOpenIdeaDetail,
    onCloseIdeaDetail,
    onRegisterIdea,
    onEditIdea,
    onCloseIdeaForm,
    handleSaveIdea,
    handleDeleteIdea,
    toggleIdeaLike,
  }
}
