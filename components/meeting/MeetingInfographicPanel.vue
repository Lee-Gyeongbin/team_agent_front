<template>
  <div class="meeting2-infographic-panel">
    <!-- 빈 상태 -->
    <template v-if="infographicList.length === 0">
      <UiEmpty
        icon="icon-view"
        title="인포그래픽이 없습니다."
      />
    </template>

    <!-- 인포그래픽 목록 -->
    <div
      v-else
      class="meeting2-infographic-grid"
    >
      <div
        v-for="item in infographicList"
        :key="item.infographicId"
        class="meeting2-infographic-card"
      >
        <p class="meeting2-infographic-card-topic">{{ item.topicNm }}</p>

        <!-- 완료 -->
        <img
          v-if="item.infographicStatus === '003'"
          :src="`data:image/png;base64,${item.infographicImg}`"
          :alt="item.topicNm"
          class="meeting2-infographic-card-img"
          title="클릭하면 크게 볼 수 있습니다"
          @click="openPreview(item)"
        />

        <!-- 실패 -->
        <div
          v-else-if="item.infographicStatus === '004'"
          class="meeting2-infographic-card-error"
        >
          <i class="icon-warning size-20" />
          <span>이미지 생성에 실패했습니다</span>
        </div>

        <!-- 생성 중 (001 / 002) -->
        <div
          v-else
          class="meeting2-infographic-card-pending"
        >
          <div class="meeting2-infographic-card-skeleton" />
          <span class="meeting2-infographic-card-pending-label">
            <i class="icon-spinner size-14" />
            생성 중...
          </span>
        </div>
      </div>
    </div>

    <!-- 인포그래픽 이미지 크게 보기 모달 -->
    <UiModal
      :is-open="isPreviewOpen"
      :title="previewItem?.topicNm ?? '인포그래픽'"
      max-width="min(96vw, 1200px)"
      show-fullscreen
      custom-class="meeting2-infographic-preview-modal"
      @close="closePreview"
    >
      <div class="meeting2-infographic-preview-body">
        <img
          v-if="previewItem"
          :src="`data:image/png;base64,${previewItem.infographicImg}`"
          :alt="previewItem.topicNm"
          class="meeting2-infographic-preview-img"
        />
      </div>

      <template #footer>
        <div class="modal-dialog-footer">
          <UiButton
            variant="line-secondary"
            size="md"
            @click="closePreview"
          >
            닫기
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            :disabled="!previewItem"
            @click="doDownload"
          >
            다운로드
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingInfographic } from '~/types/meeting'

const route = useRoute()
const meetingId = computed(() => Number(route.params.id))

const { infographicList, currentMeeting, handleStreamInfographic } = useMeetingStore()

const isPreviewOpen = ref(false)
const previewItem = ref<MeetingInfographic | null>(null)

const openPreview = (item: MeetingInfographic) => {
  previewItem.value = item
  isPreviewOpen.value = true
}

const closePreview = () => {
  isPreviewOpen.value = false
  previewItem.value = null
}

/** base64 → Blob 변환 */
const base64ToBlob = (base64: string, mimeType = 'image/png'): Blob => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

/** 파일시스템에 안전한 파일명 생성 (윈도우/맥 모두) */
const sanitizeFileName = (name: string): string => {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'infographic'
}

const doDownload = () => {
  if (!previewItem.value) return
  const item = previewItem.value
  if (!item.infographicImg) {
    openToast({ message: '다운로드할 이미지가 없습니다.', type: 'warning' })
    return
  }

  try {
    const blob = base64ToBlob(item.infographicImg, 'image/png')
    const url = window.URL.createObjectURL(blob)
    const meetingTitle = currentMeeting.value?.title ?? ''
    const baseName = meetingTitle ? `${meetingTitle}_${item.topicNm}` : item.topicNm
    const link = document.createElement('a')
    link.href = url
    link.download = `${sanitizeFileName(baseName)}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    openToast({ message: '이미지 다운로드에 실패했습니다.', type: 'error' })
    console.error('[MeetingInfographicPanel] doDownload error:', e)
  }
}

/** 생성 중인 항목이 하나라도 있으면 SSE 구독 시작 */
const hasPending = computed(() =>
  infographicList.value.some((item) => item.infographicStatus === '001' || item.infographicStatus === '002'),
)

let closeStream: (() => void) | null = null

const startStream = () => {
  if (closeStream) return
  closeStream = handleStreamInfographic(meetingId.value)
}

const stopStream = () => {
  closeStream?.()
  closeStream = null
}

watch(
  hasPending,
  (pending) => {
    if (pending) startStream()
    else stopStream()
  },
  { immediate: true },
)

onBeforeUnmount(() => stopStream())
</script>
