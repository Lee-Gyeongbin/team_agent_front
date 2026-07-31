<template>
  <div class="agent-content-setting-panel">
    <div class="agent-content-setting-panel__header">
      <span class="com-setting-section-title">콘텐츠 작성·편집 구성</span>
      <p class="com-setting-hint agent-content-setting-panel__summary">
        기본 설정·콘텐츠 유형·워크플로·출력 구성·게시 채널·제약을 아래 영역에서 설정합니다.
      </p>
    </div>

    <div class="agent-content-setting-panel__accordions">
      <!-- 기본 설정 -->
      <div class="agent-content-setting-accordion">
        <UiSettingSection
          title="기본 설정"
          collapsible
          label-width="120px"
        >
          <p class="com-setting-hint ca-section-lead">채팅 콘텐츠 메이커 화면의 기본 동작과 표시 문구를 설정합니다.</p>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 제목</label>
            <UiInput
              :model-value="modelValue.introTitle"
              size="sm"
              placeholder="예: 마케팅 콘텐츠 생성"
              @update:model-value="onUpdate('introTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">화면 설명</label>
            <UiInput
              :model-value="modelValue.introSubtitle"
              size="sm"
              placeholder="예: 목적과 채널에 맞는 문구와 이미지를 빠르게 제작해보세요."
              @update:model-value="onUpdate('introSubtitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">생성 버튼</label>
            <UiInput
              :model-value="modelValue.submitLabel"
              size="sm"
              placeholder="예: 콘텐츠 제작"
              @update:model-value="onUpdate('submitLabel', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">기본 시안 개수</label>
            <UiInput
              :model-value="String(modelValue.variantCount)"
              size="sm"
              number-only
              placeholder="1~5"
              @update:model-value="onVariantCountUpdate(String($event ?? ''))"
            />
          </div>
          <div class="com-setting-row ca-meta-row">
            <div class="ca-meta-col">
              <label class="com-setting-label">언어 코드</label>
              <UiInput
                :model-value="modelValue.language"
                size="sm"
                placeholder="ko"
                @update:model-value="onUpdate('language', String($event ?? ''))"
              />
            </div>
            <div class="ca-meta-col">
              <label class="com-setting-label">버전</label>
              <UiInput
                :model-value="modelValue.version"
                size="sm"
                placeholder="1.0"
                @update:model-value="onUpdate('version', String($event ?? ''))"
              />
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- 콘텐츠 유형 -->
      <div class="agent-content-setting-accordion">
        <UiSettingSection
          title="콘텐츠 유형"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint ca-section-lead">채팅 화면에서 선택 가능한 콘텐츠 유형입니다.</p>
          <div class="ca-list-block">
            <div class="ca-list-block__head">
              <span class="com-setting-label">유형</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddContentType"
              >
                유형 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.contentTypes.length"
              class="com-setting-hint"
            >
              유형을 추가해 주세요.
            </p>
            <div
              v-for="(item, idx) in modelValue.contentTypes"
              :key="`content-type-${idx}`"
              class="ca-list-block__row ca-list-block__row--triple"
            >
              <UiInput
                :model-value="item.value"
                size="sm"
                placeholder="값 (예: SNS)"
                @update:model-value="onContentTypeUpdate(idx, 'value', String($event ?? ''))"
              />
              <UiInput
                :model-value="item.label"
                size="sm"
                placeholder="라벨"
                @update:model-value="onContentTypeUpdate(idx, 'label', String($event ?? ''))"
              />
              <UiInput
                :model-value="item.description ?? ''"
                size="sm"
                placeholder="설명"
                @update:model-value="onContentTypeUpdate(idx, 'description', String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveContentType(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- 워크플로 -->
      <div class="agent-content-setting-accordion">
        <UiSettingSection
          title="워크플로"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint ca-section-lead">모든 콘텐츠 유형에 공통으로 적용되는 목적·독자·톤·분량입니다.</p>

          <div
            v-for="section in workflowOptionSections"
            :key="section.key"
            class="ca-list-block"
          >
            <div class="ca-list-block__head">
              <span class="com-setting-label">{{ section.title }}</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddWorkflowOption(section.key)"
              >
                {{ section.addLabel }}
              </UiButton>
            </div>
            <p
              v-if="!modelValue.workflow[section.key].length"
              class="com-setting-hint"
            >
              {{ section.emptyHint }}
            </p>
            <div
              v-for="(item, idx) in modelValue.workflow[section.key]"
              :key="`${section.key}-${idx}`"
              class="ca-list-block__row ca-list-block__row--triple"
            >
              <UiInput
                :model-value="item.value"
                size="sm"
                placeholder="값"
                @update:model-value="onWorkflowOptionUpdate(section.key, idx, 'value', String($event ?? ''))"
              />
              <UiInput
                :model-value="item.label"
                size="sm"
                placeholder="라벨"
                @update:model-value="onWorkflowOptionUpdate(section.key, idx, 'label', String($event ?? ''))"
              />
              <UiInput
                :model-value="item.description ?? ''"
                size="sm"
                placeholder="설명"
                @update:model-value="onWorkflowOptionUpdate(section.key, idx, 'description', String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveWorkflowOption(section.key, idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- 출력 구성 -->
      <div class="agent-content-setting-accordion">
        <UiSettingSection
          title="출력 구성"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint ca-section-lead">
            채팅 화면에서 선택할 수 있는 콘텐츠 출력 요소입니다. 기본 체크 시 최초 선택값으로 사용됩니다.
          </p>

          <div class="ca-list-block">
            <div class="ca-list-block__head">
              <span class="com-setting-label">출력 항목</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddWorkflowOption('outputSections')"
              >
                구성 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.workflow.outputSections.length"
              class="com-setting-hint"
            >
              출력 구성을 추가해 주세요.
            </p>
            <div
              v-for="(item, idx) in modelValue.workflow.outputSections"
              :key="`outputSections-${idx}`"
              class="ca-list-block__row ca-list-block__row--output"
            >
              <UiInput
                :model-value="item.value"
                size="sm"
                placeholder="값"
                @update:model-value="onWorkflowOptionUpdate('outputSections', idx, 'value', String($event ?? ''))"
              />
              <UiInput
                :model-value="item.label"
                size="sm"
                placeholder="라벨"
                @update:model-value="onWorkflowOptionUpdate('outputSections', idx, 'label', String($event ?? ''))"
              />
              <UiCheckbox
                class="ca-output-default-check"
                :model-value="!!item.value.trim() && modelValue.workflow.defaultOutputSections.includes(item.value)"
                label="기본"
                :disabled="!item.value.trim()"
                @update:model-value="onToggleDefaultOutputSection(item.value, $event)"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveWorkflowOption('outputSections', idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- 게시 채널 -->
      <div class="agent-content-setting-accordion">
        <UiSettingSection
          title="게시 채널"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint ca-section-lead">
            콘텐츠 유형별로 채팅 화면에서 선택 가능한 게시 채널입니다. 비워두면 해당 유형에서 채널 선택이 숨겨집니다.
          </p>
          <div class="com-setting-field-row">
            <label class="com-setting-label">콘텐츠 유형</label>
            <UiSelect
              :model-value="selectedChannelType"
              :options="contentTypeSelectOptions"
              size="sm"
              placeholder="유형을 선택하세요"
              :disabled="!contentTypeSelectOptions.length"
              @update:model-value="selectedChannelType = String($event ?? '')"
            />
          </div>

          <p
            v-if="!contentTypeSelectOptions.length"
            class="com-setting-hint ca-empty-hint"
          >
            콘텐츠 유형을 먼저 추가해 주세요.
          </p>

          <div
            v-else
            class="ca-list-block"
          >
            <div class="ca-list-block__head">
              <span class="com-setting-label">채널</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddChannel"
              >
                채널 추가
              </UiButton>
            </div>
            <p
              v-if="!currentChannelOptions.length"
              class="com-setting-hint"
            >
              채널을 추가해 주세요.
            </p>
            <div
              v-for="(item, idx) in currentChannelOptions"
              :key="`channel-${selectedChannelType}-${idx}`"
              class="ca-list-block__row"
            >
              <UiInput
                :model-value="item.value"
                size="sm"
                placeholder="값"
                @update:model-value="onChannelUpdate(idx, 'value', String($event ?? ''))"
              />
              <UiInput
                :model-value="item.label"
                size="sm"
                placeholder="라벨"
                @update:model-value="onChannelUpdate(idx, 'label', String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveChannel(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- 제약 -->
      <div class="agent-content-setting-accordion">
        <UiSettingSection
          title="제약 (Constraints)"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint ca-section-lead">
            LLM이 반드시 준수해야 할 역할·작성 규칙·출력 규칙을 한 줄씩 입력합니다.
          </p>
          <div class="ca-list-block">
            <div class="ca-list-block__head">
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
              class="ca-list-block__row"
            >
              <UiInput
                :model-value="modelValue.constraints[idx]"
                size="sm"
                placeholder="예: 확인되지 않은 수치나 사실은 생성하지 않기"
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
import type { MarketingAuthoringOption, MarketingAuthoringWorkflowConfig } from '~/types/agent'
import type { MarketingAuthoringConfigForm } from '~/utils/agent/marketingAuthoringConfigUtil'

type WorkflowOptionKey = 'purposes' | 'audiences' | 'tones' | 'lengths' | 'outputSections'
type WorkflowConditionKey = Exclude<WorkflowOptionKey, 'outputSections'>

const props = defineProps<{
  modelValue: MarketingAuthoringConfigForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: MarketingAuthoringConfigForm]
}>()

