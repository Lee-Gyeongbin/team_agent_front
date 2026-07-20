<template>
  <div class="agent-setting-sub-ty-proposal-panel">
    <div class="agent-setting-sub-ty-proposal-panel__header">
      <span class="com-setting-section-title">제안서 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-proposal-panel__summary">
        PT 제안 에이전트의 기본 페르소나·언어·템플릿을 설정합니다. 자사/경쟁사 RAG, 컬러 등은 프로젝트별로 설정 화면(Step C)에서 지정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-proposal-panel__accordions">
      <!-- ① 문서 설정 -->
      <div class="agent-setting-sub-ty-proposal-accordion">
        <UiSettingSection
          title="문서 설정"
          collapsible
          label-width="120px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">페르소나</label>
            <UiInput
              :model-value="modelValue.persona"
              placeholder="예: 공공 IT 제안서 전문 컨설턴트"
              size="sm"
              @update:model-value="onUpdate('persona', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">보고 대상</label>
            <UiSelect
              :model-value="modelValue.audience"
              :options="audienceOptions"
              size="sm"
              @update:model-value="onUpdate('audience', String($event ?? '발주기관 평가위원'))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">출력 언어</label>
            <UiSelect
              :model-value="modelValue.lang"
              :options="langOptions"
              size="sm"
              @update:model-value="onUpdate('lang', String($event ?? 'ko'))"
            />
          </div>
        </UiSettingSection>
      </div>

      <!-- ② 경쟁업체 데이터 — 프로젝트 단위로 이동됨 (Step C 설정 화면) -->
      <!-- 자사 RAG (ownDatasetId), 경쟁업체 RAG (competitorDatasetId), 웹서치 폴백 (webSearch) 제거 -->

      <!-- ③ 슬라이드 디자인 — 프로젝트 단위로 이동됨 (Step C 설정 화면, 새 컬러 체계) -->
      <!-- bgColor / baseColor / accentColor 제거 -->

      <!-- ④ 기능 -->
      <div class="agent-setting-sub-ty-proposal-accordion">
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
import type { ProposalConfigForm } from '~/utils/agent/proposalConfigUtil'

const props = defineProps<{
  modelValue: ProposalConfigForm
  tmplIdOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ProposalConfigForm]
}>()

const audienceOptions = [
  { label: '발주기관 평가위원', value: '발주기관 평가위원' },
  { label: '임원', value: '임원' },
  { label: '고객', value: '고객' },
  { label: '외부', value: '외부' },
]

const langOptions = [
  { label: '한국어', value: 'ko' },
  { label: 'English', value: 'en' },
]

const onUpdate = <K extends keyof ProposalConfigForm>(key: K, value: ProposalConfigForm[K]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style lang="scss" scoped>
.agent-setting-sub-ty-proposal-panel {
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

    .agent-setting-sub-ty-proposal-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-proposal-accordion {
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
