<template>
  <div class="mail-panel mail-inbox-panel">
    <!-- 서브탭 -->
    <UiTab
      :model-value="activeSubTab"
      :tabs="subTabItems"
      class="mail-inbox-subtab"
      @update:model-value="onSubTabChange"
    />

    <!-- 검색 + 필터 도구 -->
    <div class="mail-list-tools">
      <select
        v-model="searchField"
        class="mail-search-select"
      >
        <option value="subject">제목</option>
        <option value="fromAddr">발신자</option>
        <option value="body">내용</option>
      </select>
      <input
        v-model="searchKeyword"
        type="text"
        class="mail-search-input"
        placeholder="검색어 입력"
        @keyup.enter="doSearch"
      />
      <UiButton
        variant="primary"
        size="sm"
        class="mail-search-btn"
        @click="doSearch"
      >
        검색
      </UiButton>

      <!-- 필터 드롭다운 -->
      <div
        ref="filterWrapRef"
        class="mail-filter-wrap"
      >
        <button
          class="mail-filter-btn"
          :class="{ 'has-filter': activeFilterCount > 0 }"
          @click="isFilterOpen = !isFilterOpen"
        >
          필터
          <span
            v-if="activeFilterCount > 0"
            class="mail-filter-count-badge"
            >{{ activeFilterCount }}</span
          >
          <i class="icon-arrow-down size-14" />
        </button>

        <div
          class="mail-filter-panel"
          :class="{ 'is-open': isFilterOpen }"
        >
          <!-- 메일 목적 -->
          <div class="mail-filter-group">
            <div class="mail-filter-group-label">메일 목적</div>
            <div class="mail-chip-row">
              <button
                v-for="opt in purposeOptions"
                :key="opt.cd"
                class="mail-chip"
                :class="{ 'is-active': pendingFilters.purposeCds.includes(opt.cd) }"
                @click="toggleChip(pendingFilters.purposeCds, opt.cd)"
              >
                {{ opt.nm }}
              </button>
            </div>
          </div>

          <!-- 필요 조치 -->
          <div class="mail-filter-group">
            <div class="mail-filter-group-label">필요 조치</div>
            <div class="mail-chip-row">
              <button
                v-for="opt in actionOptions"
                :key="opt.cd"
                class="mail-chip"
                :class="{ 'is-active': pendingFilters.actionCds.includes(opt.cd) }"
                @click="toggleChip(pendingFilters.actionCds, opt.cd)"
              >
                {{ opt.nm }}
              </button>
            </div>
          </div>

          <!-- 긴급도 -->
          <div class="mail-filter-group">
            <div class="mail-filter-group-label">긴급도</div>
            <div class="mail-chip-row">
              <button
                v-for="opt in urgencyOptions"
                :key="opt.cd"
                class="mail-chip"
                :class="{ 'is-active': pendingFilters.urgencyCds.includes(opt.cd) }"
                @click="toggleChip(pendingFilters.urgencyCds, opt.cd)"
              >
                {{ opt.nm }}
              </button>
            </div>
          </div>

          <!-- 중요도 -->
          <div class="mail-filter-group">
            <div class="mail-filter-group-label">중요도</div>
            <div class="mail-chip-row">
              <button
                v-for="opt in importanceOptions"
                :key="opt.cd"
                class="mail-chip"
                :class="{ 'is-active': pendingFilters.importanceCds.includes(opt.cd) }"
                @click="toggleChip(pendingFilters.importanceCds, opt.cd)"
              >
                {{ opt.nm }}
              </button>
            </div>
          </div>

          <!-- 업무 영역 -->
          <div class="mail-filter-group">
            <div class="mail-filter-group-label">업무 영역</div>
            <div class="mail-chip-row">
              <button
                v-for="cat in workCategories"
                :key="cat.cd"
                class="mail-chip"
                :class="{ 'is-active': pendingFilters.categoryCds.includes(cat.cd) }"
                @click="toggleChip(pendingFilters.categoryCds, cat.cd)"
              >
                {{ cat.nm }}
              </button>
            </div>
          </div>

          <div class="mail-filter-actions">
            <button
              class="mail-filter-reset"
              @click="resetFilters"
            >
              초기화
            </button>
            <button
              class="mail-filter-apply"
              @click="applyFilters"
            >
              필터 적용
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 테이블 또는 스켈레톤 / 빈 상태 -->
    <div class="mail-inbox-content">
      <template v-if="isLoading">
        <div
          v-for="i in 6"
          :key="i"
          class="mail-item-skeleton"
        >
          <span class="mail-skeleton mail-skeleton-avatar" />
          <div class="mail-item-skeleton-lines">
            <span class="mail-skeleton mail-skeleton-line" />
            <span class="mail-skeleton mail-skeleton-line-sm" />
          </div>
        </div>
      </template>

      <template v-else-if="mails.length > 0">
        <div
          v-for="mail in mails"
          :key="mail.mailId"
          class="mail-classified-item"
          :class="{ 'is-urgent': mail.urgencyCd === '001' }"
        >
          <div
            class="mail-item-avatar"
            :style="{ background: getAvatarColor(mail.fromName || mail.fromAddr) }"
          >
            {{ getInitial(mail.fromName || mail.fromAddr) }}
          </div>

          <div class="mail-item-content">
            <div class="mail-item-top">
              <span class="mail-item-from">{{ mail.fromName || mail.fromAddr }}</span>
              <span
                class="mail-classified-due"
                :class="{ 'is-today': isToday(mail.dueDt) }"
              >
                · {{ formatDue(mail.dueDt) }}
              </span>
            </div>
            <p class="mail-item-subject">{{ mail.subject }}</p>
            <div class="mail-classified-tags">
              <span :class="['mail-tag', getMailCategoryTagClass(mail.mailPurposeCd, purposeOptions, 0)]">{{
                mail.mailPurposeNm
              }}</span>
              <span :class="['mail-tag', getMailCategoryTagClass(mail.actionRequiredCd, actionOptions, 2)]">{{
                mail.actionRequiredNm
              }}</span>
              <span :class="['mail-tag', getMailUrgencyTagClass(mail.urgencyCd)]">{{ mail.urgencyNm }}</span>
              <span
                v-if="mail.importanceNm || mail.workCategoryNm"
                class="mail-classified-meta"
              >
                {{ [mail.importanceNm, mail.workCategoryNm].filter(Boolean).join(' · ') }}
              </span>
            </div>
          </div>

          <!-- 행 액션 버튼 -->
          <div class="mail-classified-actions">
            <UiButton
              variant="outline"
              size="sm"
              @click.stop="emit('detail', mail)"
            >
              상세보기
            </UiButton>
            <UiButton
              variant="primary"
              size="sm"
              @click.stop="emit('analysis', mail)"
            >
              AI 분석
            </UiButton>
          </div>
        </div>
      </template>

      <UiEmpty
        v-else
        icon="icon-mail"
        title="해당 조건에 맞는 메일이 없습니다"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClassifiedMail, ClassifiedMailListParams, WorkCategory } from '~/types/mail'
