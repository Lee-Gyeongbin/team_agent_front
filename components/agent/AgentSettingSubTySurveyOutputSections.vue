<template>
  <div class="survey-output-sections">
    <p class="com-setting-hint survey-output-sections__lead">
      채팅 결과에 표시될 섹션을 순서대로 구성합니다. 유형을 선택하면 필요한 필드가 자동으로 표시됩니다.
    </p>

    <p
      v-if="!modelValue.outputSections.length"
      class="com-setting-hint survey-output-sections__empty"
    >
      위에서 섹션 유형을 선택한 뒤 「섹션 추가」를 눌러 주세요.
    </p>

    <div class="survey-output-sections__list">
      <!-- 섹션 추가 (맨 위 고정) -->
      <article class="survey-output-section-card survey-output-section-card--add">
        <header class="survey-output-section-card__head">
          <div class="survey-output-section-card__head-main">
            <span class="survey-output-section-card__order is-add">+</span>
            <span class="survey-output-section-card__type-badge">섹션 추가</span>
            <span class="survey-output-section-card__preview">{{ addSectionTypeLabel }}</span>
          </div>
        </header>
        <div class="survey-output-section-card__body">
          <div class="survey-output-section-card__field">
            <label class="survey-output-section-card__label">섹션 유형</label>
            <UiSelect
              v-model="newBlockType"
              :options="outputBlockTypeOptions"
              placeholder="추가할 섹션 유형 선택"
              size="sm"
            />
            <p
              v-if="getBlockMeta(newBlockType)"
              class="com-setting-hint survey-output-section-card__type-desc"
            >
              {{ getBlockMeta(newBlockType)?.description }}
            </p>
          </div>
          <div class="survey-output-section-card__add-action">
            <UiButton
              variant="line-secondary"
              size="xs"
              @click="onAddSection"
            >
              섹션 추가
            </UiButton>
          </div>
        </div>
      </article>

      <article
        v-for="(block, idx) in modelValue.outputSections"
        :id="`survey-output-section-${idx}`"
        :key="`${block.id}-${idx}`"
        class="survey-output-section-card"
      >
        <header class="survey-output-section-card__head">
          <div class="survey-output-section-card__head-main">
            <span class="survey-output-section-card__order">{{ idx + 1 }}</span>
            <span class="survey-output-section-card__type-badge">{{ getBlockLabel(block.blockType) }}</span>
            <span class="survey-output-section-card__preview">{{ block.title || block.id || '제목 없음' }}</span>
          </div>
          <div class="survey-output-section-card__head-actions">
            <button
              type="button"
              class="survey-move-btn"
              title="위로"
              :disabled="idx === 0"
              @click="onMoveSection(idx, -1)"
            >
              ▲
            </button>
            <button
              type="button"
              class="survey-move-btn"
              title="아래로"
              :disabled="idx === modelValue.outputSections.length - 1"
              @click="onMoveSection(idx, 1)"
            >
              ▼
            </button>
            <button
              type="button"
              class="survey-icon-btn"
              title="섹션 삭제"
              @click="onRemoveSection(idx)"
            >
              <i class="icon-trashcan size-14" />
            </button>
          </div>
        </header>

        <div class="survey-output-section-card__body">
          <div class="survey-output-section-card__field">
            <label class="survey-output-section-card__label">섹션 유형</label>
            <UiSelect
              :model-value="block.blockType"
              :options="blockTypeOptions"
              size="sm"
              @update:model-value="onBlockTypeChange(idx, String($event ?? ''))"
            />
            <p
              v-if="getBlockMeta(block.blockType)"
              class="com-setting-hint survey-output-section-card__type-desc"
            >
              {{ getBlockMeta(block.blockType)?.description }}
            </p>
          </div>

          <div class="survey-output-section-card__row">
            <div class="survey-output-section-card__field is-half">
              <label class="survey-output-section-card__label">ID</label>
              <UiInput
                :model-value="block.id"
                size="sm"
                placeholder="예: summary"
                @update:model-value="onSectionUpdate(idx, 'id', String($event ?? ''))"
              />
              <span class="com-setting-hint">JSON 식별자 (영문)</span>
            </div>
            <div class="survey-output-section-card__field is-half">
              <label class="survey-output-section-card__label">섹션 제목</label>
              <UiInput
                :model-value="block.title ?? ''"
                size="sm"
                placeholder="예: 현재 상태 요약"
                @update:model-value="onSectionUpdate(idx, 'title', String($event ?? ''))"
              />
              <span class="com-setting-hint">채팅 결과에 표시되는 헤딩</span>
            </div>
          </div>

          <div class="survey-output-section-card__field">
            <label class="survey-output-section-card__label">LLM 출력 지침</label>
            <UiTextarea
              :model-value="block.instruction ?? ''"
              :rows="3"
              size="sm"
              :border="true"
              :auto-resize="true"
              :max-rows="8"
              placeholder="이 섹션에서 LLM이 따를 출력 규칙을 입력합니다."
              @update:model-value="onSectionUpdate(idx, 'instruction', String($event ?? ''))"
            />
          </div>

          <div
            v-if="getParamFields(block.blockType).length"
            class="survey-output-section-card__params"
          >
            <span class="survey-output-section-card__params-title">추가 옵션 (params)</span>
            <div
              v-for="field in getParamFields(block.blockType)"
              :key="`${block.id}-${field.key}`"
              class="survey-output-section-card__field"
            >
              <label class="survey-output-section-card__label">{{ field.label }}</label>

              <UiInput
                v-if="field.type === 'text'"
                :model-value="String(getBlockParamValue(block, field.key) ?? '')"
                size="sm"
                :placeholder="field.placeholder"
                @update:model-value="onParamUpdate(idx, field.key, String($event ?? ''))"
              />

              <UiInput
                v-else-if="field.type === 'number'"
                :model-value="Number(getBlockParamValue(block, field.key) ?? 0)"
                size="sm"
                number-only
                @update:model-value="onParamUpdate(idx, field.key, Number($event ?? 0))"
              />

              <UiInput
                v-else-if="field.type === 'tags'"
                :model-value="joinTagsParam(getBlockParamValue(block, field.key))"
                size="sm"
                :placeholder="field.placeholder"
                @update:model-value="onParamUpdate(idx, field.key, splitTagsParam(String($event ?? '')))"
              />

              <UiCheckbox
                v-else-if="field.type === 'boolean'"
                :model-value="getBlockParamValue(block, field.key) === true"
                :label="field.hint || field.label"
                @update:model-value="onParamUpdate(idx, field.key, $event)"
              />

              <UiTextarea
                v-else-if="field.type === 'textarea'"
                :model-value="String(getBlockParamValue(block, field.key) ?? '')"
                :rows="3"
                size="sm"
                :border="true"
                :auto-resize="true"
                :max-rows="6"
                :placeholder="field.placeholder"
                @update:model-value="onParamUpdate(idx, field.key, String($event ?? ''))"
              />

              <template v-else-if="field.type === 'json'">
                <UiTextarea
                  :model-value="getJsonParamText(block, field.key)"
                  :rows="6"
                  size="sm"
                  :border="true"
                  :auto-resize="false"
                  class="survey-output-section-card__json"
                  :placeholder="field.placeholder"
                  @update:model-value="onJsonParamUpdate(idx, field.key, String($event ?? ''))"
                />
                <div class="survey-output-section-card__json-actions">
                  <UiButton
                    variant="line-secondary"
                    size="xs"
                    @click="onApplyJsonTemplate(idx, block.blockType, field.key)"
                  >
                    기본 템플릿 적용
                  </UiButton>
                  <span
                    v-if="jsonParamErrors[`${idx}-${field.key}`]"
                    class="survey-output-section-card__json-error"
                  >
                    {{ jsonParamErrors[`${idx}-${field.key}`] }}
                  </span>
                </div>
              </template>

              <span
                v-if="field.hint && field.type !== 'boolean'"
                class="com-setting-hint"
              >
                {{ field.hint }}
              </span>
            </div>
          </div>
        </div>
      </article>

      <!-- 마무리 메시지 (closingMessage 최상위 필드) -->
      <article class="survey-output-section-card survey-output-section-card--closing">
        <header class="survey-output-section-card__head">
          <div class="survey-output-section-card__head-main">
            <span class="survey-output-section-card__order">{{ closingSectionOrder }}</span>
            <span class="survey-output-section-card__type-badge">{{ getBlockLabel(closingBlock.blockType) }}</span>
            <span class="survey-output-section-card__preview">{{ closingPreview }}</span>
          </div>
        </header>

        <div class="survey-output-section-card__body">
          <p class="com-setting-hint survey-output-section-card__type-desc">
            결과 본문 맨 아래에 번호·헤딩 없이 단독 출력됩니다. (JSON 최상위 closingMessage 필드)
          </p>

          <div class="survey-output-section-card__field">
            <label class="survey-output-section-card__label">섹션 유형</label>
            <UiSelect
              :model-value="closingBlock.blockType"
              :options="closingBlockTypeOptions"
              size="sm"
              @update:model-value="onClosingBlockTypeChange(String($event ?? ''))"
            />
            <p
              v-if="getBlockMeta(closingBlock.blockType)"
              class="com-setting-hint survey-output-section-card__type-desc"
            >
              {{ getBlockMeta(closingBlock.blockType)?.description }}
            </p>
          </div>

          <div class="survey-output-section-card__row">
            <div class="survey-output-section-card__field is-half">
              <label class="survey-output-section-card__label">ID</label>
              <UiInput
                :model-value="closingBlock.id"
                size="sm"
                placeholder="예: closing"
                @update:model-value="onClosingSectionUpdate('id', String($event ?? ''))"
              />
              <span class="com-setting-hint">JSON 식별자 (영문)</span>
            </div>
            <div class="survey-output-section-card__field is-half">
              <label class="survey-output-section-card__label">섹션 제목</label>
              <UiInput
                :model-value="closingBlock.title ?? ''"
                size="sm"
                placeholder="채팅 결과 헤딩 미사용 시 비워둠"
                @update:model-value="onClosingSectionUpdate('title', String($event ?? ''))"
              />
              <span class="com-setting-hint">마무리 블록은 헤딩 없이 출력</span>
            </div>
          </div>

          <div class="survey-output-section-card__field">
            <label class="survey-output-section-card__label">LLM 출력 지침</label>
            <UiTextarea
              :model-value="closingBlock.instruction ?? ''"
              :rows="3"
              size="sm"
              :border="true"
              :auto-resize="true"
              :max-rows="6"
              placeholder="현재 심리 상태에 맞는 한 줄 응원 메시지."
              @update:model-value="onClosingSectionUpdate('instruction', String($event ?? ''))"
            />
          </div>

          <div
            v-if="getParamFields(closingBlock.blockType).length"
            class="survey-output-section-card__params"
          >
            <span class="survey-output-section-card__params-title">추가 옵션 (params)</span>
            <div
              v-for="field in getParamFields(closingBlock.blockType)"
              :key="`closing-${field.key}`"
              class="survey-output-section-card__field"
            >
              <label class="survey-output-section-card__label">{{ field.label }}</label>
              <UiInput
                v-if="field.type === 'text'"
                :model-value="String(getBlockParamValue(closingBlock, field.key) ?? '')"
                size="sm"
                :placeholder="field.placeholder"
                @update:model-value="onClosingParamUpdate(field.key, String($event ?? ''))"
              />
              <span
                v-if="field.hint"
                class="com-setting-hint"
              >
                {{ field.hint }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SurveyOutputSectionBlock } from '~/types/agentSurveyConfig'
