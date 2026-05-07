<template>
  <div
    class="chat-message-item"
    :class="message.type === 'answer' ? 'role-assistant' : message.type === 'survey' ? 'role-survey' : 'role-user'"
  >
    <!-- assistant 메시지 -->
    <template v-if="message.type === 'answer'">
      <div
        class="avatar"
        :class="{ 'is-streaming': message.isStreaming }"
      >
        <i class="icon-bot size-24"></i>
      </div>
      <div class="message-body">
        <div
          v-if="message.isStreaming && !message.rContent"
          class="message-loading"
        >
          <span class="typing-dot" /><span class="typing-dot" /><span class="typing-dot" />
        </div>
        <template v-else>
          <ChatLunchAgentCard
            v-if="message.uiType === 'lunch-card'"
            :readonly="message.lunchSubmitted === true"
            :initial-payload="message.lunchFormPayload"
            :theme-icon-class-nm="surveyThemeAgent?.iconClassNm ?? ''"
            :theme-color-hex="surveyThemeAgent?.colorHex ?? ''"
            @submit="emit('on-submit-lunch-card', message.logId, $event)"
            @close="emit('on-lunch-card-close', message.logId)"
          />
          <ChatLunchAgentCard
            v-else-if="parsedLunchRecommendations.length"
            :readonly="true"
            :initial-payload="message.lunchFormPayload"
            :recommendations="parsedLunchRecommendations"
            :theme-icon-class-nm="surveyThemeAgent?.iconClassNm ?? ''"
            :theme-color-hex="surveyThemeAgent?.colorHex ?? ''"
            @submit="emit('on-submit-lunch-card', message.logId, $event)"
            @close="emit('on-lunch-card-close', message.logId)"
          />
          <!-- eslint-disable vue/no-v-html — toHtmlContent 내 안전 처리 적용 -->
          <!-- AG000010 스트리밍 중 마커 발견: 스피너를 Vue 요소로 분리해 DOM 유지 -->
          <template v-else-if="message.agentId === 'AG000010' && streamingSpinnerVisible">
            <div
              class="message-content markdown-body"
              @click="onMarkdownClick"
              v-html="streamingBeforeHtml"
            />
            <div class="pexels-loading">
              <div class="pexels-loading__spinner" />
            </div>
            <div
              class="message-content markdown-body"
              @click="onMarkdownClick"
              v-html="streamingAfterHtml"
            />
          </template>
          <div
            v-else
            class="message-content markdown-body"
            @click="onMarkdownClick"
            v-html="renderedHtml"
          />
          <!-- eslint-enable vue/no-v-html -->
          <ul
            v-if="message.uiType !== 'lunch-card' && message.groundingSources?.length"
            class="message-grounding-sources"
          >
            <li
              v-for="(src, idx) in message.groundingSources"
              :key="`${src.url}-${idx}`"
            >
              <a
                :href="src.url"
                target="_blank"
                rel="noopener noreferrer"
                >{{ getSourceLabel(src.title, src.url) }}</a
              >
            </li>
          </ul>
        </template>
        <!-- 액션 + 패널 버튼 (한 줄) -->
        <div
          v-if="!message.isStreaming && message.uiType !== 'lunch-card'"
          class="message-footer"
        >
          <!-- 라이브러리 카테고리: Actions는 value만 알 수 있어 logId는 여기서 묶어 상위로 전달 -->
          <ChatMessageActions
            :chat-log-reaction="message.chatLogReaction"
            :knowledge-list="knowledgeList"
            :is-share="isShare"
            @on-copy="emit('on-copy', message.logId)"
            @on-like="emit('on-like', message.logId)"
            @on-dislike="emit('on-dislike', message.logId)"
            @on-regenerate="emit('on-regenerate', message.logId)"
            @on-select-category="onSelectCategoryFromActions"
          />
          <div
            v-if="message.hasSource || message.hasVisualization"
            class="message-panel-buttons"
          >
            <UiButton
              v-show="message.hasSource"
              variant="primary-dark"
              @click="emit('on-view-source', message.logId)"
            >
              원본보기
              <template #icon-right>
                <i class="icon-arrow-right size-20"></i>
              </template>
            </UiButton>
            <UiButton
              v-show="message.hasVisualization"
              variant="primary-dark"
              @click="emit('on-view-visualization', message.logId)"
            >
              시각화 보기
              <template #icon-right>
                <i class="icon-arrow-right size-20"></i>
              </template>
            </UiButton>
          </div>
        </div>
      </div>
    </template>

    <!-- user 메시지 -->
    <template v-else-if="message.type === 'question'">
      <div class="message-body">
        <div
          v-if="message.attachments?.length || message.qContent?.trim()"
          class="message-user-block"
        >
          <ChatQuestionAttachments
            v-if="message.attachments?.length"
            :attachments="message.attachments"
          />
          <div
            v-if="message.qContent?.trim()"
            class="message-content"
          >
            {{ message.qContent }}
          </div>
        </div>
      </div>
    </template>

    <!-- 설문 메시지 (산업심리 상담 에이전트) -->
    <template v-else-if="message.type === 'survey'">
      <ChatPsychologySurvey
        :readonly="message.surveySubmitted === true"
        :initial-answers="message.surveyAnswers"
        :theme-icon-class-nm="surveyThemeAgent?.iconClassNm ?? ''"
        :theme-color-hex="surveyThemeAgent?.colorHex ?? ''"
        @close="emit('on-survey-close', message.logId)"
        @submit="emit('on-survey-submit', message.logId)"
      />
    </template>
  </div>

  <!-- Pexels 이미지 원본 확대 모달 -->
  <Teleport to="body">
    <Transition name="pexels-modal">
      <div
        v-if="pexelsModalUrl"
        class="pexels-modal"
        @click.self="pexelsModalUrl = ''"
      >
        <button
          class="pexels-modal__close"
          @click="pexelsModalUrl = ''"
        >
          <i class="icon-close size-20"></i>
        </button>
        <img
          class="pexels-modal__img"
          :src="pexelsModalUrl"
          alt="확대 이미지"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ChatMessage, KnowledgeItem, LunchAgentFormPayload, LunchRecommendationItem } from '~/types/chat'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import type { Agent } from '~/types/agent'
