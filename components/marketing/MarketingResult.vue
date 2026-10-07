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
    <header
      v-if="isLoading || isRefining"
      class="chat-marketing-authoring-result__header"
    >
      <div class="chat-marketing-authoring-result__title-row">
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
      <div class="chat-marketing-authoring-result__meta-items">
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
        @click="onSelectDraft(tab.id)"
      >
        {{ tab.title }}
        <span
          v-if="tab.subLabel"
          class="chat-marketing-authoring-result__tab-label"
        >
          {{ tab.subLabel }}
        </span>
        <em v-if="tab.isAdopted">채택</em>
      </button>
    </div>

    <div class="chat-marketing-authoring-result__body">
      <div class="chat-marketing-authoring-result__main">
        <div
          v-if="isLoading && !hasDraftContent"
          class="chat-marketing-authoring-result__draft chat-marketing-authoring-result__draft--loading"
        >
          <MarketingPreparingStatus
            :generating-step="generatingStep"
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
                type="button"
                :disabled="isLoading || isRefining || !hasDraftContent"
                title="채널 미리보기"
                @click="openChannelPreview"
              >
                <UiIcon
                  name="share-2"
                  size="16"
                />
                채널 미리보기
              </button>
              <button
                type="button"
                :disabled="isRefiningActiveText || isRefiningActiveImage"
                @click="onCopy"
              >
                <UiIcon
                  name="copy"
                  size="16"
                />
                복사
              </button>
              <UiDropdownMenu
                v-if="props.contentId"
                :items="exportMenuItems"
                align="end"
                :open="isExportPickerOpen"
                content-class="marketing-export-dropdown"
                @update:open="onExportMenuOpenChange"
                @select="onSelectExportFormat"
              >
                <template #trigger>
                  <button
                    type="button"
                    :disabled="isExporting || isRefiningActiveText || isRefiningActiveImage"
                    title="생성된 시안 전체를 파일로 내보냅니다"
                  >
                    <UiIcon
                      name="download"
                      size="16"
                    />
                    {{ isExporting ? '내보내는 중...' : '내보내기' }}
                    <UiIcon
                      name="chevron-down"
                      size="16"
                      class="chat-marketing-authoring-result__export-picker-caret"
                      :class="{ 'is-open': isExportPickerOpen }"
                    />
                  </button>
                </template>
              </UiDropdownMenu>
              <button
                v-if="!isImageMode && props.saveVariant"
                type="button"
                :disabled="isSavingEdit || isRefiningActiveText || isLoading"
                @mousedown.prevent
                @click="onSaveClick"
              >
                {{ isSavingEdit ? '저장 중...' : '저장' }}
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
                  <MarketingDraftEditor
                    ref="draftEditorRef"
                    :key="activeDraftId"
                    :variant-id="activeDraftId"
                    :text="draftText"
                    :disabled="isRefiningActiveText || isSavingEdit"
                    @save="onSaveDraftText"
                    @update:text="liveDraftText = $event"
                    @add-to-prompt="onAddToPrompt"
                  />
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

          <div class="chat-marketing-authoring-result__draft-foot">
            <p
              v-if="!isImageMode"
              class="chat-marketing-authoring-result__char-count"
            >
              글자 수 {{ formattedCharCount }}자
            </p>
            <UiButton
              variant="primary"
              size="sm"
              :disabled="isLoading || isRefining || !hasDraftContent || isSelectingVariant || isActiveDraftInUse"
              @click="onUseDraft"
            >
              이 시안 사용하기
            </UiButton>
          </div>
        </div>
      </div>

      <aside
        class="chat-marketing-authoring-result__aside"
        :class="{ 'is-preparing': isLoading }"
      >
        <section class="chat-marketing-authoring-result__aside-card">
          <div class="chat-marketing-authoring-result__refine-mode-tabs">
            <button
              type="button"
              :class="{ 'is-active': refineTab === 'chat' }"
              @click="refineTab = 'chat'"
            >
              AI와 대화
            </button>
            <button
              type="button"
              :class="{ 'is-active': refineTab === 'prompt' }"
              @click="refineTab = 'prompt'"
            >
              프롬프트 수정
            </button>
          </div>

          <div class="chat-marketing-authoring-result__refine-head">
            <div
              v-if="isLoading || refineActiveVariantMeta"
              class="chat-marketing-authoring-result__refine-title-row"
            >
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
              {{ refineLead }}
            </p>
          </div>

          <template v-if="refineTab === 'chat'">
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
                <strong>시안 보완 요청 내역이 없습니다.</strong>
                <span>아이디어를 제안하면 더 완성도 높은 콘텐츠를 함께 만들어드릴게요.</span>
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
                  <UiIcon
                    v-if="entry.role === 'assistant'"
                    name="bot"
                    size="20"
                    class="chat-marketing-authoring-result__refine-avatar"
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
                v-if="isBothMode"
                class="chat-marketing-authoring-result__refine-type-tabs"
                aria-label="수정 유형"
              >
                <button
                  type="button"
                  :class="{ 'is-active': refineType === 'TEXT' }"
                  :disabled="isRefining"
                  @click="onSelectRefineType('TEXT')"
                >
                  <UiIcon
                    name="pencil"
                    size="14"
                    aria-hidden="true"
                  />
                  {{ REFINE_COPY.TEXT.label }}
                </button>
                <button
                  type="button"
                  :class="{ 'is-active': refineType === 'IMAGE' }"
                  :disabled="isRefining"
                  @click="onSelectRefineType('IMAGE')"
                >
                  <UiIcon
                    name="image"
                    size="14"
                    aria-hidden="true"
                  />
                  {{ REFINE_COPY.IMAGE.label }}
                </button>
              </div>
              <form
                class="chat-marketing-authoring-result__refine-chat-bar"
                :class="{
                  'is-active': canSendRefine,
                  'is-disabled': isLoading || isRefining,
                }"
                @submit.prevent="onSendRefine"
              >
                <UiIcon
                  v-show="!refineDraft.trim()"
                  name="sparkle"
                  size="20"
                  aria-hidden="true"
                />
                <input
                  v-model="refineDraft"
                  type="text"
                  class="chat-marketing-authoring-result__refine-chat-input"
                  autocomplete="off"
                  :spellcheck="false"
                  :disabled="isLoading || isRefining"
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
          </template>

          <div
            v-else
            class="chat-marketing-authoring-result__refine-prompt"
          >
            <div
              v-if="isBothMode"
              class="chat-marketing-authoring-result__refine-type-tabs"
              aria-label="수정 유형"
            >
              <button
                type="button"
                :class="{ 'is-active': refineType === 'TEXT' }"
                :disabled="isRefining"
                @click="onSelectRefineType('TEXT')"
              >
                <UiIcon
                  name="pencil"
                  size="14"
                  aria-hidden="true"
                />
                {{ REFINE_COPY.TEXT.label }}
              </button>
              <button
                type="button"
                :class="{ 'is-active': refineType === 'IMAGE' }"
                :disabled="isRefining"
                @click="onSelectRefineType('IMAGE')"
              >
                <UiIcon
                  name="image"
                  size="14"
                  aria-hidden="true"
                />
                {{ REFINE_COPY.IMAGE.label }}
              </button>
            </div>
            <div class="chat-marketing-authoring-result__refine-prompt-field">
              <UiTextarea
                v-model="promptDraft"
                placeholder="수정할 내용을 프롬프트로 입력해 주세요."
                :rows="1"
                border
                size="sm"
                :auto-resize="false"
                :expandable="false"
                :disabled="isLoading || isRefining"
              />
            </div>
            <div class="chat-marketing-authoring-result__refine-prompt-foot">
              <UiButton
                variant="primary"
                size="md"
                :disabled="!canSendPromptRefine"
                @click="onSendPromptRefine"
              >
                적용하기
              </UiButton>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <UiModal
      :is-open="isChannelPreviewOpen"
      title="채널 미리보기"
      position="center"
      max-width="560px"
      custom-class="marketing-channel-preview-modal"
      @close="isChannelPreviewOpen = false"
    >
      <div class="marketing-channel-preview">
        <p
          v-if="channelPreviewNm"
          class="marketing-channel-preview__channel"
        >
          {{ channelPreviewNm }}
        </p>
        <!-- eslint-disable vue/no-v-html -- 공용 유틸에서 이스케이프 후 허용된 태그만 생성 -->
        <div
          v-if="liveDraftText"
          class="marketing-channel-preview__text"
          v-html="renderedContent"
        />
        <!-- eslint-enable vue/no-v-html -->
        <img
          v-if="activeImageUrl"
          :src="activeImageUrl"
          class="marketing-channel-preview__image"
          alt="채널 미리보기 이미지"
        />
      </div>
    </UiModal>

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
import {
  UiButton,
  UiDropdownMenu,
  UiIcon,
  UiLoading,
  UiModal,
  UiTextarea,
  type DropdownMenuItemDef,
} from '@leechanyong/ispark-ui'
import { formatNumberWithComma } from '~/utils/global/numberUtil'
import { formatYyyyMmDdFromDate } from '~/utils/global/dateUtil'
import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { useMarketingExport } from '~/composables/marketing/useMarketingExport'
import type { MarketingAuthoringAgentConfig } from '~/types/agent'
import type {
  MarketingExportFormat,
  MarketingAuthoringResult,
  MarketingGeneratingStep,
  MarketingStoredRequest,
  MarketingOutputKind,
} from '~/types/marketing'
import {
  copyMarketingPayloadToClipboard,
  resolveMarketingAgentThemeStyle,
  resolveMarketingConditionDisplay,
  resolveMarketingOptionLabel,
  resolveMarketingToneLabels,
  renderMarketingTextHtml,
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
    contentId?: string
    contentTitle?: string
    orgNm?: string
    projectNm?: string
    request?: MarketingStoredRequest | null
    saveVariant?: (payload: { variantId: number; textContent: string }) => Promise<boolean>
    adoptedVariantId?: number | null
    isSelectingVariant?: boolean
  }>(),
  {
    config: null,
    themeColorHex: '',
    isLoading: false,
    refiningType: null,
    refiningVariantId: null,
    refineCompletedAt: 0,
    generatingStep: '',
    contentId: '',
    contentTitle: '',
    orgNm: '',
    projectNm: '',
    request: null,
    saveVariant: undefined,
    adoptedVariantId: null,
    isSelectingVariant: false,
  },
)

