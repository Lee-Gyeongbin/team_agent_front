<template>
  <div class="agent-setting-sub-ty-curation-panel">
    <div class="agent-setting-sub-ty-curation-panel__header">
      <span class="com-setting-section-title">큐레이션 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-curation-panel__summary">
        에이전트 정보·UI 문구·카테고리 설정·RSS 피드 매핑·결과 표시·엔진·제약을 아래 영역에서 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-curation-panel__accordions">
      <!-- ① 에이전트 정보 -->
      <div class="agent-setting-sub-ty-curation-accordion">
        <UiSettingSection
          title="에이전트 정보"
          collapsible
          label-width="140px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">에이전트 ID</label>
            <UiInput
              :model-value="modelValue.agentId"
              placeholder="예: news-curation"
              size="sm"
              @update:model-value="onUpdate('agentId', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">에이전트 이름</label>
            <UiInput
              :model-value="modelValue.agentName"
              placeholder="예: 뉴스픽"
              size="sm"
              @update:model-value="onUpdate('agentName', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">페르소나</label>
            <UiInput
              :model-value="modelValue.agentPersona"
              placeholder="예: 최신 뉴스 트렌드를 파악하고 사용자 관심사에 맞는 기사를 선별하는 뉴스 큐레이터"
              size="sm"
              @update:model-value="onUpdate('agentPersona', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">임무 설명</label>
            <UiTextarea
              :model-value="modelValue.agentMission"
              placeholder="사용자가 선택한 관심 카테고리의 후보 기사 중 가장 가치 있는 기사를 선별하여 추천하는 것이 임무입니다."
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
      <div class="agent-setting-sub-ty-curation-accordion">
        <UiSettingSection
          title="UI 문구"
          collapsible
          :default-collapsed="true"
          label-width="140px"
        >
          <p class="com-setting-hint curation-section-lead">
            채팅 큐레이션 화면에 표시되는 카드·인트로·대기 상태 문구입니다.
          </p>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 제목</label>
            <UiInput
              :model-value="modelValue.introTitle"
              placeholder="예: 오늘의 뉴스픽"
              size="sm"
              @update:model-value="onUpdate('introTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 부제</label>
            <UiInput
              :model-value="modelValue.introSubtitle"
              placeholder="예: 오늘의 뉴스픽을 준비 중입니다..."
              size="sm"
              @update:model-value="onUpdate('introSubtitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">카드 제목</label>
            <UiInput
              :model-value="modelValue.cardTitle"
              placeholder="예: 오늘의 뉴스픽"
              size="sm"
              @update:model-value="onUpdate('cardTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">결과 카드 부제</label>
            <UiInput
              :model-value="modelValue.cardSubtitleResult"
              placeholder="예: 골라주신 {categories} 카테고리를 통해 선정한 뉴스픽입니다!"
              size="sm"
              desc="{categories} 자리에 선택한 카테고리명이 치환됩니다."
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
            <label class="com-setting-label">선택 카테고리 안내</label>
            <UiInput
              :model-value="modelValue.selectionHint"
              placeholder="예: 선택하신 뉴스 분야입니다."
              size="sm"
              @update:model-value="onUpdate('selectionHint', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">하단 안내 문구</label>
            <UiInput
              :model-value="modelValue.footerTip"
              placeholder="예: TIP. 최대 {max}개까지 선택할 수 있으며..."
              size="sm"
              desc="{max} 자리에 최대 선택 개수가 치환됩니다."
              @update:model-value="onUpdate('footerTip', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">빈 결과 안내</label>
            <UiInput
              :model-value="modelValue.emptyMessage"
              placeholder="예: 아직 표시할 뉴스가 없습니다. 잠시 후 다시 확인해 주세요."
              size="sm"
              @update:model-value="onUpdate('emptyMessage', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">카테고리별 빈 결과 안내</label>
            <UiInput
              :model-value="modelValue.categoryEmptyMessage"
              placeholder="예: {category} 분야에 표시할 뉴스가 없습니다."
              size="sm"
              desc="{category} 자리에 카테고리명이 치환됩니다."
              @update:model-value="onUpdate('categoryEmptyMessage', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">요약 안내</label>
            <UiInput
              :model-value="modelValue.summaryNotice"
              placeholder="예: ※ 기사에 대한 설명은 AI가 제작한 참고용으로..."
              size="sm"
              @update:model-value="onUpdate('summaryNotice', String($event ?? ''))"
            />
          </div>

          <div class="curation-list-block">
            <div class="curation-list-block__head">
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
              class="curation-list-block__row"
            >
              <UiInput
                :model-value="modelValue.pendingStatusTexts[idx]"
                size="sm"
                placeholder="예: 어울리는 뉴스를 찾고 있는 중입니다..."
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

      <!-- ③ 카테고리 설정 -->
      <div class="agent-setting-sub-ty-curation-accordion">
        <UiSettingSection
          title="카테고리 설정"
          collapsible
          :default-collapsed="true"
          label-width="140px"
        >
          <p class="com-setting-hint curation-section-lead">
            사용자 관심 카테고리 선택지를 가져올 코드 그룹과 최대 선택 개수입니다.
          </p>
          <div class="com-setting-field-row">
            <label class="com-setting-label">카테고리 코드그룹 ID</label>
            <UiInput
              :model-value="modelValue.codeGrpId"
              placeholder="예: NC000001"
              size="sm"
              @update:model-value="onUpdate('codeGrpId', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">최대 선택 개수</label>
            <div class="com-setting-field-input">
              <UiInput
                :model-value="modelValue.maxCategoryCount"
                number-only
                size="sm"
                @update:model-value="onUpdate('maxCategoryCount', Number($event ?? 5))"
              />
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ④ RSS 피드 매핑 -->
      <div class="agent-setting-sub-ty-curation-accordion">
        <UiSettingSection
          title="RSS 피드 매핑"
          collapsible
          :default-collapsed="true"
          label-width="140px"
        >
          <p class="com-setting-hint curation-section-lead">
            카테고리 CODE_ID별로 후보 기사를 수집할 RSS 피드를 매핑합니다.
          </p>
          <div class="com-setting-row type-config-row">
            <div class="type-config-col">
              <label class="com-setting-label">언론사 라벨</label>
              <UiInput
                :model-value="modelValue.pressLabel"
                placeholder="예: 연합뉴스"
                size="sm"
                @update:model-value="onUpdate('pressLabel', String($event ?? ''))"
              />
            </div>
            <div class="type-config-col">
              <label class="com-setting-label">요약 최대 길이</label>
              <UiInput
                :model-value="modelValue.snippetMaxLength"
                number-only
                size="sm"
                @update:model-value="onUpdate('snippetMaxLength', Number($event ?? 400))"
              />
            </div>
          </div>

          <div class="curation-list-block">
            <div class="curation-list-block__head">
              <span class="com-setting-label">피드 매핑</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddCandidateSource"
              >
                피드 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.candidateSources.length"
              class="com-setting-hint"
            >
              피드를 추가해 주세요.
            </p>
            <div
              v-for="(source, idx) in modelValue.candidateSources"
              :key="`source-${idx}`"
              class="curation-source-row"
            >
              <UiInput
                :model-value="source.codeId"
                size="sm"
                placeholder="CODE_ID (예: 001)"
                class="curation-source-row__code"
                @update:model-value="onCandidateSourceUpdate(idx, 'codeId', String($event ?? ''))"
              />
              <UiInput
                :model-value="source.rssCategory"
                size="sm"
                placeholder="카테고리명 (예: 정치)"
                @update:model-value="onCandidateSourceUpdate(idx, 'rssCategory', String($event ?? ''))"
              />
              <UiInput
                :model-value="source.feedUrl"
                size="sm"
                placeholder="RSS Feed URL (예: https://www.yna.co.kr/rss/politics.xml)"
                class="curation-source-row__url"
                @update:model-value="onCandidateSourceUpdate(idx, 'feedUrl', String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveCandidateSource(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ⑤ 결과 표시 -->
      <div class="agent-setting-sub-ty-curation-accordion">
        <UiSettingSection
          title="결과 표시"
          collapsible
          :default-collapsed="true"
          label-width="140px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">카테고리별 추천 개수 (topN)</label>
            <div class="com-setting-field-input">
              <UiInput
                :model-value="modelValue.resultTopN"
                number-only
                size="sm"
                @update:model-value="onUpdate('resultTopN', Number($event ?? 5))"
              />
            </div>
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

          <div class="curation-list-block">
            <div class="curation-list-block__head">
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
              class="curation-result-field-row"
            >
              <UiInput
                :model-value="field.key"
                size="sm"
                placeholder="키"
                class="curation-result-field-row__key"
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

      <!-- ⑥ 엔진 -->
      <div class="agent-setting-sub-ty-curation-accordion">
        <UiSettingSection
          title="엔진 (출력 스키마)"
          collapsible
          :default-collapsed="true"
          label-width="140px"
        >
          <p class="com-setting-hint curation-section-lead">LLM JSON 배열 출력에 포함할 필드 키 목록입니다.</p>
          <div class="curation-list-block">
            <div class="curation-list-block__head">
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
              class="curation-list-block__row"
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

      <!-- ⑦ 제약 -->
      <div class="agent-setting-sub-ty-curation-accordion">
        <UiSettingSection
          title="제약 (Constraints)"
          collapsible
          :default-collapsed="true"
          label-width="140px"
        >
          <p class="com-setting-hint curation-section-lead">LLM이 반드시 준수해야 할 제약 사항을 한 줄씩 입력합니다.</p>
          <div class="curation-list-block">
            <div class="curation-list-block__head">
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
              class="curation-list-block__row"
            >
              <UiInput
                :model-value="modelValue.constraints[idx]"
                size="sm"
                placeholder="예: 반드시 후보 기사 목록(JSON 배열)에 있는 기사 중에서만 선택할 것."
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
import type {
  CurationCandidateSourceForm,
  CurationConfigForm,
  CurationResultFieldForm,
} from '~/utils/agent/curationConfigUtil'

