<template>
  <div class="datamart-meta-synonym com-setting-form">
    <template v-if="props.errorMessage">
      <div class="datamart-meta-synonym-error">
        <p class="datamart-meta-synonym-error-msg">{{ props.errorMessage }}</p>
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="onRetry"
        >
          다시 시도
        </UiButton>
      </div>
    </template>

    <template v-else>
      <div class="datamart-meta-synonym-header">
        <p class="datamart-meta-synonym-desc">
          같은 의미의 표현을 묶어 AI가 자연어를 이해하도록 합니다. 대표 표현을 기준으로 동의어가 적용됩니다.
        </p>
      </div>

      <div class="datamart-meta-synonym-toolbar">
        <UiInput
          v-model="searchKeyword"
          type="search"
          size="sm"
          placeholder="대표 표현·동의어를 입력하세요"
          class="datamart-meta-synonym-search"
        />
        <div class="datamart-meta-synonym-toolbar-actions flex items-center gap-8 shrink-0">
          <UiButton
            variant="line-secondary"
            size="sm"
            :disabled="!hasExpandCollapseTargets"
            @click="onToggleExpandAllGroups"
          >
            {{ expandCollapseActionLabel }}
          </UiButton>
          <UiButton
            variant="primary"
            size="sm"
            class="datamart-meta-synonym-add"
            @click="onAddGroup"
          >
            <template #icon-left>
              <i class="icon icon-plus size-16" />
            </template>
            새 표현 추가
          </UiButton>
        </div>
      </div>

      <div class="com-setting-section datamart-meta-synonym-list-section">
        <div class="com-setting-section-header datamart-meta-section-header-static">
          <div class="datamart-meta-synonym-section-header">
            <span class="com-setting-section-title">
              동의어 그룹
              <span class="datamart-meta-synonym-count">({{ visibleSynonymGroups.length }})</span>
            </span>
            <div class="datamart-meta-synonym-change-actions">
              <span
                v-if="metaModalSynonymDraft.hasPendingChanges"
                class="datamart-meta-synonym-change-badge"
              >
                <i aria-hidden="true" />
                변경사항 {{ metaModalSynonymDraft.pendingChangeCount }}건 (저장되지 않음)
              </span>
              <UiButton
                variant="line-secondary"
                size="sm"
                :disabled="!metaModalSynonymDraft.hasPendingChanges"
                @click="onResetChanges"
              >
                변경 취소
              </UiButton>
            </div>
          </div>
        </div>
        <div class="com-setting-section-body datamart-meta-synonym-list-body">
          <UiEmpty
            v-if="listEmptyState !== 'none'"
            :description="listEmptyDescription"
            class="synonym-empty"
          />

          <ul
            v-else
            class="synonym-group-list"
          >
            <li
              v-if="isAddGroupMode"
              class="synonym-group-card is-expanded"
            >
              <div class="synonym-group-header flex items-center justify-between gap-12">
                <p class="synonym-group-representative flex items-center gap-8 min-w-0">
                  <span class="synonym-group-representative-label shrink-0">대표 표현 :</span>
                  <UiInput
                    v-model="addFormSourceText"
                    size="sm"
                    class="synonym-source-input"
                    placeholder="대표 표현 입력"
                  />
                </p>
                <div class="synonym-group-header-actions flex items-center gap-8 shrink-0">
                  <UiButton
                    variant="outline"
                    size="sm"
                    :disabled="!isAddFormSaveEnabled"
                    @click.stop="onSaveAddGroup"
                  >
                    완료
                  </UiButton>
                  <UiButton
                    variant="line-secondary"
                    size="sm"
                    @click.stop="onCancelAddGroup"
                  >
                    취소
                  </UiButton>
                </div>
              </div>
              <div class="synonym-group-body">
                <p class="synonym-group-body-label">같은 의미로 이해할 표현</p>
                <div class="synonym-tag-box">
                  <div class="synonym-tag-row">
                    <UiTag
                      v-for="(word, idx) in addFormSynonyms"
                      :key="`new-${word}-${idx}`"
                      variant="primary"
                      size="md"
                      closable
                      @close="onRemoveAddFormSynonym(idx)"
                    >
                      {{ word }}
                    </UiTag>
                    <div class="synonym-tag-row-footer">
                      <div class="synonym-add-field">
                        <span class="synonym-add-field-label">추가할 동의어 :</span>
                        <UiInput
                          ref="addFormSynonymInputRef"
                          v-model="addFormSynonymInput"
                          size="sm"
                          class="synonym-inline-input"
                          placeholder="동의어 입력 후 Enter"
                          @enter="onConfirmAddFormSynonym"
                        >
                          <template #icon-right>
                            <div class="synonym-inline-input-actions">
                              <button
                                type="button"
                                class="synonym-inline-input-action"
                                aria-label="동의어 추가"
                                @mousedown.prevent
                                @click="onConfirmAddFormSynonym"
                              >
                                <i class="icon icon-check size-14" />
                              </button>
                              <button
                                type="button"
                                class="synonym-inline-input-action"
                                aria-label="입력 초기화"
                                @mousedown.prevent
                                @click="onCancelAddFormSynonymInput"
                              >
                                <i class="icon icon-close size-10" />
                              </button>
                            </div>
                          </template>
                        </UiInput>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>

            <li
              v-for="group in filteredSynonymGroupList"
              :key="getGroupUiId(group)"
              class="synonym-group-card"
              :class="{ 'is-expanded': isGroupExpanded(getGroupUiId(group)) }"
            >
              <div
                class="synonym-group-header flex items-center justify-between gap-12"
                role="button"
                tabindex="0"
                @click="onToggleGroup(getGroupUiId(group))"
                @keydown.enter.prevent="onToggleGroup(getGroupUiId(group))"
                @keydown.space.prevent="onToggleGroup(getGroupUiId(group))"
              >
                <p class="synonym-group-representative flex items-center gap-8 min-w-0">
                  <span class="synonym-group-representative-label shrink-0">대표 표현 :</span>
                  <UiInput
                    v-if="isEditingGroup(group)"
                    :model-value="editState!.sourceText"
                    size="sm"
                    class="synonym-source-input"
                    placeholder="대표 표현 입력"
                    @update:model-value="onEditSourceTextInput"
                    @click.stop
                    @enter="onConfirmEditSource(group)"
                  />
                  <strong
                    v-else
                    class="synonym-group-representative-text"
                  >
                    {{ getGroupSourceText(group) }}
                  </strong>
                  <span class="synonym-group-count-badge">{{ getDisplaySynonymWords(group).length }}</span>
                </p>

                <div class="synonym-group-header-actions flex items-center gap-8 shrink-0">
                  <UiButton
                    variant="outline"
                    size="sm"
                    class="btn-synonym-edit"
                    @mousedown.prevent
                    @click.stop="onEditGroup(group)"
                  >
                    <template #icon-left>
                      <i
                        class="icon size-14"
                        :class="isEditingGroup(group) ? 'icon-check' : 'icon-edit'"
                      />
                    </template>
                    {{ isEditingGroup(group) ? '완료' : '수정' }}
                  </UiButton>
                  <UiButton
                    variant="line-secondary"
                    size="sm"
                    class="btn-synonym-delete"
                    @click.stop="onDeleteGroup(group)"
                  >
                    <template #icon-left>
                      <i class="icon icon-trashcan size-14" />
                    </template>
                    삭제
                  </UiButton>
                  <button
                    type="button"
                    class="synonym-group-chevron-btn"
                    :aria-expanded="isGroupExpanded(getGroupUiId(group))"
                    :aria-label="isGroupExpanded(getGroupUiId(group)) ? '접기' : '펼치기'"
                    @click.stop="onToggleGroup(getGroupUiId(group))"
                  >
                    <i
                      class="icon icon-arrow-down size-20 synonym-group-chevron"
                      :class="{ 'is-expanded': isGroupExpanded(getGroupUiId(group)) }"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              <div
                v-show="isGroupExpanded(getGroupUiId(group))"
                class="synonym-group-body"
              >
                <p class="synonym-group-body-label">같은 의미로 이해할 표현</p>

                <div class="synonym-tag-box">
                  <div class="synonym-tag-row">
                    <UiTag
                      v-for="(word, wordIndex) in getDisplaySynonymWords(group)"
                      :key="`${getGroupUiId(group)}-${word}-${wordIndex}`"
                      variant="primary"
                      size="md"
                      :closable="isEditingGroup(group)"
                      @close="onRemoveSynonym(wordIndex)"
                    >
                      {{ word }}
                    </UiTag>
                    <div
                      v-if="isEditingGroup(group)"
                      class="synonym-tag-row-footer"
                    >
                      <div
                        v-if="editState!.isAddingSynonym"
                        class="synonym-add-field"
                      >
                        <span class="synonym-add-field-label">추가할 동의어 :</span>
                        <UiInput
                          ref="addSynonymInputRef"
                          :model-value="editState!.newSynonymInput"
                          size="sm"
                          class="synonym-inline-input"
                          placeholder="동의어 입력 후 Enter"
                          @update:model-value="onEditNewSynonymInput"
                          @enter="onConfirmAddSynonym"
                        >
                          <template #icon-right>
                            <div class="synonym-inline-input-actions">
                              <button
                                type="button"
                                class="synonym-inline-input-action"
                                aria-label="동의어 추가"
                                @mousedown.prevent
                                @click="onConfirmAddSynonym"
                              >
                                <i class="icon icon-check size-14" />
                              </button>
                              <button
                                type="button"
                                class="synonym-inline-input-action"
                                aria-label="입력 취소"
                                @mousedown.prevent
                                @click="onCancelAddSynonymInput"
                              >
                                <i class="icon icon-close size-10" />
                              </button>
                            </div>
                          </template>
                        </UiInput>
                      </div>
                      <button
                        v-else
                        type="button"
                        class="synonym-tag-add"
                        @click="onStartAddSynonym"
                      >
                        <i
                          class="icon icon-plus size-14"
                          aria-hidden="true"
                        />
                        추가
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDatamartStore } from '~/composables/datamart/useDatamartStore'
import type { Datamart } from '~/types/datamart'
import type { DatamartMetaSynonymGroup, DatamartMetaSynonymItem } from '~/types/datamartMeta'

