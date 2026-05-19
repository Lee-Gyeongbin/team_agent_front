<template>
  <div
    v-if="!isTodayMemeAnswer && !isNewsCuratorAnswer && !isLunchAgentAnswer"
    class="chat-message-item"
    :class="[
      message.type === 'answer'
        ? 'role-assistant'
        : message.type === 'lunch'
          ? 'role-assistant'
          : message.type === 'news'
            ? 'role-news'
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
          v-if="message.isStreaming && !message.rContent && !isNewsCuratorAnswer"
          class="message-loading"
        >
          <span class="typing-dot" /><span class="typing-dot" /><span class="typing-dot" />
        </div>
        <template v-else>
          <!-- TodayMeme 답변 JSON 원문은 숨기고 카드 컴포넌트에서만 노출 -->
          <div
            v-if="isTodayMemeAnswer"
            class="message-content"
          />
          <div
            v-else-if="isNewsCuratorAnswer"
            class="message-content"
          />
          <!-- eslint-disable vue/no-v-html — toHtmlContent 내 안전 처리 적용 -->
          <!-- AG000010: 마커 발견 → 섹션1~3 / 차트 슬롯 / 섹션4~7 분리 렌더 -->
          <template v-else-if="message.agentId === 'AG000010' && markerFound">
            <div
              class="message-content markdown-body"
              @click="onMarkdownClick"
              v-html="beforeChartHtml"
            />
            <!-- 차트 슬롯: 로딩 스피너 → 차트 컴포넌트 (퍼블리싱 후 연결) -->
            <div
              v-if="radarChartLoading"
              class="pexels-loading"
            >
              <div class="pexels-loading__spinner" />
            </div>
            <div
              v-else-if="radarChartData"
              class="chat-psychology-radar-block"
            >
              <div class="chat-psychology-radar-chart">
                <UiChart
                  type="radar"
                  :config="psychologyRadarChartConfig"
                />
              </div>
              <div class="chat-psychology-radar-metrics">
                <StressScoreGrid
                  :items="psychologyStressItems"
                  :core-areas-text="radarChartData.coreAreasSummary"
                  :risk-summary="radarChartData.riskSummary"
                  :risk-color="radarChartData.riskColor"
                />
              </div>
            </div>
            <div
              class="message-content markdown-body"
              @click="onMarkdownClick"
              v-html="afterChartHtml"
            />
          </template>
          <div
            v-else
            class="message-content markdown-body"
            @click="onMarkdownClick"
            v-html="renderedHtml"
          />
          <ul
            v-if="message.groundingSources?.length"
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
            @on-select-category="onSelectCategory"
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
          <!-- 공유 또는 타인 첨부(createUserId ≠ 본인): 패널·미리보기 대신 안내 한 줄 -->
          <div
            v-if="showAttachmentSummaryIndicator"
            class="message-user-attach-share-indicator"
          >
            <i
              class="icon-folder-close size-20"
              aria-hidden="true"
            />
            <span>파일 업로드됨</span>
          </div>
          <ChatQuestionAttachments
            v-else-if="message.attachments?.length"
            :attachments="message.attachments"
            :is-share="isShare"
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
        :theme-icon-class-nm="themeAgent?.iconClassNm ?? ''"
        :theme-color-hex="themeAgent?.colorHex ?? ''"
        @close="emit('on-survey-close', message.logId)"
        @submit="emit('on-survey-submit', message.logId)"
      />
    </template>

    <!-- 점심·밈·뉴스 에이전트 카드 (answer 행은 숨김 → 지식창고 푸터는 카드 하단 공통) -->
    <template v-else-if="isAgentCardMessage">
      <div
        class="avatar"
        :class="{ 'is-streaming': isAgentCardAvatarStreaming }"
      >
        <i class="icon-bot size-24"></i>
      </div>
      <div class="message-body">
        <ChatLunchAgentCard
          v-if="message.type === 'lunch'"
          :readonly="message.lunchSubmitted === true"
          :display-mode="lunchCardDisplayMode"
          :initial-payload="isLunchFormCard ? message.lunchFormPayload : undefined"
          :recommendations="!isLunchFormCard ? resolvedLunchRecommendations : []"
          :is-recommendations-pending="!isLunchFormCard && isLunchRecommendationsPending"
          :is-recommendation-response-streaming="!isLunchFormCard && isLunchRecommendationResponseStreaming"
          :enrichment-cache-key="!isLunchFormCard ? lunchImageEnrichmentCacheKey : ''"
          :enrichment-r-content="lunchEnrichmentRContent"
          :theme-icon-class-nm="themeAgent?.iconClassNm ?? ''"
          :theme-color-hex="themeAgent?.colorHex ?? ''"
          @submit="emit('on-submit-lunch-card', message.logId, $event)"
          @close="emit('on-lunch-card-close', message.logId)"
          @enriched="onLunchRecommendationsEnriched"
        />
        <ChatTodayMeme
          v-else-if="message.type === 'meme'"
          :readonly="isShare || message.memeSubmitted === true"
          :request-delivered="message.memeSubmitted === true"
          :meme-items="resolvedTodayMemeItems"
          :is-answer-streaming="isMemeAnswerStreaming"
          :theme-icon-class-nm="themeAgent?.iconClassNm ?? ''"
          :theme-color-hex="themeAgent?.colorHex ?? ''"
          @intro-complete="emit('on-meme-intro-complete', message.logId)"
        />
        <ChatNewsCurator
          v-else-if="message.type === 'news'"
          :readonly="isShare || message.newsSubmitted === true"
          :locked-selected-categories="message.newsSelectedCategories ?? []"
          :news-items="resolvedNewsCuratorItemsForNewsCard"
          :is-answer-streaming="isNewsCuratorAnswerStreaming"
          :theme-icon-class-nm="themeAgent?.iconClassNm ?? ''"
          :theme-color-hex="themeAgent?.colorHex ?? ''"
          @intro-complete="emit('on-news-intro-complete', message.logId)"
          @close="emit('on-news-card-close', message.logId)"
          @submit="emit('on-submit-news-card', message.logId, $event)"
        />
        <div
          v-if="shouldShowAgentCardKnowledgeFooter"
          class="message-footer"
        >
          <ChatMessageActions
            :chat-log-reaction="knowledgeActionsReaction"
            :knowledge-list="knowledgeList"
            :is-share="isShare"
            @on-copy="emit('on-copy', knowledgeActionsLogId)"
            @on-like="emit('on-like', knowledgeActionsLogId)"
            @on-dislike="emit('on-dislike', knowledgeActionsLogId)"
            @on-regenerate="emit('on-regenerate', knowledgeActionsLogId)"
            @on-select-category="onSelectCategory"
          />
        </div>
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
import type {
  ChatMessage,
  KnowledgeItem,
  LunchAgentFormPayload,
  LunchRecommendationItem,
  NewsCuratorItem,
} from '~/types/chat'
import type { StressScoreItem } from '~/types/stress'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import type { Agent } from '~/types/agent'
import {
  fetchAndInjectPexelsImages,
  extractKeywordSection,
  removeKeywordLines,
  PEXELS_LOADING_HTML,
  extractAiImageMarkerSection,
  extractSections1to4,
  fetchPsychologyRadarChartData,
  getRadarChartCache,
  setRadarChartCache,
  schedulePsychologyRadarUiInjection,
  buildStressItemsFromRadarChartData,
  buildPsychologyRadarUiChartConfig,
  usePsychologySurvey,
  type RadarChartData,
} from '~/utils/chat/psychologyConsultUtil'
import {
  applyLunchMenuImageEnrichmentToResultMessage,
  findLinkedLunchAnswerMessage,
  findLunchResultMessageForAnswer,
  getLunchImageEnrichmentCacheKey,
  LUNCH_AGENT_ID,
  migrateLunchMessagesForAnswerLogId,
  normalizeLunchRecommendationImages,
  parseLunchJsonArray,
  syncLunchResultRecommendationsFromAnswer,
} from '~/utils/chat/lunchAgentUtil'
import { parseTodayMemeItems, TODAY_MEME_AGENT_ID } from '~/utils/chat/todayMemeUtil'
import type { TodayMemeItem } from '~/utils/chat/todayMemeUtil'
import { attachmentsRequireSummaryIndicator } from '~/utils/chat/chatAttachmentDisplayUtil'
import { parseNewsCuratorItems } from '~/utils/chat/newsCuratorUtil'

