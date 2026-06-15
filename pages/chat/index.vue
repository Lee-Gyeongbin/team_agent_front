<template>
  <div
    class="chat-index s-center"
    :class="{
      'is-survey-mode':
        isSurveyVisible ||
        isGenderStepVisible ||
        isRecommendVisible ||
        isTranslateVisible ||
        isTodayMemeVisible ||
        isNewsCuratorVisible,
    }"
  >
    <!-- 헤더 (설문 모드에서 숨김) -->
    <div
      v-if="
        !isSurveyVisible &&
        !isGenderStepVisible &&
        !isRecommendVisible &&
        !isTranslateVisible &&
        !isTodayMemeVisible &&
        !isNewsCuratorVisible
      "
      class="chat-index-header"
      data-aos="fade-up"
    >
      <h1 class="chat-index-title f-center">TeamAgent</h1>
      <p class="chat-index-description f-center">{{ user?.userNm + '님, ' || '' }}어떤게 궁금하세요?</p>
    </div>

    <!-- 설문 에이전트 (svcTy C + subCfg SURVEY) -->
    <ChatSurvey
      v-if="(isSurveyVisible || isGenderStepVisible) && currentSurveyConfig"
      class="chat-index-survey"
      :survey-config="currentSurveyConfig"
      :theme-icon-class-nm="currentSurveyAgent?.iconClassNm ?? ''"
      :theme-color-hex="currentSurveyAgent?.colorHex ?? ''"
      @close="handleClosePsychologySurvey"
      @submit="handleIndexSurveySubmit"
    />
    <ChatRecommendAgentCard
      v-if="isRecommendVisible && currentRecommendConfig"
      class="chat-index-survey"
      :recommend-config="currentRecommendConfig"
      :theme-icon-class-nm="currentSurveyAgent?.iconClassNm ?? ''"
      :theme-color-hex="currentSurveyAgent?.colorHex ?? ''"
      @close="handleCloseRecommendAgent"
      @submit="handleIndexRecommendSubmit"
    />
    <ChatTranslateCard
      v-if="isTranslateVisible && currentTranslateConfig"
      class="chat-index-survey"
      :translate-config="currentTranslateConfig"
      :theme-icon-class-nm="currentSurveyAgent?.iconClassNm ?? ''"
      :theme-color-hex="currentSurveyAgent?.colorHex ?? ''"
      @close="handleCloseTranslateAgent"
      @submit="handleIndexTranslateSubmit"
    />
    <ChatTodayMeme
      v-if="isTodayMemeVisible"
      class="chat-index-survey"
      :theme-icon-class-nm="currentSurveyAgent?.iconClassNm ?? ''"
      :theme-color-hex="currentSurveyAgent?.colorHex ?? ''"
      @intro-complete="handleTodayMemeIntroEnd"
    />
    <ChatNewsCurator
      v-if="isNewsCuratorVisible"
      class="chat-index-survey chat-index-news-curator"
      :config="currentCurationConfig"
      :theme-icon-class-nm="currentSurveyAgent?.iconClassNm ?? ''"
      :theme-color-hex="currentSurveyAgent?.colorHex ?? ''"
      @close="handleCloseNewsCurator"
      @submit="handleIndexNewsCuratorSubmit"
    />

    <!-- 채팅 입력창 (설문 진행 중 비활성화) -->
    <div
      class="chat-index-input-wrapper"
      :class="{
        'is-survey-locked':
          isSurveyVisible ||
          isGenderStepVisible ||
          isRecommendVisible ||
          isTranslateVisible ||
          isTodayMemeVisible ||
          isNewsCuratorVisible,
      }"
      data-aos="fade-up"
      data-aos-delay="200"
    >
      <ChatInput v-model="chatMessage" />
    </div>

    <!-- 에이전트 카드 (설문 모드 아닐 때) -->
    <template
      v-if="
        !isSurveyVisible &&
        !isGenderStepVisible &&
        !isRecommendVisible &&
        !isTranslateVisible &&
        !isTodayMemeVisible &&
        !isNewsCuratorVisible
      "
    >
      <div
        v-if="!isLoadingChatIndexAgents && chatIndexAgents.length > 0"
        class="chat-index-card-grp"
        :class="{ 'is-few': chatIndexAgents.length <= 3 }"
        data-aos="fade-up"
        data-aos-delay="400"
      >
        <button
          v-for="agent in chatIndexAgents"
          :key="agent.agentId"
          type="button"
          class="chat-index-card"
          :class="{ 'is-active': selectedChatAgentId === agent.agentId }"
          :style="getChatIndexAgentColorStyle(agent.colorHex ?? '')"
          @click="onClickChatIndexAgent(agent)"
        >
          <div class="chat-index-card-default">
            <span class="icon-circle"
              ><i :class="[agent.iconClassNm ? agent.iconClassNm : 'icon-search', 'size-24']"
            /></span>
            <div class="chat-index-card-info">
              <p class="chat-index-card-name">{{ agent.agentNm }}</p>
              <p class="chat-index-card-sub">{{ getChatIndexAgentSubLabel(agent) }}</p>
            </div>
          </div>
          <div class="chat-index-card-hover">
            <p class="chat-index-card-hover-desc">{{ agent.description }}</p>
            <span class="chat-index-card-hover-action">시작하기 <i class="icon-chevron-right-sm size-12" /></span>
          </div>
        </button>
      </div>
      <p
        v-else-if="!isLoadingChatIndexAgents && chatIndexAgents.length === 0"
        class="chat-index-agent-hint f-center"
        data-aos="fade-up"
        data-aos-delay="400"
      >
        사용 가능한 에이전트가 없습니다. 에이전트 관리에서 등록해 주세요.
      </p>
    </template>
    <!-- 메일 브리핑 로그인 모달 -->
    <MailLoginModal
      :is-open="isLoginModalOpen"
      @close="closeLoginModal"
      @success="onMailLoginSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { parseSurveyConfigFromAgent } from '~/utils/chat/surveyUtil'
