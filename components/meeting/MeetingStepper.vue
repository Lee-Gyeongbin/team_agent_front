<template>
  <div class="meeting2-stepper">
    <template
      v-for="(step, idx) in steps"
      :key="step.key"
    >
      <div
        class="meeting2-stepper-item"
        :class="{
          'is-progress': step.status === 'progress',
          'is-done': step.status === 'done',
        }"
      >
        <span class="meeting2-stepper-item-icon">
          <i
            v-if="iconMap[step.key]"
            :class="[iconMap[step.key], 'size-20']"
          />
          <span v-else>{{ idx + 1 }}</span>
        </span>
        <div class="meeting2-stepper-item-text">
          <span class="meeting2-stepper-item-title">{{ idx + 1 }}. {{ step.label }}</span>
          <span class="meeting2-stepper-item-status">{{ statusLabel(step.status) }}</span>
        </div>
      </div>
      <span
        v-if="idx < steps.length - 1"
        class="meeting2-stepper-item-arrow"
      >
        <i class="icon-arrow-right size-20" />
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MeetingStep, MeetingStepKey, MeetingStepStatus } from '~/types/meeting2'

interface Props {
  steps: MeetingStep[]
}

defineProps<Props>()

// 단계별 아이콘 매핑
// 🔽 'icon-meeting-speaker' 등록 후 교체 (현재는 이미 등록된 'icon-user'로 임시 대체)
// 'icon-meeting-save'는 파일 저장 모달 등에서 사용
const iconMap: Partial<Record<MeetingStepKey, string>> = {
  record: 'icon-meeting-mic',
  speaker: 'icon-user',
  generate: 'icon-meeting-generate',
  edit: 'icon-meeting-edit',
  share: 'icon-meeting-mail',
}

const statusLabel = (status: MeetingStepStatus) => {
  if (status === 'progress') return '진행 중'
  if (status === 'done') return '완료'
  return '대기'
}
</script>