const { chatIndexAgents, messages } = useChatStore()
const { surveyGender } = usePsychologySurvey()
const { user } = useAuth()
interface Props {
  message: ChatMessage
  knowledgeList?: KnowledgeItem[]
  isShare?: boolean
  /** 파일 공유 여부 — Y: 첨부 뷰어 표시, N: '파일 업로드됨' 안내 표시 */
  fileShareYn?: 'Y' | 'N'
}

const props = withDefaults(defineProps<Props>(), {
  knowledgeList: undefined,
  isShare: false,
  fileShareYn: 'N',
})

const showAttachmentSummaryIndicator = computed(() =>
  attachmentsRequireSummaryIndicator(props.message.attachments, {
    isSharePage: props.isShare,
    fileShareYn: props.fileShareYn,
    currentUserId: user.value?.userId,
  }),
)

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
  'on-meme-intro-complete': [logId: string]
  'on-submit-news-card': [logId: string, categories: string[]]
  'on-news-card-close': [logId: string]
  'on-news-intro-complete': [logId: string]
}>()

// ── 공통 ──────────────────────────────────────────────────────────────────
const renderedHtml = ref('')
const pexelsModalUrl = ref('')

const onMarkdownClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'IMG' && target.classList.contains('pexels-img')) {
    pexelsModalUrl.value = (target as HTMLImageElement).dataset.full ?? (target as HTMLImageElement).src
  }
}

