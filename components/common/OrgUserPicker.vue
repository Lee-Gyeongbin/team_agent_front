<template>
  <div
    class="org-user-picker"
    :class="{ 'is-readonly': readonly }"
  >
    <!-- 검색 -->
    <div
      v-if="showSearch"
      class="org-user-picker-search"
    >
      <UiInput
        v-model="searchInput"
        class="org-user-picker-search-input"
        :placeholder="searchPlaceholder"
        @enter="onSearch"
      />
      <UiButton
        variant="outline"
        size="lg"
        @click="onSearch"
      >
        <template #icon-left>
          <UiIcon
            name="search"
            size="16"
          />
        </template>
        검색
      </UiButton>
    </div>

    <div
      class="org-user-picker-panels"
      :class="{ 'has-selected': showSelected }"
    >
      <!-- 인사조직 (공통 OrgTreePanel) — 검색 중에는 선택 표시 해제 -->
      <OrgTreePanel
        class="org-user-picker-panel"
        :title="orgTitle"
        :selected-org-id="appliedKeyword ? null : selectedOrgId"
        @select="onSelectOrg"
      />

      <!-- 직원목록 -->
      <section class="org-manage-member-panel org-user-picker-panel">
        <div class="org-manage-panel-header org-user-picker-panel-header">
          <p class="org-manage-panel-title">
            {{ appliedKeyword ? '검색 결과' : userTitle }}
            <span
              v-if="visibleUsers.length > 0"
              class="org-user-picker-count"
              >{{ visibleUsers.length }}</span
            >
          </p>
          <button
            v-if="canSelectAll"
            type="button"
            class="org-user-picker-link"
            @click="onSelectAllVisible"
          >
            전체 선택
          </button>
        </div>
        <div class="org-user-picker-body">
          <UiLoading
            v-if="isListLoading"
            overlay
            text="직원 목록을 불러오는 중..."
          />
          <div
            v-else-if="listErrorMessage"
            class="org-user-picker-state"
          >
            <p class="org-user-picker-state-error">{{ listErrorMessage }}</p>
            <UiButton
              variant="outline"
              size="sm"
              @click="onRetryList"
            >
              다시 시도
            </UiButton>
          </div>
          <UiEmpty
            v-else-if="visibleUsers.length === 0"
            :title="emptyUserTitle"
          />
          <ul
            v-else
            class="org-user-picker-list"
            role="listbox"
            :aria-multiselectable="multiple"
          >
            <li
              v-for="orgUser in visibleUsers"
              :key="orgUser.userId"
              class="org-user-picker-item is-clickable"
              :class="{
                'is-assigned': isTransferMode && isSelected(orgUser.userId),
                'is-selected': isTransferMode ? highlightLeftIds.includes(orgUser.userId) : isSelected(orgUser.userId),
              }"
              role="option"
              :tabindex="readonly ? -1 : 0"
              :title="isTransferMode && isSelected(orgUser.userId) ? '이미 선택됨' : ''"
              :aria-selected="isSelected(orgUser.userId)"
              @click="onClickLeftUser(orgUser)"
              @dblclick="onAddUserDirect(orgUser)"
              @keydown.enter.prevent="onAddUserDirect(orgUser)"
              @keydown.space.prevent="onClickLeftUser(orgUser)"
            >
              <span class="org-user-picker-avatar">
                <img
                  v-if="orgUser.profileImgUrl"
                  :src="orgUser.profileImgUrl"
                  :alt="orgUser.userNm"
                />
                <UiIcon
                  v-else
                  name="user"
                  size="14"
                />
              </span>
              <span class="org-user-picker-info">
                <span class="org-user-picker-name">{{ orgUser.userNm }}</span>
                <span
                  v-if="orgUser.email"
                  class="org-user-picker-email"
                  >{{ orgUser.email }}</span
                >
              </span>
              <span
                v-if="isTransferMode && isSelected(orgUser.userId)"
                class="org-user-picker-assigned-tag"
                >선택됨</span
              >
              <UiIcon
                v-else-if="isTransferMode ? highlightLeftIds.includes(orgUser.userId) : isSelected(orgUser.userId)"
                class="org-user-picker-check"
                name="check"
                size="14"
              />
            </li>
          </ul>
        </div>
      </section>

      <!-- 이동 버튼 (선택됨 패널이 있을 때만) -->
      <div
        v-if="showSelected"
        class="org-user-picker-mid"
      >
        <UiButton
          variant="primary"
          size="md"
          icon-only
          aria-label="선택 목록에 추가"
          :disabled="readonly || highlightLeftIds.length === 0"
          @click="onAddHighlighted"
        >
          <template #icon-left>
            <UiIcon
              name="chevron-right"
              size="18"
            />
          </template>
        </UiButton>
        <UiButton
          variant="primary-line"
          size="md"
          icon-only
          aria-label="선택 목록에서 제외"
          :disabled="readonly || highlightRightIds.length === 0"
          @click="onRemoveHighlighted"
        >
          <template #icon-left>
            <UiIcon
              name="chevron-left"
              size="18"
            />
          </template>
        </UiButton>
      </div>

      <!-- 선택됨 -->
      <section
        v-if="showSelected"
        class="org-manage-member-panel org-user-picker-panel"
      >
        <div class="org-manage-panel-header org-user-picker-panel-header">
          <p class="org-manage-panel-title">
            {{ selectedTitle }}
            <span class="org-user-picker-count">{{ modelValue.length }}</span>
          </p>
          <button
            v-if="!readonly && multiple && modelValue.length > 0"
            type="button"
            class="org-user-picker-link is-danger"
            @click="onClearSelected"
          >
            전체 해제
          </button>
        </div>
        <div class="org-user-picker-body">
          <UiEmpty
            v-if="modelValue.length === 0"
            :title="selectedEmptyTitle"
          />
          <ul
            v-else
            class="org-user-picker-list"
          >
            <li
              v-for="selectedUser in modelValue"
              :key="selectedUser.userId"
              class="org-user-picker-item"
              :class="{
                'is-clickable': !readonly,
                'is-selected': highlightRightIds.includes(selectedUser.userId),
              }"
              :tabindex="readonly ? -1 : 0"
              @click="onClickRightUser(selectedUser.userId)"
              @dblclick="!readonly && onRemoveUser(selectedUser.userId)"
              @keydown.enter.prevent="!readonly && onRemoveUser(selectedUser.userId)"
              @keydown.space.prevent="onClickRightUser(selectedUser.userId)"
            >
              <span class="org-user-picker-avatar">
                <img
                  v-if="selectedUser.profileImgUrl"
                  :src="selectedUser.profileImgUrl"
                  :alt="selectedUser.userNm"
                />
                <UiIcon
                  v-else
                  name="user"
                  size="14"
                />
              </span>
              <span class="org-user-picker-info">
                <span class="org-user-picker-name">{{ selectedUser.userNm }}</span>
                <span
                  v-if="selectedUser.email"
                  class="org-user-picker-email"
                  >{{ selectedUser.email }}</span
                >
              </span>
              <button
                v-if="!readonly"
                type="button"
                class="org-user-picker-remove"
                :aria-label="`${selectedUser.userNm} 선택 해제`"
                @click.stop="onRemoveUser(selectedUser.userId)"
                @dblclick.stop
              >
                <UiIcon
                  name="x"
                  size="14"
                />
              </button>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiButton, UiEmpty, UiIcon, UiInput, UiLoading } from '@leechanyong/ispark-ui'