import {
  fetchAndInjectPexelsImages,
  extractKeywordSection,
  PEXELS_LOADING_HTML,
  extractAiImageMarkerSection,
  AI_IMAGE_LOADING_HTML,
  extractSections1to4,
  fetchPsychologyAiImage,
  getAiImageCache,
  setAiImageCache,
} from '~/utils/chat/psychologyConsultUtil'

const { chatIndexAgents } = useChatStore()

interface Props {
  message: ChatMessage
  knowledgeList?: KnowledgeItem[]
  isShare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  knowledgeList: undefined,
  isShare: false,
})

const emit = defineEmits<{
  'on-copy': [id: string]
  'on-like': [id: string]
  'on-dislike': [id: string]
  'on-regenerate': [id: string]
  /** [답변 logId, categoryId, categoryNm] */
  'on-select-category': [id: string, categoryValue: string, categoryNm: string]
  'on-view-source': [id: string]
  'on-view-visualization': [id: string]
  'on-submit-lunch-card': [logId: string, payload: LunchAgentFormPayload]
  'on-lunch-card-close': [logId: string]
  'on-survey-submit': [logId: string]
  'on-survey-close': [logId: string]
}>()

// ── 공통 ──────────────────────────────────────────────────────────────────
const renderedHtml = ref('')
const pexelsModalUrl = ref('')

const onMarkdownClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (
    target.tagName === 'IMG' &&
    (target.classList.contains('pexels-img') || target.classList.contains('psychology-ai-image'))
  ) {
    pexelsModalUrl.value = (target as HTMLImageElement).dataset.full ?? (target as HTMLImageElement).src
  }
}

// ── AG000010 렌더 상태 ────────────────────────────────────────────────────
let markerSplit: { before: string; after: string; found: boolean } | null = null
let aiImageHtml = ''
let pexelsSplit: { beforeKw: string; gridHtml: string; afterKw: string } | null = null
let pexelsFetchDone = false
let aiImageFetchDone = false

// 스트리밍 중 마커 발견: 스피너를 Vue 요소로 분리해 DOM 재생성·애니메이션 리셋 방지
const streamingSpinnerVisible = ref(false)
const streamingBeforeHtml = ref('')
const streamingAfterHtml = ref('')

const toAiImgTag = (src: string) =>
  `<img class="psychology-ai-image" src="${src}" data-full="${src}" alt="AI 생성 심리 이미지">`

