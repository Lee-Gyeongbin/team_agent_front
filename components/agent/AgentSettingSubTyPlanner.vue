<template>
  <div class="agent-setting-sub-ty-planner-panel">
    <div class="agent-setting-sub-ty-planner-panel__header">
      <span class="com-setting-section-title">기획서·PT 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-planner-panel__summary">
        문서 유형·보고 대상·분량·언어와 출력 템플릿을 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-planner-panel__accordions">
      <!-- ① 문서 설정 -->
      <div class="agent-setting-sub-ty-planner-accordion">
        <UiSettingSection
          title="문서 설정"
          collapsible
          label-width="120px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">문서 유형</label>
            <UiSelect
              :model-value="modelValue.docTy"
              :options="docTyOptions"
              size="sm"
              @update:model-value="onUpdate('docTy', String($event ?? '기획서'))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">보고 대상</label>
            <UiSelect
              :model-value="modelValue.audience"
              :options="audienceOptions"
              size="sm"
              @update:model-value="onUpdate('audience', String($event ?? '임원'))"
            />
          </div>
          <div class="com-setting-row type-config-row">
            <div class="type-config-col">
              <label class="com-setting-label">목표 분량</label>
              <div class="com-setting-inline">
                <UiInput
                  :model-value="modelValue.pageCount"
                  number-only
                  size="sm"
                  @update:model-value="onUpdate('pageCount', Number($event ?? 5))"
                />
                <span class="com-setting-unit">페이지</span>
              </div>
            </div>
            <div class="type-config-col">
              <label class="com-setting-label">출력 언어</label>
              <UiSelect
                :model-value="modelValue.lang"
                :options="langOptions"
                size="sm"
                @update:model-value="onUpdate('lang', String($event ?? 'ko'))"
              />
            </div>
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">구조 힌트</label>
            <UiTextarea
              :model-value="modelValue.structureHint"
              placeholder="예: 문제정의 → 원인분석 → 해결방안 → 기대효과 (비워두면 AI가 자동 결정)"
              :rows="2"
              size="sm"
              :border="true"
              :auto-resize="true"
              :max-rows="4"
              @update:model-value="onUpdate('structureHint', String($event ?? ''))"
            />
          </div>
        </UiSettingSection>
      </div>

      <!-- ② 기능 -->
      <div class="agent-setting-sub-ty-planner-accordion">
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
import type { PlannerConfigForm } from '~/utils/agent/plannerConfigUtil'

const props = defineProps<{
  modelValue: PlannerConfigForm
  tmplIdOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PlannerConfigForm]
}>()

const docTyOptions = [
  { label: '기획서', value: '기획서' },
  { label: 'PT (발표자료)', value: 'PT' },
  { label: '보고서', value: '보고서' },
  { label: '제안서', value: '제안서' },
]

const audienceOptions = [
  { label: '임원', value: '임원' },
  { label: '팀원', value: '팀원' },
  { label: '고객', value: '고객' },
  { label: '외부', value: '외부' },
]

const langOptions = [
  { label: '한국어', value: 'ko' },
  { label: 'English', value: 'en' },
]

const onUpdate = <K extends keyof PlannerConfigForm>(key: K, value: PlannerConfigForm[K]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style lang="scss" scoped>
.agent-setting-sub-ty-planner-panel {
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

    .agent-setting-sub-ty-planner-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-planner-accordion {
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

.type-config-row {
  display: flex;
  gap: 12px;
  margin-left: calc(var(--label-width) + 12px);
}

.type-config-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  .com-setting-label {
    width: auto;
    text-align: left;
  }
}
</style>
