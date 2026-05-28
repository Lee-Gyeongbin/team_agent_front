<template>
  <div class="agent-setting-sub-ty-survey-panel">
    <div class="agent-setting-sub-ty-survey-panel__header">
      <span class="com-setting-section-title">설문 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-survey-panel__summary">
        설문·응답·평가 등급·기능 옵션을 아래 영역에서 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-survey-panel__accordions">
      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="기본 · 척도"
          collapsible
          label-width="100px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">설문 유형</label>
            <UiInput
              :model-value="modelValue.surveyType"
              placeholder="예: KOSS_SF1"
              size="sm"
              @update:model-value="onUpdate('surveyType', String($event ?? ''))"
            />
          </div>

          <div class="survey-score-options">
            <div class="survey-score-options__head">
              <span class="com-setting-label">응답 척도</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddScoreOption"
              >
                선택지 추가
              </UiButton>
            </div>
            <div
              v-for="(opt, idx) in modelValue.scoreOptions"
              :key="`score-${idx}`"
              class="survey-score-options__row"
            >
              <UiInput
                :model-value="opt.value"
                size="sm"
                number-only
                class="survey-score-options__value"
                @update:model-value="onScoreOptionUpdate(idx, 'value', Number($event))"
              />
              <UiInput
                :model-value="opt.label"
                size="sm"
                placeholder="라벨"
                @update:model-value="onScoreOptionUpdate(idx, 'label', String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveScoreOption(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="영역 · 문항"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <AgentSettingSubTySurveyContent
            :model-value="modelValue"
            @update:model-value="emit('update:modelValue', $event)"
          />
        </UiSettingSection>
      </div>

      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="응답 출력 · 프롬프트"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">프롬프트 역할</label>
            <UiInput
              :model-value="modelValue.promptRole"
              placeholder="전문 산업심리 상담사 및 멘탈 웰니스 코치"
              size="sm"
              @update:model-value="onUpdate('promptRole', String($event ?? ''))"
            />
          </div>

          <div class="com-setting-field-row">
            <label class="com-setting-label">응답 언어</label>
            <UiInput
              :model-value="modelValue.promptLanguage"
              placeholder="ko"
              size="sm"
              @update:model-value="onUpdate('promptLanguage', String($event ?? ''))"
            />
          </div>

          <div class="survey-output-sections">
            <div class="survey-output-sections__head">
              <span class="com-setting-label">출력 섹션</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddOutputSection"
              >
                섹션 추가
              </UiButton>
            </div>
            <span class="com-setting-hint">진단 결과 본문의 마크다운 섹션 제목입니다.</span>
            <p
              v-if="!modelValue.outputSections.length"
              class="com-setting-hint"
            >
              섹션을 추가해 주세요.
            </p>
            <div
              v-for="(_, idx) in modelValue.outputSections"
              :key="`output-section-${idx}`"
              class="survey-output-sections__row"
            >
              <UiInput
                :model-value="modelValue.outputSections[idx]"
                size="sm"
                placeholder="예: 종합 소견"
                @update:model-value="onOutputSectionUpdate(idx, String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="섹션 삭제"
                @click="onRemoveOutputSection(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="평가 등급 구간"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <p class="com-setting-hint survey-section-lead">
            등급 이름과 톤을 정의합니다. 구간 상한은 등급 수보다 1개 적게 입력합니다.
          </p>

          <div class="survey-risk-levels">
            <div class="survey-risk-levels__head">
              <span class="com-setting-label">등급 목록</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddRiskLevel"
              >
                등급 추가
              </UiButton>
            </div>
            <div
              v-for="(level, idx) in modelValue.riskLevels"
              :key="`level-${idx}`"
              class="survey-risk-level-row"
            >
              <UiInput
                :model-value="level.label"
                size="sm"
                placeholder="등급명 (예: 정상)"
                class="survey-risk-level-row__label"
                @update:model-value="onRiskLevelUpdate(idx, 'label', String($event ?? ''))"
              />
              <UiInput
                :model-value="level.tone"
                size="sm"
                placeholder="LLM 톤 안내"
                class="survey-risk-level-row__tone"
                @update:model-value="onRiskLevelUpdate(idx, 'tone', String($event ?? ''))"
              />
              <button
                v-if="modelValue.riskLevels.length > 2"
                type="button"
                class="survey-icon-btn"
                title="등급 삭제"
                @click="onRemoveRiskLevel(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>

          <div
            v-if="thresholdSlotCount > 0"
            class="com-setting-row type-config-row survey-threshold-row"
          >
            <div
              v-if="!modelValue.requireGender"
              class="type-config-col"
            >
              <label class="com-setting-label">총점 구간 상한</label>
              <div
                v-for="slot in thresholdSlotCount"
                :key="`common-${slot}`"
                class="com-setting-inline survey-threshold-inline"
              >
                <span class="survey-threshold-inline__label">
                  {{ modelValue.riskLevels[slot - 1]?.label || `등급 ${slot}` }} 이하
                </span>
                <UiInput
                  :model-value="modelValue.totalThresholdsCommon[slot - 1]"
                  size="sm"
                  number-only
                  allow-decimal
                  @update:model-value="onCommonThresholdUpdate(slot - 1, Number($event))"
                />
              </div>
              <span class="com-setting-hint">성별 구분 없이 동일 기준을 male·female에도 저장합니다.</span>
            </div>
            <template v-else>
              <div class="type-config-col">
                <label class="com-setting-label">총점 구간 (남성)</label>
                <div
                  v-for="slot in thresholdSlotCount"
                  :key="`male-${slot}`"
                  class="com-setting-inline survey-threshold-inline"
                >
                  <span class="survey-threshold-inline__label">
                    {{ modelValue.riskLevels[slot - 1]?.label || `등급 ${slot}` }} 이하
                  </span>
                  <UiInput
                    :model-value="modelValue.totalThresholdsMale[slot - 1]"
                    size="sm"
                    number-only
                    allow-decimal
                    @update:model-value="onMaleThresholdUpdate(slot - 1, Number($event))"
                  />
                </div>
              </div>
              <div class="type-config-col">
                <label class="com-setting-label">총점 구간 (여성)</label>
                <div
                  v-for="slot in thresholdSlotCount"
                  :key="`female-${slot}`"
                  class="com-setting-inline survey-threshold-inline"
                >
                  <span class="survey-threshold-inline__label">
                    {{ modelValue.riskLevels[slot - 1]?.label || `등급 ${slot}` }} 이하
                  </span>
                  <UiInput
                    :model-value="modelValue.totalThresholdsFemale[slot - 1]"
                    size="sm"
                    number-only
                    allow-decimal
                    @update:model-value="onFemaleThresholdUpdate(slot - 1, Number($event))"
                  />
                </div>
              </div>
            </template>
          </div>

          <div class="com-setting-row type-config-row survey-threshold-row">
            <div class="type-config-col">
              <label class="com-setting-label">상위 등급 영역 수</label>
              <div class="com-setting-inline">
                <UiInput
                  :model-value="modelValue.highRiskAreaThreshold"
                  size="sm"
                  number-only
                  @update:model-value="onUpdate('highRiskAreaThreshold', Number($event))"
                />
                <span class="com-setting-unit">개 이상</span>
              </div>
              <span class="com-setting-hint">
                영역별 점수가 상위 등급에 해당하는 영역이 이 개수 이상이면 종합 판정을 최상위 등급으로 올립니다.
              </span>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="기능"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <div class="sql-checkbox-col survey-feature-col">
            <UiCheckbox
              :model-value="modelValue.requireGender"
              label="성별 선택 필수"
              @update:model-value="onRequireGenderChange($event)"
            />
            <UiCheckbox
              :model-value="modelValue.showRadarChart"
              label="방사형 차트 표시"
              @update:model-value="onUpdate('showRadarChart', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.showAiRecoveryImage"
              label="회복 이미지 표시"
              @update:model-value="onUpdate('showAiRecoveryImage', $event)"
            />
            <span class="com-setting-hint">AI 생성·Pexels 스톡 이미지를 함께 켜고 끕니다.</span>
          </div>
        </UiSettingSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SurveyRiskLevelForm, SurveyScoreOptionForm } from '~/types/agentSurveyConfig'