import type { SurveyConfigForm } from '~/utils/agent/surveyConfigUtil'
import {
  CLOSING_MESSAGE_BLOCK_TYPE,
  createSurveyOutputSectionBlock,
  getBlockParamValue,
  getSurveyBlockTypeMeta,
  getSurveyBlockTypeOptions,
  getSurveyOutputBlockTypeOptions,
  joinTagsParam,
  parseJsonParam,
  setBlockParamValue,
  splitTagsParam,
  stringifyJsonParam,
} from '~/utils/agent/surveyOutputSectionUtil'

const props = defineProps<{
  modelValue: SurveyConfigForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SurveyConfigForm]
}>()

const blockTypeOptions = getSurveyBlockTypeOptions()
const outputBlockTypeOptions = getSurveyOutputBlockTypeOptions()
const closingBlockTypeOptions = blockTypeOptions.filter((o) => o.value === CLOSING_MESSAGE_BLOCK_TYPE)
const newBlockType = ref('risk_badge_summary')
const jsonParamErrors = ref<Record<string, string>>({})
const jsonParamDraft = ref<Record<string, string>>({})

const omitRecordKey = (record: Record<string, string>, key: string): Record<string, string> =>
  Object.fromEntries(Object.entries(record).filter(([entryKey]) => entryKey !== key))

