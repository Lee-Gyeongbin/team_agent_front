<template>
  <div class="prompt-filter-policy">
    <div class="prompt-filter-policy-title">컨텐츠 필터링 정책</div>
    <div class="prompt-filter-policy-list">
      <div
        v-for="policy in policies"
        :key="policy.filterCd"
        class="prompt-filter-policy-item"
      >
        <UiCheckbox
          :model-value="policy.applyYn === 'Y'"
          @update:model-value="onToggle(policy.filterCd, $event)"
        >
          <span class="prompt-filter-policy-text"> {{ policy.filterName }} ({{ policy.filterDesc }}) </span>
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

const onToggle = (filterCd: string, checked: boolean) => {
  const updated = props.policies.map((p) =>
    p.filterCd === filterCd ? { ...p, applyYn: checked ? ('Y' as const) : ('N' as const) } : p,
  )
  emit('update:policies', updated)
}
</script>
