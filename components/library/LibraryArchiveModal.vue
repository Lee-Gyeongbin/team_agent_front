<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :show-close="false"
    custom-class="library-archive-modal"
    @close="handleClose"
  >
    <!-- 커스텀 헤더 -->
    <template #header>
      <div class="library-archive-modal-header">
        <div class="header-top-grp flex items-start justify-between">
          <h2 class="library-archive-modal-title">보관함</h2>

          <!-- 닫기 버튼 -->
          <button
            class="btn btn-modal-close"
            @click="handleClose"
          >
            <i class="icon icon-close-gray size-20"></i>
          </button>
        </div>

        <!-- 검색바 -->
        <div class="library-archive-modal-search">
          <UiInput
            v-model="archiveFilterTitle"
            type="search"
            placeholder="검색어를 입력하세요"
          />
        </div>
      </div>
    </template>

    <!-- 보관된 아이템 리스트 -->
    <div
      ref="bodyRef"
      class="library-archive-modal-body"
      @scroll="handleScroll"
    >
      <div
        v-for="(item, index) in filteredArchiveCardList"
        :key="index"
        class="library-archive-card"
        :class="{ 'is-show': expandedCards[index] }"
      >
        <div
          class="library-archive-card-content flex justify-between items-center gap-8"
          @click="toggleCard(index)"
        >
          <div>
            <!-- 태그 영역 -->
            <div class="library-archive-card-badges flex flex-wrap gap-4">
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
            <h3 class="library-archive-card-title">{{ item.title }}</h3>
            <!-- 보관일 -->
            <p class="library-archive-card-date">보관일 {{ item.archiveDt }}</p>
          </div>

          <!-- 보관해제 버튼 -->
          <UiButton
            variant="outline"
            size="sm"
            class="btn-library-archive-card-action"
            @click.stop
            @click="onUnarchive(item)"
          >
            보관해제
          </UiButton>
        </div>

        <div class="library-archive-card-body">
          <!-- 사용자 질문 -->
          <div class="content-box type-question">
            <ChatPsychologySurvey
              v-if="isPsychologySurveyCard(item)"
              class="library-archive-survey-readonly"
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
const { archiveCardList } = useLibraryStore()

interface Props {
  isOpen?: boolean
}

withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<{
  close: []
  unarchive: [card: LibraryCardDetail]
}>()

// 카드 확장 상태 관리
const expandedCards = ref<Record<number, boolean>>({})
const archiveFilterTitle = ref('')

const filteredArchiveCardList = computed(() => {
  const keyword = archiveFilterTitle.value.trim().toLowerCase()
  if (!keyword) return archiveCardList.value
  return archiveCardList.value.filter((item) => {
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
  archiveFilterTitle.value = ''
  emit('close')
}

const onUnarchive = (item: LibraryCardDetail) => {
  archiveFilterTitle.value = ''
  emit('unarchive', item)
}
</script>

<style lang="scss" scoped>
.library-archive-survey-readonly {
  width: 100%;
  max-width: 100%;
  max-height: min(560px, calc(100vh - 280px));
  overflow: hidden;
}
</style>
