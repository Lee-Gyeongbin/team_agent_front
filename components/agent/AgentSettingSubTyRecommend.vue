<template>
  <div class="agent-setting-sub-ty-recommend-panel">
    <div class="agent-setting-sub-ty-recommend-panel__header">
      <span class="com-setting-section-title">추천 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-recommend-panel__summary">
        에이전트 정보·UI 문구·입력 폼·결과 표시·엔진·기능·제약을 아래 영역에서 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-recommend-panel__accordions">
      <!-- ① 에이전트 정보 -->
      <div class="agent-setting-sub-ty-recommend-accordion">
        <UiSettingSection
          title="에이전트 정보"
          collapsible
          label-width="100px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">에이전트 ID</label>
            <UiInput
              :model-value="modelValue.agentId"
              placeholder="예: music-recommend"
              size="sm"
              @update:model-value="onUpdate('agentId', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">에이전트 이름</label>
            <UiInput
              :model-value="modelValue.agentName"
              placeholder="예: 음악추천"
              size="sm"
              @update:model-value="onUpdate('agentName', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">페르소나</label>
            <UiInput
              :model-value="modelValue.agentPersona"
              placeholder="예: 음악 취향 분석과 감성적 큐레이션에 특화된 음악 전문 DJ"
              size="sm"
              @update:model-value="onUpdate('agentPersona', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">임무 설명</label>
            <UiTextarea
              :model-value="modelValue.agentMission"
              placeholder="사용자의 현재 기분·상황·장르 취향을 파악하여 추천하는 것이 임무입니다."
              :rows="3"
              size="sm"
              :border="true"
              :auto-resize="true"
              :max-rows="6"
              @update:model-value="onUpdate('agentMission', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-row type-config-row">
            <div class="type-config-col">
              <label class="com-setting-label">언어 코드</label>
              <UiInput
                :model-value="modelValue.language"
                placeholder="ko"
                size="sm"
                @update:model-value="onUpdate('language', String($event ?? ''))"
              />
            </div>
            <div class="type-config-col">
              <label class="com-setting-label">버전</label>
              <UiInput
                :model-value="modelValue.version"
                placeholder="1.0"
                size="sm"
                @update:model-value="onUpdate('version', String($event ?? ''))"
              />
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ② UI 문구 -->
      <div class="agent-setting-sub-ty-recommend-accordion">
        <UiSettingSection
          title="UI 문구"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <p class="com-setting-hint recommend-section-lead">
            채팅 추천 화면에 표시되는 카드·인트로·대기 상태 문구입니다.
          </p>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 제목</label>
            <UiInput
              :model-value="modelValue.introTitle"
              placeholder="예: 음악 추천 에이전트"
              size="sm"
              @update:model-value="onUpdate('introTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 부제</label>
            <UiInput
              :model-value="modelValue.introSubtitle"
              placeholder="예: 음악 추천 에이전트를 생성 중입니다..."
              size="sm"
              @update:model-value="onUpdate('introSubtitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">카드 제목</label>
            <UiInput
              :model-value="modelValue.cardTitle"
              placeholder="예: 음악 추천 에이전트"
              size="sm"
              @update:model-value="onUpdate('cardTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">카드 부제</label>
            <UiInput
              :model-value="modelValue.cardSubtitle"
              placeholder="예: 아래 항목을 모두 선택해 주세요."
              size="sm"
              @update:model-value="onUpdate('cardSubtitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">결과 카드 제목</label>
            <UiInput
              :model-value="modelValue.cardTitleResult"
              placeholder="예: 음악 추천 결과"
              size="sm"
              @update:model-value="onUpdate('cardTitleResult', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">결과 카드 부제</label>
            <UiInput
              :model-value="modelValue.cardSubtitleResult"
              placeholder="예: 현재 기분에 어울리는 음악을 추천해드립니다."
              size="sm"
              @update:model-value="onUpdate('cardSubtitleResult', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">읽기 전용 부제</label>
            <UiInput
              :model-value="modelValue.cardSubtitleReadonly"
              placeholder="예: 추천 요청이 완료되었습니다."
              size="sm"
              @update:model-value="onUpdate('cardSubtitleReadonly', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">이미지 안내</label>
            <UiInput
              :model-value="modelValue.imageNotice"
              placeholder="예: ※ 본 이미지는 참고용 앨범 이미지입니다"
              size="sm"
              @update:model-value="onUpdate('imageNotice', String($event ?? ''))"
            />
          </div>

          <div class="recommend-list-block">
            <div class="recommend-list-block__head">
              <span class="com-setting-label">대기 상태 문구</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddPendingText"
              >
                문구 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.pendingStatusTexts.length"
              class="com-setting-hint"
            >
              항목을 추가해 주세요.
            </p>
            <div
              v-for="(_, idx) in modelValue.pendingStatusTexts"
              :key="`pending-${idx}`"
              class="recommend-list-block__row"
            >
              <UiInput
                :model-value="modelValue.pendingStatusTexts[idx]"
                size="sm"
                placeholder="예: 어울리는 음악을 찾고 있는 중입니다..."
                @update:model-value="onPendingTextUpdate(idx, String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemovePendingText(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ③ 입력 폼 -->
      <div class="agent-setting-sub-ty-recommend-accordion">
        <UiSettingSection
          title="입력 폼"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <div class="sql-checkbox-col recommend-feature-col">
            <UiCheckbox
              :model-value="modelValue.useRegionSelect"
              label="지역 선택 사용"
              @update:model-value="onUpdate('useRegionSelect', $event)"
            />
          </div>
          <div
            v-if="modelValue.useRegionSelect"
            class="com-setting-field-row"
          >
            <label class="com-setting-label">지역 선택 라벨</label>
            <UiInput
              :model-value="modelValue.regionSelectLabel"
              placeholder="예: 지역을 선택해주세요"
              size="sm"
              @update:model-value="onUpdate('regionSelectLabel', String($event ?? ''))"
            />
          </div>

          <div class="recommend-form-fields">
            <div class="recommend-form-fields__head">
              <span class="com-setting-label">칩 선택 필드</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddFormField"
              >
                필드 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.formFields.length"
              class="com-setting-hint"
            >
              필드를 추가해 주세요.
            </p>
            <div
              v-for="(field, fieldIdx) in modelValue.formFields"
              :key="`field-${fieldIdx}`"
              class="recommend-form-field-card"
            >
              <div class="recommend-form-field-card__head">
                <UiInput
                  :model-value="field.key"
                  size="sm"
                  placeholder="키 (예: mood)"
                  class="recommend-form-field-card__key"
                  @update:model-value="onFormFieldUpdate(fieldIdx, 'key', String($event ?? ''))"
                />
                <UiCheckbox
                  :model-value="field.required"
                  label="필수"
                  @update:model-value="onFormFieldUpdate(fieldIdx, 'required', $event)"
                />
                <button
                  type="button"
                  class="survey-icon-btn"
                  title="필드 삭제"
                  @click="onRemoveFormField(fieldIdx)"
                >
                  <i class="icon-trashcan size-14" />
                </button>
              </div>
              <UiInput
                :model-value="field.label"
                size="sm"
                placeholder="질문 라벨 (예: 지금 기분이 어떠신가요?)"
                @update:model-value="onFormFieldUpdate(fieldIdx, 'label', String($event ?? ''))"
              />
              <div class="recommend-options">
                <div class="recommend-options__head">
                  <span class="com-setting-hint">선택지</span>
                  <UiButton
                    variant="line-secondary"
                    size="xs"
                    @click="onAddFormFieldOption(fieldIdx)"
                  >
                    선택지 추가
                  </UiButton>
                </div>
                <div
                  v-for="(_, optIdx) in field.options"
                  :key="`field-${fieldIdx}-opt-${optIdx}`"
                  class="recommend-options__row"
                >
                  <UiInput
                    :model-value="field.options[optIdx]"
                    size="sm"
                    placeholder="선택지"
                    @update:model-value="onFormFieldOptionUpdate(fieldIdx, optIdx, String($event ?? ''))"
                  />
                  <button
                    type="button"
                    class="survey-icon-btn"
                    title="선택지 삭제"
                    @click="onRemoveFormFieldOption(fieldIdx, optIdx)"
                  >
                    <i class="icon-trashcan size-14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ④ 결과 표시 -->
      <div class="agent-setting-sub-ty-recommend-accordion">
        <UiSettingSection
          title="결과 표시"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">추천 개수 (topN)</label>
            <div class="com-setting-field-input">
              <UiInput
                :model-value="modelValue.resultTopN"
                number-only
                size="sm"
                @update:model-value="onUpdate('resultTopN', Number($event ?? 5))"
              />
            </div>
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">순위 라벨</label>
            <UiInput
              :model-value="modelValue.rankLabel"
              placeholder="예: 추천"
              size="sm"
              @update:model-value="onUpdate('rankLabel', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-row type-config-row">
            <div class="type-config-col">
              <label class="com-setting-label">제목 필드 키</label>
              <UiInput
                :model-value="modelValue.nameField"
                placeholder="예: title"
                size="sm"
                @update:model-value="onUpdate('nameField', String($event ?? ''))"
              />
            </div>
            <div class="type-config-col">
              <label class="com-setting-label">이미지 필드 키</label>
              <UiInput
                :model-value="modelValue.imageField"
                placeholder="예: imageUrl"
                size="sm"
                @update:model-value="onUpdate('imageField', String($event ?? ''))"
              />
            </div>
          </div>

          <div class="recommend-list-block">
            <div class="recommend-list-block__head">
              <span class="com-setting-label">결과 표시 필드</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddResultField"
              >
                필드 추가
              </UiButton>
            </div>
            <div
              v-for="(field, idx) in modelValue.resultFields"
              :key="`result-${idx}`"
              class="recommend-result-field-row"
            >
              <UiInput
                :model-value="field.key"
                size="sm"
                placeholder="키"
                class="recommend-result-field-row__key"
                @update:model-value="onResultFieldUpdate(idx, 'key', String($event ?? ''))"
              />
              <UiInput
                :model-value="field.label"
                size="sm"
                placeholder="라벨"
                @update:model-value="onResultFieldUpdate(idx, 'label', String($event ?? ''))"
              />
              <UiSelect
                :model-value="field.type || ''"
                :options="resultFieldTypeOptions"
                size="sm"
                placeholder="타입"
                @update:model-value="onResultFieldUpdate(idx, 'type', String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveResultField(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ⑤ 엔진 -->
      <div class="agent-setting-sub-ty-recommend-accordion">
        <UiSettingSection
          title="엔진 (출력 스키마)"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <p class="com-setting-hint recommend-section-lead">
            LLM JSON 배열 출력에 포함할 필드 키 목록입니다.
          </p>
          <div class="recommend-list-block">
            <div class="recommend-list-block__head">
              <span class="com-setting-label">itemFields</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddOutputSchemaField"
              >
                필드 추가
              </UiButton>
            </div>
            <div
              v-for="(_, idx) in modelValue.outputSchemaItemFields"
              :key="`schema-${idx}`"
              class="recommend-list-block__row"
            >
              <UiInput
                :model-value="modelValue.outputSchemaItemFields[idx]"
                size="sm"
                placeholder="예: title"
                @update:model-value="onOutputSchemaFieldUpdate(idx, String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveOutputSchemaField(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ⑥ 기능 -->
      <div class="agent-setting-sub-ty-recommend-accordion">
        <UiSettingSection
          title="기능"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <div class="sql-checkbox-col recommend-feature-col">
            <UiCheckbox
              :model-value="modelValue.useGeolocation"
              label="위치 정보 사용"
              @update:model-value="onUpdate('useGeolocation', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.showThumbnailImages"
              label="썸네일 이미지 표시"
              @update:model-value="onUpdate('showThumbnailImages', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.showImageNotice"
              label="이미지 안내 문구 표시"
              @update:model-value="onUpdate('showImageNotice', $event)"
            />
          </div>
        </UiSettingSection>
      </div>

      <!-- ⑦ 제약 -->
      <div class="agent-setting-sub-ty-recommend-accordion">
        <UiSettingSection
          title="제약 (Constraints)"
          collapsible
          :default-collapsed="true"
          label-width="100px"
        >
          <p class="com-setting-hint recommend-section-lead">LLM이 반드시 준수해야 할 제약 사항을 한 줄씩 입력합니다.</p>
          <div class="recommend-list-block">
            <div class="recommend-list-block__head">
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
              class="recommend-list-block__row"
            >
              <UiInput
                :model-value="modelValue.constraints[idx]"
                size="sm"
                placeholder="예: 실제로 존재하는 곡만 추천할 것."
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecommendConfigForm, RecommendFormFieldForm, RecommendResultFieldForm } from '~/utils/agent/recommendConfigUtil'

