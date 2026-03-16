<template>
  <div class="com-setting-section">
    <div class="com-setting-section-title">Agent 기본 설정</div>

    <!-- Agent 이름 -->
    <div class="com-setting-field-row">
      <label class="com-setting-label">Agent 이름</label>
      <UiInput
        :model-value="modelValue.name"
        placeholder="예: GPT-4o"
        size="sm"
        @update:model-value="onUpdate('name', $event)"
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

    <!-- 유사도 임계값 / 최대 검색 결과 -->
    <div class="com-setting-row">
      <!-- 유사도 임계값 -->
      <div class="com-setting-field-col">
        <div class="com-setting-field-row">
          <label class="com-setting-label">
            <span class="is-required">*</span>
            유사도 임계값
          </label>
          <div class="com-setting-field-input">
            <div class="com-setting-inline">
              <UiInput
                :model-value="modelValue.similarityThreshold"
                type="number"
                size="sm"
                @update:model-value="onUpdate('similarityThreshold', $event)"
              />
              <span class="com-setting-unit">(0.0~1.0)</span>
            </div>
            <p class="com-setting-hint">이 값 이상의 유사도를 가진 문서만 검색</p>
          </div>
        </div>
      </div>

      <!-- 최대 검색 결과 -->
      <div class="com-setting-field-col">
        <div class="com-setting-field-row">
          <label class="com-setting-label">
            <span class="is-required">*</span>
            최대 검색 결과
          </label>
          <div class="com-setting-field-input">
            <div class="com-setting-inline">
              <UiInput
                :model-value="modelValue.maxSearchResults"
                type="number"
                size="sm"
                @update:model-value="onUpdate('maxSearchResults', $event)"
              />
              <span class="com-setting-unit">개</span>
            </div>
            <p class="com-setting-hint">최대로 검색할 문서 청크 수</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BasicForm {
  name: string
  description: string
  similarityThreshold: number
  maxSearchResults: number
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
