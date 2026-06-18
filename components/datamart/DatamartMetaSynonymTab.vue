<template>
  <div class="datamart-meta-synonym com-setting-form">
    <template v-if="props.errorMessage">
      <div class="datamart-meta-synonym-error">
        <p class="datamart-meta-synonym-error-msg">{{ props.errorMessage }}</p>
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
          <span class="com-setting-section-title">
            동의어 그룹
            <span class="datamart-meta-synonym-count">({{ synonymGroups.length }})</span>
          </span>
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
              v-for="group in filteredSynonymGroupList"
              :key="getGroupUiId(group)"
              class="synonym-group-card"
              :class="{ 'is-expanded': isGroupExpanded(getGroupUiId(group)) }"
            >
              <div
                v-if="!isGroupExpanded(getGroupUiId(group))"
                class="synonym-group-header synonym-group-header--collapsed flex items-center justify-between gap-12"
                role="button"
                tabindex="0"
                @click="onOpenGroup(getGroupUiId(group))"
                @keydown.enter.prevent="onOpenGroup(getGroupUiId(group))"
                @keydown.space.prevent="onOpenGroup(getGroupUiId(group))"
              >
                <p class="synonym-group-representative flex items-center gap-8 min-w-0">
                  <span class="synonym-group-representative-label shrink-0">대표 표현 :</span>
                  <strong class="synonym-group-representative-text">
                    {{ getGroupSourceText(group) || '—' }}
                  </strong>
                  <span class="synonym-group-count-badge">{{ getGroupSynonymWords(group).length }}</span>
                </p>

                <div class="synonym-group-header-actions flex items-center gap-8 shrink-0">
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
                    aria-expanded="false"
                    aria-label="펼치기"
                    @click.stop="onOpenGroup(getGroupUiId(group))"
                  >
                    <i
                      class="icon icon-arrow-down size-20 synonym-group-chevron"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              <div
                v-else
                class="synonym-group-header synonym-group-header--expanded flex items-center justify-between gap-12"
                role="button"
                tabindex="0"
                @click="onCloseGroup(getGroupUiId(group))"
                @keydown.enter.prevent="onCloseGroup(getGroupUiId(group))"
                @keydown.space.prevent="onCloseGroup(getGroupUiId(group))"
              >
                <p class="synonym-group-representative flex items-center gap-8 min-w-0">
                  <span class="synonym-group-representative-label shrink-0">대표 표현 :</span>
                  <UiInput
                    :model-value="getGroupSourceText(group)"
                    size="sm"
                    class="synonym-source-input"
                    placeholder="대표 표현 입력"
                    @update:model-value="onUpdateGroupSourceText(group, $event)"
                    @click.stop
                  />
                  <span class="synonym-group-count-badge">{{ getGroupSynonymWords(group).length }}</span>
                </p>

                <div class="synonym-group-header-actions flex items-center gap-8 shrink-0">
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
                    aria-expanded="true"
                    aria-label="접기"
                    @click.stop="onCloseGroup(getGroupUiId(group))"
                  >
                    <i
                      class="icon icon-arrow-down size-20 synonym-group-chevron is-expanded"
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
                      v-for="(word, wordIndex) in getGroupSynonymWords(group)"
                      :key="`${getGroupUiId(group)}-${word}-${wordIndex}`"
                      variant="primary"
                      size="md"
                      closable
                      @close="onRemoveSynonym(group, wordIndex)"
                    >
                      {{ word }}
                    </UiTag>
                    <div class="synonym-tag-row-footer">
                      <div
                        v-if="isAddingSynonymToGroup(getGroupUiId(group))"
                        class="synonym-add-field"
                      >
                        <UiInput
                          ref="addSynonymInputRef"
                          v-model="newSynonymInput"
                          size="sm"
                          class="synonym-inline-input"
                          placeholder="동의어 입력 후 Enter"
                          @enter="onConfirmAddSynonym(group)"
                        >
                          <template #icon-right>
                            <div class="synonym-inline-input-actions">
                              <button
                                type="button"
                                class="synonym-inline-input-action"
                                aria-label="동의어 추가"
                                @mousedown.prevent
                                @click="onConfirmAddSynonym(group)"
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
                        @click="onStartAddSynonym(getGroupUiId(group))"
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
import type { Datamart } from '~/types/datamart'
import type {
  DatamartMetaSynonymGroup,
  DatamartMetaSynonymItem,
  DatamartMetaSynonymPayload,
} from '~/types/datamartMeta'

const props = defineProps<{
  datamart: Datamart | null
  errorMessage?: string | null
  synonymApiRes?: unknown
}>()

const synonymGroups = defineModel<DatamartMetaSynonymGroup[]>('synonymGroups', { default: () => [] })

const isRepresentativeSynonymItem = (item: DatamartMetaSynonymItem) =>
  String(item.representYn ?? '')
    .trim()
    .toUpperCase() === 'Y'