const props = defineProps<{
  modelValue: RecommendConfigForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RecommendConfigForm]
}>()

const resultFieldTypeOptions = [
  { label: '기본', value: '' },
  { label: '링크', value: 'link' },
  { label: '텍스트', value: 'text' },
]

const emitForm = (next: RecommendConfigForm) => emit('update:modelValue', next)

const onUpdate = <K extends keyof RecommendConfigForm>(key: K, value: RecommendConfigForm[K]) => {
  emitForm({ ...props.modelValue, [key]: value })
}

// ── 대기 상태 문구 ──────────────────────────────────────────
const onAddPendingText = () => {
  emitForm({
    ...props.modelValue,
    pendingStatusTexts: [...props.modelValue.pendingStatusTexts, ''],
  })
}

const onPendingTextUpdate = (idx: number, value: string) => {
  const pendingStatusTexts = props.modelValue.pendingStatusTexts.map((t, i) => (i === idx ? value : t))
  emitForm({ ...props.modelValue, pendingStatusTexts })
}

const onRemovePendingText = (idx: number) => {
  emitForm({
    ...props.modelValue,
    pendingStatusTexts: props.modelValue.pendingStatusTexts.filter((_, i) => i !== idx),
  })
}

// ── 입력 폼 필드 ──────────────────────────────────────────────
const onAddFormField = () => {
  const formFields: RecommendFormFieldForm[] = [
    ...props.modelValue.formFields,
    { key: '', label: '', type: 'chip_select', required: false, options: [''] },
  ]
  emitForm({ ...props.modelValue, formFields })
}