import {
  ensureThresholdLength,
  thresholdSlotCount as calcThresholdSlots,
  type SurveyConfigForm,
} from '~/utils/agent/surveyConfigUtil'

const props = defineProps<{
  modelValue: SurveyConfigForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SurveyConfigForm]
}>()

const emitForm = (next: SurveyConfigForm) => emit('update:modelValue', next)

const thresholdSlotCount = computed(() => calcThresholdSlots(props.modelValue.riskLevels.length))

const onUpdate = <K extends keyof SurveyConfigForm>(key: K, value: SurveyConfigForm[K]) => {
  emitForm({ ...props.modelValue, [key]: value })
}

const onAddScoreOption = () => {
  const maxVal = props.modelValue.scoreOptions.reduce((m, o) => Math.max(m, o.value), 0)
  const scoreOptions: SurveyScoreOptionForm[] = [...props.modelValue.scoreOptions, { value: maxVal + 1, label: '' }]
  emitForm({ ...props.modelValue, scoreOptions })
}

const onScoreOptionUpdate = (idx: number, key: 'value' | 'label', value: number | string) => {
  const scoreOptions = props.modelValue.scoreOptions.map((o, i) => (i === idx ? { ...o, [key]: value } : o))
  emitForm({ ...props.modelValue, scoreOptions })
}

const onRemoveScoreOption = (idx: number) => {
  if (props.modelValue.scoreOptions.length <= 1) return
  emitForm({
    ...props.modelValue,
    scoreOptions: props.modelValue.scoreOptions.filter((_, i) => i !== idx),
  })
}

const onAddOutputSection = () => {
  emitForm({
    ...props.modelValue,
    outputSections: [...props.modelValue.outputSections, ''],
  })
}

const onOutputSectionUpdate = (idx: number, value: string) => {
  const outputSections = props.modelValue.outputSections.map((s, i) => (i === idx ? value : s))
  emitForm({ ...props.modelValue, outputSections })
}

