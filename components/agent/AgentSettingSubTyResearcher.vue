<template>
  <div class="agent-setting-sub-ty-researcher-panel">
    <div class="agent-setting-sub-ty-researcher-panel__header">
      <span class="com-setting-section-title">리서처 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-researcher-panel__summary">
        리서치 리포트 템플릿과 웹 검색 사용 여부를 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-researcher-panel__accordions">
      <div class="agent-setting-sub-ty-researcher-accordion">
        <UiSettingSection
          title="기능"
          collapsible
          label-width="120px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">리포트 템플릿</label>
            <UiSelect
              :model-value="modelValue.tmplId"
              :options="tmplIdOptions"
              placeholder="템플릿을 선택하세요"
              size="sm"
              @update:model-value="onUpdate('tmplId', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">웹 검색 사용</label>
            <UiCheckbox
              :model-value="modelValue.webSearch"
              label="답변 생성 시 웹 검색 결과를 반영"
              @update:model-value="onUpdate('webSearch', $event)"
            />
          </div>
        </UiSettingSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ResearcherConfigForm } from '~/utils/agent/researcherConfigUtil'

const props = defineProps<{
  modelValue: ResearcherConfigForm
  tmplIdOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ResearcherConfigForm]
}>()

const onUpdate = <K extends keyof ResearcherConfigForm>(key: K, value: ResearcherConfigForm[K]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style lang="scss" scoped>
.agent-setting-sub-ty-researcher-panel {
  --label-width: 120px;
  margin-top: 8px;
  padding: 14px 16px 8px;
  border: 1px solid #dce4e9;
  border-radius: $border-radius-lg;
  background: #f8fafc;

  &__header {
    padding-bottom: 12px;
    margin-bottom: 4px;
    border-bottom: 1px solid #aebccb;
  }

  &__summary {
    margin: 6px 0 0;
  }

  &__accordions {
    display: flex;
    flex-direction: column;

    .agent-setting-sub-ty-researcher-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-researcher-accordion {
  :deep(.com-setting-section) {
    border: none;
    border-radius: 0;
    padding: 10px 0 14px;
    margin: 0;
    background: transparent;
    border-bottom: 1px solid #e2e8f0;
    gap: 10px;
  }

  :deep(.com-setting-section-header) {
    padding-top: 2px;
  }

  :deep(.com-setting-field-row) {
    .ui-input-outer,
    .ui-select-wrap,
    .com-setting-field-input {
      flex: 1;
      min-width: 0;
    }
  }
}
</style>
