<template>
  <div
    class="meeting2-stepper"
    :class="{ 'is-collapsed': isCollapsed }"
  >
    <!-- 접힌 상태: 현재 단계 요약 + 펼치기 버튼 -->
    <div
      v-if="isCollapsed"
      class="meeting2-stepper-summary"
    >
      <template v-if="progressStep">
        <span
          class="meeting2-stepper-item-icon"
          style="background: var(--color-primary); color: #fff"
        >
          <i
            v-if="iconMap[progressStep.key]"
            :class="[iconMap[progressStep.key], 'size-16']"
          />
          <span v-else>{{ progressStepIdx + 1 }}</span>
        </span>
        <span class="meeting2-stepper-summary-label"> {{ progressStepIdx + 1 }}. {{ progressStep.label }} </span>
        <span class="meeting2-stepper-summary-status">진행 중</span>
      </template>
      <template v-else>
        <span class="meeting2-stepper-summary-label">진행 단계</span>
      </template>
    </div>

    <!-- 펼친 상태: 전체 단계 목록 -->
    <template v-else>
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
    </template>

    <!-- 접기/펼치기 토글 버튼 -->
    <button
      type="button"
      class="meeting2-stepper-toggle"
      :title="isCollapsed ? '펼치기' : '접기'"
      @click="isCollapsed = !isCollapsed"
    >
      <i
        class="icon-arrow-down-gray size-16 meeting2-stepper-toggle-icon"
        :class="{ 'is-collapsed': isCollapsed }"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { MeetingStep, MeetingStepKey, MeetingStepStatus } from '~/types/meeting'

interface Props {
  steps: MeetingStep[]
}

const props = defineProps<Props>()

const isCollapsed = ref(false)

const progressStep = computed(() => props.steps.find((s) => s.status === 'progress') ?? null)
const progressStepIdx = computed(() => props.steps.findIndex((s) => s.status === 'progress'))

// 단계별 아이콘 매핑
// 🔽 'icon-meeting-speaker' 등록 후 교체 (현재는 이미 등록된 'icon-user'로 임시 대체)
// 'icon-meeting-save'는 파일 저장 모달 등에서 사용
const iconMap: Partial<Record<MeetingStepKey, string>> = {
  record: 'icon-meeting-mic',
  speaker: 'icon-meeting-generate',
  generate: 'icon-meeting-edit',
  edit: 'icon-meeting-save',
  share: 'icon-meeting-mail',
}

const statusLabel = (status: MeetingStepStatus) => {
  if (status === 'progress') return '진행 중'
  if (status === 'done') return '완료'
  return '대기'
}
</script>
