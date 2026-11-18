import { useIdeaApi } from '~/composables/idea/useIdeaApi'
import {
  confirmDeleteIdea,
  createIdeaListState,
  handleDownloadIdeaFile,
  handleSelectIdeaCodeList,
  handleSelectIdeaDetail,
  handleToggleIdeaLike,
  isIdeaFail,
  useIdeaCodeStore,
} from '~/composables/idea/useIdeaStore'
import { openToast } from '~/composables/useToast'
import type { IdeaDetail, IdeaListItem, IdeaManageFormData } from '~/types/idea'
import { downloadIdeaListExcel } from '~/utils/idea/ideaExcel'

const { fetchIdeaExcelList, fetchSaveIdeaManage, fetchDeleteIdeaManage } = useIdeaApi()

// ============================================
// 아이디어 관리(관리자) — 조회 조건은 사용자 화면과 별도
// ============================================

const manageList = createIdeaListState()

const excelMenuItems = [{ label: '다운로드', value: 'download', icon: 'icon-download' }]

const selectedManageIdea = ref<IdeaDetail | null>(null)
const isIdeaManageDetailOpen = ref(false)
/** 상세 하단(진행상태·관리자 코멘트) 입력값 */
const ideaManageForm = ref<IdeaManageFormData>({ statusCd: '', cmtContent: '' })

const onOpenIdeaManageDetail = async (idea: IdeaListItem) => {
  const detail = await handleSelectIdeaDetail(idea.ideaId)
  if (!detail) return
  selectedManageIdea.value = detail
  ideaManageForm.value = { statusCd: detail.statusCd, cmtContent: detail.cmtContent ?? '' }
  isIdeaManageDetailOpen.value = true
}

const onCloseIdeaManageDetail = () => {
  isIdeaManageDetailOpen.value = false
}

/** 진행상태·관리자 코멘트 저장 (코멘트를 비우면 삭제) */
const handleSaveIdeaManage = async () => {
  const idea = selectedManageIdea.value
  if (!idea) return
  if (!ideaManageForm.value.statusCd) {
    openToast({ message: '진행상태를 선택해주세요.', type: 'warning' })
    return
  }
  const res = await fetchSaveIdeaManage(idea.ideaId, {
    statusCd: ideaManageForm.value.statusCd,
    cmtContent: ideaManageForm.value.cmtContent.trim(),
  })
  if (isIdeaFail(res)) return
  isIdeaManageDetailOpen.value = false
  await manageList.handleSelectIdeaList()
  openToast({ message: '저장되었습니다.', type: 'success' })
}

/** 목록·상세에서 삭제 (다른 사람 글 포함) */
const handleDeleteIdeaManage = async (
  idea: Pick<IdeaListItem, 'ideaId' | 'title'> | null = selectedManageIdea.value,
) => {
  if (!idea || !(await confirmDeleteIdea(idea.title))) return
  const res = await fetchDeleteIdeaManage(idea.ideaId)
  if (isIdeaFail(res)) return
  if (selectedManageIdea.value?.ideaId === idea.ideaId) {
    isIdeaManageDetailOpen.value = false
    selectedManageIdea.value = null
  }
  await manageList.handleSelectIdeaList()
  openToast({ message: '삭제되었습니다.', type: 'success' })
}

const toggleIdeaManageLike = async () => {
  const idea = selectedManageIdea.value
  if (!idea) return
  await handleToggleIdeaLike(idea)
  const row = manageList.ideaList.value.find((item) => item.ideaId === idea.ideaId)
  if (row) row.likeCnt = idea.likeCnt
}

/** 엑셀 메뉴 — 다운로드만 제공 (현재 조회 조건의 전체 목록) */
const onIdeaExcelSelect = async (value: string) => {
  if (value !== 'download') return
  const res = await fetchIdeaExcelList(manageList.getSearchParams())
  const isDone = await downloadIdeaListExcel(res.dataList ?? [])
  openToast(
    isDone
      ? { message: '엑셀 다운로드를 시작합니다.', type: 'success' }
      : { message: '엑셀 파일을 만들지 못했습니다.', type: 'error' },
  )
}

export const useIdeaManageStore = () => {
  return {
    ...useIdeaCodeStore(),
    searchInput: manageList.searchInput,
    searchKeyword: manageList.searchKeyword,
    searchTypeCd: manageList.searchTypeCd,
    searchStatusCd: manageList.searchStatusCd,
    currentPage: manageList.currentPage,
    ideaList: manageList.ideaList,
    totalIdeaCount: manageList.totalCount,
    ideaTotalPages: manageList.totalPages,
    excelMenuItems,
    isIdeaManageDetailOpen,
    ideaManageForm,
    selectedManageIdea,
    handleSelectIdeaCodeList,
    handleSelectIdeaList: manageList.handleSelectIdeaList,
    onSearchIdea: manageList.onSearch,
    onFilterChange: manageList.onFilterChange,
    handleRefreshIdea: manageList.handleRefresh,
    onOpenIdeaManageDetail,
    onCloseIdeaManageDetail,
    handleSaveIdeaManage,
    handleDeleteIdeaManage,
    toggleIdeaManageLike,
    handleDownloadIdeaFile,
    onIdeaExcelSelect,
  }
}
