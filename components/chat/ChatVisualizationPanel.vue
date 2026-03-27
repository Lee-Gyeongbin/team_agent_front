<template>
  <div
    class="chat-vis-panel"
    :class="{ 'is-open': open, 'is-fullscreen': isFullscreen }"
  >
    <!-- 헤더 -->
    <div class="chat-vis-header">
      <span class="chat-vis-title">데이터 시각화 뷰</span>
      <div class="chat-vis-header-actions">
        <button
          class="btn btn-icon"
          type="button"
          title="새로고침"
          @click="onRefresh"
        >
          <i class="icon-refresh size-16"></i>
        </button>
        <button
          class="btn btn-icon"
          type="button"
          :title="isFullscreen ? '축소' : '전체화면'"
          @click="toggleFullscreen"
        >
          <i
            :class="isFullscreen ? 'icon-collapse' : 'icon-expand'"
            class="size-20"
          ></i>
        </button>
        <button
          class="btn btn-icon"
          type="button"
          title="닫기"
          @click="onClose"
        >
          <i class="icon-close size-16"></i>
        </button>
      </div>
    </div>

    <ChatVisualizationContent
      :open="open"
      :view-model="currentVisualizationView"
      :on-refresh="onRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { clearBodyChartFullscreen, toggleBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
const { visualizationViewMap, handleSelectVisualizationData } = useChatStore()

interface Props {
  open: boolean
  messageId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  messageId: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:fullscreen': [value: boolean]
}>()

const isFullscreen = ref(false)
const currentVisualizationView = computed(() => {
  const id = props.messageId
  return visualizationViewMap.value[id ?? ''] ?? null
})

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  toggleBodyChartFullscreen(isFullscreen.value)
  emit('update:fullscreen', isFullscreen.value)
}

const onClose = () => {
  isFullscreen.value = false
  clearBodyChartFullscreen()
  emit('update:fullscreen', false)
  emit('update:open', false)
}

const onRefresh = async () => {
  if (!props.messageId) return
  await handleSelectVisualizationData(props.messageId)
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      isFullscreen.value = false
      clearBodyChartFullscreen()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  clearBodyChartFullscreen()
})
</script>
