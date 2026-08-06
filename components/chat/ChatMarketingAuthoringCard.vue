<template>
  <section
    class="chat-marketing-authoring-card"
    :style="themeStyle"
  >
    <div class="chat-marketing-authoring-card__content">
      <MarketingUnifiedWizard
        :config="config"
        :theme-color-hex="themeColorHex"
        @close="emit('close')"
        @submit="emit('submit', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MarketingAuthoringAgentConfig } from '~/types/agent'
import type { MarketingAuthoringSubmitPayload } from '~/types/chat'
import { resolveMarketingAgentThemeStyle } from '~/utils/chat/marketingAuthoringUtil'

interface Props {
  config: MarketingAuthoringAgentConfig
  themeColorHex?: string
}

const props = withDefaults(defineProps<Props>(), {
  themeColorHex: '',
})

const emit = defineEmits<{
  close: []
  submit: [payload: MarketingAuthoringSubmitPayload]
}>()

const themeStyle = computed(() => resolveMarketingAgentThemeStyle(props.themeColorHex))
</script>
