<template>
  <div class="my-documents-index">
    <!-- 신규 문서 안내 — 시스템 헤더 바로 아래 전폭 -->
    <Transition name="banner-slide-up">
      <div
        v-if="hasNewDocs && !isNewBannerDismissed && listFilter === 'saved'"
        class="my-doc-new-banner"
      >
        <i class="icon-notification size-16" />
        <span class="my-doc-new-banner__text">
          새로 저장된 문서가 {{ newDocCount }}개 있어요. 지식창고에서 만든 AI 보고서를 확인해 보세요.
        </span>
        <button
          class="my-doc-new-banner__close"
          title="닫기"
          @click="isNewBannerDismissed = true"
        >
          <i class="icon-close size-12" />
        </button>
      </div>
    </Transition>

    <div class="my-doc-body l-center">
      <!-- 헤더 -->
      <div class="my-doc-header">
        <p class="my-doc-top-title">내 문서 보관함</p>
        <div class="my-doc-header-right">
          <p class="my-doc-total">
            총 <strong>{{ displayDocList.length }}개</strong>
          </p>
          <div class="my-doc-search">
            <UiInput
              v-model="searchKeyword"
              type="search"
              placeholder="문서명 검색"
              @keyup.enter="onSearch"
              @search="onSearch"
            />
          </div>
          <div class="my-doc-sort">
            <UiSelect
              id="my-doc-sort"
              v-model="searchSort"
              name="my-doc-sort"
              :options="sortOptions"
              size="md"
              @update:model-value="onFetchList"
            />
          </div>
        </div>
      </div>

      <!-- 카드 그리드 -->
      <div class="my-doc-grid">
        <article
          v-for="doc in displayDocList"
          :key="doc.docId"
          class="my-doc-card"
          :class="{
            'is-active': selectedDocId === doc.docId,
            'is-archived': doc.docStatus === 'ARCHIVED',
          }"
          @click="onOpenDoc(doc)"
        >
          <div
            class="my-doc-card-doc"
            :class="{ 'is-default': !getMyDocDocAreaStyle(doc) }"
            :style="getMyDocDocAreaStyle(doc)"
          >
            <i class="icon icon-document size-48" />
          </div>

          <div class="my-doc-card-main">
            <div class="my-doc-card-head">
              <h3 class="my-doc-card-title">{{ doc.docNm }}</h3>
              <div @click.stop>
                <UiDropdownMenu
                  :items="getDocMenuItems(doc)"
                  align="end"
                  @select="onDocMenuSelect(doc, $event)"
                >
                  <template #trigger>
                    <UiButton
                      icon-only
                      variant="ghost"
                      size="md"
                    >
                      <template #icon-left>
                        <i class="icon icon-add-dot size-20" />
                      </template>
                    </UiButton>
                  </template>
                </UiDropdownMenu>
              </div>
            </div>

            <div class="my-doc-card-footer">
              <span
                v-if="doc.newYn === 'Y' && doc.docStatus === 'SAVED'"
                class="my-doc-card-new-tag"
                >NEW</span
              >
              <p class="my-doc-card-date">
                {{ formatDateTimeDisplay(doc.modifyDt || doc.createDt) }}
              </p>
              <span
                class="my-doc-card-agent-wrap"
                @click.stop
              >
                <UiTooltip
                  :content="getMyDocAgentLabel(doc)"
                  side="top"
                  align="end"
                  :side-offset="8"
                  content-class="my-doc-agent-tooltip"
                >
                  <span class="my-doc-card-agent">
                    <i :class="['icon', getMyDocAgentIconClass(doc), 'size-14']" />
                  </span>
                </UiTooltip>
              </span>
            </div>
          </div>
        </article>

        <div
          v-if="displayDocList.length === 0"
          class="my-doc-grid-empty"
        >
          <UiEmpty
            :icon="listFilter === 'archived' ? 'icon-archive' : 'icon-document'"
            :title="emptyTitle"
            :description="emptyDescription"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { useMyDocStore } from '~/composables/my-documents/useMyDocStore'
import type { MyDoc, MyDocListRequest } from '~/types/mydoc'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'

definePageMeta({ layout: 'default' })

type ListFilter = 'saved' | 'archived'

const { docList, archivedDocList, handleSelectMyDocList } = useMyDocStore()

const searchKeyword = ref('')
const appliedKeyword = ref('')
const searchSort = ref('latest')
const listFilter = ref<ListFilter>('saved')
const selectedDocId = ref<string | null>(null)
const isNewBannerDismissed = ref(false)

const sortOptions = [
  { label: '최신순', value: 'latest' },
  { label: '오래된순', value: 'oldest' },
  { label: '이름순', value: 'name' },
]

