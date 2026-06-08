<template>
  <div class="my-documents-index">
    <Transition name="banner-slide-up">
      <MyDocNewBanner
        v-if="showBanner"
        :variant="bannerVariant"
        :new-doc-count="newDocCount"
        @close="onBannerClose"
      />
    </Transition>

    <div class="my-doc-body l-center">
      <MyDocHeader
        v-model:search-keyword="searchKeyword"
        v-model:search-sort="searchSort"
        :total-count="docList.length"
        :sort-options="sortOptions"
        @search="onSearch"
        @sort-change="onFetchList"
      />

      <MyDocGrid
        :docs="docList"
        :selected-doc-id="selectedDocId"
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

    <!-- 공유 대상 사용자 선택 모달 (카드 드롭다운·상세 모달 공통) -->
    <UserSelectModal
      :is-open="isUserSelectModalOpen"
      title="공유 대상 선택"
      confirm-text="공유하기"
      @close="onCloseUserSelectModal"
      @confirm="handleShareMyDoc"
    />
  </div>
</template>

<script setup lang="ts">
import { useMyDocStore } from '~/composables/my-documents/useMyDocStore'
import { useUserSelectStore } from '~/composables/com/useUserSelectStore'
import type { MyDoc, MyDocListRequest } from '~/types/mydoc'

definePageMeta({ layout: 'default' })

const {
  docList,
  selectedDocDetail,
  isDetailModalOpen,
  handleSelectMyDocList,
  handleSelectMyDocDetail,
  handleCloseMyDocDetailModal,
  handleRenameMyDoc,
  handleDeleteMyDoc,
  handleOpenMyDocShareModal,
  handleCloseMyDocShareModal,
  handleShareMyDoc,
} = useMyDocStore()

const { isUserSelectModalOpen } = useUserSelectStore()
const { hasPendingMdNotify } = useNotifyStore()

const searchKeyword = ref('')
const appliedKeyword = ref('')
const searchSort = ref('latest')
const selectedDocId = ref<string | null>(null)
const isMdBannerDismissed = ref(false)
const isNewBannerDismissed = ref(false)
const isRenameModalOpen = ref(false)
const renamingDoc = ref<MyDoc | null>(null)

const sortOptions = [
  { label: '최신순', value: 'latest' },
  { label: '오래된순', value: 'oldest' },
  { label: '이름순', value: 'name' },
]

const newDocCount = computed(() => docList.value.filter((d) => d.newYn === 'Y').length)

const hasNewDocs = computed(() => newDocCount.value > 0)

/** MD 공유 알림 배너 — 신규 문서 배너보다 우선 표시 (library KS 배너와 동일 패턴) */
const showMdShareBanner = computed(() => hasPendingMdNotify.value && !isMdBannerDismissed.value)
const showNewDocBanner = computed(() => !showMdShareBanner.value && hasNewDocs.value && !isNewBannerDismissed.value)
const showBanner = computed(() => showMdShareBanner.value || showNewDocBanner.value)
const bannerVariant = computed(() => (showMdShareBanner.value ? 'md-share' : 'new'))

const onBannerClose = () => {
  if (bannerVariant.value === 'md-share') {
    isMdBannerDismissed.value = true
    return
  }
  isNewBannerDismissed.value = true
}

const emptyTitle = computed(() => {
  if (appliedKeyword.value.trim()) return '검색 결과가 없습니다.'
  return '저장된 문서가 없습니다.'
})

const emptyDescription = computed(() => {
  if (appliedKeyword.value.trim()) return '다른 검색어로 시도해 보세요.'
  return '지식창고에서 AI 보고서를 만들고 「내 문서에 저장」하면 이곳에 모여요.'
})

const getListFetchParams = (): MyDocListRequest => ({
  searchDocNm: appliedKeyword.value,
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
  handleCloseMyDocShareModal()
  handleCloseMyDocDetailModal()
}

const onCloseUserSelectModal = () => {
  handleCloseMyDocShareModal()
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

const onDeleteDoc = async (doc: MyDoc) => {
  const ok = await handleDeleteMyDoc(doc.docId)
  if (ok && selectedDocId.value === doc.docId) {
    selectedDocId.value = null
  }
}

const onDocMenuSelect = async (doc: MyDoc, action: string) => {
  if (action === 'open') {
    onOpenDoc(doc)
    return
  }
  if (action === 'rename') {
    renamingDoc.value = doc
    isRenameModalOpen.value = true
    return
  }
  if (action === 'share') {
    await handleOpenMyDocShareModal(doc.docId)
    return
  }
  if (action === 'delete') {
    await onDeleteDoc(doc)
  }
}

onMounted(() => {
  onFetchList()
})
</script>
