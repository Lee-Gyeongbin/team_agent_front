<template>
  <div
    class="com-card"
    :class="{ 'is-inactive': !agent.isActive }"
  >
    <!-- 드래그 핸들 -->
    <div class="com-card-drag">
      <i class="icon-move-handle size-20" />
    </div>

    <!-- 카드 본문 -->
    <div class="com-card-body">
      <!-- 왼쪽: 정보 -->
      <div class="com-card-info">
        <!-- 제목 + 우선순위 -->
        <div class="com-card-title-row">
          <span class="com-card-title">{{ agent.name }}</span>
          <span class="com-card-badge">
            우선순위
            <span class="badge-num">{{ agent.priority }}</span>
          </span>
        </div>
        <!-- 설명 -->
        <p class="com-card-desc">{{ agent.description }}</p>
        <!-- 메타 -->
        <div class="com-card-meta">
          <span class="com-card-meta-item">
            <i class="icon-sparkle-agent size-12" /> 유형 <strong>{{ agent.type }}</strong>
          </span>
          <span class="com-card-meta-item">
            <i class="icon-link-agent size-12" /> 연결 <strong>{{ agent.connectionCount }}개 데이터셋</strong>
          </span>
          <span class="com-card-meta-item">
            <i class="icon-edit-agent size-12" /> 최종 수정 <strong>{{ agent.updatedAt }}</strong>
          </span>
        </div>
      </div>

      <!-- 오른쪽: 액션 -->
      <div class="com-card-actions">
        <button
          class="com-card-btn"
          title="설정"
          @click="$emit('setting', agent)"
        >
          <i class="icon-setting-agent size-16" />
        </button>
        <UiToggle
          :model-value="agent.isActive"
          @update:model-value="$emit('toggle', agent)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '~/types/agent'

interface Props {
  agent: Agent
}

defineProps<Props>()
defineEmits<{
  setting: [agent: Agent]
  toggle: [agent: Agent]
}>()
</script>
