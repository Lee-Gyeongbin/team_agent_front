<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="modalTitle"
    @close="$emit('close')"
  >
    <div
      ref="formRef"
      class="com-setting-form"
    >
      <!-- 기본 정보 -->
      <UiSettingSection
        title="기본 정보"
        label-width="132px"
        collapsible
      >
        <UiFormField
          label="템플릿 이름"
          required
        >
          <UiInput
            :model-value="templateName"
            placeholder="예: 주간업무보고, 품의서, 제안서 등"
            size="sm"
            @update:model-value="templateName = $event"
          />
        </UiFormField>

        <UiFormField
          label="문서 유형"
          align-top
        >
          <div
            class="tmpl-doc-type-group"
            role="radiogroup"
            aria-label="문서 유형"
          >
            <label
              v-for="opt in docTypeOptions"
              :key="opt.value"
              class="tmpl-doc-type-row"
            >
              <input
                v-model="docType"
                type="radio"
                class="tmpl-doc-type-radio"
                :value="opt.value"
              />
              <span class="tmpl-doc-type-text">
                <span class="tmpl-doc-type-label">{{ opt.title }}</span>
                <span class="tmpl-doc-type-desc">{{ opt.desc }}</span>
              </span>
            </label>
          </div>
        </UiFormField>

        <UiFormField label="설명">
          <UiInput
            :model-value="description"
            placeholder="이 템플릿의 용도를 간단히 설명해 주세요"
            size="sm"
            @update:model-value="description = $event"
          />
        </UiFormField>
      </UiSettingSection>

      <!-- 항목 정의 (템플릿형만) -->
      <UiSettingSection
        v-show="docType === 'TEMPLATE'"
        title="항목 정의"
        label-width="132px"
        collapsible
      >
        <div class="tmpl-field-toolbar">
          <span class="tmpl-field-toolbar__hint">JSON 키와 표에 쓸 항목명을 매핑합니다.</span>
          <UiButton
            variant="ghost"
            size="sm"
            @click="onAddFieldRow"
          >
            <template #icon-left>
              <i class="icon-plus size-16" />
            </template>
            항목 추가
          </UiButton>
        </div>

        <div class="tmpl-field-table">
          <div class="tmpl-field-table__head">
            <span class="tmpl-field-table__col tmpl-field-table__col--drag" />
            <span class="tmpl-field-table__col">JSON 키</span>
            <span class="tmpl-field-table__col">항목명 (표에 표시)</span>
            <span class="tmpl-field-table__col tmpl-field-table__col--check">여러줄</span>
            <span class="tmpl-field-table__col tmpl-field-table__col--action" />
          </div>

          <draggable
            v-model="fieldRows"
            class="tmpl-field-table__body"
            handle=".tmpl-field-row__drag"
            item-key="rowId"
            animation="200"
          >
            <template #item="{ element: row }">
              <div class="tmpl-field-table__row">
                <button
                  type="button"
                  class="tmpl-field-row__drag"
                  title="순서 변경"
                  aria-label="순서 변경"
                >
                  <i class="icon-move-handle size-16" />
                </button>
                <UiInput
                  :model-value="row.jsonKey"
                  placeholder="영문 키"
                  size="sm"
                  class="tmpl-field-table__input"
                  @update:model-value="row.jsonKey = $event"
                />
                <UiInput
                  :model-value="row.itemLabel"
                  placeholder="항목명"
                  size="sm"
                  class="tmpl-field-table__input"
                  @update:model-value="row.itemLabel = $event"
                />
                <div
                  class="tmpl-field-table__check"
                  title="여러 줄 입력 허용"
                >
                  <UiCheckbox
                    :model-value="row.multiline"
                    @update:model-value="row.multiline = $event"
                  />
                </div>
                <button
                  type="button"
                  class="tmpl-field-row__delete"
                  title="항목 삭제"
                  aria-label="항목 삭제"
                  @click="onRemoveFieldRow(row.rowId)"
                >
                  <i class="icon-trashcan size-16" />
                </button>
              </div>
            </template>
          </draggable>
        </div>
        <p class="tmpl-field-drag-hint">항목을 드래그하여 순서를 변경할 수 있습니다.</p>
      </UiSettingSection>

      <!-- LLM 프롬프트 -->
      <UiSettingSection
        title="LLM 프롬프트 템플릿"
        label-width="132px"
        collapsible
      >
        <div class="tmpl-prompt-toolbar">
          <span />
          <button
            type="button"
            class="tmpl-prompt-insert"
            @click="onInsertDefaultPrompt"
          >
            기본 프롬프트 삽입
          </button>
        </div>
        <UiTextarea
          :model-value="promptTemplate"
          placeholder="LLM에게 보낼 프롬프트를 작성하세요. {{content}} 위치에 지식창고 내용이 삽입됩니다."
          :rows="10"
          border
          :auto-resize="false"
          @update:model-value="promptTemplate = $event"
        />
        <div class="tmpl-prompt-legend">
          <span class="tmpl-prompt-legend__label">템플릿 변수</span>
          <div class="tmpl-prompt-legend__tags">
            <UiTag
              variant="default"
              size="sm"
              label="{{content}}"
            />
            <span class="tmpl-prompt-legend__desc">지식창고 내용</span>
            <UiTag
              variant="default"
              size="sm"
              label="{{question}}"
            />
            <span class="tmpl-prompt-legend__desc">원본 질문</span>
          </div>
        </div>
      </UiSettingSection>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { openToast } from '~/composables/useToast'
