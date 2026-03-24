<template>
  <div class="com-setting-section">
    <div class="com-setting-section-title">Agent 유형</div>

    <div class="com-setting-field-row">
      <UiSelect
        :model-value="modelValue"
        :options="agentTypeOptions"
        class="w-full"
        size="sm"
        :disabled="!isEdit"
        @update:model-value="onChange"
      />
    </div>
    <p
      v-if="typeDescription"
      class="com-setting-desc"
    >
      *{{ typeDescription }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  isEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string]
}>()

const codes = await getCodes('AT000001')
const agentTypeOptions = [{ label: '선택', value: '' }, ...codes.map((c) => ({ label: c.codeNm, value: c.codeId }))]

const typeDescriptions: Record<string, string> = {
  '001': '매뉴얼질의(RAG) Agent에서 사용할 데이터셋과 검색 옵션을 설정합니다.',
  '002': '데이터분석(TextToSQL) Agent에서 사용할 DB 연결과 쿼리 옵션을 설정합니다.',
}

const typeDescription = computed(() => typeDescriptions[props.modelValue] || '')

const onChange = (value: string | number) => {
  emit('update:modelValue', value)
  emit('change', String(value))
}
</script>
