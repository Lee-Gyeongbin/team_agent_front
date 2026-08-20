<template>
  <div class="agent-setting-sub-ty-survey-panel">
    <div class="agent-setting-sub-ty-survey-panel__header">
      <span class="com-setting-section-title">설문 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-survey-panel__summary">
        에이전트 정보·척도·영역·등급·출력 섹션·제약·기능 옵션을 아래 영역에서 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-survey-panel__accordions">
      <!-- ① 에이전트 정보 -->
      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="에이전트 정보"
          collapsible
          label-width="100px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">페르소나</label>
            <UiInput
              :model-value="modelValue.agentPersona"
              placeholder="예: 전문 산업심리 상담사 및 멘탈 웰니스 코치"
              size="sm"
              @update:model-value="onUpdate('agentPersona', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">임무 설명</label>
            <UiTextarea
              :model-value="modelValue.agentMission"
              placeholder="사용자의 설문 결과를 분석하여 실질적인 가이드를 제공하는 것이 임무입니다."
              :rows="3"
              size="sm"
              :border="true"
              :auto-resize="true"
              :max-rows="6"
              @update:model-value="onUpdate('agentMission', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">출력 언어</label>
            <UiInput
              :model-value="modelValue.agentLanguageLabel"
              placeholder="한국어"
              size="sm"
              @update:model-value="onUpdate('agentLanguageLabel', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">언어 예외</label>
            <UiInput
              :model-value="modelValue.agentLanguageExceptions"
              placeholder="곡명·아티스트명·이미지 키워드는 영어 허용"
              size="sm"
              @update:model-value="onUpdate('agentLanguageExceptions', String($event ?? ''))"
            />
          </div>
        </UiSettingSection>
      </div>

      <!-- ② 설문 UI 문구 -->
      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="설문 UI 문구"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <p class="com-setting-hint agent-setting-sub-ty-survey-panel__summary">
            채팅 설문 화면에 표시되는 제목·출처·소개 문구입니다. 비워두면 설문 유형별 기본값이 적용됩니다.
          </p>
          <div class="com-setting-field-row">
            <label class="com-setting-label">설문 제목</label>
            <UiInput
              :model-value="modelValue.surveyTitle"
              placeholder="예: 한국인 직무스트레스 요인 평가"
              size="sm"
              @update:model-value="onUpdate('surveyTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">출처</label>
            <UiInput
              :model-value="modelValue.disclaimerSource"
              placeholder="예: 출처 : 한국형 직무스트레스 평가도구 (KOSS-SF1) : 한국산업안전보건공단"
              size="sm"
              @update:model-value="onUpdate('disclaimerSource', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">소개·면책</label>
            <UiTextarea
              :model-value="modelValue.disclaimerText"
              placeholder="설문 도구 소개 및 면책 안내 문구"
              :rows="4"
              size="sm"
              :border="true"
              :auto-resize="true"
              :max-rows="8"
              @update:model-value="onUpdate('disclaimerText', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 제목</label>
            <UiInput
              :model-value="modelValue.introTitle"
              placeholder="예: 심리 스트레스 진단"
              size="sm"
              @update:model-value="onUpdate('introTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 부제</label>
            <UiInput
              :model-value="modelValue.introSubtitle"
              placeholder="예: 상담 세션을 준비하고 있습니다..."
              size="sm"
              @update:model-value="onUpdate('introSubtitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">성별 선택 제목</label>
            <UiInput
              :model-value="modelValue.genderStepTitle"
              placeholder="예: 진단 전 성별을 선택해 주세요"
              size="sm"
              @update:model-value="onUpdate('genderStepTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">성별 선택 설명</label>
            <UiTextarea
              :model-value="modelValue.genderStepDesc"
              placeholder="성별 선택이 필요한 이유를 안내합니다."
              :rows="2"
              size="sm"
              :border="true"
              :auto-resize="true"
              :max-rows="4"
              @update:model-value="onUpdate('genderStepDesc', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">제출 버튼</label>
            <UiInput
              :model-value="modelValue.submitLabel"
              placeholder="예: 진단 완료 후 상담 시작"
              size="sm"
              @update:model-value="onUpdate('submitLabel', String($event ?? ''))"
            />
          </div>
        </UiSettingSection>
      </div>

      <!-- ③ 기본 · 척도 -->
      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="기본 · 척도"
          collapsible
          :default-collapsed="true"
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
          <div class="com-setting-field-row">
            <label class="com-setting-label">핵심 원인 N개</label>
            <div class="com-setting-field-input survey-topn-field">
              <UiInput
                :model-value="modelValue.topN"
                number-only
                size="sm"
                @update:model-value="onUpdate('topN', Number($event ?? 2))"
              />
              <span class="com-setting-hint">상위 N개 영역을 핵심 원인으로 제시합니다.</span>
            </div>
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

      <!-- ④ 영역 · 문항 -->
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

      <!-- ⑤ 평가 등급 -->
      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="평가 등급"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <p class="com-setting-hint survey-section-lead">
            등급 이름과 LLM 톤을 정의합니다. 뱃지·상태 클래스는 채팅 결과 요약(현재 상태) 색상에 사용됩니다. 구간 상한은
            등급 수보다 1개 적게 입력합니다.
          </p>

          <div class="survey-result-tiers">
            <div class="survey-result-tiers__head">
              <span class="com-setting-label">등급 목록</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddResultTier"
              >
                등급 추가
              </UiButton>
            </div>
            <div
              v-for="(tier, idx) in modelValue.resultTiers"
              :key="`tier-${idx}`"
              class="survey-result-tier-card"
            >
              <div class="survey-result-tier-card__head">
                <UiInput
                  :model-value="tier.label"
                  size="sm"
                  placeholder="등급명 (예: 정상군)"
                  @update:model-value="onResultTierUpdate(idx, 'label', String($event ?? ''))"
                />
                <button
                  v-if="modelValue.resultTiers.length > 2"
                  type="button"
                  class="survey-icon-btn"
                  title="등급 삭제"
                  @click="onRemoveResultTier(idx)"
                >
                  <i class="icon-trashcan size-14" />
                </button>
              </div>
              <UiInput
                :model-value="tier.tone"
                size="sm"
                placeholder="LLM 톤 안내 (예: 공감 중심, 따듯하고 친근한 말투)"
                @update:model-value="onResultTierUpdate(idx, 'tone', String($event ?? ''))"
              />
              <div class="survey-result-tier-card__style">
                <span class="com-setting-hint">결과 요약 뱃지·상태 텍스트 CSS 클래스</span>
                <div class="survey-result-tier-card__style-row">
                  <UiInput
                    :model-value="tier.badgeClass"
                    size="sm"
                    placeholder="뱃지 (risk-safe)"
                    @update:model-value="onResultTierUpdate(idx, 'badgeClass', String($event ?? ''))"
                  />
                  <UiInput
                    :model-value="tier.statusClass"
                    size="sm"
                    placeholder="상태 (risk-status--safe)"
                    @update:model-value="onResultTierUpdate(idx, 'statusClass', String($event ?? ''))"
                  />
                </div>
              </div>
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
                  {{ modelValue.resultTiers[slot - 1]?.label || `등급 ${slot}` }} 이하
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
                    {{ modelValue.resultTiers[slot - 1]?.label || `등급 ${slot}` }} 이하
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
                    {{ modelValue.resultTiers[slot - 1]?.label || `등급 ${slot}` }} 이하
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
        </UiSettingSection>
      </div>

      <!-- ⑥ 출력 섹션 -->
      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="출력 섹션"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <AgentSettingSubTySurveyOutputSections
            :model-value="modelValue"
            @update:model-value="emit('update:modelValue', $event)"
          />
        </UiSettingSection>
      </div>

      <!-- ⑦ 제약 -->
      <div class="agent-setting-sub-ty-survey-accordion">
        <UiSettingSection
          title="제약 (Constraints)"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <p class="com-setting-hint survey-section-lead">LLM이 반드시 준수해야 할 제약 사항을 한 줄씩 입력합니다.</p>
          <div class="survey-constraints">
            <div class="survey-constraints__head">
              <span class="com-setting-label">제약 목록</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddConstraint"
              >
                항목 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.constraints.length"
              class="com-setting-hint"
            >
              항목을 추가해 주세요.
            </p>
            <div
              v-for="(_, idx) in modelValue.constraints"
              :key="`constraint-${idx}`"
              class="survey-constraints__row"
            >
              <UiInput
                :model-value="modelValue.constraints[idx]"
                size="sm"
                placeholder="예: 의료 진단 금지. 약물처방 금지."
                @update:model-value="onConstraintUpdate(idx, String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveConstraint(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ⑦ 기능 -->
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
import { UiCheckbox } from '@leechanyong/ispark-ui'
import type { SurveyResultTierForm, SurveyScoreOptionForm } from '~/types/agentSurveyConfig'
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

