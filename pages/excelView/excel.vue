<template>
  <div class="excel-view-page">
    <h1>엑셀 뷰어</h1>
    <div
      v-if="healthLoading"
      class="health-status"
    >
      연결 확인 중...
    </div>
    <div
      v-else-if="healthError"
      class="health-status health-error"
    >
      {{ healthError }}
    </div>
    <div
      v-else
      class="health-status"
    >
      {{ healthData }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHealthCheck } from '~/composables/excel/excel'

const { healthData, healthLoading, healthError } = useHealthCheck()
</script>

<style lang="scss" scoped>
.excel-view-page {
  padding: $spacing-xl;
}

.health-status {
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background: $color-surface;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &.health-error {
    color: $color-error;
  }
}
</style>
