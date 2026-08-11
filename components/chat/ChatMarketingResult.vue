<template>
  <section
    ref="rootRef"
    class="chat-marketing-authoring-result"
    :class="{
      'is-loading': isLoading,
      'is-complete': !isLoading,
      'is-both-mode': isBothMode,
    }"
    :style="resolveMarketingAgentThemeStyle(themeColorHex)"
  >
    <header class="chat-marketing-authoring-result__header">
      <div class="chat-marketing-authoring-result__title-row">
        <span
          v-if="!isLoading && !isRefining"
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
        :class="{ 'is-collapsed': !isMetaOpen && !showSidePanel }"
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
        v-if="!showSidePanel"
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
      v-if="draftTabs.length"
      class="chat-marketing-authoring-result__tabs"
    >
      <button
        v-for="tab in draftTabs"
        :key="tab.key"
        type="button"
        class="chat-marketing-authoring-result__tab"
        :class="{ 'is-active': tab.isActive }"
        @click="selectDraft(tab.id)"
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
          v-if="isLoading && !hasDraftContent"
          class="chat-marketing-authoring-result__draft chat-marketing-authoring-result__draft--loading"
        >
          <MarketingPreparingStatus
            :mode="isBothMode ? 'BOTH' : isImageMode ? 'IMAGE' : 'TEXT'"
            :generating-step="generatingStep"
            :active="isLoading"
            :bordered="false"
          />
        </div>

        <div
          v-else-if="hasDraftContent"
          class="chat-marketing-authoring-result__draft"
          :class="{ 'is-partial': isLoading }"
        >
          <div class="chat-marketing-authoring-result__draft-toolbar">
            <p
              class="chat-marketing-authoring-result__draft-subject"
              :title="draftTitle || undefined"
            >
              {{ draftTitle ? `제목 : ${draftTitle}` : '제목' }}
            </p>
            <div class="chat-marketing-authoring-result__draft-actions">
              <button
                v-if="!isImageMode"
                type="button"
                :class="{ 'is-active': isEditing }"
                :disabled="isRefiningActiveText || isSavingEdit"
                title="생성된 문구를 직접 편집합니다"
                @click="toggleEdit"
              >
                <i class="icon-edit size-16" />
                {{ isSavingEdit ? '저장 중...' : isEditing ? '직접 수정 완료' : '내용 직접 수정' }}
              </button>
              <button
                type="button"
                :disabled="isRefiningActiveText || isRefiningActiveImage"
                @click="onCopy"
              >
                <i class="icon-copy size-16" />
                복사
              </button>
              <button
                v-if="showChannelSend"
                type="button"
                :disabled="isEditing || isRefiningActiveText || isRefiningActiveImage || !draftText.trim()"
                title="선택한 시안을 채널로 보냅니다"
                @click="onOpenChannelSend"
              >
                <i class="icon-send size-16" />
                채널로 보내기
              </button>
            </div>
          </div>

          <div class="chat-marketing-authoring-result__draft-scroll">
            <div class="chat-marketing-authoring-result__draft-body">
              <template v-if="isImageMode">
                <section
                  v-if="activeImageUrl || isRefiningActiveImage"
                  class="chat-marketing-authoring-result__image-stack"
                  :class="{ 'is-refining': isRefiningActiveImage }"
                >
                  <button
                    v-if="activeImageUrl"
                    type="button"
                    class="chat-marketing-authoring-result__image is-clickable"
                    title="이미지 크게 보기"
                    :disabled="isRefiningActiveImage"
                    @click="onOpenImagePreview"
                  >
                    <img
                      :src="activeImageUrl"
                      alt="생성된 마케팅 이미지"
                    />
                  </button>
                  <div
                    v-if="isRefiningActiveImage"
                    class="chat-marketing-authoring-result__image-loading"
                    :class="{ 'is-overlay': !!activeImageUrl }"
                  >
                    <UiLoading :text="`${REFINE_COPY.IMAGE.progress}...`" />
                  </div>
                </section>
                <div
                  v-else-if="isLoading"
                  class="chat-marketing-authoring-result__image-loading"
                >
                  <UiLoading text="이미지를 생성하고 있습니다..." />
                </div>
                <p
                  v-else
                  class="chat-marketing-authoring-result__image-missing"
                >
                  이미지 생성 실패
                </p>
              </template>
              <template v-else>
                <div
                  class="chat-marketing-authoring-result__text-stack"
                  :class="{ 'is-refining': isRefiningActiveText }"
                >
                  <UiTextarea
                    v-if="isEditing"
                    v-model="editDraft"
                    :auto-resize="true"
                    :max-rows="0"
                    :border="true"
                    :disabled="isRefiningActiveText"
                    class="chat-marketing-authoring-result__editor"
                  />
                  <!-- eslint-disable vue/no-v-html -- 공용 유틸에서 이스케이프 후 허용된 태그만 생성 -->
                  <div
                    v-else
                    class="chat-marketing-authoring-result__content"
                    v-html="renderedContent"
                  />
                  <!-- eslint-enable vue/no-v-html -->
                  <div
                    v-if="isRefiningActiveText"
                    class="chat-marketing-authoring-result__text-loading"
                  >
                    <UiLoading :text="`${REFINE_COPY.TEXT.progress}...`" />
                  </div>
                </div>

                <section
                  v-if="isBothMode && (activeImageUrl || isRefiningActiveImage)"
                  class="chat-marketing-authoring-result__image-stack"
                  :class="{ 'is-refining': isRefiningActiveImage }"
                >
                  <button
                    v-if="activeImageUrl"
                    type="button"
                    class="chat-marketing-authoring-result__image is-clickable"
                    title="이미지 크게 보기"
                    :disabled="isRefiningActiveImage"
                    @click="onOpenImagePreview"
                  >
                    <img
                      :src="activeImageUrl"
                      :alt="`시안 ${activeVariantOrder} 마케팅 이미지`"
                    />
                  </button>
                  <div
                    v-if="isRefiningActiveImage"
                    class="chat-marketing-authoring-result__image-loading"
                    :class="{ 'is-overlay': !!activeImageUrl }"
                  >
                    <UiLoading :text="`${REFINE_COPY.IMAGE.progress}...`" />
                  </div>
                </section>
                <div
                  v-else-if="isBothMode && isLoading"
                  class="chat-marketing-authoring-result__image-loading"
                >
                  <UiLoading text="이미지를 생성하고 있습니다..." />
                </div>
                <p
                  v-else-if="isBothMode && !isLoading && !activeImageUrl"
                  class="chat-marketing-authoring-result__image-missing"
                >
                  이미지 생성 실패
                </p>
              </template>
            </div>
          </div>

          <div
            v-if="!isImageMode"
            class="chat-marketing-authoring-result__draft-foot"
          >
            <p class="chat-marketing-authoring-result__char-count">글자 수 {{ formattedCharCount }}자</p>
          </div>
        </div>
      </div>

      <aside
        v-if="showSidePanel"
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
            <div
              v-else-if="refineChatLog.length === 0"
              class="chat-marketing-authoring-result__refine-chat-empty"
            >
              <template v-if="isBothMode && !refineType">
                <strong>어떤 내용을 수정할까요?</strong>
                <span>수정할 항목을 선택하면 요청에 맞는 예시를 안내해 드려요.</span>
                <div class="chat-marketing-authoring-result__refine-type-cards">
                  <button
                    type="button"
                    class="chat-marketing-authoring-result__refine-type-card"
                    @click="selectRefineType('TEXT')"
                  >
                    <span>
                      <strong>{{ REFINE_COPY.TEXT.label }}</strong>
                      <small>문구·표현 보완</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    class="chat-marketing-authoring-result__refine-type-card"
                    @click="selectRefineType('IMAGE')"
                  >
                    <span>
                      <strong>{{ REFINE_COPY.IMAGE.label }}</strong>
                      <small>이미지 교체·편집</small>
                    </span>
                  </button>
                </div>
              </template>
              <template v-else>
                <strong>시안 보완 요청 내역이 없습니다.</strong>
                <span>아이디어를 제안하면 더 완성도 높은 콘텐츠를 함께 만들어드릴게요.</span>
              </template>
            </div>
            <ul
              v-else
              class="chat-marketing-authoring-result__refine-chat-list"
            >
              <li
                v-for="entry in refineChatLog"
                :key="entry.id"
                class="chat-marketing-authoring-result__refine-chat-item"
                :class="entry.role === 'assistant' ? 'role-assistant' : 'role-user'"
              >
                <i
                  v-if="entry.role === 'assistant'"
                  class="chat-marketing-authoring-result__refine-avatar icon-bot size-20"
                  aria-hidden="true"
                />
                <div class="chat-marketing-authoring-result__refine-message">
                  <span
                    v-if="entry.role === 'user'"
                    class="chat-marketing-authoring-result__refine-message-type"
                  >
                    {{ REFINE_COPY[entry.type].label }}
                  </span>
                  <p class="chat-marketing-authoring-result__refine-bubble">
                    {{ entry.text }}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div class="chat-marketing-authoring-result__refine-chat-bar-wrap">
            <div
              v-if="isBothMode && refineType"
              class="chat-marketing-authoring-result__refine-type-tabs"
              aria-label="수정 유형"
            >
              <button
                type="button"
                :class="{ 'is-active': refineType === 'TEXT' }"
                :disabled="isRefining"
                @click="selectRefineType('TEXT')"
              >
                <i
                  class="icon-edit size-14"
                  aria-hidden="true"
                />
                {{ REFINE_COPY.TEXT.label }}
              </button>
              <button
                type="button"
                :class="{ 'is-active': refineType === 'IMAGE' }"
                :disabled="isRefining"
                @click="selectRefineType('IMAGE')"
              >
                <i
                  class="icon-image size-14"
                  aria-hidden="true"
                />
                {{ REFINE_COPY.IMAGE.label }}
              </button>
            </div>
            <form
              class="chat-marketing-authoring-result__refine-chat-bar"
              :class="{
                'is-active': canSendRefine,
                'is-disabled': isLoading || isRefining || isEditing,
              }"
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
                :disabled="isLoading || isRefining || isEditing"
                :placeholder="refineInputPlaceholder"
              />
              <button
                type="submit"
                class="chat-marketing-authoring-result__refine-chat-send"
                :disabled="!canSendRefine"
              >
                전송
              </button>
            </form>
          </div>
        </section>
      </aside>
    </div>

    <MarketingChannelSendModal
      :is-open="isChannelSendOpen"
      :channel="resolvedChannel"
      :body="channelSendBody"
      :image-url="isBothMode ? activeImageUrl : ''"
      @close="isChannelSendOpen = false"
    />

    <ChatAttachmentPreviewModal
      :is-open="!!imagePreview"
      chat-file-id=""
      :file-name="imagePreview?.title ?? '이미지'"
      :mime-type="imagePreview?.mimeType ?? 'image/png'"
      :local-preview-url="imagePreview?.src"
      @update:is-open="onImagePreviewOpenChange"
    />
  </section>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import { formatNumberWithComma } from '~/utils/global/numberUtil'