import OrgTreePanel from '~/components/common/OrgTreePanel.vue'
import { useAuth } from '~/composables/com/useAuth'
import { useOrgUserPicker } from '~/composables/com/useOrgUserPicker'
import type { OrgUserItem, OrgUserPickerSearchScope, OrgUserPickerUser } from '~/types/org-manage'

/**
 * 공통 사용자 조회 — [인사조직 | 직원목록 | 선택됨] + 검색.
 * 오버레이·Teleport·고정 크기가 없어 모달 본문이든 일반 화면이든 그대로 넣어 쓴다.
 * 높이는 사용처가 지정한다 (모달: style="height: 360px", 본창: flex: 1 등) — 컴포넌트는 부모 높이를 채운다.
 */
const props = withDefaults(
  defineProps<{
    /** 선택된 사용자 (v-model) */
    modelValue?: OrgUserPickerUser[]
    /** 목록에서 제외할 사용자 id */
    excludeUserIds?: string[]
    /** false 면 한 명만 선택 */
    multiple?: boolean
    /** 로그인 사용자를 목록에서 제외 */
    excludeSelf?: boolean
    /** 조직 선택 시 하위 조직 직원까지 포함 */
    includeSubOrg?: boolean
    /** 검색 범위 — org: 선택 조직 안 / all: 전체 직원 */
    searchScope?: OrgUserPickerSearchScope
    /** 검색창 표시 */
    showSearch?: boolean
    /** 선택됨 패널 표시 — false 면 선택 목록은 사용처가 직접 그린다 */
    showSelected?: boolean
    /** 조회만 가능 (선택·해제 불가) */
    readonly?: boolean
    orgTitle?: string
    userTitle?: string
    selectedTitle?: string
    searchPlaceholder?: string
    selectedEmptyTitle?: string
  }>(),
  {
    modelValue: () => [],
    excludeUserIds: () => [],
    multiple: true,
    excludeSelf: false,
    includeSubOrg: false,
    searchScope: 'org',
    showSearch: true,
    showSelected: true,
    readonly: false,
    orgTitle: '인사조직',
    userTitle: '직원목록',
    selectedTitle: '선택됨',
    searchPlaceholder: '이름으로 검색 (Enter)',
    selectedEmptyTitle: '직원목록에서 선택하세요.',
  },
)