// ── AG000010 렌더 상태 ────────────────────────────────────────────────────
/** [방사형그래프] 마커 발견 여부 — 템플릿 분기 조건 */
const markerFound = ref(false)
/** 마커 이전 구간 HTML (섹션 1~3) */
const beforeChartHtml = ref('')
/** 마커 이후 구간 HTML (섹션 4~7, Pexels 포함) */
const afterChartHtml = ref('')
/** 차트 API 요청 중 여부 — 스트리밍 시작부터 응답 완료까지 true */
const radarChartLoading = ref(false)
/**
 * 차트 컴포넌트 주입 데이터
 * — API 응답 후 채워짐, 차트 컴포넌트 퍼블리싱 후 템플릿에서 바인딩
 */
const radarChartData = ref<RadarChartData | null>(null)

/** guide/ui-chart Radar + StressScoreGrid 동일 구성 */
const psychologyStressItems = computed<StressScoreItem[]>(() =>
  radarChartData.value ? buildStressItemsFromRadarChartData(radarChartData.value) : [],
)

const psychologyRadarChartConfig = computed<Record<string, unknown>>(() =>
  radarChartData.value ? buildPsychologyRadarUiChartConfig(radarChartData.value) : {},
)

let pexelsFetchDone = false
let radarChartFetchDone = false

/** 캐시 주입 타이머 취소용 */
let cancelPsychologyRadarUiInjection: (() => void) | null = null

onBeforeUnmount(() => {
  cancelPsychologyRadarUiInjection?.()
  cancelPsychologyRadarUiInjection = null
})

