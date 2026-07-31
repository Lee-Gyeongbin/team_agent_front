<template>
  <section
    class="chat-marketing-authoring-card"
    :class="{
      'is-intro-playing': isIntroPlaying,
      'is-content-visible': isContentVisible,
    }"
    :style="themeStyle"
  >
    <Transition name="agent-intro">
      <div
        v-if="isIntroPlaying"
        class="chat-marketing-authoring-card__intro"
        aria-live="polite"
      >
        <div class="chat-marketing-authoring-card__intro-inner">
          <div class="chat-marketing-authoring-card__intro-avatar">
            <i :class="[themeIconClassNm || 'icon-edit', 'size-24']" />
          </div>
          <p class="chat-marketing-authoring-card__intro-title">
            <span
              v-for="(char, index) in introTitleChars"
              :key="`marketing-intro-title-${index}`"
              class="chat-marketing-authoring-card__intro-char"
              :style="{ '--intro-char-delay': `${index * 0.03}s` }"
              >{{ char === ' ' ? '\u00A0' : char }}</span
            >
          </p>
          <p class="chat-marketing-authoring-card__intro-subtitle">
            <span
              v-for="(char, index) in introSubtitleChars"
              :key="`marketing-intro-subtitle-${index}`"
              class="chat-marketing-authoring-card__intro-char"
              :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
              >{{ char === ' ' ? '\u00A0' : char }}</span
            >
          </p>
        </div>
      </div>
    </Transition>

    <template v-if="isContentVisible">
      <header class="chat-marketing-authoring-card__header">
        <div class="chat-marketing-authoring-card__header-info">
          <div class="chat-marketing-authoring-card__avatar">
            <i :class="[themeIconClassNm || 'icon-edit', 'size-24']" />
          </div>
          <div>
            <p class="chat-marketing-authoring-card__title">{{ headerTitle }}</p>
            <p class="chat-marketing-authoring-card__subtitle">
              {{ headerSubtitle }}
            </p>
          </div>
        </div>
      </header>

      <div class="chat-marketing-authoring-card__content">
        <!-- 모드 선택 -->
        <section
          v-if="marketingAgentMode === 'select'"
          class="marketing-agent-select"
        >
          <main class="marketing-agent-select__body">
            <div class="marketing-agent-select__cards">
              <article class="marketing-agent-select__card marketing-agent-select__card--generate">
                <div class="marketing-agent-select__card-body">
                  <div class="marketing-agent-select__card-icon">
                    <i class="icon-edit size-24" />
                  </div>
                  <h3 class="marketing-agent-select__card-title">문구·콘텐츠 작성</h3>
                  <p class="marketing-agent-select__card-desc">
                    광고 문구, SNS, 블로그, 이메일 등 다양한 채널에 맞는 문구를 빠르게 완성해보세요.
                  </p>
                </div>
                <UiButton
                  class="marketing-agent-select__card-btn"
                  variant="outline"
                  size="lg"
                  full-width
                  @click="setMarketingAgentMode('text')"
                >
                  문구 작성
                  <template #icon-right>
                    <i class="icon-arrow-right size-16" />
                  </template>
                </UiButton>
              </article>

              <article class="marketing-agent-select__card marketing-agent-select__card--image">
                <div class="marketing-agent-select__card-body">
                  <div class="marketing-agent-select__card-icon">
                    <i class="icon-image size-24" />
                  </div>
                  <h3 class="marketing-agent-select__card-title">마케팅 이미지 제작</h3>
                  <p class="marketing-agent-select__card-desc">
                    배너, 썸네일, 상세페이지, SNS 등 채널에 맞는 마케팅 이미지를 만들어보세요.
                  </p>
                </div>
                <UiButton
                  class="marketing-agent-select__card-btn"
                  variant="outline"
                  size="lg"
                  full-width
                  @click="setMarketingAgentMode('image')"
                >
                  이미지 제작
                  <template #icon-right>
                    <i class="icon-arrow-right size-16" />
                  </template>
                </UiButton>
              </article>
            </div>
          </main>

          <footer class="marketing-agent-select__footer">
            <UiButton
              variant="line-secondary"
              size="sm"
              @click="emit('close')"
            >
              닫기
            </UiButton>
          </footer>
        </section>

        <ChatMarketingGenerateCard
          v-else-if="marketingAgentMode === 'text'"
          :config="config"
          :theme-color-hex="themeColorHex"
          @close="setMarketingAgentMode('select')"
          @submit="emit('submit', { mode: 'TEXT', data: $event })"
        />

        <ChatMarketingImageGenerateCard
          v-else-if="marketingAgentMode === 'image'"
          :theme-color-hex="themeColorHex"
          @back="setMarketingAgentMode('select')"
          @submit="emit('submit', { mode: 'IMAGE', data: $event })"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { MarketingAuthoringAgentConfig } from '~/types/agent'
