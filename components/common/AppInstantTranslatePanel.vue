<template>
  <div
    ref="panelWrapRef"
    class="instant-translate-wrap"
  >
    <button
      type="button"
      class="header-btn instant-translate-trigger-btn"
      :class="{ 'is-active': isPanelOpen }"
      title="번역 설정"
      @click.stop="onTogglePanel"
    >
      <i class="icon-agent-translate size-20" />
    </button>

    <div
      v-if="isPanelOpen"
      class="instant-translate-panel"
      :style="translateThemeStyle"
      role="dialog"
      aria-labelledby="instant-translate-panel-title"
    >
      <div class="instant-translate-panel__header">
        <div class="instant-translate-panel__header-main">
          <span class="instant-translate-panel__avatar">
            <i class="icon-agent-translate size-16" />
          </span>
          <h2
            id="instant-translate-panel-title"
            class="instant-translate-panel__title"
          >
            번역 설정
          </h2>
        </div>
        <span
          v-if="isInstantTranslateActive"
          class="instant-translate-panel__status"
        >
          <i class="icon-check size-12" />
          즉시번역 사용 중
        </span>
      </div>

      <div class="instant-translate-panel__body">
        <div class="instant-translate-panel__field">
          <label class="instant-translate-panel__label">목표 언어</label>
          <UiSelect
            v-model="draftForm.targetLang"
            :options="DEFAULT_LANGUAGES"
            size="sm"
            :disable-portal="true"
          />
        </div>

        <div class="instant-translate-panel__field">
          <label class="instant-translate-panel__label">톤</label>
          <UiSelect
            v-model="draftForm.tone"
            :options="DEFAULT_TONES"
            size="sm"
            :disable-portal="true"
          />
        </div>
      </div>

      <div class="instant-translate-panel__footer">
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="onClose"
        >
          닫기
        </UiButton>
        <UiButton
          variant="dark"
          size="sm"
          @click="onApply"
        >
          적용
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_LANGUAGES, DEFAULT_TONES } from '~/utils/agent/translateConfigUtil'
import { isTranslateAgent, useInstantTranslate } from '~/utils/chat/translateAgentUtil'

interface InstantTranslateSettingsForm {
  targetLang: string
  tone: string
}

const { isInstantTranslateActive, instantTranslateOptions, enableInstantTranslate } = useInstantTranslate()
const { chatIndexAgents, getChatIndexAgentColorStyle, handleSelectChatIndexAgents } = useChatStore()

const translateThemeStyle = computed(() => {
  const agent = chatIndexAgents.value.find(isTranslateAgent)
  const colorHex = String(agent?.colorHex ?? '').trim()
  if (!colorHex) return undefined
  return getChatIndexAgentColorStyle(colorHex)
})

const panelWrapRef = ref<HTMLElement | null>(null)
const isPanelOpen = ref(false)

const appliedForm = ref<InstantTranslateSettingsForm>({
  targetLang: DEFAULT_LANGUAGES[0]?.value ?? '',
  tone: DEFAULT_TONES[0]?.value ?? '',
})

const draftForm = ref<InstantTranslateSettingsForm>({ ...appliedForm.value })

const resolveTargetLangLabel = (targetLang: string) =>
  DEFAULT_LANGUAGES.find((item) => item.value === targetLang)?.label ?? targetLang

const resolveToneLabel = (tone: string) => DEFAULT_TONES.find((item) => item.value === tone)?.label ?? tone

const syncAppliedFromInstantTranslate = () => {
  if (!isInstantTranslateActive.value) return

  const lang = DEFAULT_LANGUAGES.find((item) => item.label === instantTranslateOptions.value.targetLangLabel)
  const tone = DEFAULT_TONES.find((item) => item.label === instantTranslateOptions.value.toneLabel)

  appliedForm.value = {
    targetLang: lang?.value ?? appliedForm.value.targetLang,
    tone: tone?.value ?? appliedForm.value.tone,
  }
}

const syncDraftFromApplied = () => {
  draftForm.value = { ...appliedForm.value }
}

const onTogglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
  if (isPanelOpen.value) {
    syncAppliedFromInstantTranslate()
    syncDraftFromApplied()
  }
}

const onClose = () => {
  syncDraftFromApplied()
  isPanelOpen.value = false
}

const onApply = () => {
  appliedForm.value = { ...draftForm.value }
  enableInstantTranslate({
    targetLangLabel: resolveTargetLangLabel(appliedForm.value.targetLang),
    toneLabel: resolveToneLabel(appliedForm.value.tone),
  })
  isPanelOpen.value = false
}

const onPointerDownOutside = (event: PointerEvent) => {
  if (!isPanelOpen.value) return
  const target = event.target
  if (target instanceof Node && panelWrapRef.value?.contains(target)) return
  onClose()
}

onMounted(async () => {
  if (!chatIndexAgents.value.some(isTranslateAgent)) {
    await handleSelectChatIndexAgents()
  }
  document.addEventListener('pointerdown', onPointerDownOutside)
})
onUnmounted(() => document.removeEventListener('pointerdown', onPointerDownOutside))
</script>

<style lang="scss" scoped>
.instant-translate-wrap {
  position: relative;
}

.instant-translate-trigger-btn {
  &.is-active {
    background-color: #e6e8ea;
    color: #58616a;
  }
}

.instant-translate-panel {
  position: absolute;
  top: calc(100% + #{$spacing-xs});
  right: 0;
  z-index: $z-dropdown;
  width: 320px;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  overflow: visible;
}

.instant-translate-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: 14px $spacing-md;
  border-bottom: 1px solid $color-border-light;
}

.instant-translate-panel__header-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.instant-translate-panel__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: $border-radius-lg;
  background: var(--card-icon-bg, var(--color-primary-bg));
  color: var(--card-icon-color, var(--color-primary));
}

.instant-translate-panel__title {
  margin: 0;
  @include typo($body-medium-bold, $color-text-heading);
}

.instant-translate-panel__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px 8px;
  border: 1px solid var(--card-icon-color, var(--color-primary));
  border-radius: $border-radius-100;
  background: var(--card-icon-bg, var(--color-primary-bg));
  @include typo($body-xsmall-bold, var(--card-icon-color, var(--color-primary)));

  i {
    color: var(--card-icon-color, var(--color-primary));
  }
}

.instant-translate-panel__body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-md;
}

.instant-translate-panel__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.instant-translate-panel__label {
  @include typo($body-small-bold, $color-text-heading);
}

.instant-translate-panel__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md $spacing-md;
}
</style>
