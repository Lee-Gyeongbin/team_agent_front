<template>
  <section
    ref="rootRef"
    class="chat-marketing-authoring-result"
    :class="{
      'is-loading': isLoading,
      'is-complete': !isLoading,
      'is-both-mode': isBothMode,
    }"
    :style="themeStyle"
  >
    <header class="chat-marketing-authoring-result__header">
      <div class="chat-marketing-authoring-result__title-row">
        <span
          v-if="!isLoading"
          class="chat-marketing-authoring-result__status-icon"
        >
          <i class="icon-check size-16" />
        </span>
        <div class="chat-marketing-authoring-result__header-copy">
          <h3 class="chat-marketing-authoring-result__title">
            {{ headerTitle }}
          </h3>
          <p class="chat-marketing-authoring-result__subtitle">{{ result.summary }}</p>
        </div>
      </div>
    </header>

    <div
      v-if="metaItems.length"
      class="chat-marketing-authoring-result__meta"
    >
      <div
        class="chat-marketing-authoring-result__meta-items"
        :class="{ 'is-collapsed': !isMetaOpen && !showAside }"
      >
        <div
          v-for="item in metaItems"
          :key="item.label"
          class="chat-marketing-authoring-result__meta-chip"
          :title="`${item.label}: ${item.value}`"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <button
        v-if="!showAside"
        type="button"
        class="chat-marketing-authoring-result__meta-toggle"
        :class="{ 'is-open': isMetaOpen }"
        :aria-expanded="isMetaOpen"
        :title="isMetaOpen ? '작성 조건 접기' : '작성 조건 펼치기'"
        @click="toggleMeta"
      >
        <i class="icon-chevron-down size-16" />
      </button>
    </div>

    <div
      v-if="!isLoading && draftTabs.length"
      class="chat-marketing-authoring-result__tabs"
    >
      <button
        v-for="tab in draftTabs"
        :key="tab.key"
        type="button"
        class="chat-marketing-authoring-result__tab"
        :class="{ 'is-active': tab.isActive }"
        @click="onSelectDraftTab(tab.key)"
      >
        {{ tab.title }}
        <span
          v-if="tab.subLabel"
          class="chat-marketing-authoring-result__tab-label"
        >
          {{ tab.subLabel }}
        </span>
        <em v-if="tab.recommended">추천</em>
      </button>
    </div>

    <div class="chat-marketing-authoring-result__body">
      <div class="chat-marketing-authoring-result__main">
        <div
          v-if="isLoading"
          class="chat-marketing-authoring-result__draft chat-marketing-authoring-result__draft--loading"
        >
          <MarketingPreparingStatus
            :mode="isBothMode ? 'BOTH' : isImageMode ? 'IMAGE' : 'TEXT'"
            :active="isLoading"
            :bordered="false"
          />
        </div>

        <div
          v-else-if="hasDraftContent"
          class="chat-marketing-authoring-result__draft"
        >
          <div class="chat-marketing-authoring-result__draft-toolbar">
            <p
              class="chat-marketing-authoring-result__draft-subject"
              :title="keyMessage || undefined"
            >
              {{ keyMessage ? `주제 : ${keyMessage}` : '주제' }}
            </p>
            <div
              v-if="!isShare"
              class="chat-marketing-authoring-result__draft-actions"
            >
              <template v-if="!isImageResult">
                <button
                  type="button"
                  :class="{ 'is-active': isEditing }"
                  title="생성된 문구를 직접 편집합니다"
                  @click="toggleEdit"
                >
                  <i class="icon-edit size-16" />
                  {{ isEditing ? '직접 수정 완료' : '내용 직접 수정' }}
                </button>
                <button
                  type="button"
                  @click="onCopy"
                >
                  <i class="icon-copy size-16" />
                  복사
                </button>
              </template>
              <div class="chat-marketing-authoring-result__draft-download">
                <button
                  type="button"
                  :class="{ 'is-active': isDownloadOpen }"
                  title="현재 시안을 파일로 저장합니다"
                  @click="onToggleDownload"
                >
                  <i class="icon-download size-16" />
                  다운로드
                  <i
                    class="size-12"
                    :class="isDownloadOpen ? 'icon-chevron-down' : 'icon-chevron-right-sm'"
                  />
                </button>
                <div
                  v-if="isDownloadOpen"
                  class="chat-marketing-authoring-result__draft-download-menu"
                >
                  <template v-if="isImageResult">
                    <button
                      type="button"
                      @click="downloadImage"
                    >
                      <i class="icon-download size-16" />
                      이미지 저장
                    </button>
                  </template>
                  <template v-else>
                    <button
                      type="button"
                      @click="onDownloadTxt"
                    >
                      <i class="icon-file-txt size-16" />
                      TXT
                    </button>
                    <button
                      type="button"
                      title="현재 시안을 DOCX 파일로 저장합니다"
                      @click="onDownloadDocx"
                    >
                      <i class="icon-file-doc size-16" />
                      DOCX
                    </button>
                    <button
                      type="button"
                      title="현재 시안을 PDF로 저장합니다"
                      @click="onDownloadPdf"
                    >
                      <i class="icon-file-pdf size-16" />
                      PDF
                    </button>
                    <button
                      v-if="isBothMode && pairedImageUrl"
                      type="button"
                      @click="downloadImage"
                    >
                      <i class="icon-download size-16" />
                      이미지 저장
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-marketing-authoring-result__draft-scroll">
            <div class="chat-marketing-authoring-result__draft-body">
              <template v-if="isImageResult">
                <div class="chat-marketing-authoring-result__image">
                  <img
                    :src="activeImageUrl"
                    alt="생성된 마케팅 이미지"
                  />
                </div>
              </template>
              <template v-else>
                <UiTextarea
                  v-if="isEditing"
                  v-model="editDraft"
                  :auto-resize="true"
                  :max-rows="0"
                  :border="true"
                  class="chat-marketing-authoring-result__editor"
                />
                <!-- eslint-disable vue/no-v-html — escapeHtml 처리 후 해시태그/줄바꿈 태그만 주입 -->
                <div
                  v-else
                  class="chat-marketing-authoring-result__content"
                  v-html="renderedContent"
                />
                <!-- eslint-enable vue/no-v-html -->

                <!-- BOTH: 문구 바로 아래 페어링 이미지 -->
                <section
                  v-if="isBothMode && pairedImageUrl"
                  class="chat-marketing-authoring-result__image-stack"
                >
                  <div class="chat-marketing-authoring-result__image">
                    <img
                      :src="pairedImageUrl"
                      :alt="`시안 ${activePairIndex + 1} 마케팅 이미지`"
                    />
                  </div>
                </section>
              </template>
            </div>
          </div>

          <div
            v-if="!isImageResult"
            class="chat-marketing-authoring-result__draft-foot"
          >
            <p class="chat-marketing-authoring-result__char-count">
              {{ draftFootLabel }}
            </p>
          </div>
        </div>
      </div>

      <aside
        v-if="showAside && !isShare && (isLoading || !isImageMode || isImageResult)"
        class="chat-marketing-authoring-result__aside"
        :class="{ 'is-preparing': isLoading }"
      >
        <section class="chat-marketing-authoring-result__aside-card">
          <div class="chat-marketing-authoring-result__refine-head">
            <div class="chat-marketing-authoring-result__refine-title-row">
              <strong class="chat-marketing-authoring-result__refine-title">AI와 대화하여 내용 보완</strong>
              <span
                v-if="!isLoading && refineActiveVariantMeta"
                class="chat-marketing-authoring-result__refine-variant"
                :title="refineActiveVariantMeta"
              >
                {{ refineActiveVariantMeta }}
              </span>
              <span
                v-else-if="isLoading"
                class="chat-marketing-authoring-result__refine-variant is-preparing"
              >
                준비 중
              </span>
            </div>
            <p class="chat-marketing-authoring-result__refine-lead">
              {{
                isLoading
                  ? '콘텐츠 생성이 완료되면 시안을 기준으로 Agent와 대화할 수 있습니다'
                  : isImageMode
                    ? '현재 이미지 시안을 기준으로 Agent와 대화하며 내용을 보완할 수 있습니다'
                    : isBothMode
                      ? '현재 시안(문구+이미지)을 기준으로 Agent와 대화하며 내용을 보완할 수 있습니다'
                      : '현재 시안을 기준으로 Agent와 대화하며 내용을 보완할 수 있습니다'
              }}
            </p>
          </div>

          <div
            ref="refineChatListRef"
            class="chat-marketing-authoring-result__refine-chat"
            aria-label="보완 요청 대화 기록"
          >
            <p
              v-if="isLoading"
              class="chat-marketing-authoring-result__refine-chat-empty is-preparing"
            >
              <strong>Agent 준비 중</strong>
              <span>선택한 조건으로 시안을 구성하고 있어요. 잠시만 기다려 주세요.</span>
            </p>
            <p
              v-else-if="refineChatLog.length === 0"
              class="chat-marketing-authoring-result__refine-chat-empty"
            >
              <strong>시안 보완 요청 내역이 없습니다.</strong>
              <span>아이디어를 제안하면 더 완성도 높은 콘텐츠를 함께 만들어드릴게요.</span>
            </p>
            <ul
              v-else
              class="chat-marketing-authoring-result__refine-chat-list"
            >
              <li
                v-for="entry in refineChatLog"
                :key="entry.id"
                class="chat-marketing-authoring-result__refine-chat-item"
                :class="entry.role === 'user' ? 'role-user' : 'role-assistant'"
              >
                <i
                  v-if="entry.role === 'assistant'"
                  class="chat-marketing-authoring-result__refine-avatar icon-bot size-20"
                />
                <div class="chat-marketing-authoring-result__refine-message">
                  <p class="chat-marketing-authoring-result__refine-bubble">
                    {{ entry.text }}
                  </p>
                  <span
                    v-if="entry.role === 'user'"
                    class="chat-marketing-authoring-result__refine-time"
                  >
                    {{ entry.timeLabel }}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div class="chat-marketing-authoring-result__refine-chat-bar-wrap">
            <form
              class="chat-marketing-authoring-result__refine-chat-bar"
              :class="{ 'is-active': !isLoading && !!refineDraft.trim(), 'is-disabled': isLoading }"
              @submit.prevent="onSendRefine"
            >
              <i
                v-show="!refineDraft.trim()"
                class="icon-sparkle size-20"
                aria-hidden="true"
              />
              <input
                v-model="refineDraft"
                type="text"
                class="chat-marketing-authoring-result__refine-chat-input"
                autocomplete="off"
                :spellcheck="false"
                :disabled="isLoading"
                :placeholder="
                  isLoading
                    ? '시안 생성 후 보완 요청을 입력할 수 있어요'
                    : isImageMode
                      ? '예: 배경을 더 밝게, 문구를 짧게 바꿔주세요'
                      : '예: 첫 문장을 더 임팩트 있게 보완해주세요'
                "
              />
              <button
                type="submit"
                class="chat-marketing-authoring-result__refine-chat-send"
                :disabled="isLoading || !refineDraft.trim()"
              >
                전송
              </button>
            </form>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