const emit = defineEmits<{
  'update:modelValue': [users: OrgUserPickerUser[]]
}>()

const { user: loginUser } = useAuth()
const {
  selectedOrgId,
  orgUsers,
  isOrgUserLoading,
  orgUserErrorMessage,
  allUsers,
  isAllUserLoading,
  allUserErrorMessage,
  handleSelectOrg,
  handleLoadAllUsers,
} = useOrgUserPicker()

/** 검색창 입력값 */
const searchInput = ref('')
/** 검색 버튼/Enter 로 확정된 검색어 — 한글 IME 로 Enter 가 두 번 들어와도 결과 동일 */
const appliedKeyword = ref('')

const isAllSearch = computed(() => !!appliedKeyword.value && props.searchScope === 'all')

/** 목록에서 뺄 사용자 id (명시 제외 + 본인) */
const excludedIds = computed(() => {
  const ids = new Set(props.excludeUserIds.map((id) => String(id || '').trim()))
  const selfId = String(loginUser.value?.userId || '').trim()
  if (props.excludeSelf && selfId) ids.add(selfId)
  return ids
})

/** 검색 전 원본 목록 — null 이면 아직 조회 전 */
const sourceUsers = computed<OrgUserItem[] | null>(() => (isAllSearch.value ? allUsers.value : orgUsers.value))

const visibleUsers = computed<OrgUserItem[]>(() => {
  const keyword = appliedKeyword.value.toLowerCase()
  return (sourceUsers.value || []).filter((orgUser) => {
    if (excludedIds.value.has(String(orgUser.userId || '').trim())) return false
    if (!keyword) return true
    return String(orgUser.userNm || '')
      .toLowerCase()
      .includes(keyword)
  })
})

const isListLoading = computed(() => (isAllSearch.value ? isAllUserLoading.value : isOrgUserLoading.value))
const listErrorMessage = computed(() => (isAllSearch.value ? allUserErrorMessage.value : orgUserErrorMessage.value))

const emptyUserTitle = computed(() => {
  if (appliedKeyword.value) return '검색 결과가 없습니다.'
  if (!selectedOrgId.value || orgUsers.value === null) return '조직을 선택하세요.'
  return '소속 직원이 없습니다.'
})

const canSelectAll = computed(
  () => !props.readonly && props.multiple && !isListLoading.value && visibleUsers.value.length > 0,
)

const isSelected = (userId: string): boolean => props.modelValue.some((selected) => selected.userId === userId)

/**
 * 이동 방식 — 선택됨 패널이 있으면 [클릭: 하이라이트 → 화살표로 이동 / 더블클릭: 바로 이동],
 * 선택됨 패널이 없으면 이동할 곳이 없으므로 클릭 한 번으로 바로 선택/해제.
 */
const isTransferMode = computed(() => props.showSelected && !props.readonly)

