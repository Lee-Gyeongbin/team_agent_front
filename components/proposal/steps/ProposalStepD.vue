<template>
  <div class="pt-stepD-layout">
    <!-- 좌측: 소목차 진행 리스트 -->
    <div class="pt-sec-list">
      <div
        v-for="(sec, idx) in sectionList"
        :key="sec.sectionId"
        :class="['pt-sec-item', `is-${sec.status}`]"
      >
        <span :class="['pt-sec-dot', `is-${sec.status}`]" />
        <span :class="['pt-sec-title', { 'is-bold': sec.status === 'active' }]"> {{ idx + 1 }}. {{ sec.title }} </span>
      </div>
      <UiEmpty
        v-if="sectionList.length === 0"
        title="소목차가 없습니다."
      />
    </div>

    <!-- 중앙: 현재 소목차 미리보기 -->
    <div
      v-if="activeSection"
      class="pt-gen-panel"
    >
      <div class="pt-gen-head">
        <div>
          <div class="pt-gen-title">{{ activeSection.title }}</div>
          <div class="pt-gen-sub">
            소목차 {{ activeSectionIndex + 1 }} / {{ sectionList.length }}
            <template v-if="currentSlides.length"> · {{ currentSlides.length }}장</template>
          </div>
        </div>
        <!-- 생성/재생성 버튼 -->
        <UiButton
          variant="outline"
          size="sm"
          :loading="isGenerating"
          @click="onGenerate"
        >
          <template #icon-left>
            <i class="icon-refresh size-14" />
          </template>
          {{ currentSlides.length ? '재생성' : '슬라이드 생성' }}
        </UiButton>
      </div>

      <!-- 생성 중 진행 표시 -->
      <div
        v-if="isGenerating"
        class="pt-gen-progress"
      >
        <div class="pt-gen-progress-bar" />
        <span class="pt-gen-progress-msg">{{ genProgressMsg || '생성 중...' }}</span>
      </div>

      <!-- 슬라이드 캐러셀 -->
      <div
        v-else-if="currentSlides.length"
        class="pt-slide-carousel"
      >
        <!-- 현재 슬라이드 미리보기 -->
        <div class="pt-slide-preview">
          <div
            v-if="activeSlide"
            class="pt-slide-mock"
            :class="`is-color-${activeSlide.colorIndex}`"
          >
            <!-- 렌더링된 이미지가 있으면 표시, 없으면 JSON 기반 목업 -->
            <img
              v-if="activeSlide.renderedImagePath"
              :src="activeSlide.renderedImagePath"
              class="pt-slide-img"
              :alt="`슬라이드 ${activeSlide.slideNo}`"
            />
            <template v-else>
              <div class="pt-slide-eyebrow">{{ activeSlideContent?.eyebrow ?? 'PREVIEW' }}</div>
              <div class="pt-slide-ttl">{{ activeSlideContent?.title ?? activeSection.title }}</div>
              <div
                v-if="activeSlideContent?.subtitle"
                class="pt-slide-sub"
              >
                {{ activeSlideContent.subtitle }}
              </div>
              <div class="pt-slide-bars"><i /><i /><i /></div>
              <!-- 실패 표시 -->
              <div
                v-if="activeSlide.renderStatusCd === '004'"
                class="pt-slide-fail"
              >
                렌더링 실패 — 재생성 버튼을 눌러주세요
              </div>
            </template>
          </div>
        </div>

        <!-- 썸네일 스트립 -->
        <div class="pt-slide-strip">
          <div
            v-for="(slide, idx) in currentSlides"
            :key="slide.slideId"
            :class="[
              'pt-slide-thumb',
              { 'is-active': idx === activeSlideIndex, 'is-fail': slide.renderStatusCd === '004' },
            ]"
            @click="activeSlideIndex = idx"
          >
            <span class="pt-slide-thumb-no">{{ slide.slideNo }}</span>
          </div>
        </div>
      </div>

      <!-- 슬라이드 미생성 상태 -->
      <div
        v-else
        class="pt-slide-empty"
      >
        <UiEmpty
          icon="icon-document"
          title="슬라이드를 생성하세요."
        />
      </div>

      <!-- 하단 액션 -->
      <div class="pt-gen-actions">
        <UiButton
          variant="ghost"
          size="md"
          :disabled="activeSectionIndex === 0"
          @click="emit('prev-section')"
        >
          <template #icon-left>
            <i class="icon-arrow-left size-14" />
          </template>
          이전 소목차
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          :disabled="!currentSlides.length || isGenerating"
          @click="onConfirm"
        >
          이 소목차 확인 · 다음 진행
          <template #icon-right>
            <i class="icon-arrow-right size-14" />
          </template>
        </UiButton>
      </div>
    </div>

    <!-- 우측: 소목차별 보완요청 채팅 -->
    <div
      v-if="activeSection"
      class="pt-chat-side"
    >
      <div class="pt-chat-head">💬 "{{ activeSection.title }}" 보완요청</div>
      <div
        ref="chatBodyRef"
        class="pt-chat-body"
      >
        <div
          v-for="(msg, idx) in currentMessages"
          :key="idx"
          :class="['pt-chat-msg', `is-${msg.role}`]"
        >
          {{ msg.text }}
        </div>
        <div
          v-if="isSending"
          class="pt-chat-msg is-ai pt-chat-typing"
        >
          <span /><span /><span />
        </div>
        <div
          v-if="!currentMessages.length && !isSending"
          class="pt-chat-hint"
        >
          예) 차별점을 구체적 수치로 강조해줘<br />예) 3번 슬라이드 제목을 더 강렬하게
        </div>
      </div>
      <div class="pt-chat-input">
        <input
          v-model="chatInput"
          class="pt-chat-input-field"
          placeholder="보완 요청을 입력하세요"
          :disabled="!currentSlides.length || isSending"
          @keydown.enter="onSendChat"
        />
        <UiButton
          variant="primary"
          size="sm"
          :loading="isSending"
          :disabled="!currentSlides.length"
          @click="onSendChat"
        >
          전송
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PtSection, PtSectionChatMessage, PtSlide, PtSlideContent, SectionGenDoneData } from '~/types/proposal'
import { useProposalSectionChat } from '~/composables/proposal/useProposalSectionChat'