import type { MarketingAuthoringSubmitPayload } from '~/types/chat'
import { MARKETING_AGENT_SELECT_SUBTITLE, useMarketingAuthoring } from '~/utils/chat/marketingAuthoringUtil'

interface Props {
  config: MarketingAuthoringAgentConfig
  themeIconClassNm?: string
  themeColorHex?: string
}

const props = withDefaults(defineProps<Props>(), {
  themeIconClassNm: '',
  themeColorHex: '',
})

const emit = defineEmits<{
  close: []
  submit: [payload: MarketingAuthoringSubmitPayload]
}>()

const { marketingAgentMode, setMarketingAgentMode } = useMarketingAuthoring()

const MARKETING_INTRO_CONTENT_REVEAL_MS = 900
const MARKETING_INTRO_END_MS = 1400

const isIntroPlaying = ref(true)
const isContentVisible = ref(false)
let introStartTimer: ReturnType<typeof setTimeout> | null = null
let introEndTimer: ReturnType<typeof setTimeout> | null = null

const headerTitle = computed(() => props.config.ui.introTitle.trim() || '마케팅')
const introTitleChars = computed(() => headerTitle.value.split(''))
const introSubtitleChars = computed(() =>
  (props.config.ui.introSubtitle.trim() || '콘텐츠 생성을 준비 중입니다.').split(''),
)
const themeIconClassNm = computed(() => String(props.themeIconClassNm || '').trim())

const clearIntroTimers = () => {
  if (introStartTimer) clearTimeout(introStartTimer)
  if (introEndTimer) clearTimeout(introEndTimer)
  introStartTimer = null
  introEndTimer = null
}

onMounted(() => {
  isIntroPlaying.value = true
  isContentVisible.value = false
  introStartTimer = setTimeout(() => {
    isContentVisible.value = true
  }, MARKETING_INTRO_CONTENT_REVEAL_MS)
  introEndTimer = setTimeout(() => {
    isIntroPlaying.value = false
  }, MARKETING_INTRO_END_MS)
})

onUnmounted(() => {
  clearIntroTimers()
})

const headerSubtitle = computed(() => {
  if (marketingAgentMode.value === 'text') {
    return props.config.ui.introSubtitle.trim()
  }
  if (marketingAgentMode.value === 'image') return '용도와 채널에 맞는 마케팅 이미지를 제작합니다.'
  return MARKETING_AGENT_SELECT_SUBTITLE
})

const DEFAULT_THEME_HEX = '#7c5cfc'
const hexToRgb = (hex: string) => {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return '124, 92, 252'
  return `${parseInt(cleaned.slice(0, 2), 16)}, ${parseInt(cleaned.slice(2, 4), 16)}, ${parseInt(cleaned.slice(4, 6), 16)}`
}

const themeStyle = computed(() => {
  const colorHex = String(props.themeColorHex || '').trim() || DEFAULT_THEME_HEX
  return {
    '--marketing-agent-theme-color': colorHex,
    '--marketing-agent-theme-rgb': hexToRgb(colorHex),
  }
})
</script>
