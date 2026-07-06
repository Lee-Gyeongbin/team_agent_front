<template>
  <div class="chat-input">
    <div
      v-if="isGeneratingNextQuestions || nextQuestions.length > 0"
      class="chat-next-questions"
    >
      <div
        v-if="isGeneratingNextQuestions"
        class="chat-next-questions-loading"
      >
        <span class="chat-next-questions-loading-dots"> <i></i><i></i><i></i> </span>
        다음 질문을 만드는 중...
      </div>
      <div
        v-else
        class="chat-next-questions-list"
      >
        <button
          v-for="(question, idx) in nextQuestions"
          :key="idx"
          type="button"
          class="chat-next-question-btn"
          @click="handleSelectNextQuestion(question)"
        >
          {{ question }}
        </button>
      </div>
    </div>
    <Transition name="chat-data-ac-fade">
      <div
        v-if="hasDataAutocomplete"
        class="chat-next-questions chat-data-ac"
        :style="dataAutocompleteTheme ? { '--chat-ac-theme': dataAutocompleteTheme } : undefined"
      >
        <div class="chat-next-questions-list">
          <button
            v-for="(term, idx) in dataAutocompleteItems"
            :key="idx"
            type="button"
            class="chat-next-question-btn chat-data-ac-btn"
            @click="applyDataAutocomplete(term)"
          >
            <span class="chat-data-ac-term">
              <template
                v-for="(part, i) in dataAutocompleteHighlight(term)"
                :key="i"
              >
                <mark
                  v-if="part.hit"
                  class="chat-data-ac-hit"
                  >{{ part.text }}</mark
                >
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </button>
        </div>
      </div>
    </Transition>
    <div
      class="chat-input-inner"
      :class="{ 'is-active': modelValue.trim(), 'is-dragging': isDragging, 'is-disabled': props.disabled }"
      @dragenter.prevent="onAttachDragEnter"
      @dragover.prevent="onAttachDragOver"
      @dragleave.prevent="onAttachDragLeave"
      @drop.prevent="onAttachDrop"
    >
      <div class="chat-input-top flex items-start">
        <i
          v-show="!modelValue"
          class="icon-sparkle size-24"
        ></i>
        <UiTextarea
          :model-value="modelValue"
          class="inp-chat-search"
          :placeholder="inputPlaceholder"
          :disabled="props.disabled || isSearchModeMissingSubOptions || riskAgentActive"
          :auto-resize="true"
          :max-rows="6"
          @update:model-value="emit('update:modelValue', $event)"
          @keydown.enter.exact.prevent="onPrimaryEnter"
        />
      </div>

      <div class="chat-input-bottom flex justify-between items-center">
        <div class="chat-input-bottom-left flex gap-8 items-center">
          <UiTooltip
            v-if="isFileAttachEnabled"
            :content="riskAgentActive ? 'PDF 파일만 첨부할 수 있습니다.' : '파일 첨부'"
            side="top"
          >
            <UiButton
              type="button"
              variant="ghost"
              size="xlg"
              icon-only
              class="btn-chat-attach"
              :class="{ 'is-pdf-only': riskAgentActive }"
              :aria-label="riskAgentActive ? 'PDF 파일 첨부' : '파일 첨부'"
              :disabled="isSending || props.disabled"
              @click="handleAttachClick"
            >
              <template #icon-left>
                <span class="btn-chat-attach-icon-wrap">
                  <i class="icon-attach-file size-24" />
                  <span
                    v-if="riskAgentActive"
                    class="btn-chat-attach-pdf-badge"
                    aria-hidden="true"
                  >
                    PDF
                  </span>
                </span>
              </template>
            </UiButton>
          </UiTooltip>
          <input
            v-if="isFileAttachEnabled"
            ref="attachInputRef"
            type="file"
            class="chat-input-attach-hidden"
            :accept="attachAccept"
            :disabled="props.disabled"
            multiple
            @change="onAttachFileChange"
          />
          <ChatSearchMode
            v-if="chatIndexAgents.length > 0"
            :disabled="props.disabled"
          />
        </div>
        <div class="chat-input-bottom-right flex gap-8 items-center">
          <UiSelect
            id="sub-option"
            class="w-150"
            name="sub-option"
            :model-value="selectedModelOption"
            :options="modelOptions"
            size="xlg"
            :disabled="props.disabled"
            @update:model-value="selectedModelOption = String($event)"
          />
          <UiButton
            variant="primary"
            size="xlg"
            icon-only
            class="btn-chat-send"
            :class="{ 'is-validate-mode': isValidateMode, 'is-just-unlocked': justUnlocked }"
            :loading="isSending || isValidating"
            :aria-label="
              isAnswerStreaming
                ? '응답 중단'
                : isSending
                  ? '전송 중'
                  : isValidating
                    ? '질의 검증 중'
                    : isValidateMode
                      ? '질의 검증'
                      : riskAgentActive
                        ? '리스크 진단 시작'
                        : '메시지 전송'
            "
            :disabled="isPrimaryDisabled"
            @click="onPrimaryClick"
          >
            <template #icon-left>
              <i
                v-if="isAnswerStreaming"
                class="icon-stop"
              />
              <span
                v-else-if="isSending || isValidating"
                class="btn-chat-send-spinner"
                aria-hidden="true"
              />
              <i
                v-else-if="isValidateMode"
                class="icon-sidebar-database size-20"
              />
              <i
                v-else-if="riskAgentActive"
                class="icon-play-circle size-20"
              />
              <i
                v-else
                class="icon-send size-20"
              />
            </template>
          </UiButton>
        </div>
      </div>
      <div
        v-if="isFileAttachEnabled && previewItems.length > 0"
        class="chat-input-attachments"
      >
        <ul
          class="chat-attachment-list"
          :class="{ 'is-single-image': isSingleImageAttachment }"
        >
          <li
            v-for="item in previewItems"
            :key="item.id"
            class="chat-attachment-item"
            :class="{ 'is-image': item.isImage }"
          >
            <div
              v-if="item.isImage && item.previewUrl"
              class="chat-attachment-thumb-wrap"
            >
              <img
                :src="item.previewUrl"
                :alt="item.file.name"
                class="chat-attachment-thumb"
              />
            </div>
            <div
              v-else
              class="chat-attachment-file-wrap"
            >
              <i :class="['icon', 'size-16', item.iconClass]" />
              <span class="chat-attachment-ext">{{ item.extensionLabel }}</span>
            </div>
            <p class="chat-attachment-name">{{ item.file.name }}</p>
            <button
              type="button"
              class="chat-attachment-remove"
              :aria-label="`${item.file.name} 첨부 삭제`"
              @click="removeAttachment(item.id)"
            >
              <i class="icon icon-close size-14" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiTooltip } from '@leechanyong/ispark-ui'