const emitForm = (next: SurveyConfigForm) => emit('update:modelValue', next)

const getBlockMeta = (blockType: string) => getSurveyBlockTypeMeta(blockType)
const getBlockLabel = (blockType: string) => getSurveyBlockTypeMeta(blockType)?.label ?? blockType
const getParamFields = (blockType: string) => getSurveyBlockTypeMeta(blockType)?.paramFields ?? []

const addSectionTypeLabel = computed(() => getBlockLabel(newBlockType.value))

const closingBlock = computed(() => props.modelValue.closingMessage)
const closingSectionOrder = computed(() => props.modelValue.outputSections.length + 1)
const closingPreview = computed(() => {
  const block = closingBlock.value
  return block.instruction?.trim() || block.id || '마무리 메시지'
})

const getJsonParamText = (block: SurveyOutputSectionBlock, key: string) => {
  const draftKey = `${block.id}-${key}`
  if (jsonParamDraft.value[draftKey] != null) return jsonParamDraft.value[draftKey]
  return stringifyJsonParam(getBlockParamValue(block, key))
}

const onSectionUpdate = (idx: number, key: keyof SurveyOutputSectionBlock, value: string) => {
  const outputSections = props.modelValue.outputSections.map((block, i) =>
    i === idx ? { ...block, [key]: value } : block,
  )
  emitForm({ ...props.modelValue, outputSections })
}

