import type { CodeGroupItem, CodeItem } from '~/types/codes'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { useCodesApi } from '~/composables/codes/useCodesApi'
import { isEmpty, isValidCodeFormat } from '~/utils/global/validationUtil'
const { fetchCodeGroupList, fetchSaveCodeGroup, fetchCodeList, fetchSaveCode, fetchUpdateCodeSortOrder } = useCodesApi()

/** 상세코드 행 액션 메뉴 아이템 */
export const codesRowMenuItems: DropdownMenuItemDef[] = [
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]

/** 그룹코드 행 액션 메뉴 아이템 */
export const codeGroupRowMenuItems: DropdownMenuItemDef[] = [
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]

/** 사용여부 선택 옵션 */
export const useYnOptions = [
  { label: '사용', value: 'Y' },
  { label: '미사용', value: 'N' },
]

// 호출부 간 동기화를 위해 모듈 레벨로 공유
const codeGroupList = ref<CodeGroupItem[]>([])
const codeList = ref<CodeItem[]>([])
const selectedGroupCode = ref('')
const searchKeyword = ref('')
const searchKeywordGroup = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const modalErrorMessage = ref('')

const isModalOpen = ref(false)
const isEditMode = ref(false)
const editingCode = ref<CodeItem | null>(null)

const isGroupModalOpen = ref(false)
const isGroupEditMode = ref(false)
const editingGroup = ref<CodeGroupItem | null>(null)

const isGroupDeleteModalOpen = ref(false)
const deletingGroup = ref<CodeGroupItem | null>(null)

const isDeleteModalOpen = ref(false)
const deletingCode = ref<CodeItem | null>(null)