import type { MarketingAuthoringAgentConfig } from '~/types/agent'
import type { MarketingAuthoringResult } from '~/types/marketing'
import {
  copyMarketingPayloadToClipboard,
  isChannelSendSupported,
  resolveMarketingAgentThemeStyle,
  resolveMarketingConditionDisplay,
  resolveMarketingOptionLabel,
  resolveMarketingToneLabels,
  renderMarketingTextHtml,
  type MarketingGeneratingStep,
  type MarketingRequestCustomFields,
} from '~/utils/marketing/marketingUtil'
import { MARKETING_IMAGE_ATMOSPHERES, MARKETING_IMAGE_TYPES } from '~/utils/agent/marketingAuthoringConfigUtil'

const props = withDefaults(
  defineProps<{
    result: MarketingAuthoringResult
    config?: MarketingAuthoringAgentConfig | null
    themeColorHex?: string
    isLoading?: boolean
    refiningType?: 'TEXT' | 'IMAGE' | null
    refiningVariantId?: number | null
    refineCompletedAt?: number
    generatingStep?: MarketingGeneratingStep
    showSidePanel?: boolean
    contentTitle?: string
    request?: MarketingRequestCustomFields | null
    saveVariant?: (payload: { variantId: number; textContent: string }) => Promise<boolean>
  }>(),
  {
    config: null,
    themeColorHex: '',
    isLoading: false,
    refiningType: null,
    refiningVariantId: null,
    refineCompletedAt: 0,
    generatingStep: '',
    showSidePanel: false,
    contentTitle: '',
    request: null,
    saveVariant: undefined,
  },
)