import { getChatAttachmentExtension, getChatFileIconClass } from '~/utils/chat/chatAttachmentDisplayUtil'
import { buildStopPayload } from '~/utils/chat/chatSocketPayloadUtil'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatMessages } from '~/composables/chat/useChatMessages'

interface AttachmentPreviewItem {
  id: string
  file: File
  previewUrl: string
  isImage: boolean
  iconClass: string
  extensionLabel: string
}

const ATTACH_ALLOWED_EXTENSIONS = [
  'pdf',
  'docx',
  'xlsx',
  'xls',
  'csv',
  'md',
  'txt',
  'json',
  'pptx',
  'py',
  'js',
  'ts',
  'html',
  'png',
  'jpg',
  'jpeg',
  'webp',
]
const GEMINI_ALLOWED_EXTENSIONS = ['png', 'jpeg', 'jpg', 'webp', 'heic', 'heif', 'pdf', 'txt', 'csv']
// RISK(리스크진단) 에이전트는 PDF만 첨부 허용
const RISK_ALLOWED_EXTENSIONS = ['pdf']
const IMAGE_EXTENSION_SET = new Set(['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'])
const ATTACH_EXTENSION_SET = new Set(ATTACH_ALLOWED_EXTENSIONS)
const GEMINI_ATTACH_EXTENSION_SET = new Set(GEMINI_ALLOWED_EXTENSIONS)
const RISK_ATTACH_EXTENSION_SET = new Set(RISK_ALLOWED_EXTENSIONS)
const MAX_ATTACH_FILE_COUNT = 5
const MAX_ATTACH_FILE_SIZE_MB = 15
const MAX_ATTACH_FILE_SIZE_BYTES = MAX_ATTACH_FILE_SIZE_MB * 1024 * 1024

