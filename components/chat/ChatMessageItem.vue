<template>
  <div
    v-if="!isTodayMemeAnswer && !isLunchAgentAnswer"
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
          v-if="message.isStreaming && !message.rContent"
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
          <!-- eslint-disable vue/no-v-html — toHtmlContent 내 안전 처리 적용 -->
          <!-- SURVEY(showRadarChart): 마커 발견 → 섹션1~3 / 차트 슬롯 / 섹션4~7 분리 렌더 -->
          <template v-else-if="isSurveyRadarAnswer && markerFound">
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

    <!-- 설문 메시지 (svcTy C + subCfg SURVEY) -->
    <template v-else-if="message.type === 'survey'">
      <ChatSurvey
        v-if="messageSurveyConfig"
        :survey-config="messageSurveyConfig"
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
          :news-is-new="newsCardIsNew"
          :news-reselect="newsCardReselect"
          :locked-selected-categories="message.newsSelectedCategories ?? []"
          :news-items="resolvedNewsCuratorItemsForNewsCard"
          :enable-reselect="!isShare"
          :reselect-disabled="isNewsReselectDisabled"
          :is-answer-streaming="isLinkedAgentCardAnswerStreaming"
          :theme-icon-class-nm="themeAgent?.iconClassNm ?? ''"
          :theme-color-hex="themeAgent?.colorHex ?? ''"
          @intro-complete="emit('on-news-intro-complete', message.logId)"
          @close="emit('on-news-card-close', message.logId)"
          @submit="(categories, options) => emit('on-submit-news-card', message.logId, categories, options)"
          @reselect-categories="emit('on-news-card-reselect', message.logId)"
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

  <ChatAttachmentPreviewModal
    :is-open="!!imagePreview"
    chat-file-id=""
    :file-name="imagePreview?.title ?? '이미지'"
    :mime-type="imagePreview?.mimeType ?? 'image/png'"
    :local-preview-url="imagePreview?.src"
    :is-share="isShare"
    @update:is-open="onImagePreviewOpenChange"
  />
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
  parseSurveyAnswersFromPrompt,
  type RadarChartData,
} from '~/utils/chat/surveyUtil'
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
import { findLinkedNewsCuratorAnswer, resolveNewsCuratorItemsForCard } from '~/utils/chat/newsCuratorUtil'
import { attachmentsRequireSummaryIndicator } from '~/utils/chat/chatAttachmentDisplayUtil'
import {
  parseSurveyConfigFromAgent,
  resolveSurveyConfigByAgentId,
  setActiveSurveyConfig,
  isSurveyRadarAgentById,
} from '~/utils/chat/surveyUtil'

const { chatIndexAgents, messages } = useChatStore()
const { surveyGender } = usePsychologySurvey()
const { user } = useAuth()

const isSurveyRadarAgent = (agentId: string) => isSurveyRadarAgentById(agentId, chatIndexAgents.value)
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
  'on-submit-news-card': [logId: string, categories: string[], options?: { isNew?: boolean }]
  'on-news-card-close': [logId: string]
  'on-news-card-reselect': [logId: string]
  'on-news-intro-complete': [logId: string]
}>()

// ── 공통 ──────────────────────────────────────────────────────────────────
const renderedHtml = ref('')
const imagePreview = ref<{ src: string; title: string; mimeType: string } | null>(null)

const onImagePreviewOpenChange = (open: boolean) => {
  if (!open) imagePreview.value = null
}

const onMarkdownClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName !== 'IMG') return
  const img = target as HTMLImageElement
  let src = ''
  if (img.classList.contains('pexels-img')) {
    src = img.dataset.full ?? img.src
  } else if (img.src.startsWith('data:image/')) {
    src = img.src
  }
  if (!src) return
  const mimeMatch = src.match(/^data:(image\/[a-z0-9+.+-]+);/i)
  imagePreview.value = {
    src,
    title: img.alt?.trim() || '이미지',
    mimeType: mimeMatch?.[1] ?? 'image/png',
  }
}

// ── SURVEY(showRadarChart) 렌더 상태 ────────────────────────────────────────────────────
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

/** guide/ui-chart Radar + StressScoreGrid 동일 구성 — 성별별 PDF 23p 영역별 참고치로 단계 판정 */
const psychologyStressItems = computed<StressScoreItem[]>(() =>
  radarChartData.value ? buildStressItemsFromRadarChartData(radarChartData.value, surveyGender.value) : [],
)

const psychologyRadarChartConfig = computed<Record<string, unknown>>(() =>
  radarChartData.value ? buildPsychologyRadarUiChartConfig(radarChartData.value, surveyGender.value) : {},
)

let pexelsFetchDone = false
let radarChartFetchDone = false

/** F5 직후 chatIndexAgents 미로드 → 이후 재처리 트리거용 */
let lastSurveyRadarGateKey = ''

const resetSurveyRadarRenderState = () => {
  markerFound.value = false
  beforeChartHtml.value = ''
  afterChartHtml.value = ''
  radarChartLoading.value = false
  radarChartData.value = null
  pexelsFetchDone = false
  radarChartFetchDone = false
  cancelPsychologyRadarUiInjection?.()
  cancelPsychologyRadarUiInjection = null
}