const emit = defineEmits<{
  'edit-with-agent': [payload: { variantId: number; content: string; request: string; type: MarketingOutputKind }]
  used: [variantId: number]
}>()

const { fetchExportMarketingContentHtml } = useMarketingApi()
const { exportMarketingHtmlAsPdf, exportMarketingHtmlAsDocx } = useMarketingExport()

const variants = computed(() => props.result.variants ?? [])
const images = computed(() => props.result.images ?? [])

type RefineChatEntry = {
  id: string
  role: 'user' | 'assistant'
  text: string
  type: MarketingOutputKind
}

interface DraftTab {
  id: number
  key: string
  title: string
  subLabel?: string
  isAdopted: boolean
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
  return '콘텐츠를 생성하고 있습니다'
})

const resolveInitialDraftId = () => {
  const items = draftItems.value
  const recommended = items.find((item) => item.recommended)
  return recommended?.id ?? items[0]?.id ?? 1
}

const activeDraftId = ref(resolveInitialDraftId())
const isRefiningActive = (type: MarketingOutputKind) =>
  props.refiningType === type && props.refiningVariantId != null && props.refiningVariantId === activeDraftId.value
const isRefiningActiveImage = computed(() => isRefiningActive('IMAGE'))
const isRefiningActiveText = computed(() => isRefiningActive('TEXT'))
const isExporting = ref(false)
const isSavingEdit = ref(false)
const draftEditorRef = ref<{ save: () => void } | null>(null)
const isChannelPreviewOpen = ref(false)
const imagePreview = ref<{ src: string; title: string; mimeType: string } | null>(null)