const {
  chatRoom,
  createChatRoom,
  onSend,
  modelOptions,
  selectedModelOption,
  isSearchModeMissingSubOptions,
  searchModeSubOptionsEmptyMessage,
  chatIndexAgents,
  selectedSubOptions,
  isFileAttachEnabled,
  riskAgentActive,
} = useChatStore()

const { ensureWebSocketAndSend } = useChatSocket()
const { getStreamingMessage, nextQuestions, isGeneratingNextQuestions, markStoppedByUser } = useChatMessages()
const isAnswerStreaming = computed(() => !!getStreamingMessage()?.isStreaming)

// 데이터분석(S) 모드 인라인 자동완성 — 다음질문 추천과 동일한 틀로 입력창 위에 노출
const {
  items: dataAutocompleteItems,
  hasItems: hasDataAutocomplete,
  themeColorHex: dataAutocompleteTheme,
  highlightParts: dataAutocompleteHighlight,
  applyItem: applyDataAutocomplete,
} = useDataAutocomplete()

// 다음 추천 질문 텍스트 클릭 시 검색창에 텍스트 채우기
const handleSelectNextQuestion = (question: string) => {
  emit('update:modelValue', question)
}

// ===== 데이터분석(S) 질문 품질 게이트 — 검증 통과 전 전송 차단 =====
const { isGateActive, isValidating, canSend, requiredFilled, validate } = useDataQuestionGate()

/** 검증 단계 버튼 모드 — 게이트 활성 + 미통과 + 응답중 아님 */
const isValidateMode = computed(() => isGateActive.value && !canSend.value && !isAnswerStreaming.value)

/** 전송 버튼 비활성 — 게이트 활성 시 검증 통과 전엔 전송 불가(검증 모드일 땐 검증 가능 여부로 판정) */
const isPrimaryDisabled = computed(() => {
  if (isAnswerStreaming.value) return false
  const baseDisabled =
    props.disabled ||
    isSearchModeMissingSubOptions.value ||
    (riskAgentActive.value
      ? previewItems.value.length === 0
      : !props.modelValue.trim() || selectedSubOptions.value.length === 0)
  if (baseDisabled) return true
  // 검증 모드: 필수항목(무엇을·기간) 미충족이면 검증 요청 불가
  if (isValidateMode.value && !requiredFilled.value) return true
  return false
})

/** 버튼 클릭 — 응답중지 / 검증 / 전송 분기 */
const onPrimaryClick = () => {
  if (isAnswerStreaming.value) return handleStop()
  if (isValidateMode.value) return void validate()
  return void handleSend()
}

/** Enter — 검증 모드면 검증(필수항목 충족 시), 아니면 전송 */
const onPrimaryEnter = () => {
  if (isValidateMode.value) {
    if (!requiredFilled.value) return
    return void validate()
  }
  return void handleSend()
}

// 검증 통과 순간 버튼(검증→요청) 전환 강조 애니메이션
const justUnlocked = ref(false)
watch(canSend, (next, prev) => {
  if (isGateActive.value && next && !prev) {
    justUnlocked.value = true
    window.setTimeout(() => (justUnlocked.value = false), 800)
  }
})

const DEFAULT_INPUT_PLACEHOLDER = '궁금하신 내용을 입력하세요.'
const RISK_INPUT_PLACEHOLDER = 'RFP(PDF)를 첨부한 뒤 진단 시작을 눌러주세요.'

const inputPlaceholder = computed(() => {
  if (riskAgentActive.value) return RISK_INPUT_PLACEHOLDER
  if (isSearchModeMissingSubOptions.value) return searchModeSubOptionsEmptyMessage.value
  return DEFAULT_INPUT_PLACEHOLDER
})

