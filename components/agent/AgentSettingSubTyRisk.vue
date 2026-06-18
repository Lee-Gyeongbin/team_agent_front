<template>
  <div class="agent-setting-sub-ty-risk-panel">
    <div class="agent-setting-sub-ty-risk-panel__header">
      <span class="com-setting-section-title">리스크진단 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-risk-panel__summary">
        RFP(제안요청서) 업로드 시 생성할 리스크 진단 리포트 템플릿을 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-risk-panel__accordions">
      <div class="agent-setting-sub-ty-risk-accordion">
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
        </UiSettingSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RiskConfigForm } from '~/utils/agent/riskConfigUtil'

const props = defineProps<{
  modelValue: RiskConfigForm
  tmplIdOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RiskConfigForm]
}>()

const onUpdate = <K extends keyof RiskConfigForm>(key: K, value: RiskConfigForm[K]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style lang="scss" scoped>
.agent-setting-sub-ty-risk-panel {
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

    .agent-setting-sub-ty-risk-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-risk-accordion {
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
