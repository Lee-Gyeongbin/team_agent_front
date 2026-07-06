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
          <template v-if="datamart?.dmNm">
            <span class="datamart-meta-synonym-desc-dm"> ({{ datamart.dmNm }})</span>
          </template>
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
                    :id="`synonym-representative-${getGroupUiId(group)}`"
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
import { UiEmpty } from '@leechanyong/ispark-ui'
import type { Datamart } from '~/types/datamart'
import type {
  DatamartMetaSynonymGroup,
  DatamartMetaSynonymItem,
  DatamartMetaSynonymPayload,
} from '~/types/datamartMeta'

const props = defineProps<{
  datamart: Datamart | null
  errorMessage?: string | null
  synonymApiRes?: DatamartMetaSynonymPayload | null
}>()

/** 부모와 양방향 바인딩 — 동의어 그룹 편집 상태 */
const synonymGroups = defineModel<DatamartMetaSynonymGroup[]>('synonymGroups', { default: () => [] })

/** representYn === 'Y' 인 항목을 대표 표현으로 판별 */
const isRepresentativeSynonymItem = (item: DatamartMetaSynonymItem) =>
  String(item.representYn ?? '')
    .trim()
    .toUpperCase() === 'Y'

/** 서버 synonymId 없이 신규 생성한 그룹의 클라이언트 식별자 */
const createSynonymClientKey = () => `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/** 그룹 내 대표 표현 아이템 — 없으면 첫 항목 반환 */
const getRepresentativeSynonymItem = (group: DatamartMetaSynonymGroup) =>
  group.synonymList.find(isRepresentativeSynonymItem) ?? group.synonymList[0]

/**
 * API 조회 응답 → 탭 UI 그룹 목록
 * - 배열 / synonymGroupList / flat synonymList 등 응답 형태를 통합 처리
 * - flat 목록은 representYn 기준으로 UI 그룹으로 재구성
 */
const parseSynonymGroupsFromApi = (
  res: DatamartMetaSynonymPayload | DatamartMetaSynonymGroup[] | null | undefined,
  datamartId: string,
): DatamartMetaSynonymGroup[] | null => {
  if (!res) return null

  /** 그룹별 datamartId 누락 시 인자값으로 보정 */
  const attachDatamartId = (groups: DatamartMetaSynonymGroup[], id: string) =>
    groups.map((group) => ({ ...group, datamartId: group.datamartId?.trim() || id }))

  /** API 그룹 구조를 UI 카드 단위로 정규화 */
  const toUiGroups = (groups: DatamartMetaSynonymGroup[], id: string): DatamartMetaSynonymGroup[] => {
    if (!groups.length) return []
    const withId = attachDatamartId(groups, id)

    // 이미 그룹화된 응답 — synonymList가 비어 있는 그룹은 제외
    if (groups.length > 1 || !(groups[0]?.synonymList?.length ?? 0)) {
      return withId.filter((group) => (group.synonymList?.length ?? 0) > 0)
    }

    // 단일 래퍼 + flat synonymList — representYn 순서로 UI 그룹 재조립
    const flatItems = groups
      .flatMap((group) => group.synonymList)
      .filter((item) => item.synonymWord?.trim())
      .map((item) => ({ ...item, synonymWord: item.synonymWord.trim() }))

    if (!flatItems.length) return []

    const grouped: DatamartMetaSynonymGroup[] = []
    let current: DatamartMetaSynonymGroup | null = null

    flatItems.forEach((item) => {
      // 대표 항목이거나 첫 항목이면 새 그룹 시작
      if (isRepresentativeSynonymItem(item) || !current) {
        const serverId = item.synonymId?.trim() ?? ''
        current = {
          datamartId: id,
          ...(serverId ? { synonymId: serverId } : { clientKey: createSynonymClientKey() }),
          synonymList: [{ ...item, representYn: 'Y' as const, useYn: item.useYn === 'N' ? 'N' : 'Y' }],
        }
        grouped.push(current)
        return
      }
      // 이전 대표에 속하는 동의어로 추가
      current.synonymList.push({ ...item, representYn: 'N' as const, useYn: item.useYn === 'N' ? 'N' : 'Y' })
    })

    return grouped
  }

  // 응답이 그룹 배열 그 자체인 경우
  if (Array.isArray(res)) {
    if (!res.length) return []
    if (!res.every((group) => Array.isArray(group?.synonymList))) return null
    return toUiGroups(attachDatamartId(res, datamartId), datamartId)
  }

  const sourceDatamartId = res.datamartId?.trim() || datamartId
  const groupedList = res.synonymGroupList
  if (Array.isArray(groupedList)) {
    return toUiGroups(attachDatamartId(groupedList, sourceDatamartId), sourceDatamartId)
  }

  // flat synonymList 단일 래퍼 형태
  if (Array.isArray(res.synonymList)) {
    return toUiGroups(
      attachDatamartId([{ datamartId: sourceDatamartId, synonymList: res.synonymList }], sourceDatamartId),
      sourceDatamartId,
    )
  }

  return null
}

// 검색·펼침·인라인 동의어 추가 UI 상태
const searchKeyword = ref('')
const expandedGroupIds = ref<string[]>([])
const addingSynonymGroupId = ref<string | null>(null)
const newSynonymInput = ref('')

type UiInputExpose = { focus: () => void }
const addSynonymInputRef = ref<UiInputExpose | null>(null)

const datamartId = computed(() => props.datamart?.datamartId?.trim() ?? '')

/** v-for key·펼침 상태 — 서버 synonymId 우선, 없으면 clientKey */
const getGroupUiId = (group: DatamartMetaSynonymGroup) => group.synonymId?.trim() || group.clientKey?.trim() || ''

/** 그룹 헤더에 표시할 대표 표현 텍스트 */
const getGroupSourceText = (group: DatamartMetaSynonymGroup) =>
  getRepresentativeSynonymItem(group)?.synonymWord?.trim() ?? ''

/** 대표 표현을 제외한 동의어 아이템 목록 */
const getGroupSynonymItems = (group: DatamartMetaSynonymGroup) => {
  const representative = getRepresentativeSynonymItem(group)
  if (!representative) return []
  return group.synonymList.filter((item) => item !== representative)
}

/** 태그 UI용 동의어 단어 배열 */
const getGroupSynonymWords = (group: DatamartMetaSynonymGroup) =>
  getGroupSynonymItems(group).map((item) => item.synonymWord)

/** 검색어로 대표 표현·동의어를 필터링한 그룹 목록 */
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

/** 빈 목록 UI 구분 — 데이터 없음 / 검색 결과 없음 */
const listEmptyState = computed<'none' | 'no-data' | 'no-search'>(() => {
  if (synonymGroups.value.length === 0) return 'no-data'
  if (filteredSynonymGroupList.value.length === 0) return 'no-search'
  return 'none'
})

const listEmptyDescription = computed(() =>
  listEmptyState.value === 'no-search' ? '검색 결과가 없습니다.' : '등록된 동의어가 없습니다.',
)

/** UI ID로 특정 그룹만 불변 갱신 */
const updateGroupByUiId = (groupId: string, updater: (group: DatamartMetaSynonymGroup) => DatamartMetaSynonymGroup) => {
  synonymGroups.value = synonymGroups.value.map((group) => {
    if (getGroupUiId(group) !== groupId) return group
    return updater(group)
  })
}

/** 신규 동의어 아이템 생성 — 기본 useYn Y */
const createSynonymItem = (synonymWord: string, representYn: 'Y' | 'N'): DatamartMetaSynonymItem => ({
  synonymWord,
  representYn,
  useYn: 'Y',
})

/** 저장 API 전송용 필드 정규화 */
const normalizeSynonymItemForSave = (item: DatamartMetaSynonymItem): DatamartMetaSynonymItem => ({
  ...item,
  datamartId: item.datamartId?.trim() || datamartId.value,
  synonymWord: item.synonymWord?.trim() ?? '',
  representYn: isRepresentativeSynonymItem(item) ? 'Y' : 'N',
  useYn: item.useYn === 'N' ? 'N' : 'Y',
})

/**
 * 그룹의 대표 표현·동의어 목록 일괄 갱신
 * - checkOverlap: 그룹 내·타 그룹 간 단어 중복 검사
 * - 기존 동의어 아이템은 synonymId 등 메타를 유지하며 단어만 교체
 */
const updateGroupSynonyms = (
  groupId: string,
  sourceText: string,
  synonymWords: string[],
  checkOverlap = false,
): boolean => {
  const nextWords = synonymWords.map((word) => word.trim()).filter(Boolean)

  if (checkOverlap) {
    const keys: string[] = []
    let isDuplicate = false

    // 같은 그룹 내 대표·동의어 간 중복
    for (const word of [sourceText, ...nextWords]) {
      const key = word.trim().toLowerCase()
      if (!key) continue
      if (keys.includes(key)) {
        isDuplicate = true
        break
      }
      keys.push(key)
    }

    // 다른 그룹과의 단어 충돌
    if (
      !isDuplicate &&
      synonymGroups.value.some((group) => {
        if (getGroupUiId(group) === groupId) return false
        const otherKeys = [getGroupSourceText(group), ...getGroupSynonymWords(group)]
          .map((word) => word.trim().toLowerCase())
          .filter(Boolean)
        return keys.some((key) => otherKeys.includes(key))
      })
    ) {
      isDuplicate = true
    }

    if (isDuplicate) {
      openToast({ message: '동의어 중복 검사 결과 중복 단어가 있습니다.', type: 'warning' })
      return false
    }
  }

  updateGroupByUiId(groupId, (group) => {
    const representative = getRepresentativeSynonymItem(group)
    // 기존 동의어 아이템을 단어 키로 매핑 — 서버 메타 보존용
    const oldByKey = new Map(
      group.synonymList
        .filter((item) => item !== representative)
        .flatMap((item) => {
          const key = item.synonymWord.trim().toLowerCase()
          return key ? ([[key, item]] as const) : []
        }),
    )

    return {
      ...group,
      synonymList: [
        representative
          ? { ...representative, synonymWord: sourceText, representYn: 'Y', useYn: 'Y' }
          : createSynonymItem(sourceText, 'Y'),
        ...nextWords.map((word) => {
          const prev = oldByKey.get(word.toLowerCase())
          return prev
            ? { ...prev, synonymWord: word, representYn: 'N' as const, useYn: 'Y' as const }
            : createSynonymItem(word, 'N')
        }),
      ],
    }
  })

  return true
}

const isGroupExpanded = (groupId: string) => expandedGroupIds.value.includes(groupId)

/** 필터된 그룹이 있을 때만 모두 펼침/닫음 버튼 활성화 */
const hasExpandCollapseTargets = computed(() => filteredSynonymGroupList.value.length > 0)

/** 현재 필터 결과가 전부 펼쳐진 상태인지 */
const isAllFilteredGroupsExpanded = computed(
  () =>
    hasExpandCollapseTargets.value &&
    filteredSynonymGroupList.value.every((group) => isGroupExpanded(getGroupUiId(group))),
)

const expandCollapseActionLabel = computed(() => (isAllFilteredGroupsExpanded.value ? '모두 닫음' : '모두 펼침'))

/** 모두 펼침 ↔ 모두 닫음 토글 */
const onToggleExpandAllGroups = () => {
  if (isAllFilteredGroupsExpanded.value) {
    onCollapseAllGroups()
    return
  }
  onExpandAllGroups()
}

/** 필터된 그룹을 모두 펼침 — 기존 펼침 상태는 유지 */
const onExpandAllGroups = () => {
  const targets = filteredSynonymGroupList.value
  if (!targets.length) return
  expandedGroupIds.value = [...new Set([...expandedGroupIds.value, ...targets.map((group) => getGroupUiId(group))])]
}

/** 전체 접기 — 인라인 동의어 입력도 함께 초기화 */
const onCollapseAllGroups = () => {
  expandedGroupIds.value = []
  addingSynonymGroupId.value = null
  newSynonymInput.value = ''
}

/** 카드 펼침 — 중복 추가 방지 */
const onOpenGroup = (groupId: string) => {
  if (!expandedGroupIds.value.includes(groupId)) {
    expandedGroupIds.value = [...expandedGroupIds.value, groupId]
  }
}

/** 카드 접기 — 해당 그룹의 인라인 입력 상태 정리 */
const onCloseGroup = (groupId: string) => {
  expandedGroupIds.value = expandedGroupIds.value.filter((id) => id !== groupId)
  if (addingSynonymGroupId.value === groupId) {
    addingSynonymGroupId.value = null
    newSynonymInput.value = ''
  }
}

const isAddingSynonymToGroup = (groupId: string) => addingSynonymGroupId.value === groupId

/** 동의어 태그 추가 — 중복 검사 포함 */
const addSynonymToGroup = (group: DatamartMetaSynonymGroup, value: string) => {
  const token = value.trim()
  if (!token) return false

  return updateGroupSynonyms(
    getGroupUiId(group),
    getGroupSourceText(group),
    [...getGroupSynonymWords(group), token],
    true,
  )
}

/** 빈 대표 표현으로 신규 그룹 생성 후 목록 상단에 추가·펼침 */
const onAddGroup = () => {
  const newGroup: DatamartMetaSynonymGroup = {
    datamartId: datamartId.value,
    clientKey: createSynonymClientKey(),
    synonymList: [{ synonymWord: '', representYn: 'Y', useYn: 'Y' }],
  }
  onOpenGroup(getGroupUiId(newGroup))
  synonymGroups.value = [newGroup, ...synonymGroups.value]
}

/** 대표 표현 입력 변경 — 값이 있을 때만 타 그룹 중복 검사 */
const onUpdateGroupSourceText = (group: DatamartMetaSynonymGroup, value: string) => {
  updateGroupSynonyms(getGroupUiId(group), value, getGroupSynonymWords(group), !!value.trim())
}

/** 인라인 동의어 입력 모드 진입 후 포커스 */
const onStartAddSynonym = (groupId: string) => {
  addingSynonymGroupId.value = groupId
  newSynonymInput.value = ''
  nextTick(() => addSynonymInputRef.value?.focus())
}

const onCancelAddSynonymInput = () => {
  addingSynonymGroupId.value = null
  newSynonymInput.value = ''
}

/** Enter/확인 — 성공 시 입력 유지·연속 추가 가능하도록 포커스 복원 */
const onConfirmAddSynonym = (group: DatamartMetaSynonymGroup) => {
  if (!addSynonymToGroup(group, newSynonymInput.value)) return
  newSynonymInput.value = ''
  nextTick(() => addSynonymInputRef.value?.focus())
}

/** 태그 닫기 — 해당 인덱스 동의어만 제거 */
const onRemoveSynonym = (group: DatamartMetaSynonymGroup, index: number) => {
  const groupId = getGroupUiId(group)
  const synonymWords = [...getGroupSynonymWords(group)]
  if (index < 0 || index >= synonymWords.length) return
  synonymWords.splice(index, 1)
  updateGroupSynonyms(groupId, getGroupSourceText(group), synonymWords)
}

/** 그룹 삭제 후 펼침·입력 상태 정리 */
const onDeleteGroup = (group: DatamartMetaSynonymGroup) => {
  const groupId = getGroupUiId(group)
  synonymGroups.value = synonymGroups.value.filter((item) => getGroupUiId(item) !== groupId)
  onCloseGroup(groupId)
}

/**
 * API 조회 결과 → synonymGroups 동기화
 * - 탭 재마운트(immediate, prev 없음) + 편집 데이터 있음 → 유지
 * - API 응답 변경(저장 후 재조회 등) → 서버 데이터로 갱신
 */
watch(
  () => [props.synonymApiRes, props.errorMessage] as const,
  ([res, errorMessage], prev) => {
    if (errorMessage) {
      synonymGroups.value = []
      return
    }
    if (res === null || res === undefined) return

    const prevRes = prev?.[0]
    if (synonymGroups.value.length > 0 && prevRes === undefined) return

    synonymGroups.value = parseSynonymGroupsFromApi(res, datamartId.value) ?? []
  },
  { immediate: true },
)

/** 유효성 실패 시 해당 그룹 펼침 후 대표 표현 입력으로 스크롤·포커스 */
const focusRepresentativeInput = (groupId: string) => {
  onOpenGroup(groupId)
  nextTick(() => {
    const el = document.getElementById(`synonym-representative-${groupId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  })
}

/**
 * 부모 모달 저장 시 호출 — flat synonymList 페이로드 생성
 * - datamartId·대표 표현 필수 검증
 * - 실패 시 null, 성공 시 정규화된 아이템 배열
 */
const buildSavePayload = (): DatamartMetaSynonymItem[] | null => {
  if (!datamartId.value) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return null
  }

  const emptyRepresentativeGroup = synonymGroups.value.find((group) => !getGroupSourceText(group).trim())
  if (emptyRepresentativeGroup) {
    openToast({ message: '대표 표현을 입력해주세요.', type: 'warning' })
    focusRepresentativeInput(getGroupUiId(emptyRepresentativeGroup))
    return null
  }

  return synonymGroups.value
    .flatMap((group) => group.synonymList)
    .map(normalizeSynonymItemForSave)
    .filter((item) => item.synonymWord)
}

defineExpose({ buildSavePayload })
</script>