import { parseRecommendConfigFromAgent } from '~/utils/chat/recommendAgentUtil'
import { parseTranslateConfigFromAgent } from '~/utils/chat/translateAgentUtil'
import { parseCurationConfigFromAgent } from '~/utils/chat/newsCuratorUtil'
import { useMailStore } from '~/composables/mail/useMailStore'
import type { Agent } from '~/types/agent'

const { chatMessage, selectChatRoomList, selectModelOptions, resetChatRoom } = useChatRooms()
const {
  selectedChatAgentId,
  selectChatIndexAgent,
  handleResetChatPanels,
  chatIndexAgents,
  isLoadingChatIndexAgents,
  getChatIndexAgentSubLabel,
  getChatIndexAgentColorStyle,
  handleSelectChatIndexAgents,
  handleClosePsychologySurvey,
  isSurveyVisible,
  isGenderStepVisible,
  handleIndexSurveySubmit,
  isRecommendVisible,
  handleCloseRecommendAgent,
  handleIndexRecommendSubmit,
  isTranslateVisible,
  handleCloseTranslateAgent,
  handleIndexTranslateSubmit,
  isTodayMemeVisible,
  handleTodayMemeIntroEnd,
  resetTodayMemePanel,
  isNewsCuratorVisible,
  handleCloseNewsCurator,
  handleIndexNewsCuratorSubmit,
} = useChatStore()
const { startChatSocket, stopChatSocket } = useChatSocket()
const { user } = useAuth()
const { isLoginModalOpen, openLoginModal, closeLoginModal } = useMailStore()

/** 메일 브리핑 카드 클릭 → 로그인 모달 표시 */
const openMailLoginModal = () => openLoginModal()