import { formatNumberWithComma } from '~/utils/global/numberUtil'
import type { MarketingAuthoringResult } from '~/types/chat'
import { resolveMarketingAgentThemeStyle } from '~/utils/chat/marketingAuthoringUtil'
import { downloadReportAsDocx, downloadReportAsPdf } from '~/utils/chat/reportExportUtil'

const props = withDefaults(
  defineProps<{
    result: MarketingAuthoringResult
    isShare?: boolean
    themeColorHex?: string
    /** 이미지 생성 응답 대기 — 카드 셸 유지 + 본문 스피너 */
    isLoading?: boolean
    /** /marketing 결과 — 우측 패널 노출 */
    showSidePanel?: boolean
  }>(),
  {
    isShare: false,
    themeColorHex: '',
    isLoading: false,
    showSidePanel: false,
  },
)

const emit = defineEmits<{
  editWithAgent: [payload: { variantId: number; content: string; request: string }]
}>()

const themeStyle = computed(() => resolveMarketingAgentThemeStyle(props.themeColorHex))
const showAside = computed(() => props.showSidePanel === true)

const imageDataUrls = computed(() => props.result.imageDataUrls ?? [])
const hasTextVariants = computed(() => (props.result.variants?.length ?? 0) > 0)
const hasImages = computed(() => imageDataUrls.value.length > 0)
/** BOTH 또는 문구+이미지가 함께 있는 결과 */
const isBothMode = computed(() => props.result.mode === 'BOTH' || (hasTextVariants.value && hasImages.value))
const isImageMode = computed(() => props.result.mode === 'IMAGE' && !isBothMode.value)
const isImageOnlyResult = computed(() => isImageMode.value && hasImages.value)
/** IMAGE 전용 결과 — BOTH는 문구 아래 이미지 스택 */
const isImageResult = computed(() => isImageOnlyResult.value)