const emitForm = (next: MarketingAuthoringConfigForm) => emit('update:modelValue', next)

const onUpdate = <K extends keyof MarketingAuthoringConfigForm>(key: K, value: MarketingAuthoringConfigForm[K]) => {
  emitForm({ ...props.modelValue, [key]: value })
}

const onVariantCountUpdate = (raw: string) => {
  const n = Number(String(raw).trim())
  if (!Number.isFinite(n) || n < 1) {
    onUpdate('variantCount', 1)
    return
  }
  onUpdate('variantCount', Math.min(5, Math.floor(n)))
}

const emptyOption = (): MarketingAuthoringOption => ({ value: '', label: '', description: '' })

// 채널 편집에 사용하는 콘텐츠 유형 선택값
const selectedChannelType = ref(props.modelValue.contentTypes[0]?.value ?? '')

const contentTypeValues = computed(() => props.modelValue.contentTypes.map((item) => item.value.trim()).filter(Boolean))

const contentTypeSelectOptions = computed(() =>
  props.modelValue.contentTypes
    .filter((item) => item.value.trim())
    .map((item) => ({ value: item.value.trim(), label: item.label.trim() || item.value.trim() })),
)

watch(
  contentTypeValues,
  (values) => {
    if (!values.includes(selectedChannelType.value)) {
      selectedChannelType.value = values[0] ?? ''
    }
  },
  { immediate: true },
)