const onBlockTypeChange = (idx: number, blockType: string) => {
  const meta = getSurveyBlockTypeMeta(blockType)
  if (!meta) return

  const params = meta.defaultParams ? { ...meta.defaultParams } : undefined
  if (blockType === 'cause_analysis' && params) {
    params.topN = props.modelValue.topN
  }

  const outputSections = props.modelValue.outputSections.map((block, i) => {
    if (i !== idx) return block
    return {
      ...block,
      blockType,
      id: block.id || meta.defaultId,
      title: block.title || meta.defaultTitle,
      instruction: block.instruction || meta.defaultInstruction,
      params,
    }
  })
  emitForm({ ...props.modelValue, outputSections })
}

const onParamUpdate = (idx: number, key: string, value: unknown) => {
  const outputSections = props.modelValue.outputSections.map((block, i) =>
    i === idx ? setBlockParamValue(block, key, value) : block,
  )
  emitForm({ ...props.modelValue, outputSections })
}

const onJsonParamUpdate = (idx: number, key: string, raw: string) => {
  const block = props.modelValue.outputSections[idx]
  const errorKey = `${idx}-${key}`
  jsonParamDraft.value[`${block.id}-${key}`] = raw

  const parsed = parseJsonParam(raw)
  if (raw.trim() && parsed == null) {
    jsonParamErrors.value[errorKey] = 'JSON 형식이 올바르지 않습니다.'
    return
  }

  jsonParamErrors.value = omitRecordKey(jsonParamErrors.value, errorKey)
  jsonParamDraft.value = omitRecordKey(jsonParamDraft.value, `${block.id}-${key}`)
  onParamUpdate(idx, key, parsed)
}

const onApplyJsonTemplate = (idx: number, blockType: string, key: string) => {
  const meta = getSurveyBlockTypeMeta(blockType)
  const template = meta?.defaultParams?.[key]
  if (template == null) return
  onParamUpdate(idx, key, template)
}

/** 섹션 추가 후 해당 카드로 스크롤 */
const pendingScrollToSectionIdx = ref<number | null>(null)