const emit = defineEmits<{
  editWithAgent: [payload: { variantId: number; content: string; request: string; type: 'TEXT' | 'IMAGE' }]
}>()

const variants = computed(() => props.result.variants ?? [])
const images = computed(() => props.result.images ?? [])

type RefineType = 'TEXT' | 'IMAGE'

type RefineChatEntry = {
  id: string
  role: 'user' | 'assistant'
  text: string
  type: RefineType
}

interface DraftTab {
  id: number
  key: string
  title: string
  subLabel?: string
  recommended: boolean
  isActive: boolean
}

const REFINE_COPY = {
  TEXT: {
    label: '글 수정',
    progress: '문구를 수정하고 있습니다',
    done: '문구를 수정했습니다.',
    placeholder: '예: 첫 문장을 더 간결하고 눈에 띄게 바꿔 주세요',
  },
  IMAGE: {
    label: '이미지 수정',
    progress: '이미지를 수정하고 있습니다',
    done: '이미지를 수정했습니다.',
    placeholder: '예: 배경 이미지를 밝은 분위기로 변경해 주세요',
  },
} as const

const isBothMode = computed(() => props.result.mode === 'BOTH')
const isImageMode = computed(() => props.result.mode === 'IMAGE')
const isRefining = computed(() => !!props.refiningType)
const draftItems = computed(() => (isImageMode.value ? images.value : variants.value))