const headerTitle = computed(() => {
  if (props.isLoading) {
    if (isBothMode.value) return '콘텐츠를 생성하고 있습니다'
    return isImageMode.value ? '마케팅 이미지를 생성하고 있습니다' : '콘텐츠를 생성하고 있습니다'
  }
  if (isBothMode.value) return '콘텐츠 생성이 완료되었습니다!'
  return isImageOnlyResult.value ? '마케팅 이미지 생성이 완료되었습니다!' : '콘텐츠 생성이 완료되었습니다!'
})

const activeImageIndex = ref(0)
const activeImageUrl = computed(() => imageDataUrls.value[activeImageIndex.value] ?? imageDataUrls.value[0] ?? '')

/** BOTH — 시안 인덱스(문구 N + 이미지 N 페어링) */
const resolveInitialPairIndex = () => {
  const variants = props.result.variants
  const recommendedIdx = variants.findIndex((item) => item.recommended)
  if (recommendedIdx >= 0) return recommendedIdx
  return 0
}
const activePairIndex = ref(resolveInitialPairIndex())

const pairedImageUrl = computed(() => {
  if (!isBothMode.value) return ''
  return imageDataUrls.value[activePairIndex.value] ?? ''
})

watch(imageDataUrls, (urls) => {
  if (activeImageIndex.value >= urls.length) activeImageIndex.value = Math.max(0, urls.length - 1)
  if (isBothMode.value && activePairIndex.value >= Math.max(props.result.variants.length, urls.length)) {
    activePairIndex.value = 0
  }
})

