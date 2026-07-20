<template>
  <div
    ref="chatPageRef"
    class="chat-page-wrap"
  >
    <div
      class="chat-index s-center"
      :class="{
        'is-survey-mode':
          isSurveyVisible ||
          isGenderStepVisible ||
          isRecommendVisible ||
          isTranslateVisible ||
          isAutoRecommendVisible ||
          isNewsCuratorVisible,
      }"
      :style="activeThemeStyle"
    >
      <div class="chat-index-main">
        <!-- 헤더 (설문 모드에서 숨김) -->
        <div
          v-if="
            !isSurveyVisible &&
            !isGenderStepVisible &&
            !isRecommendVisible &&
            !isTranslateVisible &&
            !isAutoRecommendVisible &&
            !isNewsCuratorVisible
          "
          class="chat-index-header"
          data-aos="fade-up"
        >
          <h1 class="chat-index-title f-center">TeamAgent</h1>
          <p class="chat-index-description f-center">{{ greetingText }}</p>
        </div>

        <!-- 채팅 입력창 (설문 진행 중 비활성화, 데이터분석 모드는 잠금 제외) -->
        <div
          class="chat-index-input-wrapper"
          :class="{
            'is-survey-locked':
              isSurveyVisible ||
              isGenderStepVisible ||
              isRecommendVisible ||
              isTranslateVisible ||
              isAutoRecommendVisible ||
              isNewsCuratorVisible,
          }"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <DataQuestionGuide
            :theme-icon-class-nm="selectedChatThemeAgent?.iconClassNm ?? 'icon-chart-ai'"
            :theme-color-hex="selectedChatThemeAgent?.colorHex ?? ''"
          />
          <ChatInput v-model="chatMessage">
            <template #above-input>
              <ChatInputGuide />
            </template>
          </ChatInput>
        </div>
      </div>

      <!-- 설문 에이전트 (svcTy C + subCfg SURVEY) -->
      <ChatSurvey
        v-if="(isSurveyVisible || isGenderStepVisible) && currentSurveyConfig"
        class="chat-index-survey"
        :survey-config="currentSurveyConfig"
        :theme-icon-class-nm="selectedChatThemeAgent?.iconClassNm ?? ''"
        :theme-color-hex="selectedChatThemeAgent?.colorHex ?? ''"
        @close="handleClosePsychologySurvey"
        @submit="handleIndexSurveySubmit"
      />
      <ChatRecommendAgentCard
        v-if="isRecommendVisible && currentRecommendConfig"
        class="chat-index-survey"
        :recommend-config="currentRecommendConfig"
        :theme-icon-class-nm="selectedChatThemeAgent?.iconClassNm ?? ''"
        :theme-color-hex="selectedChatThemeAgent?.colorHex ?? ''"
        @close="handleCloseRecommendAgent"
        @submit="handleIndexRecommendSubmit"
      />
      <ChatTranslateCard
        v-if="isTranslateVisible && currentTranslateConfig"
        class="chat-index-survey"
        :translate-config="currentTranslateConfig"
        :theme-icon-class-nm="selectedChatThemeAgent?.iconClassNm ?? ''"
        :theme-color-hex="selectedChatThemeAgent?.colorHex ?? ''"
        @close="handleCloseTranslateAgent"
        @submit="handleIndexTranslateSubmit"
      />
      <ChatAutoRecommendCard
        v-if="isAutoRecommendVisible && currentAutoRecommendConfig"
        class="chat-index-survey"
        :config="currentAutoRecommendConfig"
        :theme-icon-class-nm="selectedChatThemeAgent?.iconClassNm ?? ''"
        :theme-color-hex="selectedChatThemeAgent?.colorHex ?? ''"
        @intro-complete="handleAutoRecommendIntroEnd"
      />
      <ChatNewsCurator
        v-if="isNewsCuratorVisible"
        class="chat-index-survey chat-index-news-curator"
        :config="currentCurationConfig"
        :theme-icon-class-nm="selectedChatThemeAgent?.iconClassNm ?? ''"
        :theme-color-hex="selectedChatThemeAgent?.colorHex ?? ''"
        @close="handleCloseNewsCurator"
        @submit="handleIndexNewsCuratorSubmit"
      />
      <!-- 에이전트 카드 (설문 모드 아닐 때) -->
      <template
        v-if="
          !isSurveyVisible &&
          !isGenderStepVisible &&
          !isRecommendVisible &&
          !isTranslateVisible &&
          !isAutoRecommendVisible &&
          !isNewsCuratorVisible
        "
      >
        <div
          class="chat-index-theme-section"
          :aria-hidden="!showThemeArrows || undefined"
        >
          <button
            v-show="showThemeArrows"
            type="button"
            class="chat-index-theme-arrow chat-index-theme-arrow--prev"
            :disabled="activeThemeIndex === 0"
            aria-label="이전 테마"
            @click="moveToPrevTheme"
          >
            ‹
          </button>
          <!-- 테마 캐러셀 (4테마 에이전트) -->
          <ChatThemeCarousel
            v-if="isLoadingChatIndexAgents || hasThemeAgents"
            v-model:active-key="activeThemeKey"
            :agents="chatIndexAgents"
            :selected-agent-id="selectedChatAgentId"
            :is-loading="isLoadingChatIndexAgents"
            @select="onClickChatIndexAgent"
          />
          <p
            v-else
            class="chat-index-agent-hint f-center"
          >
            사용 가능한 에이전트가 없습니다. 에이전트 관리에서 등록해 주세요.
          </p>
          <button
            v-show="showThemeArrows"
            type="button"
            class="chat-index-theme-arrow chat-index-theme-arrow--next"
            :disabled="activeThemeIndex === CHAT_THEMES.length - 1"
            aria-label="다음 테마"
            @click="moveToNextTheme"
          >
            ›
          </button>
        </div>
      </template>
      <!-- 메일 브리핑 로그인 모달 -->
      <MailLoginModal
        :is-open="isLoginModalOpen"
        @close="closeLoginModal"
        @success="onMailLoginSuccess"
      />
      <!-- 사용 가능 기능 안내 (NOTICE_FEATURE, enblYn=Y) -->
      <ChatFeatureNoticeModal
        :is-open="isFeatureNoticeOpen"
        :content="featureNoticeContent"
        @close="closeFeatureNotice"
        @confirm="closeFeatureNotice"
        @hide="hideFeatureNoticeForever"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseSurveyConfigFromAgent } from '~/utils/chat/surveyUtil'