const onFormFieldUpdate = <K extends keyof RecommendFormFieldForm>(
  idx: number,
  key: K,
  value: RecommendFormFieldForm[K],
) => {
  const formFields = props.modelValue.formFields.map((f, i) => (i === idx ? { ...f, [key]: value } : f))
  emitForm({ ...props.modelValue, formFields })
}

const onRemoveFormField = (idx: number) => {
  emitForm({
    ...props.modelValue,
    formFields: props.modelValue.formFields.filter((_, i) => i !== idx),
  })
}

const onAddFormFieldOption = (fieldIdx: number) => {
  const formFields = props.modelValue.formFields.map((f, i) =>
    i === fieldIdx ? { ...f, options: [...f.options, ''] } : f,
  )
  emitForm({ ...props.modelValue, formFields })
}

const onFormFieldOptionUpdate = (fieldIdx: number, optIdx: number, value: string) => {
  const formFields = props.modelValue.formFields.map((f, i) => {
    if (i !== fieldIdx) return f
    const options = f.options.map((o, j) => (j === optIdx ? value : o))
    return { ...f, options }
  })
  emitForm({ ...props.modelValue, formFields })
}

const onRemoveFormFieldOption = (fieldIdx: number, optIdx: number) => {
  const formFields = props.modelValue.formFields.map((f, i) => {
    if (i !== fieldIdx) return f
    if (f.options.length <= 1) return f
    return { ...f, options: f.options.filter((_, j) => j !== optIdx) }
  })
  emitForm({ ...props.modelValue, formFields })
}

