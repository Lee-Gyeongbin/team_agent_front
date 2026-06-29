<template>
  <div class="datamart-meta-term com-setting-form">
    <template v-if="props.errorMessage">
      <div class="datamart-meta-term-error">
        <p class="datamart-meta-term-error-msg">{{ props.errorMessage }}</p>
      </div>
    </template>

    <template v-else>
      <div class="datamart-meta-term-header">
        <p class="datamart-meta-term-desc">
          질문 설계 시 추천·검증에 쓰이는 지표(METRIC)와 구분(DIMENSION) 용어를 관리합니다. 구분은 예시 값을 함께
          등록하면 더 정확하게 유도됩니다.
          <template v-if="datamart?.dmNm">
            <span class="datamart-meta-term-desc-dm"> ({{ datamart.dmNm }})</span>
          </template>
        </p>
      </div>

      <div class="datamart-meta-term-toolbar">
        <UiTab
          v-model="typeFilter"
          :tabs="typeFilterTabs"
        />
        <UiButton
          variant="primary"
          size="sm"
          class="shrink-0"
          @click="onAdd"
        >
          <template #icon-left>
            <i class="icon icon-plus size-16" />
          </template>
          새 용어 등록
        </UiButton>
      </div>

      <div class="datamart-meta-term-split">
        <!-- 좌측: 목록 -->
        <div class="com-setting-section datamart-meta-term-list-section">
          <div class="com-setting-section-header datamart-meta-section-header-static">
            <span class="com-setting-section-title">
              등록된 용어 <span class="datamart-meta-term-count">({{ filteredList.length }})</span>
            </span>
          </div>
          <div class="com-setting-section-body datamart-meta-term-list-body">
            <UiEmpty
              v-if="filteredList.length === 0"
              :description="termList.length === 0 ? '등록된 용어가 없습니다.' : '해당 유형의 용어가 없습니다.'"
            />
            <ul
              v-else
              class="term-card-list"
            >
              <li
                v-for="row in filteredList"
                :id="`term-card-${getUiKey(row)}`"
                :key="getUiKey(row)"
              >
                <button
                  type="button"
                  class="term-card"
                  :class="{ 'is-selected': selectedKey === getUiKey(row) }"
                  @click="selectTerm(getUiKey(row))"
                >
                  <span
                    class="term-card-type"
                    :class="row.termType === 'METRIC' ? 'is-metric' : 'is-dimension'"
                  >
                    {{ row.termType === 'METRIC' ? '지표' : '구분' }}
                  </span>
                  <span
                    class="term-card-nm"
                    :class="{ 'is-placeholder': !row.termNm.trim() }"
                  >
                    {{ row.termNm.trim() || '새 용어' }}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- 우측: 상세 -->
        <div class="com-setting-section datamart-meta-term-detail-section">
          <div class="com-setting-section-header datamart-meta-section-header-static">
            <span class="com-setting-section-title">{{ selectedTerm ? '용어 수정' : '상세보기' }}</span>
          </div>
          <div class="com-setting-section-body datamart-meta-term-detail-body">
            <UiEmpty
              v-if="!selectedTerm"
              description="용어를 선택하거나 새로 등록해 주세요."
            />
            <template v-else>
              <form
                class="term-form"
                @submit.prevent
              >
                <div class="term-form-field">
                  <label class="term-form-label">유형</label>
                  <UiSelect
                    :model-value="selectedTerm.termType"
                    :options="typeOptions"
                    size="md"
                    @update:model-value="onUpdateField('termType', String($event))"
                  />
                </div>

                <div class="term-form-field">
                  <label
                    class="term-form-label"
                    for="term-nm"
                  >
                    대표 용어
                  </label>
                  <UiInput
                    id="term-nm"
                    :model-value="selectedTerm.termNm"
                    size="md"
                    :max-length="TERM_NM_MAX"
                    placeholder="예: 매출액, 지역"
                    @update:model-value="onUpdateField('termNm', $event)"
                  />
                </div>

                <div class="term-form-field">
                  <label
                    class="term-form-label"
                    for="term-synonyms"
                  >
                    유사어 <span class="term-form-optional">(콤마구분)</span>
                  </label>
                  <UiInput
                    id="term-synonyms"
                    :model-value="selectedTerm.synonyms ?? ''"
                    size="md"
                    placeholder="예: 매출,매출액,영업수익"
                    @update:model-value="onUpdateField('synonyms', $event)"
                  />
                </div>

                <div
                  v-if="selectedTerm.termType === 'DIMENSION'"
                  class="term-form-field"
                >
                  <label
                    class="term-form-label"
                    for="term-sample"
                  >
                    예시 값 <span class="term-form-optional">(콤마구분)</span>
                  </label>
                  <UiInput
                    id="term-sample"
                    :model-value="selectedTerm.sampleValues ?? ''"
                    size="md"
                    placeholder="예: 대전,서울,부산"
                    @update:model-value="onUpdateField('sampleValues', $event)"
                  />
                </div>

                <div class="term-form-field">
                  <label
                    class="term-form-label"
                    for="term-desc"
                  >
                    설명 <span class="term-form-optional">(선택)</span>
                  </label>
                  <UiTextarea
                    id="term-desc"
                    :model-value="selectedTerm.termDesc ?? ''"
                    size="md"
                    :rows="2"
                    :auto-resize="true"
                    :max-rows="4"
                    border
                    placeholder="용어의 정의/설명을 입력하세요"
                    @update:model-value="onUpdateField('termDesc', $event)"
                  />
                </div>
              </form>

              <div class="term-form-footer flex items-center gap-8">
                <UiButton
                  type="button"
                  variant="line-secondary"
                  size="md"
                  @click="onDelete"
                >
                  <template #icon-left>
                    <i class="icon icon-trashcan size-16" />
                  </template>
                  삭제
                </UiButton>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from '~/components/ui/UiSelect.vue'