const props = defineProps<{
  datamart: Datamart | null
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()

const synonymGroups = defineModel<DatamartMetaSynonymGroup[]>('synonymGroups', { default: () => [] })

const { metaModalSynonymDraft } = useDatamartStore()

type SynonymEditState = {
  groupId: string
  sourceText: string
  synonymWords: string[]
  isAddingSynonym: boolean
  newSynonymInput: string
}

const searchKeyword = ref('')
const expandedGroupIds = ref<string[]>([])
const editState = ref<SynonymEditState | null>(null)
const isAddGroupMode = ref(false)
const addFormSourceText = ref('')
const addFormSynonyms = ref<string[]>([])
const addFormSynonymInput = ref('')

type UiInputExpose = { focus: () => void }
const addSynonymInputRef = ref<UiInputExpose | null>(null)
const addFormSynonymInputRef = ref<UiInputExpose | null>(null)

const datamartId = computed(() => props.datamart?.datamartId?.trim() ?? '')

const isAddFormSaveEnabled = computed(() => Boolean(addFormSourceText.value.trim() && addFormSynonyms.value.length > 0))

const getGroupUiId = (group: DatamartMetaSynonymGroup) => group.synonymId?.trim() || group.clientKey?.trim() || ''

const isRepresentativeItem = (item: DatamartMetaSynonymItem) =>
  String(item.representYn ?? '')
    .trim()
    .toUpperCase() === 'Y'

const getGroupSourceText = (group: DatamartMetaSynonymGroup) =>
  group.synonymList.find(isRepresentativeItem)?.synonymWord ?? group.synonymList[0]?.synonymWord ?? ''

const getGroupSynonymItems = (group: DatamartMetaSynonymGroup) => {
  const representative = group.synonymList.find(isRepresentativeItem) ?? group.synonymList[0]
  if (!representative) return []
  return group.synonymList.filter((item) => item !== representative && item.useYn !== 'N')
}

const isEditingGroup = (group: DatamartMetaSynonymGroup) => editState.value?.groupId === getGroupUiId(group)

const getDisplaySynonymWords = (group: DatamartMetaSynonymGroup) => {
  if (isEditingGroup(group)) return [...editState.value!.synonymWords]
  return getGroupSynonymItems(group).map((item) => item.synonymWord)
}

const isVisibleSynonymItem = (item: DatamartMetaSynonymItem) => item.useYn !== 'N'
const isVisibleSynonymGroup = (group: DatamartMetaSynonymGroup) => group.synonymList.some(isVisibleSynonymItem)
const visibleSynonymGroups = computed(() => synonymGroups.value.filter(isVisibleSynonymGroup))

const filteredSynonymGroupList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const groups = visibleSynonymGroups.value
  if (!keyword) return groups
  return groups.filter((group) => {
    const sourceText = getGroupSourceText(group).toLowerCase()
    return (
      sourceText.includes(keyword) ||
      getGroupSynonymItems(group).some((item) => item.synonymWord.toLowerCase().includes(keyword))
    )
  })
})