const activeVariantId = ref(props.result.variants.find((item) => item.recommended)?.id ?? props.result.variants[0]?.id)
const isEditing = ref(false)
const isDownloadOpen = ref(false)
const editDraft = ref('')
const editedContents = ref<Record<number, string>>({})

type RefineChatRole = 'user' | 'assistant'
interface RefineChatEntry {
  id: string
  role: RefineChatRole
  text: string
  createdAt: number
  timeLabel: string
}

interface DraftTab {
  key: string
  title: string
  subLabel?: string
  recommended: boolean
  isActive: boolean
}

const refineDraft = ref('')
const refineChatLog = ref<RefineChatEntry[]>([])
const refineChatListRef = ref<HTMLElement | null>(null)
let refineChatIdSeq = 0

const nextRefineChatId = () => {
  refineChatIdSeq += 1
  return `marketing-refine-${refineChatIdSeq}`
}

const toRefineTimeLabel = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

const scrollRefineChatToBottom = () => {
  nextTick(() => {
    const el = refineChatListRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  })
}

const resetRefineChat = () => {
  refineDraft.value = ''
  refineChatLog.value = []
  refineChatIdSeq = 0
}

const resetDraftChrome = () => {
  isDownloadOpen.value = false
  resetRefineChat()
}

watch(
  () => props.result.variants,
  (variants) => {
    const preferred = variants.find((item) => item.recommended)?.id ?? variants[0]?.id
    if (preferred && !variants.some((item) => item.id === activeVariantId.value)) {
      activeVariantId.value = preferred
    }
    if (isBothMode.value) {
      const idx = variants.findIndex((item) => item.id === activeVariantId.value)
      activePairIndex.value = idx >= 0 ? idx : 0
      activeImageIndex.value = activePairIndex.value
    }
  },
  { deep: true },
)

const activeVariant = computed(() => {
  if (isBothMode.value) {
    return props.result.variants[activePairIndex.value] ?? null
  }
  return props.result.variants.find((item) => item.id === activeVariantId.value) ?? null
})
const hasDraftContent = computed(() => {
  if (isImageResult.value) return !!activeImageUrl.value
  if (isBothMode.value) return !!activeVariant.value || !!pairedImageUrl.value
  return !!activeVariant.value
})

