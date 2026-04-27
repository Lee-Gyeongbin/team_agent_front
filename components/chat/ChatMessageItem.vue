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
            @submit="emit('on-submit-lunch-card', message.logId, $event)"
            @close="emit('on-close-lunch-card', message.logId)"
          />
          <ChatLunchAgentCard
            v-else-if="parsedLunchRecommendations.length"
            :recommendations="parsedLunchRecommendations"
          />
          <!-- eslint-disable vue/no-v-html — toHtmlContent 내 안전 처리 적용 -->
          <div
            v-else
            class="message-content markdown-body"
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
</template>

<script setup lang="ts">
import type { ChatMessage, KnowledgeItem, LunchAgentFormPayload, LunchRecommendationItem } from '~/types/chat'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import type { Agent } from '~/types/agent'
const { chatIndexAgents } = useChatStore()
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

/** 마크다운 렌더 결과 — v-html */
const renderedHtml = computed(() => toHtmlContent(props.message.rContent ?? ''))
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
  if (!raw || props.message.uiType === 'lunch-card') return []
  return parseLunchRecommendations(raw)
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
  'on-close-lunch-card': [logId: string]
  /** 설문 제출 (survey 타입 메시지) */
  'on-survey-submit': [logId: string]
  /** 설문 닫기 (survey 타입 메시지) */
  'on-survey-close': [logId: string]
}>()

/** 카테고리 id만 전달되므로 표시명은 knowledgeList에서 매칭 */
const onSelectCategoryFromActions = (categoryId: string) => {
  const categoryNm = props.knowledgeList?.find((k) => k.categoryId === categoryId)?.categoryNm ?? ''
  emit('on-select-category', props.message.logId, categoryId, categoryNm)
}
</script>