const headerTitle = computed(() => {
  if (props.refiningType) return REFINE_COPY[props.refiningType].progress
  if (props.isLoading) return '콘텐츠를 생성하고 있습니다'
  return '콘텐츠 생성이 완료되었습니다'
})

const resolveInitialDraftId = () => {
  const items = draftItems.value
  const recommended = items.find((item) => item.recommended)
  return recommended?.id ?? items[0]?.id ?? 1
}

const activeDraftId = ref(resolveInitialDraftId())
const isRefiningActive = (type: RefineType) =>
  props.refiningType === type && props.refiningVariantId != null && props.refiningVariantId === activeDraftId.value
const isRefiningActiveImage = computed(() => isRefiningActive('IMAGE'))
const isRefiningActiveText = computed(() => isRefiningActive('TEXT'))
const isEditing = ref(false)
const isSavingEdit = ref(false)
const editDraft = ref('')
const isChannelSendOpen = ref(false)
const channelSendBody = ref('')
const imagePreview = ref<{ src: string; title: string; mimeType: string } | null>(null)

const resolveInitialRefineType = (): RefineType | null => {
  if (isBothMode.value) return null
  return isImageMode.value ? 'IMAGE' : 'TEXT'
}

const refineDraft = ref('')
const refineChatLog = ref<RefineChatEntry[]>([])
const refineType = ref<RefineType | null>(resolveInitialRefineType())
const refineChatListRef = ref<HTMLElement | null>(null)
const lastSentRefineType = ref<RefineType | null>(null)
let refineChatIdSeq = 0

const nextRefineChatId = () => {
  refineChatIdSeq += 1
  return `marketing-refine-${refineChatIdSeq}`
}

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
  refineType.value = resolveInitialRefineType()
  lastSentRefineType.value = null
  refineChatIdSeq = 0
}

const selectRefineType = (type: RefineType) => {
  refineType.value = type
  refineDraft.value = ''
}

const pushAssistantRefineReply = (type: RefineType) => {
  refineChatLog.value.push({
    id: nextRefineChatId(),
    role: 'assistant',
    text: REFINE_COPY[type].done,
    type,
  })
  scrollRefineChatToBottom()
}

const refineInputPlaceholder = computed(() => {
  if (props.refiningType) return `${REFINE_COPY[props.refiningType].progress}...`
  return refineType.value ? REFINE_COPY[refineType.value].placeholder : '먼저 수정할 항목을 선택해 주세요'
})

watch(
  () => props.refineCompletedAt,
  (completedAt) => {
    if (!completedAt || !lastSentRefineType.value) return
    pushAssistantRefineReply(lastSentRefineType.value)
    lastSentRefineType.value = null
  },
)

watch(isRefiningActiveText, (active) => {
  if (!active || !isEditing.value) return
  isEditing.value = false
  editDraft.value = ''
})

watch(
  () => [props.result.mode, props.result.variants, props.result.images] as const,
  () => {
    if (draftItems.value.some((item) => item.id === activeDraftId.value)) return
    activeDraftId.value = resolveInitialDraftId()
  },
  { deep: true },
)