const createSynonymClientKey = () => `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getRepresentativeSynonymItem = (group: DatamartMetaSynonymGroup) =>
  group.synonymList.find(isRepresentativeSynonymItem) ?? group.synonymList[0]

/** API 조회 응답 → 탭 UI 그룹 목록 */
const parseSynonymGroupsFromApi = (
  res: DatamartMetaSynonymPayload | DatamartMetaSynonymGroup[] | null | undefined,
  datamartId: string,
): DatamartMetaSynonymGroup[] | null => {
  if (!res) return null

  const attachDatamartId = (groups: DatamartMetaSynonymGroup[], id: string) =>
    groups.map((group) => ({ ...group, datamartId: group.datamartId?.trim() || id }))

  const toUiGroups = (groups: DatamartMetaSynonymGroup[], id: string): DatamartMetaSynonymGroup[] => {
    if (!groups.length) return []
    const withId = attachDatamartId(groups, id)
    if (groups.length > 1 || !(groups[0]?.synonymList?.length ?? 0)) return withId

    const flatItems = groups
      .flatMap((group) => group.synonymList)
      .filter((item) => item.synonymWord?.trim())
      .map((item) => ({ ...item, synonymWord: item.synonymWord.trim() }))

    if (!flatItems.length) return []

    const grouped: DatamartMetaSynonymGroup[] = []
    let current: DatamartMetaSynonymGroup | null = null

    flatItems.forEach((item) => {
      if (isRepresentativeSynonymItem(item) || !current) {
        const serverId = item.synonymId?.trim() ?? ''
        current = {
          datamartId: id,
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

  if (Array.isArray(res)) {
    if (!res.length) return []
    if (!res.every((group) => Array.isArray(group?.synonymList))) return null
    return toUiGroups(attachDatamartId(res, datamartId), datamartId)
  }

  const sourceDatamartId = res.datamartId?.trim() || datamartId
  const groupedList = res.synonymGroupList ?? res.dataList
  if (Array.isArray(groupedList)) {
    return toUiGroups(attachDatamartId(groupedList, sourceDatamartId), sourceDatamartId)
  }

  if (Array.isArray(res.synonymList)) {
    return toUiGroups(
      attachDatamartId([{ datamartId: sourceDatamartId, synonymList: res.synonymList }], sourceDatamartId),
      sourceDatamartId,
    )
  }

  return null
}

const searchKeyword = ref('')
const expandedGroupIds = ref<string[]>([])
const addingSynonymGroupId = ref<string | null>(null)
const newSynonymInput = ref('')

type UiInputExpose = { focus: () => void }
const addSynonymInputRef = ref<UiInputExpose | null>(null)

const datamartId = computed(() => props.datamart?.datamartId?.trim() ?? '')

const getGroupUiId = (group: DatamartMetaSynonymGroup) => group.synonymId?.trim() || group.clientKey?.trim() || ''

const getGroupSourceText = (group: DatamartMetaSynonymGroup) =>
  getRepresentativeSynonymItem(group)?.synonymWord?.trim() ?? ''

const getGroupSynonymItems = (group: DatamartMetaSynonymGroup) => {
  const representative = getRepresentativeSynonymItem(group)
  if (!representative) return []
  return group.synonymList.filter((item) => item !== representative)
}

const getGroupSynonymWords = (group: DatamartMetaSynonymGroup) =>
  getGroupSynonymItems(group).map((item) => item.synonymWord)

const filteredSynonymGroupList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const groups = synonymGroups.value
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
  if (synonymGroups.value.length === 0) return 'no-data'
  if (filteredSynonymGroupList.value.length === 0) return 'no-search'
  return 'none'
})

const listEmptyDescription = computed(() =>
  listEmptyState.value === 'no-search' ? '검색 결과가 없습니다.' : '등록된 동의어가 없습니다.',
)

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

/** 단어 중복 검사 */
const hasOverlapInAllSynonymWords = (sourceText: string, synonymWords: string[], excludeGroupId?: string) => {
  const groupWords = [sourceText, ...synonymWords].map((word) => word.trim()).filter(Boolean)
  if (new Set(groupWords).size !== groupWords.length) return true

  const existingSet = new Set(
    synonymGroups.value
      .filter((group) => !excludeGroupId || getGroupUiId(group) !== excludeGroupId)
      .flatMap((group) => [
        getGroupSourceText(group).trim(),
        ...getGroupSynonymItems(group).map((item) => item.synonymWord.trim()),
      ])
      .filter(Boolean),
  )
  return groupWords.some((word) => existingSet.has(word))
}

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
  addingSynonymGroupId.value = null
  newSynonymInput.value = ''
}

const onOpenGroup = (groupId: string) => {
  if (!expandedGroupIds.value.includes(groupId)) {
    expandedGroupIds.value = [...expandedGroupIds.value, groupId]
  }
}

const onCloseGroup = (groupId: string) => {
  expandedGroupIds.value = expandedGroupIds.value.filter((id) => id !== groupId)
  if (addingSynonymGroupId.value === groupId) {
    addingSynonymGroupId.value = null
    newSynonymInput.value = ''
  }
}

const isAddingSynonymToGroup = (groupId: string) => addingSynonymGroupId.value === groupId

const applyGroupSynonymChanges = (groupId: string, sourceText: string, synonymWords: string[]) => {
  const normalizedWords = [...new Set(synonymWords.map((word) => word.trim()).filter(Boolean))]

  updateGroupByUiId(groupId, (item) => {
    const representative = getRepresentativeSynonymItem(item)
    if (!representative) {
      return {
        ...item,
        synonymList: [
          createSynonymItem(sourceText, 'Y'),
          ...normalizedWords.map((word) => createSynonymItem(word, 'N')),
        ],
      }
    }

    const baseSynonyms = item.synonymList.filter((synonym) => synonym !== representative)
    const activeSynonymsByWord = baseSynonyms.reduce((map, synonym) => {
      const word = synonym.synonymWord?.trim()
      if (!word) return map
      map.set(word, [...(map.get(word) ?? []), synonym])
      return map
    }, new Map<string, DatamartMetaSynonymItem[]>())
    const nextSynonymItems = normalizedWords.map((word) => {
      const existingItems = activeSynonymsByWord.get(word) ?? []
      const existingItem = existingItems.shift()
      if (existingItems.length > 0) activeSynonymsByWord.set(word, existingItems)
      else activeSynonymsByWord.delete(word)

      return existingItem
        ? { ...existingItem, synonymWord: word, representYn: 'N' as const, useYn: 'Y' as const }
        : createSynonymItem(word, 'N')
    })

    return {
      ...item,
      synonymList: [{ ...representative, synonymWord: sourceText, representYn: 'Y', useYn: 'Y' }, ...nextSynonymItems],
    }
  })
}

const addSynonymToGroup = (group: DatamartMetaSynonymGroup, value: string) => {
  const token = value.trim()
  if (!token) return false

  const groupId = getGroupUiId(group)
  const sourceText = getGroupSourceText(group)
  const synonymWords = getGroupSynonymWords(group)

  if (hasOverlapInAllSynonymWords(sourceText, [...synonymWords, token], groupId)) {
    openToast({ message: '동의어 중복 검사 결과 중복 단어가 있습니다.', type: 'warning' })
    return false
  }

  applyGroupSynonymChanges(groupId, sourceText, [...synonymWords, token])
  return true
}

const onAddGroup = () => {
  const newGroup: DatamartMetaSynonymGroup = {
    datamartId: datamartId.value,
    clientKey: createSynonymClientKey(),
    synonymList: [{ synonymWord: '', representYn: 'Y', useYn: 'Y' }],
  }
  onOpenGroup(getGroupUiId(newGroup))
  synonymGroups.value = [newGroup, ...synonymGroups.value]
}

const onUpdateGroupSourceText = (group: DatamartMetaSynonymGroup, value: string) => {
  const groupId = getGroupUiId(group)
  const synonymWords = getGroupSynonymWords(group)
  const nextSourceText = value.trim()

  if (nextSourceText && hasOverlapInAllSynonymWords(nextSourceText, synonymWords, groupId)) {
    openToast({ message: '동의어 중복 검사 결과 중복 단어가 있습니다.', type: 'warning' })
    return
  }

  applyGroupSynonymChanges(groupId, value, synonymWords)
}

const onStartAddSynonym = (groupId: string) => {
  addingSynonymGroupId.value = groupId
  newSynonymInput.value = ''
  nextTick(() => addSynonymInputRef.value?.focus())
}

const onCancelAddSynonymInput = () => {
  addingSynonymGroupId.value = null
  newSynonymInput.value = ''
}

const onConfirmAddSynonym = (group: DatamartMetaSynonymGroup) => {
  if (!addSynonymToGroup(group, newSynonymInput.value)) return
  newSynonymInput.value = ''
  nextTick(() => addSynonymInputRef.value?.focus())
}

const onRemoveSynonym = (group: DatamartMetaSynonymGroup, index: number) => {
  const groupId = getGroupUiId(group)
  const synonymWords = [...getGroupSynonymWords(group)]
  if (index < 0 || index >= synonymWords.length) return
  synonymWords.splice(index, 1)
  applyGroupSynonymChanges(groupId, getGroupSourceText(group), synonymWords)
}

const onDeleteGroup = (group: DatamartMetaSynonymGroup) => {
  const groupId = getGroupUiId(group)
  synonymGroups.value = synonymGroups.value.filter((item) => getGroupUiId(item) !== groupId)
  onCloseGroup(groupId)
}

watch(
  () => [props.synonymApiRes, props.errorMessage] as const,
  ([res, errorMessage]) => {
    if (errorMessage) {
      synonymGroups.value = []
      return
    }
    if (res === null || res === undefined) return
    synonymGroups.value =
      parseSynonymGroupsFromApi(
        res as DatamartMetaSynonymPayload | DatamartMetaSynonymGroup[] | null | undefined,
        datamartId.value,
      ) ?? []
  },
  { immediate: true },
)

const buildSavePayload = (): DatamartMetaSynonymItem[] | null => {
  if (!datamartId.value) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return null
  }
  return synonymGroups.value.flatMap((group) => group.synonymList)
}

defineExpose({ buildSavePayload })
</script>
