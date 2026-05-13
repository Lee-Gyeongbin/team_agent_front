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
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'

const route = useRoute()
const meetingId = computed(() => Number(route.params.id))

const { infographicList, handleStreamInfographic } = useMeetingStore()

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