interface Props {
  sectionList: PtSection[]
  activeSection: PtSection | null
  activeSectionIndex: number
  currentMessages: PtSectionChatMessage[]
  isSending: boolean
  isGenerating: boolean
  genProgressMsg: string
  /** 현재 활성 소목차의 슬라이드 목록 */
  currentSlides: PtSlide[]
  modelId: string
  agentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'prev-section': []
  'confirm-section': [sectionId: string]
  'send-chat': [text: string]
  'generate-section': [tocId: string]
  /** 채팅 재생성 후 슬라이드 갱신 */
  'slides-updated': [slides: PtSlide[]]
}>()

const chatInput = ref('')
const chatBodyRef = ref<HTMLElement | null>(null)

// 현재 보고 있는 슬라이드 인덱스
const activeSlideIndex = ref(0)

const activeSlide = computed<PtSlide | null>(() => props.currentSlides[activeSlideIndex.value] ?? null)

// 슬라이드 JSON 파싱 (목업 표시용)
const activeSlideContent = computed<PtSlideContent | null>(() => {
  if (!activeSlide.value?.slideJson) return null
  try {
    return JSON.parse(activeSlide.value.slideJson) as PtSlideContent
  } catch {
    return null
  }
})

// 소목차 전환 시 첫 슬라이드로 리셋
watch(
  () => props.activeSection?.tocId,
  () => {
    activeSlideIndex.value = 0
  },
)

// 메시지 추가 시 자동 스크롤
watch(
  () => props.currentMessages.length,
  async () => {
    await nextTick()
    if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  },
)

const onSendChat = () => {
  if (!chatInput.value.trim() || props.isSending) return
  emit('send-chat', chatInput.value.trim())
  chatInput.value = ''
}

const onGenerate = () => {
  if (!props.activeSection || props.isGenerating) return
  emit('generate-section', props.activeSection.tocId)
}

const onConfirm = () => {
  if (!props.activeSection) return
  emit('confirm-section', props.activeSection.sectionId)
}
</script>