import { parseRecommendConfigFromAgent } from '~/utils/chat/recommendAgentUtil'
import { parseTranslateConfigFromAgent } from '~/utils/chat/translateAgentUtil'
import { parseCurationConfigFromAgent } from '~/utils/chat/newsCuratorUtil'
import { parseAutoRecommendConfigFromAgent } from '~/utils/chat/autoRecommendUtil'
import { CHAT_THEMES, groupAgentsByTheme, getInitialThemeKey, findThemeByKey } from '~/utils/chat/chatThemeUtil'
import { useMailStore } from '~/composables/mail/useMailStore'
import { useDataQuestionGate } from '~/composables/chat/useDataQuestionGate'
import { useChatFeatureNotice } from '~/composables/chat/useChatFeatureNotice'
import type { Agent } from '~/types/agent'

const { chatMessage, selectChatRoomList, selectModelOptions, resetChatRoom } = useChatRooms()
const { resetGate } = useDataQuestionGate()
const {
  selectedChatAgentId,
  selectedChatThemeAgent,
  selectChatIndexAgent,
  handleResetChatPanels,
  chatIndexAgents,
  isLoadingChatIndexAgents,
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
  isAutoRecommendVisible,
  handleAutoRecommendIntroEnd,
  resetAutoRecommendPanel,
  isNewsCuratorVisible,
  handleCloseNewsCurator,
  handleIndexNewsCuratorSubmit,
} = useChatStore()
const { startChatSocket, stopChatSocket } = useChatSocket()
const { user } = useAuth()
const { isLoginModalOpen, openLoginModal, closeLoginModal, checkMailAuth } = useMailStore()
const { getChatGuideByType, fetchChatGuideList } = useChatGuide()
const {
  isOpen: isFeatureNoticeOpen,
  content: featureNoticeContent,
  closeModal: closeFeatureNotice,
  hideForever: hideFeatureNoticeForever,
  initFeatureNotice,
} = useChatFeatureNotice()
const THEME_BG_FADE_MS = 1000
let themeBgFadeTimer: ReturnType<typeof window.setTimeout> | null = null