const onRemoveOutputSection = (idx: number) => {
  emitForm({
    ...props.modelValue,
    outputSections: props.modelValue.outputSections.filter((_, i) => i !== idx),
  })
}

const resizeThresholds = (form: SurveyConfigForm): SurveyConfigForm => {
  const slots = calcThresholdSlots(form.riskLevels.length)
  return {
    ...form,
    totalThresholdsCommon: ensureThresholdLength(form.totalThresholdsCommon, slots),
    totalThresholdsMale: ensureThresholdLength(form.totalThresholdsMale, slots),
    totalThresholdsFemale: ensureThresholdLength(form.totalThresholdsFemale, slots),
  }
}

const onAddRiskLevel = () => {
  const riskLevels: SurveyRiskLevelForm[] = [...props.modelValue.riskLevels, { key: '', label: '', tone: '' }]
  emitForm(resizeThresholds({ ...props.modelValue, riskLevels }))
}

const onRemoveRiskLevel = (idx: number) => {
  if (props.modelValue.riskLevels.length <= 2) return
  const riskLevels = props.modelValue.riskLevels.filter((_, i) => i !== idx)
  emitForm(resizeThresholds({ ...props.modelValue, riskLevels }))
}

const onRiskLevelUpdate = (idx: number, key: keyof SurveyRiskLevelForm, value: string) => {
  const riskLevels = props.modelValue.riskLevels.map((l, i) => (i === idx ? { ...l, [key]: value } : l))
  emitForm({ ...props.modelValue, riskLevels })
}

const onCommonThresholdUpdate = (slotIdx: number, value: number) => {
  const bounds = [...props.modelValue.totalThresholdsCommon]
  bounds[slotIdx] = value
  emitForm({ ...props.modelValue, totalThresholdsCommon: bounds })
}

const onMaleThresholdUpdate = (slotIdx: number, value: number) => {
  const bounds = [...props.modelValue.totalThresholdsMale]
  bounds[slotIdx] = value
  emitForm({ ...props.modelValue, totalThresholdsMale: bounds })
}

const onFemaleThresholdUpdate = (slotIdx: number, value: number) => {
  const bounds = [...props.modelValue.totalThresholdsFemale]
  bounds[slotIdx] = value
  emitForm({ ...props.modelValue, totalThresholdsFemale: bounds })
}

const onRequireGenderChange = (requireGender: boolean) => {
  const prev = props.modelValue
  const slots = calcThresholdSlots(prev.riskLevels.length)
  if (requireGender) {
    emitForm(
      resizeThresholds({
        ...prev,
        requireGender: true,
        totalThresholdsMale: ensureThresholdLength(
          prev.totalThresholdsMale.length ? prev.totalThresholdsMale : prev.totalThresholdsCommon,
          slots,
        ),
        totalThresholdsFemale: ensureThresholdLength(
          prev.totalThresholdsFemale.length ? prev.totalThresholdsFemale : prev.totalThresholdsCommon,
          slots,
        ),
        totalThresholdsCommon: [],
      }),
    )
    return
  }
  emitForm(
    resizeThresholds({
      ...prev,
      requireGender: false,
      totalThresholdsCommon: ensureThresholdLength(
        prev.totalThresholdsCommon.length ? prev.totalThresholdsCommon : prev.totalThresholdsMale,
        slots,
      ),
      totalThresholdsMale: [],
      totalThresholdsFemale: [],
    }),
  )
}
</script>

<style lang="scss" scoped>
.agent-setting-sub-ty-survey-panel {
  --label-width: 100px;
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

    .agent-setting-sub-ty-survey-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-survey-accordion {
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
}

.survey-section-lead {
  margin: 0;
}

.survey-output-sections,
.survey-score-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: calc(var(--label-width) + 12px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .com-setting-label {
      width: auto;
      text-align: left;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__value {
    width: 56px;
    flex-shrink: 0;
  }
}

.survey-output-sections {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .com-setting-label {
      width: auto;
      text-align: left;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.ui-input-outer) {
      flex: 1;
      min-width: 0;
    }
  }
}

.survey-threshold-row,
.survey-risk-levels {
  margin-left: calc(var(--label-width) + 12px);
}

.survey-risk-levels {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .com-setting-label {
      width: auto;
      text-align: left;
    }
  }
}

.survey-risk-level-row {
  display: flex;
  align-items: center;
  gap: 8px;

  &__label {
    flex: 0.9;
    min-width: 0;
  }

  &__tone {
    flex: 1.4;
    min-width: 0;
  }
}

.survey-threshold-inline {
  flex-wrap: wrap;
  margin-bottom: 4px;

  &__label {
    min-width: 72px;
    font-size: 12px;
    color: $color-text-muted;
  }
}

.type-config-row {
  display: flex;
  gap: 12px;
}

.type-config-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  .com-setting-label {
    width: auto;
    text-align: left;
  }
}

.survey-feature-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: calc(var(--label-width) + 12px);
}

.survey-icon-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: $border-radius-base;
  background: transparent;
  color: $color-text-muted;
  cursor: pointer;

  &:hover {
    background: #eef2f6;
    color: $color-text-dark;
  }
}
</style>