const activeVariant = computed(
  () => variants.value.find((item) => item.id === activeDraftId.value) ?? variants.value[0] ?? null,
)

const activeImage = computed(() => {
  if (!isImageMode.value && !isBothMode.value) return null
  const found = images.value.find((item) => item.id === activeDraftId.value)
  if (found) return found
  return isImageMode.value ? (images.value[0] ?? null) : null
})

const activeImageUrl = computed(() => activeImage.value?.url ?? '')

const activeVariantOrder = computed(() => {
  const index = draftItems.value.findIndex((item) => item.id === activeDraftId.value)
  return index >= 0 ? index + 1 : 1
})

const draftText = computed(() => activeVariant.value?.content ?? '')

const canSendRefine = computed(() => {
  if (props.isLoading || isRefining.value || isEditing.value || !refineType.value) return false
  if (!refineDraft.value.trim()) return false
  if (refineType.value === 'IMAGE') return !!activeImageUrl.value
  return !!draftText.value.trim()
})

const hasEditChanges = computed(() => {
  if (!isEditing.value || !activeVariant.value) return false
  return editDraft.value.trim() !== draftText.value.trim()
})

const resolvedChannel = computed(() => String(props.result.conditions.channel ?? '').trim())

const showChannelSend = computed(
  () => !isImageMode.value && !props.isLoading && isChannelSendSupported(resolvedChannel.value),
)

const hasDraftContent = computed(() =>
  isImageMode.value ? !!activeImageUrl.value : !!activeVariant.value || (isBothMode.value && !!activeImageUrl.value),
)

const formattedCharCount = computed(() => {
  const text = isEditing.value ? editDraft.value : draftText.value
  return formatNumberWithComma([...text].length) || '0'
})

const draftTabs = computed<DraftTab[]>(() => {
  const items = draftItems.value
  const hasRecommended = items.some((item) => item.recommended)
  return items.map((item, index) => ({
    id: item.id,
    key: `draft-${item.id}`,
    title: `시안 ${index + 1}`,
    subLabel: String(item.label ?? '').trim() || undefined,
    recommended: !!item.recommended || (!hasRecommended && index === 0),
    isActive: item.id === activeDraftId.value,
  }))
})

const metaItems = computed(() => {
  const display = resolveMarketingConditionDisplay(props.result.conditions, props.config, props.request ?? undefined)
  const imageConditions = props.result.imageConditions
  const imageStyle = resolveMarketingOptionLabel(MARKETING_IMAGE_TYPES, imageConditions?.contentType)
  const imageAtmosphere = resolveMarketingToneLabels(imageConditions?.tones, MARKETING_IMAGE_ATMOSPHERES)
  const aspectRatio = String(imageConditions?.length ?? '').trim()

  const rows = isImageMode.value
    ? [
        { label: '표현 방식', value: imageStyle || display.contentType },
        { label: '채널', value: display.channel },
        { label: '제작 목적', value: display.purpose },
        { label: '대상 고객', value: display.audience },
        { label: '톤앤매너', value: imageAtmosphere || display.tones },
        { label: '화면 비율', value: aspectRatio || display.length },
      ]
    : [
        { label: '콘텐츠 유형', value: display.contentType },
        { label: '채널', value: display.channel },
        { label: '작성 목적', value: display.purpose },
        { label: '대상 독자', value: display.audience },
        { label: '톤앤매너', value: display.tones },
        { label: '분량', value: display.length },
        ...(isBothMode.value
          ? [
              { label: '이미지 스타일', value: imageStyle },
              { label: '이미지 분위기', value: imageAtmosphere },
              { label: '화면 비율', value: aspectRatio },
            ]
          : []),
      ]

  return rows
    .map((item) => ({ label: item.label, value: String(item.value ?? '').trim() }))
    .filter((item) => !!item.value)
})

const draftTitle = computed(() => String(props.contentTitle ?? '').trim())

const refineActiveVariantMeta = computed(() => {
  if (!isImageMode.value && !activeVariant.value) return ''
  const label = String((isImageMode.value ? activeImage.value?.label : activeVariant.value?.label) ?? '').trim()
  return label ? `시안 ${activeVariantOrder.value} · ${label}` : `시안 ${activeVariantOrder.value}`
})

