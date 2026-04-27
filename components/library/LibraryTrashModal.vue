<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :show-close="false"
    custom-class="library-trash-modal"
    @close="handleClose"
  >
    <!-- 커스텀 헤더 -->
    <template #header>
      <div class="library-trash-modal-header">
        <div class="header-top-grp flex items-start justify-between">
          <h2 class="library-trash-modal-title">휴지통</h2>
          <!-- 닫기 버튼 -->
          <button
            class="btn btn-modal-close"
            @click="handleClose"
          >
            <i class="icon icon-close-gray size-20"></i>
          </button>
        </div>

        <!-- 검색바 + 휴지통 비우기 -->
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
    </template>

    <!-- 삭제된 아이템 리스트 -->
    <div
      ref="bodyRef"
      class="library-trash-modal-body"
      @scroll="handleScroll"
    >
      <div
        v-for="(item, index) in filteredTrashCardList"
        :key="index"
        class="library-trash-card"
        :class="{ 'is-show': expandedCards[index] }"
      >
        <div
          class="library-trash-card-content flex justify-between items-center gap-8"
          @click="toggleCard(index)"
        >
          <div>
            <!-- 태그 영역 -->
            <div class="library-trash-card-badges flex flex-wrap gap-4">
              <UiBadge
                v-if="item.svcTy === 'C' || item.agentId"
                :variant="item.svcTy === 'C' ? 'basic-chat' : 'default'"
                :color-hex="item.svcTy === 'C' ? '' : item.colorHex"
              >
                <template #icon-left>
                  <i :class="`icon ${item.svcTy === 'C' ? 'icon-comment-other' : item.iconClassNm} size-14`"></i>
                </template>
                {{ item.svcTy === 'C' ? '기본대화' : item.agentNm }}
              </UiBadge>
            </div>
            <!-- 제목 -->
            <h3 class="library-trash-card-title">{{ item.title }}</h3>
            <!-- 삭제일 -->
            <p class="library-trash-card-date">삭제일 {{ item.modifyDt }}</p>
          </div>

          <!-- 복원 버튼 -->
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
          <!-- 사용자 질문 -->
          <div class="content-box type-question">
            <ChatPsychologySurvey
              v-if="isPsychologySurveyCard(item)"
              class="library-trash-survey-readonly"
              readonly
              :initial-answers="parseSurveyAnswersFromPrompt(item.qcontent ?? '')"
              :theme-icon-class-nm="item.iconClassNm ?? ''"
              :theme-color-hex="item.colorHex ?? ''"
            />
            <p v-else>{{ item.qcontent }}</p>
          </div>

          <!-- 시스템 응답 -->
          <div class="content-box type-response">
            <ChatLunchAgentCard
              v-if="parseLunchRecommendations(item.rcontent ?? '').length"
              :recommendations="parseLunchRecommendations(item.rcontent ?? '')"
            />
            <!-- eslint-disable vue/no-v-html — toHtmlContent 내 안전 처리 적용 -->
            <div
              v-else
              class="message-content markdown-body"
              v-html="toHtmlContent(item.rcontent ?? '')"
            ></div>
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </div>
      </div>
    </div>

    <!-- 탑 버튼 -->
    <button
      class="btn btn-modal-top"
      :class="{ 'is-show': isScrolled }"
      @click="handleScrollToTop"
    >
      <i class="icon icon-arrow-down size-20"></i>
    </button>
  </UiModal>
</template>

<script setup lang="ts">
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import { parseSurveyAnswersFromPrompt } from '~/utils/chat/psychologyConsultUtil'
import type { LunchRecommendationItem } from '~/types/chat'
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

// 카드 확장 상태 관리
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

const isPsychologySurveyCard = (item: LibraryCardDetail) => item.agentId === 'AG000010'
const parseLunchRecommendations = (raw: string): LunchRecommendationItem[] => {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as LunchRecommendationItem[]
  } catch {
    return []
  }
}

// 스크롤 상태
const bodyRef = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

// 스크롤 이벤트 핸들러
const handleScroll = () => {
  if (!bodyRef.value) return
  isScrolled.value = bodyRef.value.scrollTop > 50
}

// 탑 버튼 클릭 핸들러
const handleScrollToTop = () => {
  if (!bodyRef.value) return
  bodyRef.value.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// 카드 토글 핸들러
const toggleCard = (index: number) => {
  expandedCards.value[index] = !expandedCards.value[index]
}

// 이벤트 핸들러
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

<style lang="scss" scoped>
.library-trash-survey-readonly {
  width: 100%;
  max-width: 100%;
  max-height: min(560px, calc(100vh - 280px));
  overflow: hidden;
}
</style>
