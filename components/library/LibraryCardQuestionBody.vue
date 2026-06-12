<template>
  <ChatSurvey
    v-if="isSurveyCard && surveyConfig"
    class="library-card-question-body__survey"
    readonly
    :survey-config="surveyConfig"
    :initial-answers="surveyAnswers"
    :theme-icon-class-nm="item.iconClassNm ?? ''"
    :theme-color-hex="item.colorHex ?? ''"
  />
  <ChatRecommendAgentCard
    v-else-if="recommendConfig && recommendPayload"
    class="library-card-question-body__recommend"
    readonly
    display-mode="form"
    :recommend-config="recommendConfig"
    :initial-payload="recommendPayload"
    :theme-icon-class-nm="item.iconClassNm ?? ''"
    :theme-color-hex="item.colorHex ?? ''"
  />
  <ChatNewsCurator
    v-else-if="newsCategories.length"
    class="library-card-question-body__news"
    readonly
    display-mode="form"
    :news-is-new="newsIsNew"
    :locked-selected-categories="newsCategories"
    :theme-icon-class-nm="item.iconClassNm ?? ''"
    :theme-color-hex="item.colorHex ?? ''"
  />
  <ChatTodayMeme
    v-else-if="isTodayMemeCard && hasTodayMemeQcontent(item)"
    class="library-card-question-body__meme"
    display-mode="request"
    request-delivered
    :theme-color-hex="item.colorHex ?? ''"
  />
  <p v-else>{{ item.qcontent }}</p>
</template>

<script setup lang="ts">
import type { LibraryCardDetail } from '~/types/library'
import { useLibraryStore } from '~/composables/library/useLibraryStore'
import {
  isRecommendLibraryCardItem,
  parseRecommendConfigFromAgentForLibrary,
  parseRecommendPayloadFromPrompt,
  resolveRecommendConfigByAgentIdForLibrary,
} from '~/utils/chat/recommendAgentUtil'
import { NEWS_CURATOR_AGENT_ID, parseNewsCuratorPromptMeta } from '~/utils/chat/newsCuratorUtil'
import { hasTodayMemeQcontent, isTodayMemeLibraryCard } from '~/utils/chat/todayMemeUtil'
import {
  isSurveyLibraryCardItem,
  parseSurveyAnswersFromPrompt,
  parseSurveyConfigFromAgent,
  resolveSurveyConfigByAgentId,
} from '~/utils/chat/surveyUtil'

const props = defineProps<{
  item: LibraryCardDetail
}>()

const { libraryAgents } = useLibraryStore()

const item = computed(() => props.item)

const isSurveyCard = computed(() => isSurveyLibraryCardItem(item.value, libraryAgents.value))

const surveyConfig = computed(() => {
  const agentId = item.value.agentId ?? ''
  if (!agentId) return null
  const agent = libraryAgents.value.find((a) => a.agentId === agentId)
  if (agent) return parseSurveyConfigFromAgent(agent)
  return resolveSurveyConfigByAgentId(agentId, libraryAgents.value)
})

const surveyAnswers = computed(() => parseSurveyAnswersFromPrompt(item.value.qcontent ?? ''))

const isRecommendCard = computed(() => isRecommendLibraryCardItem(item.value, libraryAgents.value))

const recommendConfig = computed(() => {
  if (!isRecommendCard.value) return null
  const agentId = item.value.agentId ?? ''
  if (!agentId) return null
  const agent = libraryAgents.value.find((a) => a.agentId === agentId)
  if (agent) return parseRecommendConfigFromAgentForLibrary(agent)
  return resolveRecommendConfigByAgentIdForLibrary(agentId, libraryAgents.value)
})

const recommendPayload = computed(() => {
  const config = recommendConfig.value
  if (!config) return null
  return parseRecommendPayloadFromPrompt(item.value.qcontent ?? '', config)
})

const newsQuestionMeta = computed(() => {
  if (item.value.agentId !== NEWS_CURATOR_AGENT_ID) {
    return { categories: [] as string[], isNew: undefined as boolean | undefined }
  }
  return parseNewsCuratorPromptMeta(item.value.qcontent ?? '')
})

const newsCategories = computed(() => newsQuestionMeta.value.categories)

const newsIsNew = computed(() => item.value.agentId === NEWS_CURATOR_AGENT_ID && newsQuestionMeta.value.isNew === true)

const isTodayMemeCard = computed(() => isTodayMemeLibraryCard(item.value))
</script>

<style lang="scss" scoped>
.library-card-question-body__survey,
.library-card-question-body__recommend,
.library-card-question-body__news {
  width: 100%;
  max-width: 100%;
  max-height: min(560px, calc(100vh - 280px));
  overflow: hidden;
}

.library-card-question-body__meme {
  width: 100%;
  max-width: 100%;
}
</style>