import type { DocumentTemplateUser, TmplDocType, TmplFieldRow, TmplFormSavePayload } from '~/types/tmpl'

const genRowId = () => `row_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

const DEFAULT_FIELD_ROWS = (): TmplFieldRow[] => [
  { rowId: genRowId(), jsonKey: 'title', itemLabel: '제목', multiline: false },
  { rowId: genRowId(), jsonKey: 'content', itemLabel: '본문내용', multiline: true },
]

const DEFAULT_PROMPT_TEXT = `다음 지침에 따라 문서를 작성하세요.

사용자 질문:
{{question}}

참고 자료(지식창고):
{{content}}

위 정보를 반영하여 요청된 형식으로 출력해 주세요.`

const docTypeOptions: { value: TmplDocType; title: string; desc: string }[] = [
  {
    value: 'TEMPLATE',
    title: '템플릿형 (고정 항목 구조)',
    desc: 'JSON 키와 항목명을 미리 정의합니다.',
  },
  {
    value: 'FREE',
    title: '자유형식 (LLM이 항목 자유 생성)',
    desc: 'LLM이 문맥에 맞게 항목을 구성합니다.',
  },
]

interface Props {
  isOpen: boolean
  /** null이면 신규 추가, 값이 있으면 수정 */
  template: DocumentTemplateUser | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [payload: TmplFormSavePayload]
}>()

const formRef = ref<HTMLElement | null>(null)
const templateName = ref('')
const docType = ref<TmplDocType>('TEMPLATE')
const description = ref('')
const fieldRows = ref<TmplFieldRow[]>(DEFAULT_FIELD_ROWS())
const promptTemplate = ref('')

const modalTitle = computed(() => (props.template ? '템플릿 수정' : '새 템플릿 추가'))

const resetForm = () => {
  templateName.value = ''
  docType.value = 'TEMPLATE'
  description.value = ''
  fieldRows.value = DEFAULT_FIELD_ROWS()
  promptTemplate.value = ''
}

const loadFromTemplate = (t: DocumentTemplateUser) => {
  templateName.value = t.templateName
  docType.value = t.docType
  description.value = t.description
  if (t.docType === 'FREE') {
    fieldRows.value = t.fieldRows.map((r) => ({ ...r, rowId: r.rowId || genRowId() }))
  } else if (t.fieldRows.length > 0) {
    fieldRows.value = t.fieldRows.map((r) => ({ ...r, rowId: r.rowId || genRowId() }))
  } else {
    fieldRows.value = DEFAULT_FIELD_ROWS()
  }
  promptTemplate.value = t.promptTemplate
}

watch(docType, (v) => {
  if (v === 'TEMPLATE' && fieldRows.value.length === 0) {
    fieldRows.value = DEFAULT_FIELD_ROWS()
  }
})

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    if (props.template) {
      loadFromTemplate(props.template)
    } else {
      resetForm()
    }
    nextTick(() => formRef.value?.closest('.modal-side-body')?.scrollTo(0, 0))
  },
)

const onAddFieldRow = () => {
  fieldRows.value.push({
    rowId: genRowId(),
    jsonKey: '',
    itemLabel: '',
    multiline: false,
  })
}

const onRemoveFieldRow = (rowId: string) => {
  if (fieldRows.value.length <= 1) {
    openToast({ message: '최소 1개의 항목이 필요합니다.', type: 'warning' })
    return
  }
  const idx = fieldRows.value.findIndex((r) => r.rowId === rowId)
  if (idx !== -1) fieldRows.value.splice(idx, 1)
}

const onInsertDefaultPrompt = () => {
  promptTemplate.value = DEFAULT_PROMPT_TEXT
}

const onSave = () => {
  const name = templateName.value.trim()
  if (!name) {
    openToast({ message: '템플릿 이름을 입력해 주세요.', type: 'error' })
    return
  }

  let rows: TmplFieldRow[] = []
  if (docType.value === 'TEMPLATE') {
    rows = fieldRows.value.map((r) => ({
      rowId: r.rowId,
      jsonKey: r.jsonKey.trim(),
      itemLabel: r.itemLabel.trim(),
      multiline: r.multiline,
    }))
    const empty = rows.some((r) => !r.jsonKey || !r.itemLabel)
    if (empty) {
      openToast({ message: 'JSON 키와 항목명을 모두 입력해 주세요.', type: 'error' })
      return
    }
    const keys = rows.map((r) => r.jsonKey)
    if (new Set(keys).size !== keys.length) {
      openToast({ message: 'JSON 키가 중복되었습니다.', type: 'error' })
      return
    }
  }

  const payload: TmplFormSavePayload = {
    templateId: props.template?.templateId,
    templateName: name,
    docType: docType.value,
    description: description.value.trim(),
    fieldRows: rows,
    promptTemplate: promptTemplate.value,
  }
  emit('save', payload)
}
</script>

<style lang="scss" scoped>
.tmpl-doc-type-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tmpl-doc-type-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  margin: 0;
}

.tmpl-doc-type-radio {
  flex-shrink: 0;
  margin-top: 4px;
  accent-color: var(--color-primary);
}

.tmpl-doc-type-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tmpl-doc-type-label {
  @include typo($body-medium);
  font-weight: $font-weight-semibold;
  color: $color-text-heading-sub;
}

.tmpl-doc-type-desc {
  @include typo($body-small);
  color: $color-text-muted;
  line-height: $line-height-base;
}

.tmpl-field-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  margin-bottom: 4px;
}

.tmpl-field-toolbar__hint {
  @include typo($body-xsmall);
  color: $color-text-muted;
}

.tmpl-field-table {
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;
  background: #fff;
}

.tmpl-field-table__head {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 100px 44px;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background: $color-background;
  border-bottom: 1px solid $color-border-light;
  @include typo($body-xsmall-bold);
  color: $color-text-dark;

  .tmpl-field-table__col {
    text-align: center;
  }
}

.tmpl-field-table__body {
  display: flex;
  flex-direction: column;
}

.tmpl-field-table__row {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 100px 44px;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid $color-border-light;

  &:last-child {
    border-bottom: none;
  }
}

.tmpl-field-table__input {
  min-width: 0;
}

.tmpl-field-table__check {
  display: flex;
  justify-content: center;
}

.tmpl-field-row__drag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: $border-radius-sm;
  background: transparent;
  color: $color-text-disabled;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &:hover {
    background: $color-surface;
    color: $color-text-secondary;
  }
}

.tmpl-field-row__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0 auto;
  padding: 0;
  border: none;
  border-radius: $border-radius-sm;
  background: transparent;
  color: $color-text-secondary;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: color-mix(in srgb, $color-error 10%, transparent);
    color: $color-error;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.tmpl-field-drag-hint {
  margin: 8px 0 0;
  @include typo($body-xsmall);
  color: $color-text-muted;
}

.tmpl-prompt-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tmpl-prompt-insert {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  @include typo($body-small);
  font-weight: $font-weight-semibold;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: $color-primary-hover;
  }
}

.tmpl-prompt-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.tmpl-prompt-legend__label {
  @include typo($body-xsmall-bold);
  color: $color-text-dark;
}

.tmpl-prompt-legend__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.tmpl-prompt-legend__desc {
  @include typo($body-xsmall);
  color: $color-text-muted;
  margin-right: 4px;
}
</style>