// ===== 테마 캐러셀 상태 =====

/** 풀너비 페이지 래퍼 ref — 드래그 및 화살표 버튼 기준점 */
const chatPageRef = ref<HTMLElement | null>(null)

/** 현재 활성 테마 키 */
const activeThemeKey = ref(CHAT_THEMES[0].key)

/** 활성 테마 인덱스 */
const activeThemeIndex = computed(() => CHAT_THEMES.findIndex((t) => t.key === activeThemeKey.value))

const moveToPrevTheme = () => {
  if (activeThemeIndex.value > 0) activeThemeKey.value = CHAT_THEMES[activeThemeIndex.value - 1].key
}

const moveToNextTheme = () => {
  if (activeThemeIndex.value < CHAT_THEMES.length - 1)
    activeThemeKey.value = CHAT_THEMES[activeThemeIndex.value + 1].key
}

/** 테마별로 그룹핑된 에이전트 */
const groupedAgents = computed(() => groupAgentsByTheme(chatIndexAgents.value))

/** 4테마 중 에이전트가 1개 이상 있으면 true */
const hasThemeAgents = computed(() => CHAT_THEMES.some((t) => (groupedAgents.value[t.key]?.length ?? 0) > 0))

/** 화살표 버튼 표시 여부 — v-show 전용 (v-if 사용 시 DOM 동적 추가/제거로 Nuxt 루트 경고 발생) */
const showThemeArrows = computed(
  () =>
    (isLoadingChatIndexAgents.value || hasThemeAgents.value) &&
    !isSurveyVisible.value &&
    !isGenderStepVisible.value &&
    !isRecommendVisible.value &&
    !isTranslateVisible.value &&
    !isAutoRecommendVisible.value &&
    !isNewsCuratorVisible.value,
)

/** 활성 테마 CSS 변수 스타일 — .chat-index 스코프에 주입 (primary 계열 변수) */
const activeThemeStyle = computed(() => {
  const theme = findThemeByKey(activeThemeKey.value)
  if (!theme) return undefined
  return {
    '--color-primary': theme.primary,
    '--color-primary-hover': theme.primaryHover,
    '--color-primary-dark': theme.primaryDark,
    '--color-primary-dark-hover': theme.primaryDarkHover,
    '--color-primary-rgb': theme.primaryRgb,
    '--color-primary-bg': theme.primaryBg,
  }
})