const resolveInitialRefineType = (): MarketingOutputKind => (isImageMode.value ? 'IMAGE' : 'TEXT')

const refineDraft = ref('')
const promptDraft = ref('')
const refineChatLog = ref<RefineChatEntry[]>([])
const refineType = ref<MarketingOutputKind>(resolveInitialRefineType())
const refineTab = ref<'chat' | 'prompt'>('prompt')
const refineChatListRef = ref<HTMLElement | null>(null)
const lastSentRefineType = ref<MarketingOutputKind | null>(null)
const lastSentRefineSource = ref<'chat' | 'prompt' | null>(null)
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
  promptDraft.value = originalPrompt.value
  refineChatLog.value = []
  refineType.value = resolveInitialRefineType()
  lastSentRefineType.value = null
  lastSentRefineSource.value = null
  refineChatIdSeq = 0
}

const onSelectRefineType = (type: MarketingOutputKind) => {
  refineType.value = type
  refineDraft.value = ''
}

const pushAssistantRefineReply = (type: MarketingOutputKind) => {
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
  return REFINE_COPY[refineType.value].placeholder
})

const refineLead = computed(() => {
  if (props.isLoading) return '콘텐츠 생성이 완료되면 시안을 기준으로 보완할 수 있습니다'
  if (refineTab.value === 'prompt') return '현재 시안을 기준으로 프롬프트를 수정해 보완할 수 있습니다'
  return '현재 시안을 기준으로 Agent와 대화하며 내용을 보완할 수 있습니다'
})

