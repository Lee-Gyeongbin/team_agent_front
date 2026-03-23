<template>
  <div class="com-setting-section">
    <div class="com-setting-section-title">Agent 기본 설정</div>

    <!-- Agent 이름 -->
    <div class="com-setting-field-row">
      <label class="com-setting-label">Agent 이름</label>
      <UiInput
        :model-value="modelValue.agentNm"
        placeholder="예: GPT-4o"
        size="sm"
        @update:model-value="onUpdate('agentNm', $event)"
      />
    </div>

    <!-- Agent 설명 -->
    <div class="com-setting-field-row is-top">
      <label class="com-setting-label">
        <span class="is-required">*</span>
        Agent 설명
      </label>
      <UiTextarea
        :model-value="modelValue.description"
        placeholder="등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다."
        :rows="2"
        size="sm"
        :border="true"
        :auto-resize="true"
        :max-rows="5"
        @update:model-value="onUpdate('description', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface BasicForm {
  agentNm: string
  description: string
}

interface Props {
  modelValue: BasicForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: BasicForm]
}>()

const onUpdate = (key: keyof BasicForm, value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
