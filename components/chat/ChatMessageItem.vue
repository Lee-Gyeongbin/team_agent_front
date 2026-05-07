<template>
  <div
    v-if="!isTodayMemeAnswer"
    class="chat-message-item"
    :class="[
      message.type === 'answer'
        ? 'role-assistant'
        : message.type === 'lunch'
          ? 'role-assistant'
          : message.type === 'meme'
            ? 'role-meme'
            : message.type === 'survey'
              ? 'role-survey'
              : 'role-user',
    ]"
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
            v-if="isLunchRecommendationAnswer"
            :readonly="true"
            :initial-payload="message.lunchFormPayload"
            :recommendations="parsedLunchRecommendations"
            :theme-icon-class-nm="surveyThemeAgent?.iconClassNm ?? ''"
            :theme-color-hex="surveyThemeAgent?.colorHex ?? ''"
            @submit="emit('on-submit-lunch-card', message.logId, $event)"
            @close="emit('on-lunch-card-close', message.logId)"
          />
          <!-- TodayMeme 답변 JSON 원문은 숨기고 카드 컴포넌트에서만 노출 -->
          <div
            v-else-if="isTodayMemeAnswer"
            class="message-content"
          />
          <!-- eslint-disable vue/no-v-html — toHtmlContent 내 안전 처리 적용 -->
          <div
            v-else
            class="message-content markdown-body"
            @click="onMarkdownClick"
            v-html="renderedHtml"
          />
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
          v-if="shouldShowMessageFooter"
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

    <!-- 점심 카드 메시지 -->
    <template v-else-if="message.type === 'lunch'">
      <div class="avatar">
        <i class="icon-bot size-24"></i>
      </div>
      <div class="message-body">
        <ChatLunchAgentCard
          :readonly="message.lunchSubmitted === true"
          :initial-payload="message.lunchFormPayload"
          :theme-icon-class-nm="surveyThemeAgent?.iconClassNm ?? ''"
          :theme-color-hex="surveyThemeAgent?.colorHex ?? ''"
          @submit="emit('on-submit-lunch-card', message.logId, $event)"
          @close="emit('on-lunch-card-close', message.logId)"
        />
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

    <!-- TodayMeme 메시지 — 봇 아바타 + message-body 정렬 -->
    <template v-else-if="message.type === 'meme'">
      <div
        class="avatar"
        :class="{ 'is-streaming': isMemeAnswerStreaming }"
      >
        <i class="icon-bot size-24"></i>
      </div>
      <div class="message-body">
        <ChatTodayMeme
          :readonly="message.memeSubmitted === true"
          :meme-items="resolvedTodayMemeItems"
          :is-answer-streaming="isMemeAnswerStreaming"
          :theme-icon-class-nm="surveyThemeAgent?.iconClassNm ?? ''"
          :theme-color-hex="surveyThemeAgent!.colorHex"
          @intro-complete="emit('on-meme-intro-complete', message.logId)"
        />
      </div>
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
} from '~/utils/chat/psychologyConsultUtil'
import { parseTodayMemeItems } from '~/utils/chat/todayMemeUtil'
import type { TodayMemeItem } from '~/utils/chat/todayMemeUtil'
const { chatIndexAgents, messages } = useChatStore()
interface Props {
  message: ChatMessage
  knowledgeList?: KnowledgeItem[]
  /** 공유 페이지 등: 액션 영역은 복사·카테고리만 */
  isShare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  knowledgeList: undefined,
  isShare: false,
})

/**
 * 마크다운 렌더 결과 — v-html
 * 산업심리 상담 에이전트(AG000010): 스트리밍 완료 시 Pexels API로 이미지 URL 조회 후 렌더
 * 그 외 에이전트: 동기 렌더
 */
const renderedHtml = ref('')
const pexelsModalUrl = ref('')

/** .pexels-img 클릭 시 data-full(원본) URL로 모달 오픈 */
const onMarkdownClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'IMG' && target.classList.contains('pexels-img')) {
    const img = target as HTMLImageElement
    pexelsModalUrl.value = img.dataset.full ?? img.src
  }
}

/** Pexels fetch 진행 중 여부 — watch 재트리거 방지 */
let pexelsFetchInProgress = false

