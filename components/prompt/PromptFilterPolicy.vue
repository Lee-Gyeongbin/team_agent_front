<template>
  <div class="prompt-filter-policy">
    <div class="prompt-filter-policy-title">컨텐츠 필터링 정책</div>
    <div class="prompt-filter-policy-list">
      <div
        v-for="policy in policies"
        :key="policy.id"
        class="prompt-filter-policy-item"
      >
        <UiCheckbox
          :model-value="policy.isEnabled"
          @update:model-value="onToggle(policy.id, $event)"
        >
          <span class="prompt-filter-policy-text">
            {{ policy.label }} ({{ policy.description }})
          </span>
        </UiCheckbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PromptFilterPolicy } from '~/types/prompt'

interface Props {
  policies: PromptFilterPolicy[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:policies': [policies: PromptFilterPolicy[]]
}>()

const onToggle = (id: string, checked: boolean) => {
  const updated = props.policies.map((p) => (p.id === id ? { ...p, isEnabled: checked } : p))
  emit('update:policies', updated)
}
</script>