/** 직원목록에서 하이라이트한 사용자 id (아직 선택 전) */
const highlightLeftIds = ref<string[]>([])
/** 선택됨 목록에서 하이라이트한 사용자 id */
const highlightRightIds = ref<string[]>([])

const toggleHighlight = (side: 'left' | 'right', userId: string): void => {
  const target = side === 'left' ? highlightLeftIds : highlightRightIds
  if (target.value.includes(userId)) {
    target.value = target.value.filter((id) => id !== userId)
    return
  }
  // 한 명만 선택하는 모드에서는 직원목록 하이라이트도 하나만
  target.value = side === 'left' && !props.multiple ? [userId] : [...target.value, userId]
}

/** 선택 목록에 추가 (한 명 모드면 교체) */
const addUsers = (orgUsersToAdd: OrgUserItem[]): void => {
  const added = orgUsersToAdd.filter((orgUser) => !isSelected(orgUser.userId)).map(toPickerUser)
  if (!added.length) return
  emit('update:modelValue', props.multiple ? [...props.modelValue, ...added] : added.slice(0, 1))
  const addedIds = new Set(added.map((orgUser) => orgUser.userId))
  highlightLeftIds.value = highlightLeftIds.value.filter((id) => !addedIds.has(id))
}

/** 선택 목록에서 제거 */
const removeUsers = (userIds: string[]): void => {
  if (!userIds.length) return
  const removeIds = new Set(userIds)
  emit(
    'update:modelValue',
    props.modelValue.filter((selected) => !removeIds.has(selected.userId)),
  )
  highlightRightIds.value = highlightRightIds.value.filter((id) => !removeIds.has(id))
}

const onSelectOrg = (orgId: string): void => {
  // 조직을 고르면 검색 모드 해제
  appliedKeyword.value = ''
  searchInput.value = ''
  highlightLeftIds.value = []
  void handleSelectOrg(orgId, props.includeSubOrg)
}

const onSearch = (): void => {
  appliedKeyword.value = searchInput.value.trim()
  highlightLeftIds.value = []
  if (isAllSearch.value) void handleLoadAllUsers()
}

const onRetryList = (): void => {
  if (isAllSearch.value) {
    void handleLoadAllUsers()
    return
  }
  if (selectedOrgId.value) void handleSelectOrg(selectedOrgId.value, props.includeSubOrg)
}

/** 선택 목록에 담는 값 — 화면 표시용 필드까지 복사 */
const toPickerUser = (orgUser: OrgUserItem): OrgUserPickerUser => ({ ...orgUser })

/** 직원목록 클릭 — 이동 모드면 하이라이트, 아니면 바로 선택/해제 */
const onClickLeftUser = (orgUser: OrgUserItem): void => {
  if (props.readonly) return
  if (!isTransferMode.value) {
    if (isSelected(orgUser.userId)) removeUsers([orgUser.userId])
    else addUsers([orgUser])
    return
  }
  if (isSelected(orgUser.userId)) return // 이미 선택됨 — 하이라이트 대상 아님
  toggleHighlight('left', orgUser.userId)
}

/** 직원목록 더블클릭 / Enter — 바로 선택 목록에 추가 */
const onAddUserDirect = (orgUser: OrgUserItem): void => {
  if (!isTransferMode.value) {
    onClickLeftUser(orgUser)
    return
  }
  addUsers([orgUser])
}

/** > 버튼 — 하이라이트한 직원을 선택 목록에 추가 (화면 순서 유지) */
const onAddHighlighted = (): void => {
  const highlightIds = new Set(highlightLeftIds.value)
  addUsers(visibleUsers.value.filter((orgUser) => highlightIds.has(orgUser.userId)))
}

/** < 버튼 — 하이라이트한 선택 사용자를 제외 */
const onRemoveHighlighted = (): void => {
  removeUsers([...highlightRightIds.value])
}

/** 전체 선택 — 이동 모드면 표시 중인 미선택 직원 전부 하이라이트, 아니면 바로 추가 */
const onSelectAllVisible = (): void => {
  const candidates = visibleUsers.value.filter((orgUser) => !isSelected(orgUser.userId))
  if (!isTransferMode.value) {
    addUsers(candidates)
    return
  }
  highlightLeftIds.value = candidates.map((orgUser) => orgUser.userId)
}