export const useCodesStore = () => {
  const filteredList = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return codeList.value
    return codeList.value.filter(
      (item) =>
        item.codeGrpId.toLowerCase().includes(keyword) ||
        item.codeNm.toLowerCase().includes(keyword) ||
        (item.description && item.description.toLowerCase().includes(keyword)),
    )
  })

  const filteredGroupList = computed(() => {
    const keyword = searchKeywordGroup.value.trim().toLowerCase()
    if (!keyword) return codeGroupList.value
    return codeGroupList.value.filter(
      (item) =>
        item.codeGrpId.toLowerCase().includes(keyword) ||
        item.codeGrpNm.toLowerCase().includes(keyword) ||
        (item.description && item.description.toLowerCase().includes(keyword)),
    )
  })

  const codeGroupOptions = computed(() =>
    codeGroupList.value.map((g) => ({ label: g.codeGrpNm + ' (' + g.codeGrpId + ')', value: g.codeGrpId })),
  )

  /** 검색 중이 아닐 때만 드래그 정렬 가능 */
  const canDrag = computed(() => !searchKeyword.value.trim() && codeList.value.length > 0)

  const codeGroupTableDataWithActions = computed(() =>
    filteredGroupList.value.map((item) => ({
      ...item,
      actions: null,
    })),
  )

  const tableData = computed(() =>
    filteredList.value.map((item) => ({
      ...item,
      actions: null,
    })),
  )

  /** 공통코드 그룹 목록 조회 */
  const handleFetchCodeGroupList = async () => {
    errorMessage.value = ''
    isLoading.value = true
    try {
      const response = await fetchCodeGroupList()
      codeGroupList.value = response.dataList ?? []
      if (codeGroupList.value.length > 0 && !selectedGroupCode.value) {
        selectedGroupCode.value = codeGroupList.value[0].codeGrpId
        await handleFetchCodeList()
      }
    } catch {
      errorMessage.value = '그룹코드 목록을 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  /** 상세코드 목록 조회 */
  const handleFetchCodeList = async () => {
    if (!selectedGroupCode.value) {
      codeList.value = []
      return
    }
    errorMessage.value = ''
    isLoading.value = true
    try {
      const response = await fetchCodeList(selectedGroupCode.value as string)
      codeList.value = response.dataList ?? []
    } catch {
      errorMessage.value = '상세코드 목록을 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  /** 그룹코드 변경 시 상세코드 목록 로드 */
  const handleGroupCodeChange = () => {
    handleFetchCodeList()
  }

  /** 그룹 행 클릭 시 선택 및 상세코드 로드 */
  const handleSelectGroup = (group: CodeGroupItem) => {
    selectedGroupCode.value = group.codeGrpId
    handleFetchCodeList()
  }

  /** 상세코드 추가 모달 열기 */
  const openAddModal = () => {
    isEditMode.value = false
    editingCode.value = null
    isModalOpen.value = true
  }

  /** 그룹코드 추가 모달 열기 */
  const openAddGroupModal = () => {
    isGroupEditMode.value = false
    editingGroup.value = null
    isGroupModalOpen.value = true
  }

  /** 그룹코드 수정 모달 열기 */
  const openEditGroupModal = (group: CodeGroupItem) => {
    isGroupEditMode.value = true
    editingGroup.value = { ...group }
    isGroupModalOpen.value = true
  }

  /** 그룹코드 모달 닫기 */
  const handleGroupModalClose = () => {
    isGroupModalOpen.value = false
    editingGroup.value = null
    modalErrorMessage.value = ''
  }

  /** 그룹코드 폼 유효성 검사 */
  const validateGroupForm = (_form: Partial<CodeGroupItem>): boolean => {
    if (isEmpty(_form.codeGrpId)) {
      modalErrorMessage.value = '그룹코드를 입력해주세요.'
      return false
    }

    if (!isValidCodeFormat(_form.codeGrpId)) {
      modalErrorMessage.value =
        '그룹코드 형식이 올바르지 않습니다.\n앞 2자리 대문자 영문 + 뒤 6자리 숫자로 입력해주세요.'
      return false
    }

    if (isEmpty(_form.codeGrpNm)) {
      modalErrorMessage.value = '그룹코드명을 입력해주세요.'
      return false
    }

    return true
  }

  /** 그룹코드 저장 */
  const handleSaveGroup = async (_form: Partial<CodeGroupItem>) => {
    if (!validateGroupForm(_form)) return
    modalErrorMessage.value = ''
    try {
      errorMessage.value = ''
      isLoading.value = true
      await fetchSaveCodeGroup(_form as CodeGroupItem)
      await handleFetchCodeGroupList()
    } catch {
      errorMessage.value = '그룹코드 저장에 실패했습니다.'
    } finally {
      isLoading.value = false
      handleGroupModalClose()
    }
  }

  /** 그룹코드 행 메뉴 선택 */
  const handleGroupRowMenuSelect = (row: CodeGroupItem, value: string) => {
    const group = row
    if (value === 'edit') {
      openEditGroupModal(group)
    } else if (value === 'delete') {
      deletingGroup.value = group
      isGroupDeleteModalOpen.value = true
    }
  }

  const handleGroupDeleteConfirm = async () => {
    if (!deletingGroup.value) return
    // TODO: API 연결 시 그룹 삭제 API 호출
    console.warn('[TODO] handleGroupDeleteConfirm — API 연결 필요', deletingGroup.value)
    codeGroupList.value = codeGroupList.value.filter((g) => g.codeGrpId !== deletingGroup.value!.codeGrpId)
    if (selectedGroupCode.value === deletingGroup.value.codeGrpId) {
      selectedGroupCode.value = codeGroupList.value[0]?.codeGrpId ?? ''
      await handleFetchCodeList()
    }
    isGroupDeleteModalOpen.value = false
    deletingGroup.value = null
  }

  const handleGroupDeleteModalClose = () => {
    isGroupDeleteModalOpen.value = false
    deletingGroup.value = null
  }

  const openEditModal = (code: CodeItem) => {
    isEditMode.value = true
    editingCode.value = { ...code }
    isModalOpen.value = true
  }

  const handleModalClose = () => {
    isModalOpen.value = false
    editingCode.value = null
    modalErrorMessage.value = ''
  }

  /** 상세코드 폼 유효성 검사 */
  const validateCodeForm = (_form: Partial<CodeItem>): boolean => {
    if (isEmpty(selectedGroupCode.value)) {
      modalErrorMessage.value = '그룹코드를 선택해주세요.'
      return false
    }

    if (isEmpty(_form.codeId)) {
      modalErrorMessage.value = '코드를 입력해주세요.'
      return false
    }

    if (isEmpty(_form.codeNm)) {
      modalErrorMessage.value = '코드명을 입력해주세요.'
      return false
    }

    return true
  }

  /** 상세코드 저장 */
  const handleSaveCode = async (_form: Partial<CodeItem>) => {
    if (!validateCodeForm(_form)) return
    modalErrorMessage.value = ''
    try {
      errorMessage.value = ''
      isLoading.value = true
      await fetchSaveCode({ ..._form, codeGrpId: selectedGroupCode.value as string } as CodeItem)
      await handleFetchCodeList()
    } catch {
      errorMessage.value = '상세코드 저장에 실패했습니다.'
    } finally {
      isLoading.value = false
      handleModalClose()
    }
  }

  /** 상세코드 행 메뉴 선택 */
  const handleRowMenuSelect = (row: CodeItem, value: string) => {
    const code = row
    if (value === 'edit') {
      openEditModal(code)
    } else if (value === 'delete') {
      deletingCode.value = code
      isDeleteModalOpen.value = true
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCode.value) return
    // TODO: API 연결 시 삭제 API 호출
    console.warn('[TODO] handleDeleteConfirm — API 연결 필요', deletingCode.value)
    isDeleteModalOpen.value = false
    deletingCode.value = null
    await handleFetchCodeList()
  }

  const handleDeleteModalClose = () => {
    isDeleteModalOpen.value = false
    deletingCode.value = null
  }

  /** 정렬순서 변경 (드래그 후 API 호출) */
  const handleUpdateSortOrder = async () => {
    if (!selectedGroupCode.value || codeList.value.length === 0) return
    const items = codeList.value.map((item, index) => ({
      codeId: item.codeId,
      sortOrder: index + 1,
    }))
    try {
      // TODO: 실제 API 엔드포인트 확인 후 연결
      await fetchUpdateCodeSortOrder(selectedGroupCode.value, items)
      // 로컬 sortOrder 반영
      codeList.value.forEach((item, index) => {
        item.sortOrd = index + 1
      })
    } catch {
      errorMessage.value = '정렬순서 저장에 실패했습니다.'
      await handleFetchCodeList()
    }
  }

  return {
    codeGroupList,
    codeList,
    selectedGroupCode,
    searchKeyword,
    searchKeywordGroup,
    isLoading,
    errorMessage,
    modalErrorMessage,
    filteredList,
    filteredGroupList,
    codeGroupOptions,
    canDrag,
    codeGroupTableDataWithActions,
    tableData,
    isModalOpen,
    isEditMode,
    editingCode,
    isGroupModalOpen,
    isGroupEditMode,
    editingGroup,
    isGroupDeleteModalOpen,
    deletingGroup,
    isDeleteModalOpen,
    deletingCode,
    handleFetchCodeGroupList,
    handleFetchCodeList,
    handleGroupCodeChange,
    handleSelectGroup,
    openAddModal,
    openAddGroupModal,
    openEditGroupModal,
    handleGroupRowMenuSelect,
    handleGroupDeleteConfirm,
    handleGroupDeleteModalClose,
    openEditModal,
    handleModalClose,
    handleGroupModalClose,
    handleSaveGroup,
    handleSaveCode,
    handleRowMenuSelect,
    handleDeleteConfirm,
    handleDeleteModalClose,
    handleUpdateSortOrder,
  }
}