const scrollToOutputSection = async (idx: number) => {
  await nextTick()
  document.getElementById(`survey-output-section-${idx}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
}

watch(
  () => props.modelValue.outputSections.length,
  async (len, prevLen) => {
    const idx = pendingScrollToSectionIdx.value
    if (idx == null || len <= prevLen) return
    await scrollToOutputSection(idx)
    pendingScrollToSectionIdx.value = null
  },
)

const onAddSection = () => {
  if (!newBlockType.value) return
  const newIdx = props.modelValue.outputSections.length
  const block = createSurveyOutputSectionBlock(newBlockType.value, props.modelValue.topN)
  pendingScrollToSectionIdx.value = newIdx
  emitForm({
    ...props.modelValue,
    outputSections: [...props.modelValue.outputSections, block],
  })
}

const onRemoveSection = (idx: number) => {
  emitForm({
    ...props.modelValue,
    outputSections: props.modelValue.outputSections.filter((_, i) => i !== idx),
  })
}

const onMoveSection = (idx: number, direction: -1 | 1) => {
  const next = [...props.modelValue.outputSections]
  const target = idx + direction
  if (target < 0 || target >= next.length) return
  ;[next[idx], next[target]] = [next[target], next[idx]]
  emitForm({ ...props.modelValue, outputSections: next })
}

const onClosingSectionUpdate = (key: keyof SurveyOutputSectionBlock, value: string) => {
  emitForm({
    ...props.modelValue,
    closingMessage: { ...closingBlock.value, [key]: value },
  })
}

const onClosingBlockTypeChange = (blockType: string) => {
  const meta = getSurveyBlockTypeMeta(blockType)
  if (!meta) return
  const params = meta.defaultParams ? { ...meta.defaultParams } : undefined
  emitForm({
    ...props.modelValue,
    closingMessage: {
      ...closingBlock.value,
      blockType,
      id: closingBlock.value.id || meta.defaultId,
      title: closingBlock.value.title || meta.defaultTitle,
      instruction: closingBlock.value.instruction || meta.defaultInstruction,
      params,
    },
  })
}

const onClosingParamUpdate = (key: string, value: unknown) => {
  emitForm({
    ...props.modelValue,
    closingMessage: setBlockParamValue(closingBlock.value, key, value),
  })
}
</script>

<style lang="scss" scoped>
.survey-output-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: calc(var(--label-width, 100px) + 12px);

  &__lead {
    margin: 0;
  }

  &__empty {
    margin: 0;
    padding: 12px;
    border: 1px dashed #c6d2db;
    border-radius: $border-radius-base;
    text-align: center;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.survey-output-section-card {
  border: 1px solid #dce4e9;
  border-radius: $border-radius-base;
  background: #fff;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
  }

  &__head-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__head-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  &__order {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: var(--color-primary);
    color: #fff;
    font-size: 11px;
    font-weight: $font-weight-semibold;

    &.is-add {
      background: #e2e8f0;
      color: $color-text-secondary;
      font-size: 14px;
      line-height: 1;
    }
  }

  &__add-action {
    display: flex;
    justify-content: flex-end;
    padding-top: 4px;
  }

  &__type-badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 999px;
    background: #e2e8f0;
    color: $color-text-secondary;
    font-size: 11px;
    font-weight: $font-weight-medium;
  }

  &__preview {
    font-size: 13px;
    font-weight: $font-weight-medium;
    color: $color-text-dark;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  &__row {
    display: flex;
    gap: 10px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    &.is-half {
      flex: 1;
    }
  }

  &__label {
    font-size: 12px;
    font-weight: $font-weight-semibold;
    color: $color-text-secondary;
  }

  &__type-desc {
    margin: 2px 0 0;
    line-height: 1.5;
  }

  &__params {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    border-radius: $border-radius-base;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  &__params-title {
    font-size: 12px;
    font-weight: $font-weight-semibold;
    color: $color-text-muted;
  }

  &__json {
    :deep(textarea) {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
    }
  }

  &__json-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__json-error {
    font-size: 11px;
    color: $color-error;
  }
}

.survey-move-btn {
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
  font-size: 10px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #eef2f6;
    color: $color-text-dark;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.survey-output-section-card--add {
  border-style: dashed;
  background: #f8fafc;
}
</style>