watch(
  () => [props.message.rContent, props.message.agentId, props.message.isStreaming] as const,
  ([rContent, agentId, isStreaming]) => {
    const raw = rContent ?? ''

    if (agentId !== 'AG000010') {
      renderedHtml.value = toHtmlContent(raw)
      return
    }

    const { found, before, after } = extractAiImageMarkerSection(raw)

    if (!found) {
      // 마커 미발견: 스트리밍 중에도 전체 내용 실시간 렌더
      renderedHtml.value = toHtmlContent(removeKeywordLines(raw))
      return
    }

    // ── [방사형그래프] 마커 발견 ──────────────────────────────────────────
    markerFound.value = true

    // 섹션 1~3 실시간 갱신 (스트리밍 중에도 계속 업데이트)
    beforeChartHtml.value = toHtmlContent(removeKeywordLines(before))

    // 섹션 4~7: 스트리밍 중에는 Pexels 키워드 줄을 제거하지 않고 원문 표시 — 완료 후에만 이미지 주입
    if (!pexelsFetchDone && isStreaming) {
      afterChartHtml.value = toHtmlContent(after)
    }

    // 마커 최초 발견 시 차트 데이터 — 캐시는 API 대기 없이 바로 올 수 있어 JSON 주입만 짧게 지연
    if (!radarChartFetchDone) {
      radarChartFetchDone = true
      radarChartLoading.value = true

      const cached = getRadarChartCache(props.message.logId)
      if (cached) {
        cancelPsychologyRadarUiInjection?.()
        const logIdForInject = props.message.logId
        cancelPsychologyRadarUiInjection = schedulePsychologyRadarUiInjection(() => {
          if (props.message.logId !== logIdForInject) return
          radarChartData.value = cached
          radarChartLoading.value = false
        })
      } else {
        fetchPsychologyRadarChartData(extractSections1to4(raw), props.message.surveyAnswers!, surveyGender.value).then(
          (chartData) => {
            radarChartLoading.value = false
            if (chartData) {
              setRadarChartCache(props.message.logId, chartData)
              radarChartData.value = chartData
            }
          },
        )
      }
    }

    // Pexels 이미지: 키워드 섹션이 완성되는 스트리밍 완료 후에만 처리
    if (isStreaming) return

    // ── 스트리밍 완료 이후 1회 ────────────────────────────────────────────
    if (!pexelsFetchDone) {
      pexelsFetchDone = true
      const { beforeText, afterText } = extractKeywordSection(after)
      afterChartHtml.value = toHtmlContent(beforeText) + PEXELS_LOADING_HTML + toHtmlContent(afterText)
      fetchAndInjectPexelsImages(after, props.message.logId).then(({ beforeText: bt, afterText: at, gridHtml }) => {
        afterChartHtml.value = toHtmlContent(bt) + gridHtml + toHtmlContent(at)
      })
    }
  },
  { immediate: true },
)

// ── 기타 computed / 유틸 ──────────────────────────────────────────────────
/** 현재 메시지 agentId에 해당하는 에이전트 정보 — 테마 아이콘·색상 공통 */
const themeAgent = computed<Agent | null>(
  () => chatIndexAgents.value.find((a) => a.agentId === props.message.agentId) ?? null,
)

/** 점심 에이전트 answer 행 — 추천 JSON은 type=lunch 카드에서만 표시 */
const isLunchAgentAnswer = computed(() => props.message.type === 'answer' && props.message.agentId === LUNCH_AGENT_ID)

const lunchCardDisplayMode = computed((): 'form' | 'result' | 'combined' => {
  if (props.message.type !== 'lunch') return 'combined'
  if (props.message.lunchCardRole === 'result') return 'result'
  if (props.message.lunchCardRole === 'form' || !props.message.lunchSubmitted) return 'form'
  return 'combined'
})

const isLunchFormCard = computed(() => lunchCardDisplayMode.value === 'form')

const linkedLunchAnswerMessage = computed(() => {
  if (props.message.type !== 'lunch' || isLunchFormCard.value) return undefined
  const linked = findLinkedLunchAnswerMessage(messages.value, props.message)
  if (linked) return linked
  const answerLogId = getLunchImageEnrichmentCacheKey(props.message)
  if (!answerLogId) return undefined
  return messages.value.find((m) => m.type === 'answer' && m.logId === answerLogId)
})

const lunchImageEnrichmentCacheKey = computed(() => {
  if (props.message.type !== 'lunch' || isLunchFormCard.value) return ''
  return getLunchImageEnrichmentCacheKey(props.message)
})