const props = defineProps<{
  modelValue: CurationConfigForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CurationConfigForm]
}>()

const resultFieldTypeOptions = [
  { label: '기본', value: '' },
  { label: '링크', value: 'link' },
  { label: '텍스트', value: 'text' },
]

const emitForm = (next: CurationConfigForm) => emit('update:modelValue', next)

const onUpdate = <K extends keyof CurationConfigForm>(key: K, value: CurationConfigForm[K]) => {
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

// ── RSS 피드 매핑 ──────────────────────────────────────────
const onAddCandidateSource = () => {
  const candidateSources: CurationCandidateSourceForm[] = [
    ...props.modelValue.candidateSources,
    { codeId: '', rssCategory: '', feedUrl: '' },
  ]
  emitForm({ ...props.modelValue, candidateSources })
}

const onCandidateSourceUpdate = <K extends keyof CurationCandidateSourceForm>(
  idx: number,
  key: K,
  value: CurationCandidateSourceForm[K],
) => {
  const candidateSources = props.modelValue.candidateSources.map((s, i) => (i === idx ? { ...s, [key]: value } : s))
  emitForm({ ...props.modelValue, candidateSources })
}

const onRemoveCandidateSource = (idx: number) => {
  emitForm({
    ...props.modelValue,
    candidateSources: props.modelValue.candidateSources.filter((_, i) => i !== idx),
  })
}

// ── 결과 필드 ──────────────────────────────────────────────
const onAddResultField = () => {
  const resultFields: CurationResultFieldForm[] = [...props.modelValue.resultFields, { key: '', label: '', type: '' }]
  emitForm({ ...props.modelValue, resultFields })
}

const onResultFieldUpdate = (idx: number, key: keyof CurationResultFieldForm, value: string) => {
  const resultFields = props.modelValue.resultFields.map((f, i) => {
    if (i !== idx) return f
    if (key === 'type') {
      const type: CurationResultFieldForm['type'] = value === 'link' || value === 'text' ? value : ''
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
.agent-setting-sub-ty-curation-panel {
  --label-width: 140px;
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

    .agent-setting-sub-ty-curation-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-curation-accordion {
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
    align-items: flex-start;

    .com-setting-label {
      flex-shrink: 0;
      white-space: normal;
      word-break: keep-all;
      line-height: 1.4;
      padding-top: 6px;
    }

    &.is-top .com-setting-label {
      padding-top: 6px;
    }

    .ui-input-outer,
    .ui-textarea,
    .ui-select-wrap,
    .com-setting-field-input {
      flex: 1;
      min-width: 0;
    }
  }
}

.curation-section-lead {
  margin: 0;
}

.curation-list-block {
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

.curation-source-row {
  display: flex;
  align-items: center;
  gap: 8px;

  &__code {
    flex: 0 0 100px;
    min-width: 0;
  }

  :deep(.ui-input-outer) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ui-input-outer.curation-source-row__url) {
    flex: 2;
  }
}

.curation-result-field-row {
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