const currentChannelOptions = computed(() => props.modelValue.channelsByContentType[selectedChannelType.value] ?? [])

const workflowOptionSections: Array<{
  key: WorkflowConditionKey
  title: string
  addLabel: string
  emptyHint: string
}> = [
  { key: 'purposes', title: '작성 목적', addLabel: '목적 추가', emptyHint: '목적을 추가해 주세요.' },
  { key: 'audiences', title: '대상 독자', addLabel: '독자 추가', emptyHint: '독자를 추가해 주세요.' },
  { key: 'tones', title: '톤앤매너', addLabel: '톤 추가', emptyHint: '톤을 추가해 주세요.' },
  { key: 'lengths', title: '분량', addLabel: '분량 추가', emptyHint: '분량을 추가해 주세요.' },
]

const patchWorkflow = (workflow: MarketingAuthoringWorkflowConfig) => {
  emitForm({ ...props.modelValue, workflow })
}

const updateOption = <K extends keyof MarketingAuthoringOption>(
  options: MarketingAuthoringOption[],
  idx: number,
  key: K,
  value: string,
) => options.map((item, i) => (i === idx ? { ...item, [key]: value } : item))

const removeOption = (options: MarketingAuthoringOption[], idx: number) => options.filter((_, i) => i !== idx)

// ── 콘텐츠 유형 ──────────────────────────────────────────────
const onAddContentType = () => {
  emitForm({ ...props.modelValue, contentTypes: [...props.modelValue.contentTypes, emptyOption()] })
}

const onContentTypeUpdate = <K extends keyof MarketingAuthoringOption>(idx: number, key: K, value: string) => {
  const prev = props.modelValue.contentTypes[idx]
  const contentTypes = updateOption(props.modelValue.contentTypes, idx, key, value)
  if (key !== 'value' || !prev) {
    emitForm({ ...props.modelValue, contentTypes })
    return
  }
  const prevValue = prev.value.trim()
  const nextValue = value.trim()
  let channelsByContentType = props.modelValue.channelsByContentType
  if (prevValue && nextValue && prevValue !== nextValue && prevValue in channelsByContentType) {
    const next: typeof channelsByContentType = {}
    for (const [k, v] of Object.entries(channelsByContentType)) {
      next[k === prevValue ? nextValue : k] = v
    }
    channelsByContentType = next
    if (selectedChannelType.value === prevValue) selectedChannelType.value = nextValue
  }
  emitForm({ ...props.modelValue, contentTypes, channelsByContentType })
}

const onRemoveContentType = (idx: number) => {
  const removed = props.modelValue.contentTypes[idx]
  const removedValue = removed?.value.trim()
  const contentTypes = removeOption(props.modelValue.contentTypes, idx)
  const channelsByContentType = removedValue
    ? Object.fromEntries(Object.entries(props.modelValue.channelsByContentType).filter(([k]) => k !== removedValue))
    : props.modelValue.channelsByContentType
  emitForm({ ...props.modelValue, contentTypes, channelsByContentType })
}

