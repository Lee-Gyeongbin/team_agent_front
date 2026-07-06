<template>
  <div class="agent-setting-sub-ty-proposal-panel">
    <div class="agent-setting-sub-ty-proposal-panel__header">
      <span class="com-setting-section-title">제안서 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-proposal-panel__summary">
        RFP(요구사항) 업로드 시 생성할 제안서 슬라이드의 페르소나·디자인·데이터를 설정합니다.
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

      <!-- ② 경쟁업체 데이터 -->
      <div class="agent-setting-sub-ty-proposal-accordion">
        <UiSettingSection
          title="경쟁업체 데이터"
          collapsible
          label-width="120px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">경쟁업체 RAG</label>
            <UiSelect
              :model-value="modelValue.competitorDatasetId"
              :options="datasetOptions"
              placeholder="데이터셋을 선택하세요 (없으면 미사용)"
              size="sm"
              @update:model-value="onUpdate('competitorDatasetId', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">웹서치 폴백</label>
            <UiCheckbox
              :model-value="modelValue.webSearch"
              label="경쟁업체 RAG 없을 때 웹 검색으로 정보 수집"
              @update:model-value="onUpdate('webSearch', $event)"
            />
          </div>
        </UiSettingSection>
      </div>

      <!-- ③ 슬라이드 디자인 -->
      <div class="agent-setting-sub-ty-proposal-accordion">
        <UiSettingSection
          title="슬라이드 디자인"
          collapsible
          label-width="120px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">배경 색상</label>
            <div class="proposal-color-row">
              <input
                type="color"
                class="proposal-color-picker"
                :value="modelValue.slideDesign.bgColor"
                @input="onColorUpdate('bgColor', ($event.target as HTMLInputElement).value)"
              />
              <UiInput
                :model-value="modelValue.slideDesign.bgColor"
                placeholder="#FFFFFF"
                size="sm"
                @update:model-value="onColorUpdate('bgColor', String($event ?? '#FFFFFF'))"
              />
            </div>
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">기본 색조</label>
            <div class="proposal-color-row">
              <input
                type="color"
                class="proposal-color-picker"
                :value="modelValue.slideDesign.baseColor"
                @input="onColorUpdate('baseColor', ($event.target as HTMLInputElement).value)"
              />
              <UiInput
                :model-value="modelValue.slideDesign.baseColor"
                placeholder="#003087"
                size="sm"
                @update:model-value="onColorUpdate('baseColor', String($event ?? '#003087'))"
              />
            </div>
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">강조 색상</label>
            <div class="proposal-color-row">
              <input
                type="color"
                class="proposal-color-picker"
                :value="modelValue.slideDesign.accentColor"
                @input="onColorUpdate('accentColor', ($event.target as HTMLInputElement).value)"
              />
              <UiInput
                :model-value="modelValue.slideDesign.accentColor"
                placeholder="#0066CC"
                size="sm"
                @update:model-value="onColorUpdate('accentColor', String($event ?? '#0066CC'))"
              />
            </div>
          </div>
        </UiSettingSection>
      </div>

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
import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import type { ProposalConfigForm, ProposalSlideDesign } from '~/utils/agent/proposalConfigUtil'

const props = defineProps<{
  modelValue: ProposalConfigForm
  tmplIdOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ProposalConfigForm]
}>()

const { fetchDocDatasetList } = useDocDatasetApi()

const datasetOptions = ref<{ value: string; label: string }[]>([{ label: '미사용', value: '' }])

onMounted(async () => {
  try {
    const res = await fetchDocDatasetList()
    datasetOptions.value = [
      { label: '미사용', value: '' },
      ...(res.dataList ?? []).map((d) => ({ label: d.dsNm, value: d.datasetId })),
    ]
  } catch {
    // 조회 실패 시 미사용 옵션만 유지
  }
})

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

const onColorUpdate = (key: keyof ProposalSlideDesign, value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    slideDesign: { ...props.modelValue.slideDesign, [key]: value },
  })
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

.proposal-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.proposal-color-picker {
  width: 32px;
  height: 32px;
  padding: 2px;
  border: 1px solid #dce4e9;
  border-radius: $border-radius-sm;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
