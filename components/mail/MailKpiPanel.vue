<template>
  <div class="mail-kpi-row">
    <!-- 전체 메일 -->
    <div class="mail-kpi-card mail-kpi-total">
      <div class="mail-kpi-icon">
        <i class="icon-meeting-mail size-20" />
      </div>
      <div>
        <div class="mail-kpi-num">
          <span
            v-if="isLoading"
            class="mail-skeleton mail-skeleton-sm"
          />
          <template v-else>{{ kpi?.totalCount ?? 0 }}</template>
        </div>
        <div class="mail-kpi-label">전체 메일</div>
      </div>
    </div>

    <!-- 회신 필요 -->
    <div class="mail-kpi-card mail-kpi-reply">
      <div class="mail-kpi-icon">
        <i class="icon-send size-20" />
      </div>
      <div>
        <div class="mail-kpi-num">
          <span
            v-if="isLoading"
            class="mail-skeleton mail-skeleton-sm"
          />
          <template v-else>{{ kpi?.replyRequiredCount ?? 0 }}</template>
        </div>
        <div class="mail-kpi-label">회신 필요</div>
      </div>
    </div>

    <!-- 긴급 -->
    <div class="mail-kpi-card mail-kpi-urgent">
      <div class="mail-kpi-icon">
        <i class="icon-warning-triangle size-20" />
      </div>
      <div>
        <div class="mail-kpi-num">
          <span
            v-if="isLoading"
            class="mail-skeleton mail-skeleton-sm"
          />
          <template v-else>{{ kpi?.urgentCount ?? 0 }}</template>
        </div>
        <div class="mail-kpi-label">긴급</div>
      </div>
    </div>

    <!-- 오늘 마감 -->
    <div class="mail-kpi-card mail-kpi-due">
      <div class="mail-kpi-icon">
        <i class="icon-calendar size-20" />
      </div>
      <div>
        <div class="mail-kpi-num">
          <span
            v-if="isLoading"
            class="mail-skeleton mail-skeleton-sm"
          />
          <template v-else>{{ kpi?.todayDueCount ?? 0 }}</template>
        </div>
        <div class="mail-kpi-label">오늘 마감</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MailKpi } from '~/types/mail'

defineProps<{
  kpi: MailKpi | null
  isLoading: boolean
}>()
</script>