const isMetaOpen = ref(true)
const toggleMeta = () => {
  isMetaOpen.value = !isMetaOpen.value
}

const renderedContent = computed(() => renderMarketingTextHtml(draftText.value))

const rootRef = ref<HTMLElement | null>(null)

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

    scrollAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const selectDraft = async (draftId: number) => {
  if (draftId === activeDraftId.value) return
  if (isEditing.value && hasEditChanges.value) {
    const confirmed = await openConfirm({
      title: '수정 내용',
      message: '저장하지 않은 수정 내용이 있습니다.\n다른 시안으로 이동할까요?',
      confirmText: '이동',
      cancelText: '취소',
    })
    if (!confirmed) return
  }
  isEditing.value = false
  editDraft.value = ''
  if (!isRefining.value) resetRefineChat()
  activeDraftId.value = draftId
  scrollResultToTop()
}

const onSendRefine = () => {
  if (!canSendRefine.value || !refineType.value) return

  const request = refineDraft.value.trim()
  const content = draftText.value.trim()

  refineChatLog.value.push({
    id: nextRefineChatId(),
    role: 'user',
    text: request,
    type: refineType.value,
  })
  lastSentRefineType.value = refineType.value
  refineDraft.value = ''
  scrollRefineChatToBottom()

  emit('editWithAgent', {
    variantId: activeDraftId.value,
    content,
    request,
    type: refineType.value,
  })
}

const toggleEdit = async () => {
  if (!activeVariant.value || isRefiningActiveText.value || isSavingEdit.value) return
  if (isEditing.value) {
    const textContent = editDraft.value.trim()
    if (!textContent) {
      openToast({ message: '시안 내용을 입력해 주세요.', type: 'warning' })
      return
    }
    if (!props.saveVariant) {
      isEditing.value = false
      editDraft.value = ''
      return
    }
    isSavingEdit.value = true
    try {
      const saved = await props.saveVariant({ variantId: activeVariant.value.id, textContent })
      if (!saved) return
      isEditing.value = false
      editDraft.value = ''
    } finally {
      isSavingEdit.value = false
    }
    return
  }
  editDraft.value = draftText.value
  isEditing.value = true
}

const onCopy = async () => {
  const content = isImageMode.value ? '' : (isEditing.value ? editDraft.value : draftText.value).trim()
  const imageUrl = isImageMode.value || isBothMode.value ? activeImageUrl.value : ''
  if (!content && !imageUrl) {
    openToast({ message: '복사할 내용이 없습니다.', type: 'warning' })
    return
  }

  try {
    const result = await copyMarketingPayloadToClipboard(content, imageUrl)
    if (result.textCopied && result.imageCopied) {
      openToast({ message: '글과 이미지를 함께 복사했습니다.' })
      return
    }
    if (result.textCopied) {
      openToast({
        message: imageUrl ? '텍스트만 복사되었습니다.' : '시안을 클립보드에 복사했습니다.',
        type: imageUrl ? 'warning' : undefined,
      })
      return
    }
    if (result.imageCopied) {
      openToast({ message: '이미지만 복사되었습니다.', type: 'warning' })
    }
  } catch {
    openToast({ message: '복사에 실패했습니다.', type: 'error' })
  }
}

const onOpenChannelSend = () => {
  if (!showChannelSend.value || isEditing.value) return
  const content = draftText.value.trim()
  if (!content) return
  channelSendBody.value = content
  isChannelSendOpen.value = true
}

const resolveImagePreviewMime = (src: string) => {
  const mimeMatch = src.match(/^data:(image\/[a-z0-9+.+-]+);/i)
  if (mimeMatch?.[1]) return mimeMatch[1]
  if (/\.jpe?g($|\?)/i.test(src)) return 'image/jpeg'
  if (/\.webp($|\?)/i.test(src)) return 'image/webp'
  if (/\.gif($|\?)/i.test(src)) return 'image/gif'
  return 'image/png'
}

const onOpenImagePreview = () => {
  const src = String(activeImageUrl.value ?? '').trim()
  if (!src) return
  imagePreview.value = {
    src,
    title: `시안 ${activeVariantOrder.value} 마케팅 이미지`,
    mimeType: resolveImagePreviewMime(src),
  }
}

const onImagePreviewOpenChange = (open: boolean) => {
  if (!open) imagePreview.value = null
}
</script>