/** document.documentElement에 테마 배경 CSS 변수를 전역 적용한다 */
const applyGlobalThemeBg = (themeKey: string) => {
  const theme = findThemeByKey(themeKey)
  const root = document.documentElement
  if (!theme) return

  const nextBg = theme.bgGradient
  const nextSidebarBg = theme.sidebarBg

  const currentBg = root.style.getPropertyValue('--chat-theme-bg-base').trim()
  const currentSidebarBg = root.style.getPropertyValue('--chat-theme-sidebar-bg-base').trim()

  // 첫 적용은 즉시 반영 (초기 진입 시 깜빡임 방지)
  if (!currentBg && !currentSidebarBg) {
    root.style.setProperty('--chat-theme-bg-base', nextBg)
    root.style.setProperty('--chat-theme-sidebar-bg-base', nextSidebarBg)
    root.style.setProperty('--chat-theme-bg-overlay-opacity', '0')
    root.style.setProperty('--chat-theme-bg-overlay-scale', '0')
    root.style.setProperty('--chat-theme-sidebar-bg-overlay-opacity', '0')
    root.style.setProperty('--chat-theme-sidebar-bg-overlay-scale', '0')
    return
  }

  // 동일 테마 재적용은 무시
  if (currentBg === nextBg && currentSidebarBg === nextSidebarBg) return

  // 새 테마는 base에 즉시 반영하고, 이전 테마를 overlay로 올려 위에서 아래로 걷어낸다.
  // 반투명 그라데이션끼리 겹쳐 진해지는 현상을 방지한다.
  root.style.setProperty('--chat-theme-bg-base', nextBg)
  root.style.setProperty('--chat-theme-sidebar-bg-base', nextSidebarBg)
  root.style.setProperty('--chat-theme-bg-overlay', currentBg)
  root.style.setProperty('--chat-theme-sidebar-bg-overlay', currentSidebarBg)
  root.style.setProperty('--chat-theme-bg-overlay-opacity', '1')
  root.style.setProperty('--chat-theme-sidebar-bg-overlay-opacity', '1')
  root.style.setProperty('--chat-theme-bg-overlay-scale', '1')
  root.style.setProperty('--chat-theme-sidebar-bg-overlay-scale', '1')

  // transition 트리거를 위해 reflow 보장 후 scale 축소
  void root.offsetHeight
  root.style.setProperty('--chat-theme-bg-overlay-scale', '0')
  root.style.setProperty('--chat-theme-sidebar-bg-overlay-scale', '0')

  if (themeBgFadeTimer) window.clearTimeout(themeBgFadeTimer)
  themeBgFadeTimer = window.setTimeout(() => {
    root.style.setProperty('--chat-theme-bg-overlay-opacity', '0')
    root.style.setProperty('--chat-theme-bg-overlay-scale', '0')
    root.style.setProperty('--chat-theme-sidebar-bg-overlay-opacity', '0')
    root.style.setProperty('--chat-theme-sidebar-bg-overlay-scale', '0')
    themeBgFadeTimer = null
  }, THEME_BG_FADE_MS)
}

const clearGlobalThemeBg = () => {
  const root = document.documentElement
  if (themeBgFadeTimer) {
    window.clearTimeout(themeBgFadeTimer)
    themeBgFadeTimer = null
  }
  root.style.removeProperty('--chat-theme-bg-base')
  root.style.removeProperty('--chat-theme-bg-overlay')
  root.style.removeProperty('--chat-theme-bg-overlay-opacity')
  root.style.removeProperty('--chat-theme-bg-overlay-scale')
  root.style.removeProperty('--chat-theme-sidebar-bg-base')
  root.style.removeProperty('--chat-theme-sidebar-bg-overlay')
  root.style.removeProperty('--chat-theme-sidebar-bg-overlay-opacity')
  root.style.removeProperty('--chat-theme-sidebar-bg-overlay-scale')
}

/** 에이전트 로드 완료 후 에이전트가 있는 첫 테마로 이동 */
watch(
  () => isLoadingChatIndexAgents.value,
  (loading) => {
    if (!loading) {
      activeThemeKey.value = getInitialThemeKey(groupedAgents.value)
    }
  },
)

/** activeThemeKey 변경 시 전역 배경 즉시 반영 */
watch(
  activeThemeKey,
  (key) => {
    applyGlobalThemeBg(key)
  },
  { immediate: true },
)

/** guideTpCd '001' 인사 멘트 — 있으면 content의 {{userName}} 치환, 없으면 기존 텍스트 */
const greetingText = computed(() => {
  const greetGuide = getChatGuideByType('001').find((item) => item.enblYn === 'Y')
  if (greetGuide?.content) {
    return greetGuide.content.replace('{{userName}}', user.value?.userNm ?? '')
  }
  return (user.value?.userNm ? user.value.userNm + '님, ' : '') + '어떤게 궁금하세요?'
})