import type { Datamart } from '~/types/datamart'
import type { DatamartMetaTermItem, DatamartMetaTermType } from '~/types/datamartMeta'

const props = defineProps<{
  datamart: Datamart | null
  errorMessage?: string | null
}>()

/** 부모 모달과 양방향 바인딩되는 용어 목록 */
const termList = defineModel<DatamartMetaTermItem[]>('termList', { default: () => [] })

type TermEditableField = 'termType' | 'termNm' | 'synonyms' | 'sampleValues' | 'termDesc'

const TERM_NM_MAX = 50
const DRAFT_ID_PREFIX = '__draft_'

const typeOptions: SelectOption[] = [
  { label: '지표 (METRIC)', value: 'METRIC' },
  { label: '구분 (DIMENSION)', value: 'DIMENSION' },
]
const typeFilterTabs = [
  { label: '전체', value: 'ALL' },
  { label: '지표', value: 'METRIC' },
  { label: '구분', value: 'DIMENSION' },
]

const typeFilter = ref<'ALL' | DatamartMetaTermType>('ALL')
const selectedKey = ref<string | null>(null)

const datamartId = computed(() => props.datamart?.datamartId?.trim() ?? '')

const createDraftId = () => `${DRAFT_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
const isDraftId = (id: string) => !id || id.startsWith(DRAFT_ID_PREFIX)
const getUiKey = (row: DatamartMetaTermItem) => row.termId?.trim() || ''

const filteredList = computed(() =>
  typeFilter.value === 'ALL' ? termList.value : termList.value.filter((row) => row.termType === typeFilter.value),
)

const findByUiKey = (uiKey: string) => termList.value.find((row) => getUiKey(row) === uiKey)
const selectedTerm = computed(() => findByUiKey(selectedKey.value ?? '') ?? null)

const selectTerm = (uiKey: string | null) => {
  selectedKey.value = uiKey
}

const patchTerm = (uiKey: string, patch: Partial<DatamartMetaTermItem>) => {
  termList.value = termList.value.map((row) =>
    getUiKey(row) === uiKey ? { ...row, ...patch, datamartId: datamartId.value || row.datamartId, useYn: 'Y' } : row,
  )
}

const onUpdateField = (field: TermEditableField, value: string) => {
  const uiKey = selectedKey.value
  if (!uiKey) return
  patchTerm(uiKey, { [field]: value })
}

const onAdd = () => {
  const newRow: DatamartMetaTermItem = {
    datamartId: datamartId.value,
    termId: createDraftId(),
    termType: typeFilter.value === 'DIMENSION' ? 'DIMENSION' : 'METRIC',
    termNm: '',
    termDesc: '',
    sampleValues: '',
    synonyms: '',
    useYn: 'Y',
  }
  termList.value = [newRow, ...termList.value]
  selectTerm(getUiKey(newRow))
}

const onDelete = () => {
  const uiKey = selectedKey.value
  if (!uiKey) return
  termList.value = termList.value.filter((row) => getUiKey(row) !== uiKey)
  selectTerm(filteredList.value[0] ? getUiKey(filteredList.value[0]) : null)
}

/** 필터 변경 시 선택 보정 */
watch(filteredList, (list) => {
  if (list.length === 0) {
    selectTerm(null)
    return
  }
  if (!list.some((row) => getUiKey(row) === selectedKey.value)) selectTerm(getUiKey(list[0]))
})

/** 저장 payload — termNm 필수 검증 후 정규화 */
const buildSavePayload = (): DatamartMetaTermItem[] | null => {
  if (!datamartId.value) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return null
  }
  for (const row of termList.value) {
    if (!row.termNm.trim()) {
      openToast({ message: '대표 용어를 입력해주세요.', type: 'warning' })
      selectTerm(getUiKey(row))
      nextTick(() => document.getElementById('term-nm')?.focus())
      return null
    }
  }
  return termList.value.map((row) => ({
    ...row,
    termId: isDraftId(row.termId ?? '') ? '' : row.termId,
    termNm: row.termNm.trim(),
    termDesc: (row.termDesc ?? '').trim(),
    sampleValues: row.termType === 'DIMENSION' ? (row.sampleValues ?? '').trim() : '',
    synonyms: (row.synonyms ?? '').trim(),
  }))
}

defineExpose({ buildSavePayload })
</script>

<style lang="scss" scoped>
.datamart-meta-term-header {
  margin-bottom: $spacing-sm;
}

.datamart-meta-term-desc {
  @include typo($body-small, $color-text-secondary);

  &-dm {
    color: var(--color-primary);
  }
}

.datamart-meta-term-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.datamart-meta-term-split {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: $spacing-md;
  min-height: 360px;
}

.datamart-meta-term-count {
  color: $color-text-muted;
}

.term-card-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.term-card {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  width: 100%;
  padding: $spacing-xs $spacing-sm;
  border: 1px solid transparent;
  border-radius: $border-radius-base;
  background: none;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: $color-background;
  }

  &.is-selected {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
  }
}

.term-card-type {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: $border-radius-sm;
  @include typo($body-caption-bold);

  &.is-metric {
    color: #2563eb;
    background: rgba(37, 99, 235, 0.12);
  }
  &.is-dimension {
    color: #7c3aed;
    background: rgba(124, 58, 237, 0.12);
  }
}

.term-card-nm {
  @include typo($body-small, $color-text-primary);
  @include ellipsis(1);

  &.is-placeholder {
    color: $color-text-muted;
  }
}

.term-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.term-form-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.term-form-label {
  @include typo($body-small-bold, $color-text-primary);
}

.term-form-optional {
  @include typo($body-xsmall, $color-text-muted);
}

.term-form-footer {
  margin-top: $spacing-md;
}
</style>