const rebuildPsychHtml = () => {
  if (!markerSplit || !pexelsSplit) return
  const { before, found } = markerSplit
  const { beforeKw, gridHtml, afterKw } = pexelsSplit
  const pexelsSection = toHtmlContent(beforeKw) + gridHtml + toHtmlContent(afterKw)
  renderedHtml.value = found ? toHtmlContent(before) + aiImageHtml + pexelsSection : pexelsSection
}

watch(
  () => [props.message.rContent, props.message.agentId, props.message.isStreaming] as const,
  ([rContent, agentId, isStreaming]) => {
    const raw = rContent ?? ''

    if (agentId !== 'AG000010') {
      renderedHtml.value = toHtmlContent(raw)
      return
    }

    // 스트리밍 중: before/after ref를 독립 갱신해 스피너 DOM 유지
    if (isStreaming) {
      const { found, before, after } = extractAiImageMarkerSection(raw)
      if (found) {
        streamingSpinnerVisible.value = true
        streamingBeforeHtml.value = toHtmlContent(before)
        streamingAfterHtml.value = toHtmlContent(after)
      } else {
        renderedHtml.value = toHtmlContent(raw)
      }
      return
    }

    streamingSpinnerVisible.value = false
    if (!raw) return

    // 최초 1회: 마커·Pexels 구간 분리 및 초기 렌더
    if (!markerSplit) {
      markerSplit = extractAiImageMarkerSection(raw)
      const pexelsTarget = markerSplit.found ? markerSplit.after : raw
      const { beforeText, afterText } = extractKeywordSection(pexelsTarget)
      pexelsSplit = { beforeKw: beforeText, gridHtml: PEXELS_LOADING_HTML, afterKw: afterText }

      if (markerSplit.found) {
        const cached = getAiImageCache(props.message.logId)
        aiImageHtml = cached ? toAiImgTag(cached) : AI_IMAGE_LOADING_HTML
        if (cached) aiImageFetchDone = true
      }
      rebuildPsychHtml()
    }

    // Pexels 이미지 그리드 (1회 — logId 캐시 히트 시 API 재호출 없음)
    if (!pexelsFetchDone) {
      pexelsFetchDone = true
      fetchAndInjectPexelsImages(markerSplit.found ? markerSplit.after : raw, props.message.logId).then(
        ({ beforeText: bt, afterText: at, gridHtml }) => {
          pexelsSplit = { beforeKw: bt, gridHtml, afterKw: at }
          rebuildPsychHtml()
        },
      )
    }

    // AI 이미지 생성 — 캐시 미스 시에만 API 호출 (1회)
    if (!aiImageFetchDone && markerSplit.found) {
      aiImageFetchDone = true
      // answer 메시지에 주입된 surveyAnswers → 정확한 수치 기반 방사형 그래프 프롬프트 생성
      fetchPsychologyAiImage(extractSections1to4(raw), props.message.surveyAnswers).then((base64) => {
        if (base64) setAiImageCache(props.message.logId, base64)
        aiImageHtml = base64 ? toAiImgTag(base64) : ''
        rebuildPsychHtml()
      })
    }
  },
  { immediate: true },
)

// ── 기타 computed / 유틸 ──────────────────────────────────────────────────
const surveyThemeAgent = computed<Agent | null>(
  () => chatIndexAgents.value.find((a) => a.agentId === (props.message.agentId || 'AG000010')) ?? null,
)

const parsedLunchRecommendations = computed<LunchRecommendationItem[]>(() => {
  const raw = (props.message.rContent ?? '').trim()
  if (!raw || props.message.uiType === 'lunch-card') return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as LunchRecommendationItem[]) : []
  } catch {
    return []
  }
})

/** 출처 제목 앞 마크다운 헤더 기호(## 등) 제거 */
const getSourceLabel = (title: string | undefined, url: string) => {
  const text = (title ?? '').trim()
  return text ? text.replace(/^#{1,6}\s+/u, '').trim() : url
}

const onSelectCategoryFromActions = (categoryId: string) => {
  const categoryNm = props.knowledgeList?.find((k) => k.categoryId === categoryId)?.categoryNm ?? ''
  emit('on-select-category', props.message.logId, categoryId, categoryNm)
}
</script>
