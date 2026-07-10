<template>
  <div class="agent-setting-sub-ty-auto-recommend-panel">
    <div class="agent-setting-sub-ty-auto-recommend-panel__header">
      <span class="com-setting-section-title">자동추천 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-auto-recommend-panel__summary">
        에이전트 정보·UI 문구·엔진·결과 표시·제약·기능을 아래 영역에서 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-auto-recommend-panel__accordions">
      <!-- ① 에이전트 정보 -->
      <div class="agent-setting-sub-ty-auto-recommend-accordion">
        <UiSettingSection
          title="에이전트 정보"
          collapsible
          label-width="120px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">에이전트 ID</label>
            <UiInput
              :model-value="modelValue.agentId"
              placeholder="예: meme-delivery"
              size="sm"
              @update:model-value="onUpdate('agentId', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">에이전트 이름</label>
            <UiInput
              :model-value="modelValue.agentName"
              placeholder="예: 밈 배달부"
              size="sm"
              @update:model-value="onUpdate('agentName', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">페르소나</label>
            <UiInput
              :model-value="modelValue.agentPersona"
              placeholder="예: 한국 커뮤니티 트렌드·밈 표현 분석에 특화된 큐레이터"
              size="sm"
              @update:model-value="onUpdate('agentPersona', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">임무 설명</label>
            <UiTextarea
              :model-value="modelValue.agentMission"
              placeholder="최근 24시간 커뮤니티에서 반복되는 유행 표현을 선별하여 전달하는 것이 임무입니다."
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
          <div class="com-setting-field-row">
            <label class="com-setting-label">기본 모델 ID</label>
            <UiInput
              :model-value="modelValue.defaultModelId"
              placeholder="예: gemini-3-flash-preview"
              size="sm"
              @update:model-value="onUpdate('defaultModelId', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">API 모드</label>
            <UiSelect
              :model-value="modelValue.apiMode || ''"
              :options="apiModeOptions"
              placeholder="API 모드를 선택하세요"
              size="sm"
              @update:model-value="onApiModeChange(String($event ?? ''))"
            />
          </div>
        </UiSettingSection>
      </div>

      <!-- ② UI 문구 -->
      <div class="agent-setting-sub-ty-auto-recommend-accordion">
        <UiSettingSection
          title="UI 문구"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint auto-recommend-section-lead">
            채팅 자동추천 카드에 표시되는 제목·인트로·전달 완료·버튼 문구입니다.
          </p>
          <div class="com-setting-field-row">
            <label class="com-setting-label">카드 제목</label>
            <UiInput
              :model-value="modelValue.cardTitle"
              placeholder="예: 오늘의 밈 배달부"
              size="sm"
              @update:model-value="onUpdate('cardTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">카드 부제</label>
            <UiInput
              :model-value="modelValue.cardSubtitle"
              placeholder="예: 오늘의 밈 추천을 시작해 보세요."
              size="sm"
              @update:model-value="onUpdate('cardSubtitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">읽기 전용 부제</label>
            <UiInput
              :model-value="modelValue.cardSubtitleReadonly"
              placeholder="예: 최신 유행 밈들을 선별했어요!"
              size="sm"
              @update:model-value="onUpdate('cardSubtitleReadonly', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 부제</label>
            <UiInput
              :model-value="modelValue.introSubtitle"
              placeholder="예: 오늘의 밈을 고르는 중입니다..."
              size="sm"
              @update:model-value="onUpdate('introSubtitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">전달 완료 제목</label>
            <UiInput
              :model-value="modelValue.requestCompleteTitle"
              placeholder="예: 요청한 밈을 안전하게 전달했어요!"
              size="sm"
              @update:model-value="onUpdate('requestCompleteTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">전달 완료 설명</label>
            <UiTextarea
              :model-value="modelValue.requestCompleteDesc"
              placeholder="예: 밈 배달부가 오늘의 밈을 잘 전달했어요. 아래에서 맞춤 밈을 확인해보세요!"
              :rows="2"
              size="sm"
              :border="true"
              :auto-resize="true"
              :max-rows="4"
              @update:model-value="onUpdate('requestCompleteDesc', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">제출 버튼 라벨</label>
            <UiInput
              :model-value="modelValue.submitButtonLabel"
              placeholder="예: 오늘의 밈 받기"
              size="sm"
              @update:model-value="onUpdate('submitButtonLabel', String($event ?? ''))"
            />
          </div>

          <div class="auto-recommend-list-block">
            <div class="auto-recommend-list-block__head">
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
              class="auto-recommend-list-block__row"
            >
              <UiInput
                :model-value="modelValue.pendingStatusTexts[idx]"
                size="sm"
                placeholder="예: 유행 표현을 분석하고 있습니다..."
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

      <!-- ③ 엔진 (출력 스키마) -->
      <div class="agent-setting-sub-ty-auto-recommend-accordion">
        <UiSettingSection
          title="엔진 (출력 스키마)"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint auto-recommend-section-lead">LLM JSON 배열 출력에 포함할 필드 키 목록입니다.</p>
          <div class="auto-recommend-list-block auto-recommend-list-block--flush">
            <div class="auto-recommend-list-block__head">
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
              class="auto-recommend-list-block__row"
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

      <!-- ④ 결과 표시 -->
      <div class="agent-setting-sub-ty-auto-recommend-accordion">
        <UiSettingSection
          title="결과 표시"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <div class="com-setting-row type-config-row">
            <div class="type-config-col">
              <label class="com-setting-label">추천 개수 (topN)</label>
              <UiInput
                :model-value="modelValue.resultTopN"
                placeholder="5"
                size="sm"
                number-only
                :min="1"
                :max="AGENT_RECOMMEND_TOP_N_MAX"
                @update:model-value="onResultTopNUpdate"
              />
            </div>
            <div class="type-config-col">
              <label class="com-setting-label">이름 필드</label>
              <UiInput
                :model-value="modelValue.nameField"
                placeholder="title"
                size="sm"
                @update:model-value="onUpdate('nameField', String($event ?? ''))"
              />
            </div>
          </div>
          <p class="com-setting-hint type-config-row">
            카드 설명 행 라벨(특정 상황·사용 패턴·확산 흐름)은 채팅 UI에 고정되어 있습니다.
          </p>
        </UiSettingSection>
      </div>

      <!-- ⑤ 제약 -->
      <div class="agent-setting-sub-ty-auto-recommend-accordion">
        <UiSettingSection
          title="제약 (Constraints)"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint auto-recommend-section-lead">
            LLM 역할·분석 기준·출력 규칙을 한 줄씩 입력합니다. 기존 engine.prompt 내용은 이 목록으로 이전됩니다.
          </p>
          <div class="auto-recommend-list-block auto-recommend-list-block--flush">
            <div class="auto-recommend-list-block__head">
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
              class="auto-recommend-list-block__row"
            >
              <UiInput
                :model-value="modelValue.constraints[idx]"
                size="sm"
                placeholder="예: 5개만 추출"
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

      <!-- ⑥ 기능 -->
      <div class="agent-setting-sub-ty-auto-recommend-accordion">
        <UiSettingSection
          title="기능"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <div class="sql-checkbox-col auto-recommend-feature-col">
            <UiCheckbox
              :model-value="modelValue.autoSubmit"
              label="에이전트 선택 시 자동 제출 (인덱스·채팅방)"
              @update:model-value="onUpdate('autoSubmit', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.hideQuestion"
              label="질문 메시지 UI 숨김"
              @update:model-value="onUpdate('hideQuestion', $event)"
            />
            <UiCheckbox
              :model-value="modelValue.excludeNextQuestions"
              label="이후 질문 메시지 제외"
              @update:model-value="onUpdate('excludeNextQuestions', $event)"
            />
          </div>
        </UiSettingSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AutoRecommendConfigForm } from '~/utils/agent/autoRecommendConfigUtil'