watch(
  () => [props.message.rContent, props.message.agentId, props.message.isStreaming] as const,
  ([rContent, agentId, isStreaming]) => {
    const raw = rContent ?? ''

    if (agentId !== 'AG000010') {
      renderedHtml.value = toHtmlContent(raw)
      return
    }

    // 스트리밍 중: 키워드 텍스트 그대로 노출, 완료 후 이미지로 교체
    if (isStreaming) {
      if (!pexelsFetchInProgress) {
        renderedHtml.value = toHtmlContent(raw)
      }
      return
    }

    // 이미 fetch 중이면 무시 (중복 호출 방지)
    if (pexelsFetchInProgress) return

    // 스트리밍 완료 즉시:
    //   1) before/after 텍스트는 동기로 바로 렌더 (텍스트 사라짐 없음)
    //   2) 키워드 영역엔 로딩 스피너 표시
    //   3) Pexels API 완료 후 스피너 → 이미지 그리드로 교체
    const { beforeText, afterText } = extractKeywordSection(raw)
    renderedHtml.value = toHtmlContent(beforeText) + PEXELS_LOADING_HTML + toHtmlContent(afterText)

    pexelsFetchInProgress = true
    fetchAndInjectPexelsImages(raw).then(({ beforeText: bt, afterText: at, gridHtml }) => {
      renderedHtml.value = toHtmlContent(bt) + gridHtml + toHtmlContent(at)
      pexelsFetchInProgress = false
    })
  },
  { immediate: true },
)
const surveyThemeAgent = computed<Agent | null>(() => {
  const targetAgentId = props.message.agentId || 'AG000010'
  return chatIndexAgents.value.find((agent) => agent.agentId === targetAgentId) ?? null
})

const parseLunchRecommendations = (raw: string): LunchRecommendationItem[] => {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as LunchRecommendationItem[]
  } catch {
    return []
  }
}

const parsedLunchRecommendations = computed<LunchRecommendationItem[]>(() => {
  const raw = (props.message.rContent ?? '').trim()
  if (!raw) return []
  return parseLunchRecommendations(raw)
})
const isLunchRecommendationAnswer = computed(() => props.message.agentId === 'AG000009')

const isTodayMemeAnswerMessage = (message: ChatMessage) => message.type === 'answer' && message.agentId === 'AG000011'

const resolvedTodayMemeItems = computed<TodayMemeItem[]>(() => {
  const findParsedItems = (list: ChatMessage[]): TodayMemeItem[] => {
    for (const msg of list) {
      if (!isTodayMemeAnswerMessage(msg)) continue
      const parsed = parseTodayMemeItems(String(msg.rContent ?? ''))
      if (parsed.length) return parsed
    }
    return []
  }

  const memeIndex = messages.value.findIndex((m) => m.logId === props.message.logId)
  const sourceList = memeIndex >= 0 ? messages.value.slice(memeIndex + 1) : messages.value
  const parsedFromFollowing = findParsedItems(sourceList)
  if (parsedFromFollowing.length) return parsedFromFollowing
  return findParsedItems([...messages.value].reverse())
})

/** TodayMeme 에이전트 답변 행 식별 */
const isTodayMemeAnswer = computed(() => isTodayMemeAnswerMessage(props.message))

/** 답변 액션 푸터 노출 조건을 한곳에서 관리 */
const shouldShowMessageFooter = computed(
  () => !props.message.isStreaming && props.message.uiType !== 'lunch-card' && !isTodayMemeAnswer.value,
)

/** 이 meme 메시지에 대응하는 TodayMeme 답변이 아직 스트리밍 중인지 */
const isMemeAnswerStreaming = computed(() => {
  const idx = messages.value.findIndex((m) => m.logId === props.message.logId)
  if (idx < 0) return false
  return messages.value.slice(idx + 1).some((m) => isTodayMemeAnswerMessage(m) && m.isStreaming === true)
})

/** 출처 제목 앞 마크다운 헤더 기호(## 등) 제거 */
const getSourceLabel = (title: string | undefined, url: string) => {
  const raw = (title ?? '').trim()
  if (!raw) return url
  return raw.replace(/^#{1,6}\s+/u, '').trim()
}

const emit = defineEmits<{
  'on-copy': [id: string]
  'on-like': [id: string]
  'on-dislike': [id: string]
  'on-regenerate': [id: string]
  /** [답변 logId, categoryId, categoryNm] — Actions는 value만 알 수 있어 여기서 knowledgeList로 이름 조회 */
  'on-select-category': [id: string, categoryValue: string, categoryNm: string]
  'on-view-source': [id: string]
  'on-view-visualization': [id: string]
  'on-submit-lunch-card': [logId: string, payload: LunchAgentFormPayload]
  'on-lunch-card-close': [logId: string]
  /** 설문 제출 (survey 타입 메시지) */
  'on-survey-submit': [logId: string]
  /** 설문 닫기 (survey 타입 메시지) */
  'on-survey-close': [logId: string]
  /** TodayMeme 인트로 종료 — 프롬프트 전송 트리거 */
  'on-meme-intro-complete': [logId: string]
}>()

/** 카테고리 id만 전달되므로 표시명은 knowledgeList에서 매칭 */
const onSelectCategoryFromActions = (categoryId: string) => {
  const categoryNm = props.knowledgeList?.find((k) => k.categoryId === categoryId)?.categoryNm ?? ''
  emit('on-select-category', props.message.logId, categoryId, categoryNm)
}
</script>