/** answer 행에 surveyAnswers가 없을 때(로그 재조회 등) 연결 question·survey 메시지에서 복원 */
const resolveSurveyAnswersForRadar = (): Record<number, number> => {
  const direct = props.message.surveyAnswers
  if (direct && Object.keys(direct).length > 0) return direct

  const surveyMsg = messages.value.find(
    (m) => m.type === 'survey' && m.surveySubmitted && (!props.message.agentId || m.agentId === props.message.agentId),
  )
  if (surveyMsg?.surveyAnswers && Object.keys(surveyMsg.surveyAnswers).length > 0) {
    return surveyMsg.surveyAnswers
  }

  const questionMsg = messages.value.find((m) => {
    if (m.type !== 'question') return false
    if (props.message.agentId && m.agentId && m.agentId !== props.message.agentId) return false
    return Object.keys(parseSurveyAnswersFromPrompt(m.qContent ?? '')).length > 0
  })
  if (questionMsg) return parseSurveyAnswersFromPrompt(questionMsg.qContent ?? '')

  return {}
}

/** 캐시 주입 타이머 취소용 */
let cancelPsychologyRadarUiInjection: (() => void) | null = null
/** 페이지 전환·메시지 교체 후 비동기 콜백이 언마운트된 vnode를 갱신하지 않도록 */
let isMessageItemAlive = true

onBeforeUnmount(() => {
  isMessageItemAlive = false
  cancelPsychologyRadarUiInjection?.()
  cancelPsychologyRadarUiInjection = null
})

watch(
  () =>
    [
      props.message.logId,
      props.message.rContent,
      props.message.agentId,
      props.message.isStreaming,
      props.message.surveyAnswers,
      chatIndexAgents.value.map((a) => a.agentId).join(','),
    ] as const,
  ([, rContent, agentId, isStreaming]) => {
    const raw = rContent ?? ''
    const gateKey = `${props.message.logId}:${isSurveyRadarAgentById(agentId ?? '', chatIndexAgents.value)}`

    if (gateKey !== lastSurveyRadarGateKey) {
      resetSurveyRadarRenderState()
      lastSurveyRadarGateKey = gateKey
    }

    if (!isSurveyRadarAgent(agentId ?? '')) {
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
      const logIdForChart = props.message.logId

      const cached = getRadarChartCache(logIdForChart)
      if (cached) {
        cancelPsychologyRadarUiInjection?.()
        cancelPsychologyRadarUiInjection = schedulePsychologyRadarUiInjection(() => {
          if (!isMessageItemAlive || props.message.logId !== logIdForChart) return
          radarChartData.value = cached
          radarChartLoading.value = false
        })
      } else {
        const surveyConfig = resolveSurveyConfigByAgentId(props.message.agentId ?? '', chatIndexAgents.value)
        if (surveyConfig) setActiveSurveyConfig(surveyConfig)
        const answersForRadar = resolveSurveyAnswersForRadar()
        fetchPsychologyRadarChartData(extractSections1to4(raw), answersForRadar, surveyGender.value).then(
          (chartData) => {
            if (!isMessageItemAlive || props.message.logId !== logIdForChart) return
            radarChartLoading.value = false
            if (chartData) {
              setRadarChartCache(logIdForChart, chartData)
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
      const logIdForPexels = props.message.logId
      const { beforeText, afterText } = extractKeywordSection(after)
      afterChartHtml.value = toHtmlContent(beforeText) + PEXELS_LOADING_HTML + toHtmlContent(afterText)
      fetchAndInjectPexelsImages(after, logIdForPexels).then(({ beforeText: bt, afterText: at, gridHtml }) => {
        if (!isMessageItemAlive || props.message.logId !== logIdForPexels) return
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

const isSurveyRadarAnswer = computed(
  () => props.message.type === 'answer' && isSurveyRadarAgent(props.message.agentId ?? ''),
)

/** 설문 메시지용 subCfg 기반 설정 */
const messageSurveyConfig = computed(() => {
  if (props.message.type !== 'survey') return null
  const agent = themeAgent.value
  if (agent) return parseSurveyConfigFromAgent(agent)
  if (props.message.agentId) {
    return resolveSurveyConfigByAgentId(props.message.agentId, chatIndexAgents.value)
  }
  return null
})

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

const resolvedNewsCuratorItemsForNewsCard = computed<NewsCuratorItem[]>(() =>
  props.message.type === 'news' ? resolveNewsCuratorItemsForCard(props.message, messages.value) : [],
)

/** 미제출 news 카드가 있으면 기존 뉴스픽 '새로운 카테고리 선택하기' 비활성 */
const isNewsReselectDisabled = computed(() => messages.value.some((m) => m.type === 'news' && m.newsSubmitted !== true))

/** NewsCurator 카드 — `newsIsNew` / `newsReselect` */
const newsCardIsNew = computed(() => (props.message.type === 'news' ? props.message.newsIsNew : undefined))
const newsCardReselect = computed(() => props.message.type === 'news' && props.message.newsReselect === true)

/** TodayMeme 에이전트 답변 행 식별 */
const isTodayMemeAnswer = computed(() => isTodayMemeAnswerMessage(props.message))

const isAgentCardMessage = computed(
  () => props.message.type === 'lunch' || props.message.type === 'meme' || props.message.type === 'news',
)

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
    return findLinkedNewsCuratorAnswer(messages.value, props.message.logId)
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

const isAgentCardAvatarStreaming = computed(() => {
  if (props.message.type === 'meme') return isMemeAnswerStreaming.value
  if (props.message.type === 'news') return isLinkedAgentCardAnswerStreaming.value
  return false
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
const shouldShowMessageFooter = computed(() => !props.message.isStreaming && !isTodayMemeAnswer.value)

/** 이 meme 메시지에 대응하는 TodayMeme 답변이 아직 스트리밍 중인지 */
const isMemeAnswerStreaming = computed(() => {
  if (props.message.type !== 'meme') return false
  const idx = messages.value.findIndex((m) => m.logId === props.message.logId)
  if (idx < 0) return false
  const after = messages.value.slice(idx + 1)
  const ans = after.find((m) => m.type === 'answer' && m.agentId === TODAY_MEME_AGENT_ID)
  return ans?.isStreaming === true
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