import { AGENT_RECOMMEND_TOP_N_MAX, clampAgentRecommendTopN } from '~/utils/agent/recommendConfigUtil'

const props = defineProps<{
  modelValue: AutoRecommendConfigForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AutoRecommendConfigForm]
}>()

const apiModeOptions = [
  { label: '선택', value: '' },
  { label: '검색 전용 (searchOnly)', value: 'searchOnly' },
  { label: '기본 (default)', value: 'default' },
]

const onUpdate = <K extends keyof AutoRecommendConfigForm>(key: K, value: AutoRecommendConfigForm[K]) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const onResultTopNUpdate = (raw: string | number) => {
  onUpdate('resultTopN', clampAgentRecommendTopN(raw))
}

const onApiModeChange = (value: string) => {
  const apiMode: AutoRecommendConfigForm['apiMode'] = value === 'searchOnly' || value === 'default' ? value : ''
  onUpdate('apiMode', apiMode)
}

const onAddPendingText = () => {
  onUpdate('pendingStatusTexts', [...props.modelValue.pendingStatusTexts, ''])
}

const onPendingTextUpdate = (idx: number, value: string) => {
  const next = [...props.modelValue.pendingStatusTexts]
  next[idx] = value
  onUpdate('pendingStatusTexts', next)
}

const onRemovePendingText = (idx: number) => {
  onUpdate(
    'pendingStatusTexts',
    props.modelValue.pendingStatusTexts.filter((_, i) => i !== idx),
  )
}

const onAddOutputSchemaField = () => {
  onUpdate('outputSchemaItemFields', [...props.modelValue.outputSchemaItemFields, ''])
}

const onOutputSchemaFieldUpdate = (idx: number, value: string) => {
  const next = [...props.modelValue.outputSchemaItemFields]
  next[idx] = value
  onUpdate('outputSchemaItemFields', next)
}

const onRemoveOutputSchemaField = (idx: number) => {
  onUpdate(
    'outputSchemaItemFields',
    props.modelValue.outputSchemaItemFields.filter((_, i) => i !== idx),
  )
}

const onAddConstraint = () => {
  onUpdate('constraints', [...props.modelValue.constraints, ''])
}

const onConstraintUpdate = (idx: number, value: string) => {
  const next = [...props.modelValue.constraints]
  next[idx] = value
  onUpdate('constraints', next)
}

const onRemoveConstraint = (idx: number) => {
  onUpdate(
    'constraints',
    props.modelValue.constraints.filter((_, i) => i !== idx),
  )
}
</script>

<style lang="scss" scoped>
.agent-setting-sub-ty-auto-recommend-panel {
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

    .agent-setting-sub-ty-auto-recommend-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-auto-recommend-accordion {
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

.auto-recommend-section-lead {
  margin: 0;
}

.type-config-row {
  margin-left: calc(var(--label-width) + 12px);
}

.type-config-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .com-setting-label {
    width: auto;
    text-align: left;
  }

  .com-setting-hint {
    margin-top: 0;
  }
}

.auto-recommend-list-block {
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

  &--flush {
    margin-left: 0;
  }
}

.auto-recommend-feature-col {
  margin-left: calc(var(--label-width) + 12px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