// ── 채널 ──────────────────────────────────────────────
const onAddChannel = () => {
  const key = selectedChannelType.value
  if (!key) return
  const next = [...(props.modelValue.channelsByContentType[key] ?? []), emptyOption()]
  emitForm({ ...props.modelValue, channelsByContentType: { ...props.modelValue.channelsByContentType, [key]: next } })
}

const onChannelUpdate = <K extends keyof MarketingAuthoringOption>(idx: number, key: K, value: string) => {
  const typeKey = selectedChannelType.value
  if (!typeKey) return
  const list = updateOption(props.modelValue.channelsByContentType[typeKey] ?? [], idx, key, value)
  emitForm({
    ...props.modelValue,
    channelsByContentType: { ...props.modelValue.channelsByContentType, [typeKey]: list },
  })
}

const onRemoveChannel = (idx: number) => {
  const typeKey = selectedChannelType.value
  if (!typeKey) return
  const list = removeOption(props.modelValue.channelsByContentType[typeKey] ?? [], idx)
  emitForm({
    ...props.modelValue,
    channelsByContentType: { ...props.modelValue.channelsByContentType, [typeKey]: list },
  })
}

// ── 워크플로 옵션 ──────────────────────────────────────────────
const onAddWorkflowOption = (key: WorkflowOptionKey) => {
  patchWorkflow({ ...props.modelValue.workflow, [key]: [...props.modelValue.workflow[key], emptyOption()] })
}

const onWorkflowOptionUpdate = <K extends keyof MarketingAuthoringOption>(
  listKey: WorkflowOptionKey,
  idx: number,
  field: K,
  value: string,
) => {
  const workflow = props.modelValue.workflow
  const prev = workflow[listKey][idx]
  const list = updateOption(workflow[listKey], idx, field, value)
  let defaultOutputSections = workflow.defaultOutputSections
  if (listKey === 'outputSections' && field === 'value' && prev) {
    const prevValue = prev.value.trim()
    const nextValue = value.trim()
    if (prevValue && nextValue && prevValue !== nextValue) {
      defaultOutputSections = defaultOutputSections.map((item) => (item === prevValue ? nextValue : item))
    } else if (prevValue && !nextValue) {
      defaultOutputSections = defaultOutputSections.filter((item) => item !== prevValue)
    }
  }
  patchWorkflow({ ...workflow, [listKey]: list, defaultOutputSections })
}

const onRemoveWorkflowOption = (listKey: WorkflowOptionKey, idx: number) => {
  const workflow = props.modelValue.workflow
  const removed = workflow[listKey][idx]
  const list = removeOption(workflow[listKey], idx)
  const defaultOutputSections =
    listKey === 'outputSections' && removed?.value
      ? workflow.defaultOutputSections.filter((item) => item !== removed.value)
      : workflow.defaultOutputSections
  patchWorkflow({ ...workflow, [listKey]: list, defaultOutputSections })
}

const onToggleDefaultOutputSection = (value: string, checked: boolean) => {
  const workflow = props.modelValue.workflow
  const defaultOutputSections = checked
    ? [...new Set([...workflow.defaultOutputSections, value])]
    : workflow.defaultOutputSections.filter((item) => item !== value)
  patchWorkflow({ ...workflow, defaultOutputSections })
}

// ── 제약 ──────────────────────────────────────────────
const onAddConstraint = () => {
  emitForm({ ...props.modelValue, constraints: [...props.modelValue.constraints, ''] })
}

const onConstraintUpdate = (idx: number, value: string) => {
  const constraints = props.modelValue.constraints.map((item, i) => (i === idx ? value : item))
  emitForm({ ...props.modelValue, constraints })
}

const onRemoveConstraint = (idx: number) => {
  emitForm({ ...props.modelValue, constraints: props.modelValue.constraints.filter((_, i) => i !== idx) })
}
</script>

<style lang="scss" scoped>
.agent-content-setting-panel {
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

    .agent-content-setting-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-content-setting-accordion {
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

    .ui-input-outer,
    .ui-select-wrap,
    .ui-textarea-outer,
    .com-setting-field-input {
      flex: 1;
      min-width: 0;
    }
  }
}

.ca-section-lead {
  margin: 0;
}

.ca-meta-row {
  display: flex;
  gap: 12px;
  margin-left: calc(var(--label-width) + 12px);
}

.ca-meta-col {
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

.ca-list-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: calc(var(--label-width) + 12px);
  margin-top: 8px;

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

    &--triple :deep(.ui-input-outer) {
      flex: 1;
    }

    &--output {
      .ca-output-default-check {
        flex-shrink: 0;
        white-space: nowrap;
      }
    }
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
