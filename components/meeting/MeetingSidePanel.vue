<template>
  <div class="meeting2-panel">
    <div class="meeting2-panel-header">
      <div class="meeting2-side-tab-group">
        <UiButton
          variant="ghost"
          size="sm"
          class="meeting2-side-tab"
          :class="{ 'is-active': activeTab === 'share' }"
          @click="activeTab = 'share'"
        >
          공유/발송
        </UiButton>
        <!-- [인포그래픽 일시 중지 2026-11-19] 다시 쓰려면 주석 해제
        <UiButton
          variant="ghost"
          size="sm"
          class="meeting2-side-tab"
          :class="{ 'is-active': activeTab === 'infographic' }"
          @click="activeTab = 'infographic'"
        >
          인포그래픽
          <span
            v-if="hasPendingInfographic"
            class="meeting2-side-tab-badge"
          />
        </UiButton>
        -->
      </div>
    </div>

    <div class="meeting2-panel-body">
      <!-- [인포그래픽 일시 중지 2026-11-19] 탭 분기 복원 시 v-if="activeTab === 'share'" + v-else 블록 주석 해제 -->
      <MeetingMeta />
      <MeetingActionMenu />
      <!--
      <template v-else>
        <MeetingInfographicPanel />
      </template>
      -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton } from '@leechanyong/ispark-ui'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'

const { activeTab } = useMeetingStore()

// [인포그래픽 일시 중지 2026-11-19] 다시 쓰려면 주석 해제 (useMeetingStore 에서 infographicList 도 받을 것)
// /** 생성 중 항목이 있으면 탭에 뱃지 표시 */
// const hasPendingInfographic = computed(() =>
//   infographicList.value.some((item) => item.infographicStatus === '001' || item.infographicStatus === '002'),
// )
</script>