/** 카드 클릭 분기: 메일(svcTy=A)은 로그인 모달, 그 외는 기존 에이전트 선택 */
const onClickChatIndexAgent = (agent: Agent) => {
  if (agent.svcTy === 'A') {
    openMailLoginModal()
    return
  }
  void selectChatIndexAgent(agent)
}

/** 로그인 성공 → 메일 대시보드로 이동 */
const onMailLoginSuccess = async () => {
  closeLoginModal()
  await nextTick()
  await navigateTo('/mail', { replace: true })
}

const isMountedChatIndex = ref(true)
const currentSurveyAgent = computed(
  () => chatIndexAgents.value.find((agent) => agent.agentId === selectedChatAgentId.value) ?? null,
)
const currentSurveyConfig = computed(() => {
  const agent = currentSurveyAgent.value
  return agent ? parseSurveyConfigFromAgent(agent) : null
})
const currentRecommendConfig = computed(() => {
  const agent = currentSurveyAgent.value
  return agent ? parseRecommendConfigFromAgent(agent) : null
})
const currentTranslateConfig = computed(() => {
  const agent = currentSurveyAgent.value
  return agent ? parseTranslateConfigFromAgent(agent) : null
})
const currentCurationConfig = computed(() => {
  const agent = currentSurveyAgent.value
  return agent ? parseCurationConfigFromAgent(agent) : null
})

onMounted(async () => {
  // 시각화 패널에서 나와 다시 일반 채팅으로 들어올 때 이전 tableData가 남지 않게 초기화
  handleResetChatPanels()
  // 다른 메뉴 갔다 돌아올 때 설문 / 에이전트 선택 상태 초기화
  handleClosePsychologySurvey()
  handleCloseRecommendAgent()
  handleCloseTranslateAgent()
  handleCloseNewsCurator()
  resetTodayMemePanel()
  // 인덱스 진입 시점에 즉시 채팅방 상태를 초기화해
  // 비동기 로딩 완료 시점의 늦은 reset으로 인한 레이스를 방지한다.
  resetChatRoom()
  await Promise.all([selectChatRoomList(), handleSelectChatIndexAgents(), selectModelOptions()])
  // /chat에서 /chat/[id]로 이미 이동한 뒤 비동기 완료 시 reset이 늦게 실행되어
  // 방금 생성한 방의 로컬 메시지가 지워지는 레이스 컨디션을 방지한다.
  if (!isMountedChatIndex.value) return
  // 채팅소켓 시작
  startChatSocket()
})

onUnmounted(() => {
  isMountedChatIndex.value = false
})

onBeforeRouteLeave((to) => {
  if (!String(to.path).startsWith('/chat')) {
    stopChatSocket()
  }
})
</script>

<style lang="scss" scoped>
.chat-index-agent-hint {
  margin-top: $spacing-lg;
  @include typo($body-small);
  color: $color-text-muted;
}

// 설문 모드: 카드 상단 · 채팅 입력창 뷰포트 하단 고정
.chat-index.is-survey-mode {
  justify-content: flex-start;
  padding-top: $spacing-lg;
  min-height: calc(100vh - #{$header-height});

  .chat-index-input-wrapper {
    margin-top: auto;
    margin-bottom: $spacing-lg;
    flex-shrink: 0;
    width: 100%;
  }
}

// 설문 컴포넌트: 남은 세로 공간을 모두 차지, 입력창과 간격 확보
.chat-index-survey {
  flex: 1;
  min-height: 0;
  width: 100%;
  margin-bottom: $spacing-md;
}

/** 뉴스픽 분야 선택 — 콘텐츠 높이만큼만 (하단 여백 방지) */
.chat-index-news-curator {
  flex: 0 1 auto;
}

// 설문 진행 중 입력창 비활성화
.chat-index-input-wrapper.is-survey-locked {
  pointer-events: none;
  opacity: 0.45;
  user-select: none;
}
</style>