/** 선택한 시안·수정 유형에 실제로 사용된 프롬프트 */
const originalPrompt = computed(() => {
  const useImage = isImageMode.value || refineType.value === 'IMAGE'
  const matched = useImage
    ? images.value.find((item) => item.id === activeDraftId.value)
    : variants.value.find((item) => item.id === activeDraftId.value)
  const text = matched?.prompt
  if (!text) return ''
  return text.trim()
})

watch(
  originalPrompt,
  (next, prev) => {
    if (!prev || promptDraft.value === prev) promptDraft.value = next
  },
  { immediate: true },
)

watch(
  () => props.contentId,
  () => {
    promptDraft.value = originalPrompt.value
  },
)

// 생성 SSE로 시안이 늘어나는 동안 컴포넌트는 유지
watch(
  () => [props.result.mode, props.result.variants, props.result.images] as const,
  () => {
    if (draftItems.value.some((item) => item.id === activeDraftId.value)) return
    activeDraftId.value = resolveInitialDraftId()
  },
  { deep: true },
)

// 보완 완료 시각이 바뀌면 대화 로그에 응답을 추가한다 (컴포넌트가 유지된 채 props만 갱신됨)
watch(
  () => props.refineCompletedAt,
  (completedAt) => {
    if (!completedAt || !lastSentRefineType.value) return
    if (lastSentRefineSource.value === 'chat') {
      pushAssistantRefineReply(lastSentRefineType.value)
    }
    lastSentRefineType.value = null
    lastSentRefineSource.value = null
  },
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

const isActiveDraftInUse = computed(
  () => props.adoptedVariantId != null && props.adoptedVariantId === activeDraftId.value,
)

const activeVariantOrder = computed(() => {
  const index = draftItems.value.findIndex((item) => item.id === activeDraftId.value)
  return index >= 0 ? index + 1 : 1
})

const draftText = computed(() => activeVariant.value?.content ?? '')
const liveDraftText = ref('')

watch(
  draftText,
  (value) => {
    if (value.trim().startsWith('<')) return
    liveDraftText.value = value
  },
  { immediate: true },
)

/** 진행 중인 작업이 없고 현재 수정 유형의 대상(이미지 또는 문구)이 있는지 */
const canRefineActive = computed(() => {
  if (props.isLoading || isRefining.value) return false
  if (refineType.value === 'IMAGE') return !!activeImageUrl.value
  return !!liveDraftText.value.trim()
})
const canSendRefine = computed(() => canRefineActive.value && !!refineDraft.value.trim())
const canSendPromptRefine = computed(() => canRefineActive.value && !!promptDraft.value.trim())

const hasDraftContent = computed(() =>
  isImageMode.value ? !!activeImageUrl.value : !!activeVariant.value || (isBothMode.value && !!activeImageUrl.value),
)

const formattedCharCount = computed(() => formatNumberWithComma([...liveDraftText.value].length) || '0')

const conditionDisplay = computed(() =>
  resolveMarketingConditionDisplay(props.result.conditions, props.config, props.request ?? undefined),
)
const channelPreviewNm = computed(() => conditionDisplay.value.channel)

const draftTabs = computed<DraftTab[]>(() => {
  const items = draftItems.value
  return items.map((item, index) => ({
    id: item.id,
    key: `draft-${item.id}`,
    title: `시안 ${index + 1}`,
    subLabel: String(item.label ?? '').trim() || undefined,
    isAdopted: props.adoptedVariantId != null && item.id === props.adoptedVariantId,
    isActive: item.id === activeDraftId.value,
  }))
})

const metaItems = computed(() => {
  const display = conditionDisplay.value
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

const renderedContent = computed(() => renderMarketingTextHtml(liveDraftText.value))

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
        '.chat-marketing-authoring-result__draft-scroll, .chat-marketing-authoring-result__draft-body',
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

const onSelectDraft = (draftId: number) => {
  if (draftId === activeDraftId.value) return
  if (!isRefining.value) resetRefineChat()
  activeDraftId.value = draftId
  scrollResultToTop()
}

const onSendRefine = () => {
  if (!canSendRefine.value) return

  const request = refineDraft.value.trim()
  const content = liveDraftText.value.trim()

  refineChatLog.value.push({
    id: nextRefineChatId(),
    role: 'user',
    text: request,
    type: refineType.value,
  })
  lastSentRefineType.value = refineType.value
  lastSentRefineSource.value = 'chat'
  refineDraft.value = ''
  scrollRefineChatToBottom()

  emit('edit-with-agent', {
    variantId: activeDraftId.value,
    content,
    request,
    type: refineType.value,
  })
}

const onSendPromptRefine = () => {
  if (!canSendPromptRefine.value) return

  const request = promptDraft.value.trim()
  const content = liveDraftText.value.trim()

  lastSentRefineType.value = refineType.value
  lastSentRefineSource.value = 'prompt'

  emit('edit-with-agent', {
    variantId: activeDraftId.value,
    content,
    request,
    type: refineType.value,
  })
}

const onSaveDraftText = async (payload: { variantId: number; textContent: string }) => {
  if (!props.saveVariant || isSavingEdit.value) return
  isSavingEdit.value = true
  try {
    await props.saveVariant(payload)
  } finally {
    isSavingEdit.value = false
  }
}

const onSaveClick = () => {
  if (!props.saveVariant || isSavingEdit.value || isRefiningActiveText.value) return
  draftEditorRef.value?.save()
}

const onAddToPrompt = (text: string) => {
  const selected = text.trim()
  if (!selected) return
  refineType.value = 'TEXT'
  refineTab.value = 'prompt'
  const current = promptDraft.value.trim()
  promptDraft.value = current ? `${current}\n${selected}` : selected
}

const openChannelPreview = () => {
  if (props.isLoading || isRefining.value || !hasDraftContent.value) return
  isChannelPreviewOpen.value = true
}

const onCopy = async () => {
  const content = isImageMode.value ? '' : liveDraftText.value.trim()
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

const EXPORT_FORMAT_OPTIONS: { format: MarketingExportFormat; label: string; extension: string }[] = [
  { format: 'word', label: 'Word로 저장', extension: 'docx' },
  { format: 'pdf', label: 'PDF로 저장', extension: 'pdf' },
]

const exportMenuItems = computed<DropdownMenuItemDef[]>(() =>
  EXPORT_FORMAT_OPTIONS.map((option) => ({ label: option.label, value: option.format })),
)

const isExportPickerOpen = ref(false)

const onExportMenuOpenChange = (open: boolean) => {
  if (open && (isExporting.value || isRefiningActiveText.value || isRefiningActiveImage.value)) {
    isExportPickerOpen.value = false
    return
  }
  isExportPickerOpen.value = open
}

/** "고객사_프로젝트명_제목_YYYYMMDD" — 고객사·프로젝트명은 없으면 생략, 날짜는 내보내는 시점 기준 */
const buildExportFileNameBase = () => {
  const parts = [props.orgNm, props.projectNm, draftTitle.value || '마케팅_콘텐츠']
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/[\\/:*?"<>|]/g, '_'))
  parts.push(formatYyyyMmDdFromDate(new Date()))
  return parts.join('_')
}

const isMarketingExportFormat = (value: string): value is MarketingExportFormat =>
  EXPORT_FORMAT_OPTIONS.some((option) => option.format === value)

/** 콘텐츠 시안 전체 내보내기 — format=word|pdf. HTML만 받아 프론트에서 변환한다(회의록과 동일 패턴) */
const onSelectExportFormat = async (format: string) => {
  isExportPickerOpen.value = false
  if (!isMarketingExportFormat(format)) return
  const contentId = props.contentId.trim()
  if (!contentId || isExporting.value) return
  isExporting.value = true
  try {
    const { successYn, html, returnMsg } = await fetchExportMarketingContentHtml(contentId)
    if (!successYn || !html) {
      openToast({ message: returnMsg || '내보내기에 실패했습니다.', type: 'error' })
      return
    }
    if (format === 'pdf') {
      await exportMarketingHtmlAsPdf(html)
    } else {
      await exportMarketingHtmlAsDocx(html, buildExportFileNameBase())
    }
  } catch {
    openToast({ message: '내보내기에 실패했습니다.', type: 'error' })
  } finally {
    isExporting.value = false
  }
}

const onUseDraft = () => {
  if (
    props.isLoading ||
    isRefining.value ||
    !hasDraftContent.value ||
    props.isSelectingVariant ||
    isActiveDraftInUse.value
  )
    return
  emit('used', activeDraftId.value)
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
