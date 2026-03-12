<template>
  <div class="agent-setting-section">
    <div class="agent-setting-section-title">Agent 유형</div>

    <div class="agent-setting-field-row">
      <UiSelect
        :model-value="modelValue"
        :options="agentTypeOptions"
        class="w-full"
        @update:model-value="$emit('update:modelValue', $event)"
        size="sm"
      />
    </div>
    <p class="agent-setting-desc">*{{ typeDescription }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
}

const props = defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string | number]
}>()

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const agentTypeOptions = [
  { label: '매뉴얼질의 (RAG)', value: 'RAG' },
  { label: '데이터분석 (TextToSQL)', value: 'TextToSQL' },
]

const typeDescriptions: Record<string, string> = {
  RAG: '매뉴얼질의(RAG) Agent에서 사용할 데이터셋과 검색 옵션을 설정합니다.',
  TextToSQL: '데이터분석(TextToSQL) Agent에서 사용할 DB 연결과 쿼리 옵션을 설정합니다.',
}

const typeDescription = computed(() => typeDescriptions[props.modelValue] || '')
</script>