const activeContent = computed(() => {
  if (!activeVariant.value) return ''
  return editedContents.value[activeVariant.value.id] ?? activeVariant.value.content
})

/** 편집 중이면 입력값, 아니면 확정 본문 기준 글자 수 */
const displayContentForCount = computed(() => (isEditing.value ? editDraft.value : activeContent.value))
const charCount = computed(() => [...displayContentForCount.value].length)
const formattedCharCount = computed(() => formatNumberWithComma(charCount.value) || '0')

const bothPairCount = computed(() =>
  Math.max(props.result.variants.length, isBothMode.value ? imageDataUrls.value.length : 0),
)

const draftTabs = computed<DraftTab[]>(() => {
  if (isImageMode.value) {
    return imageDataUrls.value.map((_, index) => ({
      key: `image-${index}`,
      title: `시안 ${index + 1} · 이미지`,
      recommended: index === 0,
      isActive: index === activeImageIndex.value,
    }))
  }

  if (isBothMode.value) {
    return Array.from({ length: bothPairCount.value }, (_, index) => {
      const variant = props.result.variants[index]
      const hasRecommended = props.result.variants.some((item) => item.recommended)
      return {
        key: `both-${index}`,
        title: `시안 ${index + 1}`,
        subLabel: String(variant?.label ?? '').trim() || undefined,
        recommended: !!variant?.recommended || (!hasRecommended && index === 0),
        isActive: index === activePairIndex.value,
      }
    })
  }

  return props.result.variants.map((variant) => ({
    key: `text-${variant.id}`,
    title: `시안 ${variant.id}`,
    subLabel: String(variant.label ?? '').trim() || undefined,
    recommended: !!variant.recommended,
    isActive: variant.id === activeVariantId.value,
  }))
})

const draftFootLabel = computed(() => `글자 수 ${formattedCharCount.value}자`)

const metaItems = computed(() => {
  const conditions = props.result.conditions
  const imageConditions = props.result.imageConditions
  const rows = isBothMode.value
    ? [
        { label: '콘텐츠 유형', value: conditions.contentType },
        { label: '채널', value: conditions.channel },
        { label: '작성 목적', value: conditions.purpose },
        { label: '대상 독자', value: conditions.audience },
        { label: '톤앤매너', value: conditions.tones },
        { label: '분량', value: conditions.length },
        { label: '이미지 스타일', value: imageConditions?.contentType },
        { label: '이미지 분위기', value: imageConditions?.tones },
        { label: '화면 비율', value: imageConditions?.length },
      ]
    : isImageMode.value
      ? [
          { label: '표현 방식', value: conditions.contentType },
          { label: '채널', value: conditions.channel },
          { label: '제작 목적', value: conditions.purpose },
          { label: '대상 고객', value: conditions.audience },
          { label: '톤앤매너', value: conditions.tones },
          { label: '화면 비율', value: conditions.length },
        ]
      : [
          { label: '콘텐츠 유형', value: conditions.contentType },
          { label: '채널', value: conditions.channel },
          { label: '작성 목적', value: conditions.purpose },
          { label: '대상 독자', value: conditions.audience },
          { label: '톤앤매너', value: conditions.tones },
          { label: '분량', value: conditions.length },
        ]

  return rows
    .map((item) => ({ label: item.label, value: String(item.value ?? '').trim() }))
    .filter((item) => !!item.value)
})

const keyMessage = computed(() => props.result.conditions.keyMessage?.trim() ?? '')

/** AI 보완 패널 — 현재 선택된 시안 표시 (시안 2 · 사용감집중) */
const refineActiveVariantMeta = computed(() => {
  if (isImageResult.value) {
    return `시안 ${activeImageIndex.value + 1} · 이미지`
  }
  if (isBothMode.value) {
    const variant = activeVariant.value
    const label = String(variant?.label ?? '').trim()
    const base = label ? `시안 ${activePairIndex.value + 1} · ${label}` : `시안 ${activePairIndex.value + 1}`
    return pairedImageUrl.value ? `${base} · 통합` : base
  }
  const variant = activeVariant.value
  if (!variant) return ''
  const label = String(variant.label ?? '').trim()
  return label ? `시안 ${variant.id} · ${label}` : `시안 ${variant.id}`
})

