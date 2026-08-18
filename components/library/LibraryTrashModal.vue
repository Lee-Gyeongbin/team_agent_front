<template>
  <UiDrawer
    :open="isOpen"
    position="right"
    width="680px"
    :confirm-before-close="false"
    :show-fullscreen="false"
    :show-resize="false"
    :resizable="false"
    @update:open="(v) => !v && handleClose()"
  >
    <!-- SCSS 루트 .library-trash-modal 하위 셀렉터가 먹도록 헤더+본문을 한 래퍼로 감쌈 -->
    <div class="library-trash-modal">
      <div class="library-trash-modal-header">
        <div class="header-top-grp flex items-start justify-between">
          <h2 class="library-trash-modal-title">휴지통</h2>
          <button
            class="btn btn-modal-close"
            @click="handleClose"
          >
            <i class="icon icon-close-gray size-20"></i>
          </button>
        </div>
        <div class="library-trash-modal-search">
          <UiInput
            v-model="trashFilterTitle"
            type="search"
            placeholder="검색어를 입력하세요"
          />
          <button
            class="btn btn-empty-trash"
            @click="onEmptyTrash"
          >
            <i class="icon icon-trash-reset size-16"></i>
            <span>휴지통 비우기</span>
          </button>
        </div>
      </div>

      <div
        ref="bodyRef"
        class="library-trash-modal-body"
        @scroll="handleScroll"
      >
        <div
          v-for="(item, index) in filteredTrashCardList"
          :key="item.cardId"
          class="library-trash-card"
          :class="{ 'is-show': expandedCards[index] }"
        >
          <div
            class="library-trash-card-content flex justify-between items-center gap-8"
            @click="toggleCard(index)"
          >
            <div>
              <div class="library-trash-card-badges flex flex-wrap gap-4">
                <UiBadge
                  v-if="item.svcTy === 'C' || item.agentId"
                  variant="default"
                  :color-hex="item.svcTy === 'C' ? '#ac5e00' : item.colorHex"
                >
                  <template #icon-left>
                    <i :class="`icon ${item.svcTy === 'C' ? 'icon-comment-other' : item.iconClassNm} size-14`"></i>
                  </template>
                  {{ item.svcTy === 'C' ? '기본대화' : item.agentNm }}
                </UiBadge>
              </div>
              <h3 class="library-trash-card-title">{{ item.title }}</h3>
              <p class="library-trash-card-date">삭제일 {{ item.modifyDt }}</p>
            </div>

            <UiButton
              variant="outline"
              size="sm"
              class="btn-library-trash-card-action"
              @click.stop
              @click="onRestore(item)"
            >
              복원
            </UiButton>
          </div>

          <div class="library-trash-card-body">
            <div class="content-box type-question">
              <LibraryCardQuestionBody :item="item" />
            </div>
            <div class="content-box type-response">
              <LibraryCardResponseBody :item="item" />
            </div>
          </div>
        </div>
      </div>

      <button
        class="btn btn-modal-top"
        :class="{ 'is-show': isScrolled }"
        @click="handleScrollToTop"
      >
        <i class="icon icon-arrow-down size-20"></i>
      </button>
    </div>
  </UiDrawer>
</template>

<script setup lang="ts">
import { UiDrawer, UiInput, UiBadge, UiButton } from '@leechanyong/ispark-ui'
import type { LibraryCardDetail } from '~/types/library'

const { trashCardList } = useLibraryStore()

interface Props {
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<{
  close: []
  restore: [card: LibraryCardDetail]
  emptyTrash: []
}>()

const expandedCards = ref<Record<number, boolean>>({})
const trashFilterTitle = ref('')

const filteredTrashCardList = computed(() => {
  const keyword = trashFilterTitle.value.trim().toLowerCase()
  if (!keyword) return trashCardList.value
  return trashCardList.value.filter((item) => {
    const title = (item.title ?? '').toLowerCase()
    const qcontent = (item.qcontent ?? '').toLowerCase()
    return title.includes(keyword) || qcontent.includes(keyword)
  })
})

const bodyRef = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

const isModalTopBtnShown = computed(() => props.isOpen && isScrolled.value)
useModalTopBtnSync(isModalTopBtnShown)

const handleScroll = () => {
  if (!bodyRef.value) return
  isScrolled.value = bodyRef.value.scrollTop > 50
}

const handleScrollToTop = () => {
  if (!bodyRef.value) return
  bodyRef.value.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const toggleCard = (index: number) => {
  expandedCards.value[index] = !expandedCards.value[index]
}

const handleClose = () => {
  trashFilterTitle.value = ''
  emit('close')
}

const onRestore = (item: LibraryCardDetail) => {
  trashFilterTitle.value = ''
  emit('restore', item)
}

const onEmptyTrash = () => {
  trashFilterTitle.value = ''
  emit('emptyTrash')
}
</script>