const thresholdSlotCount = computed(() => calcThresholdSlots(props.modelValue.resultTiers.length))

const onUpdate = <K extends keyof SurveyConfigForm>(key: K, value: SurveyConfigForm[K]) => {
  emitForm({ ...props.modelValue, [key]: value })
}

// ── 척도 선택지 ──────────────────────────────────────────────
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

// ── 결과 등급 ──────────────────────────────────────────────
const resizeThresholds = (form: SurveyConfigForm): SurveyConfigForm => {
  const slots = calcThresholdSlots(form.resultTiers.length)
  return {
    ...form,
    totalThresholdsCommon: ensureThresholdLength(form.totalThresholdsCommon, slots),
    totalThresholdsMale: ensureThresholdLength(form.totalThresholdsMale, slots),
    totalThresholdsFemale: ensureThresholdLength(form.totalThresholdsFemale, slots),
  }
}

const onAddResultTier = () => {
  const resultTiers: SurveyResultTierForm[] = [
    ...props.modelValue.resultTiers,
    { key: '', label: '', badgeClass: '', statusClass: '', tone: '' },
  ]
  emitForm(resizeThresholds({ ...props.modelValue, resultTiers }))
}

const onRemoveResultTier = (idx: number) => {
  if (props.modelValue.resultTiers.length <= 2) return
  const resultTiers = props.modelValue.resultTiers.filter((_, i) => i !== idx)
  emitForm(resizeThresholds({ ...props.modelValue, resultTiers }))
}

