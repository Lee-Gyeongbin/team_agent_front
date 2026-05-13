<template>
  <div class="meeting2-panel">
    <div class="meeting2-panel-header">
      <div class="meeting2-side-tab-group">
        <button
          class="meeting2-side-tab"
          :class="{ 'is-active': activeTab === 'share' }"
          @click="activeTab = 'share'"
        >
          공유/발송
        </button>
        <button
          class="meeting2-side-tab"
          :class="{ 'is-active': activeTab === 'infographic' }"
          @click="activeTab = 'infographic'"
        >
          인포그래픽
          <span
            v-if="hasPendingInfographic"
            class="meeting2-side-tab-badge"
          />
        </button>
      </div>
    </div>

    <div class="meeting2-panel-body">
      <template v-if="activeTab === 'share'">
        <MeetingMeta />
        <MeetingActionMenu />
      </template>
      <template v-else>
        <MeetingInfographicPanel />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'

const { infographicList, activeTab } = useMeetingStore()

/** 생성 중 항목이 있으면 탭에 뱃지 표시 */
const hasPendingInfographic = computed(() =>
  infographicList.value.some((item) => item.infographicStatus === '001' || item.infographicStatus === '002'),
)
</script>