interface Props {
  modelValue: string
  disabled?: boolean
}

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const attachInputRef = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const previewItems = ref<AttachmentPreviewItem[]>([])
const isDragging = ref(false)
const isSending = ref(false)
const isSingleImageAttachment = computed(() => previewItems.value.length === 1 && previewItems.value[0]?.isImage)
const isGeminiModelSelected = computed(() => selectedModelOption.value.toLowerCase().includes('gemini'))
const currentAllowedExtensions = computed(() => {
  if (riskAgentActive.value) return RISK_ALLOWED_EXTENSIONS
  return isGeminiModelSelected.value ? GEMINI_ALLOWED_EXTENSIONS : ATTACH_ALLOWED_EXTENSIONS
})
const attachAccept = computed(() => currentAllowedExtensions.value.map((ext) => `.${ext}`).join(','))

const isSameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

const revokePreviewUrl = (targetId: string) => {
  const target = previewItems.value.find((item) => item.id === targetId)
  if (target?.previewUrl) {
    URL.revokeObjectURL(target.previewUrl)
  }
}

const handleAttachClick = () => {
  if (!isFileAttachEnabled.value || props.disabled) return
  attachInputRef.value?.click()
}

const validateAttachmentFiles = (files: File[]) => {
  const allowedExtensionSet = riskAgentActive.value
    ? RISK_ATTACH_EXTENSION_SET
    : isGeminiModelSelected.value
      ? GEMINI_ATTACH_EXTENSION_SET
      : ATTACH_EXTENSION_SET
  const invalidExtensions = new Set<string>()
  let hasOversizeFile = false
  let hasExceededFileCount = false

  files.forEach((file) => {
    const ext = getChatAttachmentExtension(file.name)
    if (!ext || !allowedExtensionSet.has(ext)) {
      invalidExtensions.add(ext || '확장자 없음')
    }
    if (file.size > MAX_ATTACH_FILE_SIZE_BYTES) {
      hasOversizeFile = true
    }
  })

  if (files.length > MAX_ATTACH_FILE_COUNT) {
    hasExceededFileCount = true
  }

  if (invalidExtensions.size > 0) {
    openToast({
      message: `허용 형식만 첨부할 수 있습니다. (${currentAllowedExtensions.value.join(', ')})`,
      type: 'warning',
    })
    return false
  }

  if (hasOversizeFile) {
    openToast({
      message: `파일 1개당 최대 ${MAX_ATTACH_FILE_SIZE_MB}MB까지 첨부할 수 있습니다.`,
      type: 'warning',
    })
    return false
  }

  if (hasExceededFileCount) {
    openToast({
      message: `질문당 최대 ${MAX_ATTACH_FILE_COUNT}개 파일까지 첨부할 수 있습니다.`,
      type: 'warning',
    })
    return false
  }

  return true
}

const buildNextAttachFiles = (files: File[]) => {
  const nextFiles: File[] = []
  const allowedExtensionSet = riskAgentActive.value
    ? RISK_ATTACH_EXTENSION_SET
    : isGeminiModelSelected.value
      ? GEMINI_ATTACH_EXTENSION_SET
      : ATTACH_EXTENSION_SET
  let hasInvalidExtension = false
  let hasOversizeFile = false
  let hasExceededFileCount = false

  files.forEach((file) => {
    if (selectedFiles.value.length + nextFiles.length >= MAX_ATTACH_FILE_COUNT) {
      hasExceededFileCount = true
      return
    }

    const ext = getChatAttachmentExtension(file.name)
    if (!ext || !allowedExtensionSet.has(ext)) {
      hasInvalidExtension = true
      return
    }

    if (file.size > MAX_ATTACH_FILE_SIZE_BYTES) {
      hasOversizeFile = true
      return
    }

    if (selectedFiles.value.some((current) => isSameFile(current, file))) return
    nextFiles.push(file)
  })

  if (hasInvalidExtension) {
    openToast({
      message: `허용 형식만 첨부할 수 있습니다. (${currentAllowedExtensions.value.join(', ')})`,
      type: 'warning',
    })
  }
  if (hasOversizeFile) {
    openToast({
      message: `파일 1개당 최대 ${MAX_ATTACH_FILE_SIZE_MB}MB까지 첨부할 수 있습니다.`,
      type: 'warning',
    })
  }
  if (hasExceededFileCount) {
    openToast({
      message: `질문당 최대 ${MAX_ATTACH_FILE_COUNT}개 파일까지 첨부할 수 있습니다.`,
      type: 'warning',
    })
  }

  return nextFiles
}

