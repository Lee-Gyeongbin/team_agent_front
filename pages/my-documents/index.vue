<template>
  <div class="my-documents-index">
    <Transition name="banner-slide-up">
      <MyDocNewBanner
        v-if="hasNewDocs && !isNewBannerDismissed && listFilter === 'saved'"
        :new-doc-count="newDocCount"
        @close="isNewBannerDismissed = true"
      />
    </Transition>

    <div class="my-doc-body l-center">
      <MyDocHeader
        v-model:search-keyword="searchKeyword"
        v-model:search-sort="searchSort"
        :total-count="displayDocList.length"
        :sort-options="sortOptions"
        @search="onSearch"
        @sort-change="onFetchList"
      />

      <MyDocGrid
        :docs="displayDocList"
        :selected-doc-id="selectedDocId"
        :list-filter="listFilter"
        :empty-title="emptyTitle"
        :empty-description="emptyDescription"
        @open-doc="onOpenDoc"
        @menu-select="onDocMenuSelect"
      />
    </div>

    <MyDocDetailModal
      :is-open="isDetailModalOpen"
      :doc="selectedDocDetail"
      @close="onCloseDetailModal"
    />

    <UiModal
      :is-open="isRenameModalOpen"
      title="문서명 변경"
      position="center"
      max-width="420px"
      @close="onCloseRenameModal"
    >
      <MyDocRenameModal
        :doc="renamingDoc"
        @save="onSaveRename"
        @close="onCloseRenameModal"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { useMyDocStore } from '~/composables/my-documents/useMyDocStore'
import type { MyDoc, MyDocListRequest } from '~/types/mydoc'

definePageMeta({ layout: 'default' })

type ListFilter = 'saved' | 'archived'

const {
  docList,
  archivedDocList,
  selectedDocDetail,
  isDetailModalOpen,
  handleSelectMyDocList,
  handleSelectMyDocDetail,
  handleCloseMyDocDetailModal,
  handleRenameMyDoc,
} = useMyDocStore()

const searchKeyword = ref('')
const appliedKeyword = ref('')
const searchSort = ref('latest')
const listFilter = ref<ListFilter>('saved')
const selectedDocId = ref<string | null>(null)
const isNewBannerDismissed = ref(false)
const isRenameModalOpen = ref(false)
const renamingDoc = ref<MyDoc | null>(null)

const sortOptions = [
  { label: '최신순', value: 'latest' },
  { label: '오래된순', value: 'oldest' },
  { label: '이름순', value: 'name' },
]

const displayDocList = computed(() => (listFilter.value === 'archived' ? archivedDocList.value : docList.value))

const newDocCount = computed(() => docList.value.filter((d) => d.newYn === 'Y').length)

const hasNewDocs = computed(() => newDocCount.value > 0)

const emptyTitle = computed(() => {
  if (listFilter.value === 'archived') return '보관된 문서가 없습니다.'
  if (appliedKeyword.value.trim()) return '검색 결과가 없습니다.'
  return '저장된 문서가 없습니다.'
})

const emptyDescription = computed(() => {
  if (listFilter.value === 'archived') return '보관한 문서는 여기에서 다시 꺼낼 수 있어요.'
  if (appliedKeyword.value.trim()) return '다른 검색어로 시도해 보세요.'
  return '지식창고에서 AI 보고서를 만들고 「내 문서에 저장」하면 이곳에 모여요.'
})

const getListFetchParams = (): MyDocListRequest => ({
  searchDocNm: appliedKeyword.value,
  docStatus: listFilter.value === 'archived' ? 'ARCHIVED' : 'SAVED',
  svcTy: '',
  searchSort: searchSort.value,
})

const onFetchList = async () => {
  await handleSelectMyDocList(getListFetchParams())
}

const onSearch = () => {
  appliedKeyword.value = searchKeyword.value
  onFetchList()
}

const onOpenDoc = async (doc: MyDoc) => {
  selectedDocId.value = doc.docId
  await handleSelectMyDocDetail(doc.docId)
}

const onCloseDetailModal = () => {
  selectedDocId.value = null
  handleCloseMyDocDetailModal()
}

const onCloseRenameModal = () => {
  isRenameModalOpen.value = false
  renamingDoc.value = null
}

const onSaveRename = async (docNm: string) => {
  const doc = renamingDoc.value
  if (!doc) return

  const ok = await handleRenameMyDoc(doc.docId, docNm)
  if (ok) {
    onCloseRenameModal()
  }
}

const onDocMenuSelect = (doc: MyDoc, action: string) => {
  if (action === 'open') {
    onOpenDoc(doc)
    return
  }
  if (action === 'rename') {
    renamingDoc.value = doc
    isRenameModalOpen.value = true
    return
  }
  openToast({ message: `「${doc.docNm}」 ${action} — API 연동 예정입니다.`, type: 'info' })
}

onMounted(() => {
  onFetchList()
})
</script>