const isMetaOpen = ref(true)
const toggleMeta = () => {
  isMetaOpen.value = !isMetaOpen.value
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderedContent = computed(() => {
  const escaped = escapeHtml(activeContent.value)
  return escaped
    .replace(/(^|\s)(#[\p{L}\p{N}\p{M}_]+)/gu, '$1<span class="is-hashtag">$2</span>')
    .replace(/\n{2,}/g, '<br /><br />')
    .replace(/\n/g, '<br />')
})

const rootRef = ref<HTMLElement | null>(null)

/** 시안 이동 시 결과 상단(헤더·탭)으로 스크롤 + 본문 스크롤 초기화 */
const scrollResultToTop = () => {
  nextTick(() => {
    const root = rootRef.value
    if (!root) return

    const scrollSmoothTo = (el: HTMLElement, top: number) => {
      el.scrollTo({ top, behavior: 'smooth' })
    }

    root
      .querySelectorAll<HTMLElement>(
        '.chat-marketing-authoring-result__draft-scroll, .chat-marketing-authoring-result__draft-body, .chat-marketing-authoring-result__content',
      )
      .forEach((el) => scrollSmoothTo(el, 0))

    const scrollAnchor =
      root.querySelector<HTMLElement>('.chat-marketing-authoring-result__tabs') ??
      root.querySelector<HTMLElement>('.chat-marketing-authoring-result__header') ??
      root

    const layoutContent = root.closest('.content') as HTMLElement | null
    if (layoutContent) {
      const top =
        scrollAnchor.getBoundingClientRect().top - layoutContent.getBoundingClientRect().top + layoutContent.scrollTop
      scrollSmoothTo(layoutContent, Math.max(0, top))
      return
    }

    const chatList = root.closest('.chat-message-list') as HTMLElement | null
    if (chatList) {
      const top = scrollAnchor.getBoundingClientRect().top - chatList.getBoundingClientRect().top + chatList.scrollTop
      scrollSmoothTo(chatList, Math.max(0, top))
      return
    }

    scrollAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const selectImage = (index: number) => {
  if (index < 0 || index >= imageDataUrls.value.length) return
  activeImageIndex.value = index
  if (isImageMode.value) {
    resetDraftChrome()
    scrollResultToTop()
  }
}

/** BOTH 시안 탭 — 문구·이미지를 같은 인덱스로 묶음 */
const selectBothPair = (index: number) => {
  if (index < 0 || index >= bothPairCount.value) return
  isEditing.value = false
  editDraft.value = ''
  resetDraftChrome()
  activePairIndex.value = index
  const variant = props.result.variants[index]
  if (variant) activeVariantId.value = variant.id
  if (index < imageDataUrls.value.length) activeImageIndex.value = index
  scrollResultToTop()
}

const selectVariant = (variantId: number) => {
  isEditing.value = false
  editDraft.value = ''
  resetDraftChrome()
  activeVariantId.value = variantId
  if (isBothMode.value) {
    const idx = props.result.variants.findIndex((item) => item.id === variantId)
    if (idx >= 0) {
      activePairIndex.value = idx
      if (idx < imageDataUrls.value.length) activeImageIndex.value = idx
    }
  }
  scrollResultToTop()
}

const onSelectDraftTab = (key: string) => {
  if (key.startsWith('image-')) {
    selectImage(Number(key.slice('image-'.length)))
    return
  }
  if (key.startsWith('both-')) {
    selectBothPair(Number(key.slice('both-'.length)))
    return
  }
  if (key.startsWith('text-')) {
    selectVariant(Number(key.slice('text-'.length)))
  }
}

const onSendRefine = () => {
  if (props.isLoading) return
  const request = refineDraft.value.trim()
  if (!request) return

  const content = isImageResult.value
    ? [
        `[이미지 시안 ${activeImageIndex.value + 1}]`,
        keyMessage.value ? `주제: ${keyMessage.value}` : '',
        '현재 선택된 이미지 시안을 기준으로 수정해 주세요.',
      ]
        .filter(Boolean)
        .join('\n')
    : isBothMode.value
      ? [
          `[통합 시안 ${activePairIndex.value + 1}]`,
          (isEditing.value ? editDraft.value : activeContent.value).trim(),
          pairedImageUrl.value ? '(현재 시안에 페어링된 이미지가 함께 있습니다)' : '',
        ]
          .filter(Boolean)
          .join('\n')
      : (isEditing.value ? editDraft.value : activeContent.value).trim()

  if (!content) {
    openToast({ message: '수정할 시안 내용이 없습니다.', type: 'warning' })
    return
  }

  const createdAt = Date.now()
  const timeLabel = toRefineTimeLabel(createdAt)
  refineChatLog.value.push({
    id: nextRefineChatId(),
    role: 'user',
    text: request,
    createdAt,
    timeLabel,
  })
  refineDraft.value = ''
  scrollRefineChatToBottom()

  emit('editWithAgent', {
    variantId: isImageResult.value
      ? activeImageIndex.value + 1
      : isBothMode.value
        ? activePairIndex.value + 1
        : (activeVariant.value?.id ?? 1),
    content,
    request,
  })

  refineChatLog.value.push({
    id: nextRefineChatId(),
    role: 'assistant',
    text: '시안 수정 요청을 확인했습니다.',
    createdAt: Date.now(),
    timeLabel: toRefineTimeLabel(Date.now()),
  })
  scrollRefineChatToBottom()
}

const onToggleDownload = () => {
  isDownloadOpen.value = !isDownloadOpen.value
}

const toggleEdit = () => {
  if (!activeVariant.value) return
  if (isEditing.value) {
    editedContents.value = {
      ...editedContents.value,
      [activeVariant.value.id]: editDraft.value,
    }
    isEditing.value = false
    openToast({ message: '시안 수정 내용을 반영했습니다.' })
    return
  }
  isDownloadOpen.value = false
  editDraft.value = activeContent.value
  isEditing.value = true
}

const onCopy = async () => {
  try {
    await copyToClipboard(isEditing.value ? editDraft.value : activeContent.value)
    openToast({ message: '시안을 클립보드에 복사했습니다.' })
  } catch {
    openToast({ message: '복사에 실패했습니다.', type: 'error' })
  }
}

const getActiveExportContent = () => (isEditing.value ? editDraft.value : activeContent.value).trim()

const buildExportFileName = () =>
  `marketing-content-${isBothMode.value ? activePairIndex.value + 1 : (activeVariant.value?.id ?? 1)}`

const buildExportHtml = (content: string) =>
  `<div style="font-family:'Malgun Gothic',sans-serif;font-size:11pt;line-height:1.7;">${escapeHtml(content)
    .replace(/\n{2,}/g, '<br /><br />')
    .replace(/\n/g, '<br />')}</div>`

const onDownloadTxt = () => {
  const content = getActiveExportContent()
  if (!content) {
    openToast({ message: '저장할 내용이 없습니다.', type: 'warning' })
    return
  }
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${buildExportFileName()}-${Date.now()}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
  isDownloadOpen.value = false
  openToast({ message: 'TXT 파일로 저장했습니다.' })
}

const onDownloadDocx = async () => {
  const content = getActiveExportContent()
  if (!content) {
    openToast({ message: '저장할 내용이 없습니다.', type: 'warning' })
    return
  }
  try {
    await downloadReportAsDocx(buildExportHtml(content), buildExportFileName())
    isDownloadOpen.value = false
    openToast({ message: 'DOCX 파일로 저장했습니다.' })
  } catch {
    openToast({ message: 'DOCX 저장에 실패했습니다.', type: 'error' })
  }
}

const onDownloadPdf = async () => {
  const content = getActiveExportContent()
  if (!content) {
    openToast({ message: '저장할 내용이 없습니다.', type: 'warning' })
    return
  }
  try {
    await downloadReportAsPdf(buildExportHtml(content), buildExportFileName())
    isDownloadOpen.value = false
  } catch {
    openToast({ message: 'PDF 저장에 실패했습니다.', type: 'error' })
  }
}

const downloadImage = () => {
  const url = isBothMode.value ? pairedImageUrl.value : activeImageUrl.value
  if (!url) return
  const indexLabel = isBothMode.value ? activePairIndex.value + 1 : activeImageIndex.value + 1
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `marketing-image-${indexLabel}-${Date.now()}.png`
  anchor.click()
  isDownloadOpen.value = false
}
</script>