import { getMailCategoryTagClass, getMailUrgencyTagClass } from '~/utils/mail/mailTagUtil'

const props = defineProps<{
  isLoading: boolean
  mails: ClassifiedMail[]
  totalCount: number
  tabCounts: { all: number; action: number; reply: number }
  workCategories: WorkCategory[]
  purposeOptions: WorkCategory[]
  actionOptions: WorkCategory[]
  urgencyOptions: WorkCategory[]
  importanceOptions: WorkCategory[]
}>()

const emit = defineEmits<{
  detail: [mail: ClassifiedMail]
  analysis: [mail: ClassifiedMail]
  search: [params: ClassifiedMailListParams]
  'tab-change': [tab: 'all' | 'action' | 'reply']
}>()

// ─── 서브탭 ───────────────────────────────────────────────
const activeSubTab = ref<'all' | 'action' | 'reply'>('all')

const subTabItems = computed(() => [
  { label: `분류된 메일함 (${props.tabCounts.all})`, value: 'all' },
  { label: `액션 아이템 (${props.tabCounts.action})`, value: 'action' },
  { label: `회신 필요 (${props.tabCounts.reply})`, value: 'reply' },
])

const onSubTabChange = (value: string) => {
  const tab = value as 'all' | 'action' | 'reply'
  activeSubTab.value = tab
  emit('tab-change', tab)
}