const displayDocList = computed(() => (listFilter.value === 'archived' ? archivedDocList.value : docList.value))

const archivedCount = computed(() => archivedDocList.value.length)

const newDocCount = computed(() => docList.value.filter((d) => d.newYn === 'Y').length)

const hasNewDocs = computed(() => newDocCount.value > 0)

const emptyTitle = computed(() => {
  if (listFilter.value === 'archived') return '보관된 문서가 없습니다.'
  if (appliedKeyword.value.trim()) return '검색 결과가 없습니다.'
  return '저장된 문서가 없습니다.'
})

const emptyDescription = computed(() => {
  if (listFilter.value === 'archived') return '보관한 문서는 여기에서 다시 꺼낼 수 있어요.'
  if (appliedKeyword.value.trim()) return '다른 검색어로 시도해 보세요.'
  return '지식창고에서 AI 보고서를 만들고 「내 문서에 저장」하면 이곳에 모여요.'
})

const getListFetchParams = (): MyDocListRequest => ({
  searchDocNm: appliedKeyword.value,
  docStatus: listFilter.value === 'archived' ? 'ARCHIVED' : 'SAVED',
  svcTy: '',
  searchSort: searchSort.value,
})

const onFetchList = async () => {
  await handleSelectMyDocList(getListFetchParams())
}

const onSearch = () => {
  appliedKeyword.value = searchKeyword.value
  onFetchList()
}

const onToggleArchiveView = async () => {
  listFilter.value = listFilter.value === 'saved' ? 'archived' : 'saved'
  selectedDocId.value = null
  await onFetchList()
}

const getDocMenuItems = (doc: MyDoc): DropdownMenuItemDef[] => {
  const items: DropdownMenuItemDef[] = [
    { label: '열기', icon: 'icon-document', value: 'open' },
    { label: '이름 변경', icon: 'icon-edit', value: 'rename' },
  ]
  if (doc.docStatus === 'SAVED') {
    items.push({ label: '보관', icon: 'icon-archive', value: 'archive' })
  } else {
    items.push({ label: '보관 해제', icon: 'icon-archive', value: 'restore' })
  }
  items.push({ label: '삭제', icon: 'icon-delete', value: 'delete', color: 'danger' })
  return items
}

const onOpenDoc = (doc: MyDoc) => {
  selectedDocId.value = doc.docId
  openToast({ message: '개발 예정입니다.', type: 'warning' })
}

/** 기본대화(svcTy C) — UiBadge basic-chat 테마 (API colorHex 없을 때) */
const BASIC_CHAT_THEME_HEX = '#ac5e00'

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return '100, 116, 139'
  return `${Number.parseInt(h.slice(0, 2), 16)}, ${Number.parseInt(h.slice(2, 4), 16)}, ${Number.parseInt(h.slice(4, 6), 16)}`
}

const resolveMyDocThemeHex = (doc: MyDoc): string => {
  const raw = doc.colorHex?.trim()
  if (raw) return raw.startsWith('#') ? raw : `#${raw}`
  if (doc.svcTy === 'C') return BASIC_CHAT_THEME_HEX
  return ''
}

/** 왼쪽 문서 아이콘 영역 — 에이전트 colorHex 배경 (채팅 index 카드와 동일 CSS 변수) */
const getMyDocDocAreaStyle = (doc: MyDoc): Record<string, string> | undefined => {
  const colorHex = resolveMyDocThemeHex(doc)
  if (!colorHex) return undefined
  return {
    '--card-icon-color': colorHex,
    '--card-icon-bg': `rgba(${hexToRgb(colorHex)}, 0.12)`,
  }
}

/** 에이전트 아이콘 hover 툴팁 라벨 */
const getMyDocAgentLabel = (doc: MyDoc): string => {
  if (doc.agentNm?.trim()) return doc.agentNm.trim()
  if (doc.svcTy === 'C') return '기본대화'
  if (doc.svcTy === 'S') return '데이터분석'
  if (doc.agentId?.trim()) return doc.agentId.trim()
  return '에이전트'
}

/** 우측 에이전트 아이콘 — API iconClassNm (없으면 기본, C는 기본대화 아이콘) */
const getMyDocAgentIconClass = (doc: MyDoc): string => {
  const icon = doc.iconClassNm?.trim()
  if (icon) return icon
  if (doc.svcTy === 'C') return 'icon-comment-other'
  return 'icon-search'
}

const onDocMenuSelect = (doc: MyDoc, action: string) => {
  if (action === 'open') {
    onOpenDoc(doc)
    return
  }
  openToast({ message: `「${doc.docNm}」 ${action} — API 연동 예정입니다.`, type: 'info' })
}

onMounted(() => {
  onFetchList()
})
</script>