const resolvedLunchRecommendations = computed<LunchRecommendationItem[]>(() => {
  if (props.message.type !== 'lunch' || isLunchFormCard.value) return []
  const injected = props.message.lunchDisplayRecommendations
  if (Array.isArray(injected) && injected.length > 0) {
    return normalizeLunchRecommendationImages(injected)
  }
  const answer = linkedLunchAnswerMessage.value
  if (!answer) return []
  return normalizeLunchRecommendationImages(parseLunchJsonArray(String(answer.rContent ?? '')))
})

const isLunchRecommendationsPending = computed(
  () =>
    !isLunchFormCard.value &&
    linkedLunchAnswerMessage.value?.isStreaming === true &&
    resolvedLunchRecommendations.value.length === 0,
)

const isLunchRecommendationResponseStreaming = computed(
  () =>
    !isLunchFormCard.value &&
    linkedLunchAnswerMessage.value?.isStreaming === true &&
    resolvedLunchRecommendations.value.length > 0,
)

const lunchEnrichmentRContent = computed(() => {
  if (isLunchFormCard.value) return ''
  return String(linkedLunchAnswerMessage.value?.rContent ?? '')
})

const onLunchRecommendationsEnriched = (items: LunchRecommendationItem[]) => {
  const target = messages.value.find((m) => m.logId === props.message.logId && m.type === 'lunch')
  if (target) target.lunchDisplayRecommendations = [...items]
}

/** complete 후 answer logId만 바뀐 경우 — socket 외부에서 lunch 카드 연결 보정 */
watch(
  linkedLunchAnswerMessage,
  (answer, prevAnswer) => {
    if (!answer || props.message.type !== 'lunch' || isLunchFormCard.value) return
    const storedLinkId = String(props.message.lunchAnswerLogId ?? '').trim()
    if (storedLinkId && storedLinkId !== answer.logId) {
      migrateLunchMessagesForAnswerLogId(messages.value, storedLinkId, answer.logId)
    }
    syncLunchResultRecommendationsFromAnswer(messages.value, answer)

    const streamJustFinished = prevAnswer?.isStreaming === true && answer.isStreaming !== true
    if (streamJustFinished) {
      const resultMsg = findLunchResultMessageForAnswer(messages.value, answer.logId)
      if (resultMsg) {
        void applyLunchMenuImageEnrichmentToResultMessage(resultMsg, String(answer.rContent ?? ''))
      }
    }
  },
  { immediate: true },
)

const isTodayMemeAnswerMessage = (message: ChatMessage) =>
  message.type === 'answer' && message.agentId === TODAY_MEME_AGENT_ID
const isNewsCuratorAnswerMessage = (message: ChatMessage) =>
  message.type === 'answer' && String(message.agentId ?? '').trim() === 'AG000012'

