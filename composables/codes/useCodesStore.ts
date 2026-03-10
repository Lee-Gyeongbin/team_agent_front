import type { CodeGroupItem, CodeItem } from '~/types/codes'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { useCodesApi } from '~/composables/codes/useCodesApi'
const { fetchCodeGroupList, fetchSaveCodeGroup, fetchUpdateCodeSortOrder } = useCodesApi()

/**
 *
 * @returns
 */
const createDummyGroupList = (): CodeGroupItem[] => [
  {
    codeGrpId: 'USER_TYPE',
    codeGrpNm: '사용자 유형',
    description: '시스템 사용자 유형 구분',
    useYn: 'Y',
    createDt: '2026-01-01',
  },
  { codeGrpId: 'STATUS', codeGrpNm: '상태', description: '공통 상태 코드', useYn: 'Y', createDt: '2026-01-01' },
  {
    codeGrpId: 'NOTICE_TYPE',
    codeGrpNm: '공지 유형',
    description: '공지사항 유형 구분',
    useYn: 'Y',
    createDt: '2026-01-01',
  },
]

const createDummyCodeList = (codeGrpId: string): CodeItem[] => {
  const map: Record<string, CodeItem[]> = {
    USER_TYPE: [
      { codeId: '1', codeGrpId: 'USER_TYPE', codeNm: '관리자', sortOrd: 1, useYn: 'Y', description: '' },
      { codeId: '2', codeGrpId: 'USER_TYPE', codeNm: '일반사용자', sortOrd: 2, useYn: 'Y', description: '' },
      { codeId: '3', codeGrpId: 'USER_TYPE', codeNm: '게스트', sortOrd: 3, useYn: 'N', description: '비활성화 예정' },
    ],
    STATUS: [
      { codeId: '4', codeGrpId: 'STATUS', codeNm: '활성', sortOrd: 1, useYn: 'Y', description: '' },
      { codeId: '5', codeGrpId: 'STATUS', codeNm: '비활성', sortOrd: 2, useYn: 'Y', description: '' },
      { codeId: '6', codeGrpId: 'STATUS', codeNm: '대기', sortOrd: 3, useYn: 'Y', description: '' },
    ],
    NOTICE_TYPE: [
      { codeId: '7', codeGrpId: 'NOTICE_TYPE', codeNm: '일반', sortOrd: 1, useYn: 'Y', description: '' },
      { codeId: '8', codeGrpId: 'NOTICE_TYPE', codeNm: '중요', sortOrd: 2, useYn: 'Y', description: '' },
    ],
  }
  return map[codeGrpId] ?? []
}

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

export const useCodesStore = () => {
  const codeGroupList = ref<CodeGroupItem[]>(createDummyGroupList())
  const codeList = ref<CodeItem[]>([])
  const selectedGroupCode = ref('')
  const searchKeyword = ref('')
  const searchKeywordGroup = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')

  // 모달 상태
  const isModalOpen = ref(false)
  const isEditMode = ref(false)
  const editingCode = ref<CodeItem | null>(null)

  // 그룹 추가/수정 모달
  const isGroupModalOpen = ref(false)
  const isGroupEditMode = ref(false)
  const editingGroup = ref<CodeGroupItem | null>(null)

  // 그룹 삭제 확인 모달
  const isGroupDeleteModalOpen = ref(false)
  const deletingGroup = ref<CodeGroupItem | null>(null)

  // 삭제 확인 모달
  const isDeleteModalOpen = ref(false)
  const deletingCode = ref<CodeItem | null>(null)

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
        // await handleFetchCodeList()
      }
    } catch {
      errorMessage.value = '그룹코드 목록을 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  const handleFetchCodeList = async () => {
    if (!selectedGroupCode.value) {
      codeList.value = []
      return
    }
    errorMessage.value = ''
    isLoading.value = true
    try {
      // TODO: API 연결 시 fetchCodeList(selectedGroupCode) 호출
      codeList.value = createDummyCodeList(selectedGroupCode.value)
    } catch {
      errorMessage.value = '상세코드 목록을 불러오는데 실패했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  const handleGroupCodeChange = () => {
    handleFetchCodeList()
  }

  /** 그룹 행 클릭 시 선택 및 상세코드 로드 */
  const handleSelectGroup = (group: CodeGroupItem) => {
    selectedGroupCode.value = group.codeGrpId
    handleFetchCodeList()
  }

  const openAddModal = () => {
    isEditMode.value = false
    editingCode.value = null
    isModalOpen.value = true
  }

  const openAddGroupModal = () => {
    isGroupEditMode.value = false
    editingGroup.value = null
    isGroupModalOpen.value = true
  }

  const openEditGroupModal = (group: CodeGroupItem) => {
    isGroupEditMode.value = true
    editingGroup.value = { ...group }
    isGroupModalOpen.value = true
  }

  const handleGroupModalClose = () => {
    isGroupModalOpen.value = false
    editingGroup.value = null
  }

  const handleSaveGroup = async (_form: Partial<CodeGroupItem>) => {
    // TODO: API 연결 시 그룹 저장 API 호출
    console.warn('[TODO] handleSaveGroup — API 연결 필요', _form)
    if (isGroupEditMode.value && editingGroup.value) {
      codeGroupList.value = codeGroupList.value.map((g) =>
        g.codeGrpId === editingGroup.value!.codeGrpId
          ? {
              ...g,
              codeGrpNm: _form.codeGrpNm ?? g.codeGrpNm,
              description: _form.description ?? g.description,
              useYn: _form.useYn ?? g.useYn,
            }
          : g,
      )
    } else {
      const newGroup: CodeGroupItem = {
        codeGrpId: _form.codeGrpId ?? '',
        codeGrpNm: _form.codeGrpNm ?? '',
        description: _form.description ?? '',
        useYn: _form.useYn ?? 'Y',
        createDt: new Date().toISOString().slice(0, 10),
      }
      codeGroupList.value = [...codeGroupList.value, newGroup]
    }
    handleGroupModalClose()
  }

  const handleGroupRowMenuSelect = (row: Record<string, any>, value: string) => {
    const group = row as CodeGroupItem
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
  }

  const handleSaveCode = async (_form: Partial<CodeItem>) => {
    // TODO: API 연결 시 저장 API 호출
    console.warn('[TODO] handleSaveCode — API 연결 필요', _form)
    handleModalClose()
    await handleFetchCodeList()
  }

  const handleRowMenuSelect = (row: Record<string, any>, value: string) => {
    const code = row as CodeItem
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