const listEmptyState = computed<'none' | 'no-data' | 'no-search'>(() => {
  if (isAddGroupMode.value) return 'none'
  if (visibleSynonymGroups.value.length === 0) return 'no-data'
  if (filteredSynonymGroupList.value.length === 0) return 'no-search'
  return 'none'
})

const listEmptyDescription = computed(() =>
  listEmptyState.value === 'no-search' ? '검색 결과가 없습니다.' : '등록된 동의어가 없습니다.',
)

const createSynonymClientKey = () => `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const updateGroupByUiId = (groupId: string, updater: (group: DatamartMetaSynonymGroup) => DatamartMetaSynonymGroup) => {
  synonymGroups.value = synonymGroups.value.map((group) => {
    if (getGroupUiId(group) !== groupId) return group
    return updater(group)
  })
}

const createSynonymItem = (synonymWord: string, representYn: 'Y' | 'N'): DatamartMetaSynonymItem => ({
  synonymWord,
  representYn,
})

const createSynonymGroup = (sourceText: string, synonyms: string[]): DatamartMetaSynonymGroup => ({
  datamartId: datamartId.value,
  clientKey: createSynonymClientKey(),
  synonymList: [createSynonymItem(sourceText, 'Y'), ...synonyms.map((word) => createSynonymItem(word, 'N'))],
})

/** 스토어 payload(flat synonymList) → UI용 그룹 배열 */
function buildGroupedSynonyms(raw: DatamartMetaSynonymGroup[]): DatamartMetaSynonymGroup[] {
  const flatItems = raw
    .flatMap((g) => g.synonymList)
    .filter((item) => item.synonymWord?.trim())
    .map((item) => ({ ...item, synonymWord: item.synonymWord.trim() }))

  if (!flatItems.length) return []

  const grouped: DatamartMetaSynonymGroup[] = []
  let current: DatamartMetaSynonymGroup | null = null

  flatItems.forEach((item) => {
    if (isRepresentativeItem(item) || !current) {
      const serverId = item.synonymId?.trim() ?? ''
      current = {
        datamartId: datamartId.value,
        ...(serverId ? { synonymId: serverId } : { clientKey: createSynonymClientKey() }),
        synonymList: [{ ...item, representYn: 'Y' as const }],
      }
      grouped.push(current)
      return
    }
    current.synonymList.push({ ...item, representYn: 'N' as const })
  })

  return grouped
}

/** 스토어 flat payload [ { synonymList } ] — UI 카드 배열로 분할 */
const isFlatSynonymPayload = (raw: DatamartMetaSynonymGroup[]) =>
  raw.length === 1 && (raw[0]?.synonymList?.length ?? 0) > 0

const isAlreadyUiGrouped = (raw: DatamartMetaSynonymGroup[]) => raw.length > 1

/** 조회·저장 후 flat payload → UI 카드 배열 (편집 가드 없음) */
const normalizeSynonymGroupsFromStore = () => {
  if (isAlreadyUiGrouped(synonymGroups.value)) return
  if (isFlatSynonymPayload(synonymGroups.value)) {
    synonymGroups.value = buildGroupedSynonyms(synonymGroups.value)
  }
}

const resetSynonymPanelUiState = () => {
  expandedGroupIds.value = []
  editState.value = null
  onCancelAddGroup()
}

const onSavedUiFinalize = () => {
  resetSynonymPanelUiState()
  normalizeSynonymGroupsFromStore()
  metaModalSynonymDraft.commitBaseline()
}

defineExpose({
  onSavedUiFinalize,
})

const onResetChanges = () => {
  metaModalSynonymDraft.revert()
  resetSynonymPanelUiState()
}

/** flat payload → UI 카드 배열 후 baseline 설정 (hydrate는 normalize 전이라 baseline 미설정) */
onMounted(() => {
  normalizeSynonymGroupsFromStore()
  if (!metaModalSynonymDraft.ready.value) {
    metaModalSynonymDraft.commitBaseline()
  }
})

const isGroupExpanded = (groupId: string) => expandedGroupIds.value.includes(groupId)

const hasExpandCollapseTargets = computed(() => filteredSynonymGroupList.value.length > 0)

const isAllFilteredGroupsExpanded = computed(
  () =>
    hasExpandCollapseTargets.value &&
    filteredSynonymGroupList.value.every((group) => isGroupExpanded(getGroupUiId(group))),
)

const expandCollapseActionLabel = computed(() => (isAllFilteredGroupsExpanded.value ? '모두 닫음' : '모두 펼침'))

const onToggleExpandAllGroups = () => {
  if (isAllFilteredGroupsExpanded.value) {
    onCollapseAllGroups()
    return
  }
  onExpandAllGroups()
}

const onExpandAllGroups = () => {
  const targets = filteredSynonymGroupList.value
  if (!targets.length) return
  expandedGroupIds.value = [...new Set([...expandedGroupIds.value, ...targets.map((group) => getGroupUiId(group))])]
}

const onCollapseAllGroups = () => {
  expandedGroupIds.value = []
  editState.value = null
}

const ensureGroupExpanded = (groupId: string) => {
  if (!expandedGroupIds.value.includes(groupId)) {
    expandedGroupIds.value = [...expandedGroupIds.value, groupId]
  }
}

const clearGroupPanelState = (groupId: string) => {
  expandedGroupIds.value = expandedGroupIds.value.filter((id) => id !== groupId)
  if (editState.value?.groupId === groupId) {
    editState.value = null
  }
}

const onToggleGroup = (groupId: string) => {
  if (isGroupExpanded(groupId)) {
    clearGroupPanelState(groupId)
    return
  }
  ensureGroupExpanded(groupId)
}

const resetAddForm = () => {
  addFormSourceText.value = ''
  addFormSynonyms.value = []
  addFormSynonymInput.value = ''
}

const onAddGroup = () => {
  isAddGroupMode.value = true
  resetAddForm()
}

const onCancelAddGroup = () => {
  isAddGroupMode.value = false
  resetAddForm()
}

const onConfirmAddFormSynonym = () => {
  const value = addFormSynonymInput.value.trim()
  if (!value) return
  addFormSynonyms.value.push(value)
  addFormSynonymInput.value = ''
  nextTick(() => addFormSynonymInputRef.value?.focus())
}

const onCancelAddFormSynonymInput = () => {
  addFormSynonymInput.value = ''
}

const onRemoveAddFormSynonym = (index: number) => {
  addFormSynonyms.value.splice(index, 1)
}

const onSaveAddGroup = () => {
  if (!isAddFormSaveEnabled.value) return
  const sourceText = addFormSourceText.value.trim()
  const newGroup = createSynonymGroup(sourceText, [...addFormSynonyms.value])
  synonymGroups.value = [newGroup, ...synonymGroups.value]
  ensureGroupExpanded(getGroupUiId(newGroup))
  onCancelAddGroup()
}

const onEditGroup = (group: DatamartMetaSynonymGroup) => {
  const groupId = getGroupUiId(group)
  if (editState.value?.groupId === groupId) {
    onConfirmEditSource(group)
    return
  }
  ensureGroupExpanded(groupId)
  editState.value = {
    groupId,
    sourceText: getGroupSourceText(group),
    synonymWords: getGroupSynonymItems(group).map((item) => item.synonymWord),
    isAddingSynonym: false,
    newSynonymInput: '',
  }
}

const onEditSourceTextInput = (value: string) => {
  if (!editState.value) return
  editState.value = { ...editState.value, sourceText: value }
}

const onEditNewSynonymInput = (value: string) => {
  if (!editState.value) return
  editState.value = { ...editState.value, newSynonymInput: value }
}

const onConfirmEditSource = (group: DatamartMetaSynonymGroup) => {
  const state = editState.value
  const groupId = getGroupUiId(group)
  if (!state || state.groupId !== groupId) return

  const sourceText = state.sourceText.trim()
  const synonymWords = [...new Set(state.synonymWords.map((word) => word.trim()).filter(Boolean))]

  if (!sourceText) {
    editState.value = null
    ensureGroupExpanded(groupId)
    return
  }

  const sourceChanged = sourceText !== getGroupSourceText(group)
  const currentWords = getGroupSynonymItems(group).map((item) => item.synonymWord)
  const wordsChanged = currentWords.join('\u0000') !== synonymWords.join('\u0000')

  if (!sourceChanged && !wordsChanged) {
    editState.value = null
    ensureGroupExpanded(groupId)
    return
  }

  updateGroupByUiId(groupId, (item) => {
    const representative = item.synonymList.find(isRepresentativeItem) ?? item.synonymList[0]
    if (!representative) return item

    const baseSynonyms = item.synonymList.filter((synonym) => synonym !== representative)
    const removedItems = baseSynonyms.filter(
      (synonym) => synonym.useYn !== 'N' && !synonymWords.includes(synonym.synonymWord),
    )

    return {
      ...item,
      synonymList: [
        { ...representative, synonymWord: sourceText, representYn: 'Y', useYn: 'Y' },
        ...synonymWords.map((word) => createSynonymItem(word, 'N')),
        ...removedItems.map((synonym) => ({ ...synonym, representYn: 'N' as const, useYn: 'N' as const })),
      ],
    }
  })
  editState.value = null
  ensureGroupExpanded(groupId)
}

const onStartAddSynonym = () => {
  if (!editState.value) return
  editState.value = { ...editState.value, isAddingSynonym: true, newSynonymInput: '' }
  nextTick(() => addSynonymInputRef.value?.focus())
}

const onCancelAddSynonymInput = () => {
  if (!editState.value) return
  editState.value = { ...editState.value, isAddingSynonym: false, newSynonymInput: '' }
}

const onConfirmAddSynonym = () => {
  const state = editState.value
  if (!state) return
  const value = state.newSynonymInput.trim()
  if (!value) return
  editState.value = {
    ...state,
    synonymWords: [...state.synonymWords, value],
    newSynonymInput: '',
    isAddingSynonym: false,
  }
  nextTick(() => addSynonymInputRef.value?.focus())
}

const onRemoveSynonym = (index: number) => {
  if (!editState.value) return
  if (index < 0 || index >= editState.value.synonymWords.length) return
  const synonymWords = [...editState.value.synonymWords]
  synonymWords.splice(index, 1)
  editState.value = { ...editState.value, synonymWords }
}

const onDeleteGroup = (group: DatamartMetaSynonymGroup) => {
  const groupId = getGroupUiId(group)
  updateGroupByUiId(groupId, (item) => ({
    ...item,
    synonymList: item.synonymList.map((synonym) => ({ ...synonym, useYn: 'N' })),
  }))
  clearGroupPanelState(groupId)
}

const onRetry = () => {
  emit('retry')
}

onBeforeUnmount(() => {
  if (!metaModalSynonymDraft.hasPendingChanges.value) return
  onResetChanges()
})
</script>