// ── 결과 필드 ──────────────────────────────────────────────
const onAddResultField = () => {
  const resultFields: RecommendResultFieldForm[] = [...props.modelValue.resultFields, { key: '', label: '', type: '' }]
  emitForm({ ...props.modelValue, resultFields })
}

const onResultFieldUpdate = (idx: number, key: keyof RecommendResultFieldForm, value: string | boolean) => {
  const resultFields = props.modelValue.resultFields.map((f, i) => {
    if (i !== idx) return f
    if (key === 'type') {
      const typeVal = String(value)
      const type: RecommendResultFieldForm['type'] =
        typeVal === 'link' || typeVal === 'text' ? typeVal : ''
      return { ...f, type }
    }
    return { ...f, [key]: value }
  })
  emitForm({ ...props.modelValue, resultFields })
}

const onRemoveResultField = (idx: number) => {
  emitForm({
    ...props.modelValue,
    resultFields: props.modelValue.resultFields.filter((_, i) => i !== idx),
  })
}

// ── 출력 스키마 ──────────────────────────────────────────────
const onAddOutputSchemaField = () => {
  emitForm({
    ...props.modelValue,
    outputSchemaItemFields: [...props.modelValue.outputSchemaItemFields, ''],
  })
}

const onOutputSchemaFieldUpdate = (idx: number, value: string) => {
  const outputSchemaItemFields = props.modelValue.outputSchemaItemFields.map((f, i) => (i === idx ? value : f))
  emitForm({ ...props.modelValue, outputSchemaItemFields })
}

const onRemoveOutputSchemaField = (idx: number) => {
  emitForm({
    ...props.modelValue,
    outputSchemaItemFields: props.modelValue.outputSchemaItemFields.filter((_, i) => i !== idx),
  })
}

// ── 제약 ──────────────────────────────────────────────
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
.agent-setting-sub-ty-recommend-panel {
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

    .agent-setting-sub-ty-recommend-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-recommend-accordion {
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
    .ui-textarea,
    .ui-select-wrap {
      flex: 1;
      min-width: 0;
    }
  }
}

.recommend-section-lead {
  margin: 0;
}

.recommend-list-block {
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

    :deep(.ui-input-outer),
    :deep(.ui-select-wrap) {
      flex: 1;
      min-width: 0;
    }
  }
}

.recommend-form-fields {
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

.recommend-form-field-card {
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

  &__key {
    flex: 1;
    min-width: 0;
  }
}

.recommend-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 2px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

.recommend-result-field-row {
  display: flex;
  align-items: center;
  gap: 8px;

  &__key {
    flex: 0 0 100px;
    min-width: 0;
  }

  :deep(.ui-input-outer),
  :deep(.ui-select-wrap) {
    flex: 1;
    min-width: 0;
  }
}

.recommend-feature-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: calc(var(--label-width) + 12px);
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
  gap: 8px;
  min-width: 0;

  .com-setting-label {
    width: auto;
    text-align: left;
  }
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