const appendAttachmentPreview = (files: File[]) => {
  if (!isFileAttachEnabled.value) return
  const nextFiles = buildNextAttachFiles(files)

  if (nextFiles.length === 0) {
    return
  }

  const nextPreviewItems = nextFiles.map((file) => {
    const ext = getChatAttachmentExtension(file.name)
    const isImage = IMAGE_EXTENSION_SET.has(ext)
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: isImage ? URL.createObjectURL(file) : '',
      isImage,
      iconClass: getChatFileIconClass(file.name),
      extensionLabel: ext ? ext.toUpperCase() : 'FILE',
    } satisfies AttachmentPreviewItem
  })

  selectedFiles.value = [...selectedFiles.value, ...nextFiles]
  previewItems.value = [...previewItems.value, ...nextPreviewItems]
}

const onAttachFileChange = (event: Event) => {
  if (!isFileAttachEnabled.value || props.disabled) return
  const input = event.target as HTMLInputElement
  const fileList = input.files
  if (!fileList?.length) return
  appendAttachmentPreview(Array.from(fileList))
  input.value = ''
}

const onAttachDragEnter = () => {
  if (!isFileAttachEnabled.value) return
  isDragging.value = true
}

const onAttachDragOver = () => {
  if (!isFileAttachEnabled.value) return
  isDragging.value = true
}

const onAttachDragLeave = (event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null
  if (!currentTarget) {
    isDragging.value = false
    return
  }
  if (relatedTarget && currentTarget.contains(relatedTarget)) return
  isDragging.value = false
}

const onAttachDrop = (event: DragEvent) => {
  isDragging.value = false
  if (!isFileAttachEnabled.value || props.disabled) return
  const files = event.dataTransfer?.files
  if (!files?.length) return
  appendAttachmentPreview(Array.from(files))
}

const removeAttachment = (targetId: string) => {
  const target = previewItems.value.find((item) => item.id === targetId)
  if (!target) return
  revokePreviewUrl(targetId)
  previewItems.value = previewItems.value.filter((item) => item.id !== targetId)
  selectedFiles.value = selectedFiles.value.filter((file) => !isSameFile(file, target.file))
}

const clearAttachments = () => {
  previewItems.value.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
  })
  previewItems.value = []
  selectedFiles.value = []
}

watch(isFileAttachEnabled, (enabled) => {
  if (!enabled) {
    isDragging.value = false
    clearAttachments()
  }
})

onBeforeUnmount(() => {
  previewItems.value.forEach((item) => {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl)
    }
  })
})

const handleStop = async () => {
  if (!chatRoom.value.roomId) return
  // 응답 중단 시 다음 추천 질문은 생성하지 않음
  markStoppedByUser()
  await ensureWebSocketAndSend(buildStopPayload(chatRoom.value.roomId))
}

const handleSend = async () => {
  if (isSending.value) return
  if (props.disabled) return
  if (isSearchModeMissingSubOptions.value) return
  const filesToSend = isFileAttachEnabled.value ? selectedFiles.value : []
  // RISK(리스크진단): RFP 파일 첨부 필수 — 데이터셋만 선택하고 전송 시 업로드 요청
  if (riskAgentActive.value && filesToSend.length === 0) {
    openToast({ message: 'RFP 파일을 업로드한 뒤 진단을 요청하세요.', type: 'warning' })
    return
  }
  if (filesToSend.length > 0 && !validateAttachmentFiles(filesToSend)) return

  // RISK 에이전트: 텍스트 입력이 없을 때 첨부 파일명 기반 content 자동 생성
  const riskAutoContent =
    riskAgentActive.value && !props.modelValue.trim()
      ? filesToSend[0]?.name
        ? `${filesToSend[0].name} 리스크 진단 요청`
        : 'RFP 리스크 진단 요청'
      : undefined

  isSending.value = true
  try {
    let sent = false
    if (!chatRoom.value.roomId) {
      sent = await createChatRoom(riskAutoContent ?? props.modelValue, filesToSend)
    } else {
      sent = await onSend(filesToSend, riskAutoContent)
    }
    if (sent) {
      clearAttachments()
    }
  } finally {
    isSending.value = false
  }
}
</script>