// ─── 검색 ─────────────────────────────────────────────────
const searchField = ref('subject')
const searchKeyword = ref('')

// ─── 필터 상태 ────────────────────────────────────────────
interface FilterState {
  purposeCds: string[]
  actionCds: string[]
  urgencyCds: string[]
  importanceCds: string[]
  categoryCds: string[]
}

const createEmptyFilter = (): FilterState => ({
  purposeCds: [],
  actionCds: [],
  urgencyCds: [],
  importanceCds: [],
  categoryCds: [],
})

const pendingFilters = reactive<FilterState>(createEmptyFilter())
const appliedFilters = reactive<FilterState>(createEmptyFilter())

const isFilterOpen = ref(false)
const filterWrapRef = ref<HTMLElement>()

// 외부 클릭 시 필터 닫기
const onDocumentClick = (e: MouseEvent) => {
  if (filterWrapRef.value && !filterWrapRef.value.contains(e.target as Node)) {
    isFilterOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

// ─── 활성 필터 개수 ───────────────────────────────────────
const activeFilterCount = computed(
  () =>
    appliedFilters.purposeCds.length +
    appliedFilters.actionCds.length +
    appliedFilters.urgencyCds.length +
    appliedFilters.importanceCds.length +
    appliedFilters.categoryCds.length,
)

// ─── 칩 토글 ──────────────────────────────────────────────
const toggleChip = (arr: string[], cd: string) => {
  const idx = arr.indexOf(cd)
  if (idx === -1) {
    arr.push(cd)
  } else {
    arr.splice(idx, 1)
  }
}

// ─── 필터 초기화 ──────────────────────────────────────────
const resetFilters = () => {
  Object.assign(pendingFilters, createEmptyFilter())
}

// ─── 필터 적용 ────────────────────────────────────────────
const applyFilters = () => {
  Object.assign(appliedFilters, {
    purposeCds: [...pendingFilters.purposeCds],
    actionCds: [...pendingFilters.actionCds],
    urgencyCds: [...pendingFilters.urgencyCds],
    importanceCds: [...pendingFilters.importanceCds],
    categoryCds: [...pendingFilters.categoryCds],
  })
  isFilterOpen.value = false
  emitSearch()
}

// ─── 검색 emit ────────────────────────────────────────────
const doSearch = () => {
  emitSearch()
}

const emitSearch = () => {
  emit('search', {
    tabType: activeSubTab.value,
    searchField: searchField.value,
    searchKeyword: searchKeyword.value,
    purposeCds: [...appliedFilters.purposeCds],
    actionCds: [...appliedFilters.actionCds],
    urgencyCds: [...appliedFilters.urgencyCds],
    importanceCds: [...appliedFilters.importanceCds],
    categoryCds: [...appliedFilters.categoryCds],
    pageNum: 1,
    pageSize: 50,
  })
}

// ─── 날짜 헬퍼 ────────────────────────────────────────────
const isToday = (dateStr: string | null) => {
  if (!dateStr) return false
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

const formatDue = (dateStr: string | null) => {
  if (!dateStr) return '기한 없음'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '기한 없음'
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const getInitial = (name: string) => (name ? name.trim().charAt(0).toUpperCase() : '?')

const AVATAR_COLORS = ['#3c69db', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0]
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

// ─── 외부에서 서브탭 변경 가능하도록 expose ───────────────
const setSubTab = (tab: 'all' | 'action' | 'reply') => {
  activeSubTab.value = tab
}

defineExpose({ setSubTab })
</script>