/** 카드 클릭 분기: 메일(svcTy=A)은 인증 확인 후 이동 or 로그인 모달, 그 외는 기존 에이전트 선택 */
const onClickChatIndexAgent = async (agent: Agent) => {
  if (agent.svcTy === 'A') {
    const authed = await checkMailAuth()
    if (authed) {
      await navigateTo('/mail')
    } else {
      openLoginModal()
    }
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
const currentSurveyConfig = computed(() => {
  const agent = selectedChatThemeAgent.value
  return agent ? parseSurveyConfigFromAgent(agent) : null
})
const currentRecommendConfig = computed(() => {
  const agent = selectedChatThemeAgent.value
  return agent ? parseRecommendConfigFromAgent(agent) : null
})
const currentTranslateConfig = computed(() => {
  const agent = selectedChatThemeAgent.value
  return agent ? parseTranslateConfigFromAgent(agent) : null
})
const currentCurationConfig = computed(() => {
  const agent = selectedChatThemeAgent.value
  return agent ? parseCurationConfigFromAgent(agent) : null
})
const currentAutoRecommendConfig = computed(() => {
  const agent = selectedChatThemeAgent.value
  return agent ? parseAutoRecommendConfigFromAgent(agent) : null
})

onMounted(async () => {
  // 시각화 패널에서 나와 다시 일반 채팅으로 들어올 때 이전 tableData가 남지 않게 초기화
  handleResetChatPanels()
  resetGate()
  // 다른 메뉴 갔다 돌아올 때 설문 / 에이전트 선택 상태 초기화
  handleClosePsychologySurvey()
  handleCloseRecommendAgent()
  handleCloseTranslateAgent()
  handleCloseNewsCurator()
  resetAutoRecommendPanel()
  // 인덱스 진입 시점에 즉시 채팅방 상태를 초기화해
  // 비동기 로딩 완료 시점의 늦은 reset으로 인한 레이스를 방지한다.
  resetChatRoom()
  // 챗봇 가이드 최신화 — chat-guide 설정 수정 후 재진입 시 반영
  await Promise.all([selectChatRoomList(), handleSelectChatIndexAgents(), selectModelOptions(), fetchChatGuideList()])
  // /chat에서 /chat/[id]로 이미 이동한 뒤 비동기 완료 시 reset이 늦게 실행되어
  // 방금 생성한 방의 로컬 메시지가 지워지는 레이스 컨디션을 방지한다.
  if (!isMountedChatIndex.value) return
  // NOTICE_FEATURE — enblYn=Y 이고 표시 조건 충족 시 모달
  initFeatureNotice()
  // 채팅소켓 시작
  startChatSocket()
})

onUnmounted(() => {
  isMountedChatIndex.value = false
})

onBeforeRouteLeave((to) => {
  // 페이지 전환 시작 전에 테마 CSS 변수를 즉시 제거 — 사이드바/헤더 색상 원복
  // onUnmounted는 전환 애니메이션 종료 후 호출되어 늦으므로 여기서 처리
  clearGlobalThemeBg()
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

.chat-index-main {
  position: relative;
  width: 100%;

  :deep(.dq-guide) {
    top: 8px;
  }
}

.chat-index-input-wrapper {
  position: relative;
}

.chat-index:not(.is-survey-mode) {
  .chat-index-main {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .chat-index-input-wrapper {
    margin-bottom: $spacing-md;
  }
}

// 설문 모드: 카드 상단 · 채팅 입력창 뷰포트 하단 고정
.chat-index.is-survey-mode {
  justify-content: flex-start;
  padding-top: $spacing-lg;
  min-height: calc(100vh - #{$header-height});
  gap: $spacing-md;

  .chat-index-main {
    order: 2;
    width: 100%;
    margin-top: 0;
    flex-shrink: 0;
  }

  .chat-index-input-wrapper {
    margin-top: 0;
    margin-bottom: $spacing-md;
    flex-shrink: 0;
    width: 100%;
  }
}

// 설문 컴포넌트: 남은 세로 공간을 모두 차지, 입력창과 간격 확보
.chat-index-survey {
  order: 1;
  flex: 0 0 auto;
  height: min(640px, calc(100vh - #{$header-height} - 180px));
  max-height: min(640px, calc(100vh - #{$header-height} - 180px));
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 760px;
  align-self: stretch;
  margin-bottom: 0;
  overflow: hidden;
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