const resolvedTodayMemeItems = computed<TodayMemeItem[]>(() => {
  if (props.message.type !== 'meme') return []
  const injected = props.message.memeDisplayItems
  if (Array.isArray(injected) && injected.length > 0) return injected

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

const resolvedNewsCuratorItemsForNewsCard = computed<NewsCuratorItem[]>(() => {
  if (props.message.type !== 'news') return []
  const injected = props.message.newsDisplayItems
  if (Array.isArray(injected) && injected.length > 0) return injected

  const newsCardMessageIndex = messages.value.findIndex((messageEntry) => messageEntry.logId === props.message.logId)
  if (newsCardMessageIndex < 0) return []
  const messagesAfterNewsCard = messages.value.slice(newsCardMessageIndex + 1)
  const nextNewsCardMessageIndex = messagesAfterNewsCard.findIndex((messageEntry) => messageEntry.type === 'news')
  const answerMessagesUntilNextNewsCard =
    nextNewsCardMessageIndex < 0 ? messagesAfterNewsCard : messagesAfterNewsCard.slice(0, nextNewsCardMessageIndex)
  for (const answerMessage of answerMessagesUntilNextNewsCard) {
    if (answerMessage.type !== 'answer') continue
    const parsedNewsItems = parseNewsCuratorItems(String(answerMessage.rContent ?? ''))
    if (parsedNewsItems.length > 0) return parsedNewsItems
  }
  return []
})

/** TodayMeme 에이전트 답변 행 식별 */
const isTodayMemeAnswer = computed(() => isTodayMemeAnswerMessage(props.message))
const isNewsCuratorAnswer = computed(() => isNewsCuratorAnswerMessage(props.message))

const NEWS_CURATOR_AGENT_ID = 'AG000012'

const isAgentCardMessage = computed(
  () => props.message.type === 'lunch' || props.message.type === 'meme' || props.message.type === 'news',
)

const isAgentCardAvatarStreaming = computed(() => {
  if (props.message.type === 'meme') return isMemeAnswerStreaming.value
  if (props.message.type === 'news') return isNewsCuratorAnswerStreaming.value
  return false
})

/** answer 행 또는 에이전트 카드에 연결된 answer logId — 지식창고·반응 API 공통 */
const knowledgeActionsLogId = computed(() => {
  if (props.message.type === 'answer') return props.message.logId
  return agentCardFooterLogId.value
})

const knowledgeActionsReaction = computed(() => {
  if (props.message.type === 'answer') return props.message.chatLogReaction
  return agentCardFooterReaction.value
})

/** meme·news·점심(result) 카드에 대응하는 answer 행 — UI에서는 숨기고 푸터·지식저장에만 사용 */
const linkedAgentCardAnswer = computed((): ChatMessage | undefined => {
  if (props.message.type === 'lunch' && !isLunchFormCard.value) {
    return linkedLunchAnswerMessage.value
  }
  if (props.message.type === 'meme') {
    const cardIndex = messages.value.findIndex((m) => m.logId === props.message.logId)
    if (cardIndex < 0) return undefined
    return messages.value.slice(cardIndex + 1).find((m) => m.type === 'answer' && m.agentId === TODAY_MEME_AGENT_ID)
  }
  if (props.message.type === 'news') {
    const cardIndex = messages.value.findIndex((m) => m.logId === props.message.logId)
    if (cardIndex < 0) return undefined
    const after = messages.value.slice(cardIndex + 1)
    const nextNewsIndex = after.findIndex((m) => m.type === 'news')
    const untilNext = nextNewsIndex < 0 ? after : after.slice(0, nextNewsIndex)
    return untilNext.find((m) => m.type === 'answer' && String(m.agentId ?? '').trim() === NEWS_CURATOR_AGENT_ID)
  }
  return undefined
})

/** 지식창고·반응 API logId — 연결 answer 우선, 점심은 lunchAnswerLogId 폴백 */
const agentCardFooterLogId = computed(() => {
  const fromLinked = String(linkedAgentCardAnswer.value?.logId ?? '').trim()
  if (fromLinked) return fromLinked
  if (props.message.type === 'lunch' && !isLunchFormCard.value) return lunchImageEnrichmentCacheKey.value
  return ''
})

const agentCardFooterReaction = computed(() => {
  const linked = linkedAgentCardAnswer.value
  if (linked?.chatLogReaction) return linked.chatLogReaction
  const logId = agentCardFooterLogId.value
  if (!logId) return undefined
  return messages.value.find((m) => m.type === 'answer' && m.logId === logId)?.chatLogReaction
})

/** 연결 answer 스트리밍 여부 — linked 미탐색 시 logId로 answer 재조회 */
const isLinkedAgentCardAnswerStreaming = computed(() => {
  const linked = linkedAgentCardAnswer.value
  if (linked?.isStreaming === true) return true
  const logId = agentCardFooterLogId.value
  if (!logId) return false
  return messages.value.find((m) => m.type === 'answer' && m.logId === logId)?.isStreaming === true
})

/** 에이전트 카드 하단 지식창고·반응 푸터 — 숨겨진 answer 행 대신 연결된 logId 사용 */
const shouldShowAgentCardKnowledgeFooter = computed(() => {
  if (!agentCardFooterLogId.value || isLinkedAgentCardAnswerStreaming.value) return false

  if (props.message.type === 'meme') {
    return resolvedTodayMemeItems.value.length > 0 && props.message.memeSubmitted === true
  }
  if (props.message.type === 'news') {
    return resolvedNewsCuratorItemsForNewsCard.value.length > 0 && props.message.newsSubmitted === true
  }
  if (props.message.type === 'lunch' && !isLunchFormCard.value) {
    return (
      props.message.lunchSubmitted === true &&
      resolvedLunchRecommendations.value.length > 0 &&
      !isLunchRecommendationsPending.value &&
      !isLunchRecommendationResponseStreaming.value
    )
  }
  return false
})

/** 답변 액션 푸터 노출 조건을 한곳에서 관리 */
const shouldShowMessageFooter = computed(
  () => !props.message.isStreaming && !isTodayMemeAnswer.value && !isNewsCuratorAnswer.value,
)

/** 이 meme 메시지에 대응하는 TodayMeme 답변이 아직 스트리밍 중인지 */
const isMemeAnswerStreaming = computed(() => {
  if (props.message.type !== 'meme') return false
  const idx = messages.value.findIndex((m) => m.logId === props.message.logId)
  if (idx < 0) return false
  const after = messages.value.slice(idx + 1)
  const ans = after.find((m) => m.type === 'answer' && m.agentId === TODAY_MEME_AGENT_ID)
  return ans?.isStreaming === true
})

/** 이 news 카드 직후(다음 news 전까지) 구간에 answer가 스트리밍 중인지 */
const isNewsCuratorAnswerStreaming = computed(() => {
  if (props.message.type !== 'news') return false
  const newsCardMessageIndex = messages.value.findIndex((messageEntry) => messageEntry.logId === props.message.logId)
  if (newsCardMessageIndex < 0) return false
  const messagesAfterNewsCard = messages.value.slice(newsCardMessageIndex + 1)
  const nextNewsCardMessageIndex = messagesAfterNewsCard.findIndex((messageEntry) => messageEntry.type === 'news')
  const answerMessagesUntilNextNewsCard =
    nextNewsCardMessageIndex < 0 ? messagesAfterNewsCard : messagesAfterNewsCard.slice(0, nextNewsCardMessageIndex)
  return answerMessagesUntilNextNewsCard.some(
    (messageAfterNewsCard) => messageAfterNewsCard.type === 'answer' && messageAfterNewsCard.isStreaming === true,
  )
})

/** 출처 제목 앞 마크다운 헤더 기호(## 등) 제거 */
const getSourceLabel = (title: string | undefined, url: string) => {
  const raw = (title ?? '').trim()
  if (!raw) return url
  return raw.replace(/^#{1,6}\s+/u, '').trim()
}

/** ChatMessageActions는 categoryId만 넘김 — logId는 knowledgeActionsLogId(answer·연결 answer 공통) */
const onSelectCategory = (categoryId: string) => {
  const logId = knowledgeActionsLogId.value
  if (!logId) return
  const categoryNm = props.knowledgeList?.find((k) => k.categoryId === categoryId)?.categoryNm ?? ''
  emit('on-select-category', logId, categoryId, categoryNm)
}
</script>

<style lang="scss" scoped>
// guide/ui-chart «Radar + StressScoreGrid» — 전체 영역 약 80% 스케일 (576≈720×0.8, 320≈400×0.8)
.chat-psychology-radar-block {
  max-width: 576px;
  width: 100%;
  margin: 12px auto;
}

.chat-psychology-radar-chart,
.chat-psychology-radar-metrics {
  width: 86%;
  margin-left: auto;
  margin-right: auto;
}

.chat-psychology-radar-chart {
  height: 320px;
}

.chat-psychology-radar-metrics {
  margin-top: $spacing-md;
}
</style>
