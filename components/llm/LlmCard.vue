<template>
  <div
    class="com-card"
    :class="{ 'is-inactive': !model.useYn }"
  >
    <!-- 드래그 핸들 -->
    <div class="com-card-drag">
      <i class="icon-move-handle size-20" />
    </div>

    <!-- 카드 본문 -->
    <div class="com-card-body">
      <!-- 왼쪽: 정보 (클릭 시 설정 모달) -->
      <div
        class="com-card-info"
        style="cursor: pointer"
        @click="$emit('setting', model)"
      >
        <!-- 제목 + 순서 배지 -->
        <div class="com-card-title-row">
          <span class="com-card-title">{{ model.modelName }}</span>
          <span class="com-card-badge">
            순서
            <span class="badge-num">{{ model.sortOrder }}</span>
          </span>
        </div>
        <!-- Provider -->
        <p class="com-card-desc">Provider : {{ model.providerName }}</p>
        <!-- 메타 -->
        <div class="com-card-meta">
          <span class="com-card-meta-item">
            <i class="icon-edit-agent size-12" /> 버전 <strong>{{ model.version }}</strong>
          </span>
          <span class="com-card-meta-item">
            입력 비용 <strong>${{ model.inputCost }}/1M</strong>
          </span>
          <span class="com-card-meta-item">
            출력 비용 <strong>${{ model.outputCost }}/1M</strong>
          </span>
          <span class="com-card-meta-item">
            일일 제한 <strong>{{ formattedDailyLimit }}</strong>
          </span>
        </div>
      </div>

      <!-- 오른쪽: 액션 -->
      <div class="com-card-actions">
        <button
          class="com-card-btn"
          title="테스트"
          @click.stop="$emit('test', model)"
        >
          <i class="icon-play-circle size-16" />
        </button>
        <button
          class="com-card-btn"
          title="삭제"
          @click="$emit('delete', model)"
        >
          <i class="icon-trashcan size-16" />
        </button>
        <UiToggle
          :model-value="model.useYn === 'Y'"
          @update:model-value="$emit('toggle', model)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LlmModel } from '~/types/llm'

interface Props {
  model: LlmModel
}

const props = defineProps<Props>()
defineEmits<{
  setting: [model: LlmModel]
  test: [model: LlmModel]
  delete: [model: LlmModel]
  toggle: [model: LlmModel]
}>()

const formattedDailyLimit = computed(() => {
  const val = props.model.dayReqLmt
  return val != null && typeof val === 'number' ? val.toLocaleString() : '-'
})
</script>