<style lang="scss" scoped>
/* 다음 추천 질문 — 검색창 위 칩 버튼 */
.chat-next-questions {
  margin-bottom: $spacing-sm;
  padding: 0 44px;

  &-loading {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    @include typo($body-xsmall, $color-text-muted);
  }

  &-loading-dots {
    display: inline-flex;
    align-items: center;
    gap: 2px;

    i {
      display: block;
      width: 4px;
      height: 4px;
      background-color: $color-text-muted;
      border-radius: 50%;
      animation: chat-next-question-dot 1.2s ease-in-out infinite;

      &:nth-child(2) {
        animation-delay: 0.15s;
      }

      &:nth-child(3) {
        animation-delay: 0.3s;
      }
    }
  }

  &-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-sm;
  }
}

.chat-next-question-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: #fff;
  cursor: pointer;
  text-align: left;
  @include typo($body-small, $color-text-heading-sub);
  transition:
    border-color $transition-fast,
    background-color $transition-fast;

  &:hover {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb, 60, 105, 219), 0.04);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

/* 데이터분석 인라인 자동완성 — 다음질문 틀 재사용 + 일치 글자 테마색 하이라이트 */
.chat-data-ac-btn:hover {
  border-color: var(--chat-ac-theme, var(--color-primary));
}

.chat-data-ac-term {
  @include typo($body-small, $color-text-heading);
  font-weight: 600;
}

.chat-data-ac-hit {
  background: transparent;
  color: var(--chat-ac-theme, var(--color-primary));
  font-weight: 800;
}

.chat-data-ac-fade-enter-active,
.chat-data-ac-fade-leave-active {
  transition: opacity 0.18s ease;
}

.chat-data-ac-fade-enter-from,
.chat-data-ac-fade-leave-to {
  opacity: 0;
}

@keyframes chat-next-question-dot {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

/* 첨부 버튼: PDF 전용 모드일 때 아이콘 우상단 뱃지 */
.btn-chat-attach-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-chat-attach-pdf-badge {
  position: absolute;
  top: -4px;
  right: -7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 12px;
  padding: 0 3px;
  border: 1px solid #fff;
  border-radius: 999px;
  background: #db3b76;
  color: #fff;
  font-size: 7px;
  font-weight: $font-weight-bold;
  line-height: 1;
  letter-spacing: -0.02em;
  pointer-events: none;
}

/* 전송 중: 전송 아이콘 대신 버튼 안에 맞는 스피너 */
.btn-chat-send-spinner {
  display: block;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: chat-send-spin 0.75s linear infinite;
}

@keyframes chat-send-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 응답 중단: 전송 아이콘 대신 정지(사각형) 아이콘 */
.icon-stop {
  display: block;
  width: 14px;
  height: 14px;
  background-color: #fff;
  border-radius: $border-radius-sm;
}

/* 데이터분석 게이트: 검증 모드 — 전송과 동일 스타일, 아이콘만 다름 (살짝 톤 구분) */
.btn-chat-send.is-validate-mode {
  filter: saturate(0.92);
}

/* 검증 통과 → 요청 버튼 전환 강조 (한 번 펄스 + 글로우) */
.btn-chat-send.is-just-unlocked {
  animation: chat-send-unlock 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes chat-send-unlock {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb, 60, 105, 219), 0.55);
  }
  35% {
    transform: scale(1.16);
    box-shadow: 0 0 0 8px rgba(var(--color-primary-rgb, 60, 105, 219), 0);
  }
  60% {
    transform: scale(0.96);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb, 60, 105, 219), 0);
  }
}
</style>