const onClickRightUser = (userId: string): void => {
  if (props.readonly) return
  toggleHighlight('right', userId)
}

const onRemoveUser = (userId: string): void => {
  removeUsers([userId])
}

const onClearSelected = (): void => {
  emit('update:modelValue', [])
  highlightRightIds.value = []
}
</script>

<style lang="scss" scoped>
.org-user-picker {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  height: 100%;
  min-height: 0;
}

.org-user-picker-search {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-shrink: 0;

  .org-user-picker-search-input {
    flex: 1;
    min-width: 0;
  }
}

.org-user-picker-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-sm;
  flex: 1;
  min-height: 0;

  // 인사조직 | 직원목록 | 이동 버튼 | 선택됨
  &.has-selected {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto minmax(0, 1fr);
  }

  // OrgTreePanel·직원목록·선택됨 — 조직관리 패널 클래스를 쓰되 그리드 칸을 채우도록 크기만 덮는다
  .org-user-picker-panel {
    flex: none;
    max-width: none;
    min-height: 0;
    height: 100%;
    border-radius: $border-radius-base;
  }

  :deep(.org-manage-panel-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
    padding: 0 12px;
  }

  :deep(.org-manage-panel-title) {
    @include typo($body-small-bold);
    color: $color-text-secondary;
  }

  :deep(.org-manage-tree-body) {
    padding: 0 $spacing-xs;
  }
}

.org-user-picker-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
}

.org-user-picker-count {
  margin-left: 4px;
  color: var(--color-primary);
}

.org-user-picker-link {
  @include typo($body-small);
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;

  &.is-danger {
    color: $color-text-secondary;

    &:hover {
      color: $color-error;
    }
  }
}

.org-user-picker-body {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: $spacing-xs;
  @include custom-scrollbar;

  .ui-empty {
    margin: auto;
    padding: $spacing-lg 0;
  }
}

.org-user-picker-state {
  @include flex-center;
  flex-direction: column;
  flex: 1;
  gap: $spacing-sm;
  padding: $spacing-lg $spacing-md;

  .org-user-picker-state-error {
    @include typo($body-small);
    color: $color-error;
    text-align: center;
  }
}

.org-user-picker-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.org-user-picker-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-height: 40px;
  padding: 4px $spacing-sm;
  margin-bottom: 2px;
  border-radius: $border-radius-sm;
  transition: background-color $transition-fast;

  &:hover {
    background: $color-surface;
  }

  &.is-clickable {
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }
  }

  &.is-selected {
    background: var(--color-primary-bg);

    .org-user-picker-name {
      color: var(--color-primary);
      font-weight: 700;
    }
  }

  // 이미 선택 목록에 들어간 직원 — 흐리게, 하이라이트 불가
  &.is-assigned {
    cursor: default;

    .org-user-picker-name,
    .org-user-picker-email {
      color: $color-text-muted;
    }

    &:hover {
      background: transparent;
    }
  }

  .org-user-picker-check {
    flex-shrink: 0;
    color: var(--color-primary);
  }
}

.org-user-picker-assigned-tag {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: $border-radius-sm;
  background: $color-surface;
  @include typo($body-xsmall);
  color: $color-text-muted;
}

.org-user-picker-avatar {
  @include flex-center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: $border-radius-full;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.org-user-picker-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  .org-user-picker-name {
    @include typo($body-small);
    color: $color-text-primary;
    @include ellipsis(1);
  }

  .org-user-picker-email {
    @include typo($body-xsmall);
    color: $color-text-muted;
    @include ellipsis(1);
  }
}

.org-user-picker-remove {
  @include flex-center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: $border-radius-sm;
  color: $color-text-muted;

  &:hover {
    color: $color-error;
  }
}

.is-readonly .org-user-picker-item.is-clickable {
  cursor: default;
}

@include mobile {
  .org-user-picker {
    height: auto;
  }

  .org-user-picker-panels,
  .org-user-picker-panels.has-selected {
    grid-template-columns: 1fr;

    .org-user-picker-panel {
      height: 240px;
    }
  }

  .org-user-picker-mid {
    flex-direction: row;
    height: auto;
  }
}
</style>