const onResultTierUpdate = (idx: number, key: keyof SurveyResultTierForm, value: string) => {
  const resultTiers = props.modelValue.resultTiers.map((t, i) => (i === idx ? { ...t, [key]: value } : t))
  emitForm({ ...props.modelValue, resultTiers })
}

// ── 총점 구간 ──────────────────────────────────────────────
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
  const slots = calcThresholdSlots(prev.resultTiers.length)
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

// ── 제약 ──────────────────────────────────────────────────
const onAddConstraint = () => {
  emitForm({ ...props.modelValue, constraints: [...props.modelValue.constraints, ''] })
}

const onConstraintUpdate = (idx: number, value: string) => {
  const constraints = props.modelValue.constraints.map((c, i) => (i === idx ? value : c))
  emitForm({ ...props.modelValue, constraints })
}

const onRemoveConstraint = (idx: number) => {
  emitForm({
    ...props.modelValue,
    constraints: props.modelValue.constraints.filter((_, i) => i !== idx),
  })
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

  :deep(.com-setting-field-row) {
    .ui-input-outer,
    .ui-textarea {
      flex: 1;
      min-width: 0;
    }
  }
}

.survey-section-lead {
  margin: 0;
}

.survey-topn-field {
  flex: 0 0 auto;
  width: 120px;
}

// ── 응답 척도 ──────────────────────────────────────────────
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

// ── 결과 등급 ──────────────────────────────────────────────
.survey-result-tiers {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: calc(var(--label-width) + 12px);

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

.survey-result-tier-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #dce4e9;
  border-radius: $border-radius-base;
  background: #fff;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.ui-input-outer) {
      flex: 1;
      min-width: 0;
    }
  }

  &__style {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 2px;
  }

  &__style-row {
    display: flex;
    gap: 8px;

    :deep(.ui-input-outer) {
      flex: 1;
      min-width: 0;
    }
  }
}

// ── 구간 상한 ──────────────────────────────────────────────
.survey-threshold-row {
  margin-left: calc(var(--label-width) + 12px);
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

// ── 제약 ──────────────────────────────────────────────────
.survey-constraints {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: calc(var(--label-width) + 12px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;

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

// ── 기능 ──────────────────────────────────────────────────
.survey-feature-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: calc(var(--label-width) + 12px);
}

// ── 공통 아이콘 버튼 ──────────────────────────────────────
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
