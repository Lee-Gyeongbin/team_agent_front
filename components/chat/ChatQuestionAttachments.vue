<template>
  <ul
    ref="listRef"
    class="message-user-attachments"
    :class="{ 'is-single-image': isSingleImageRow }"
  >
    <li
      v-for="item in attachments"
      :key="item.chatFileId"
      class="message-user-attach-item"
    >
      <button
        v-if="isAttachmentImage(item)"
        type="button"
        class="message-user-attach message-user-attach--image"
        :aria-label="`${item.fileName} 미리보기`"
        @click="openPreview(item)"
      >
        <img
          v-if="thumbSrc(item)"
          :src="thumbSrc(item)"
          :alt="item.fileName"
          class="message-user-attach-img"
          loading="lazy"
          @error="onThumbError(item.chatFileId)"
        />
        <span
          v-else
          class="message-user-attach-img-fallback"
        >
          <i
            v-if="!isThumbLoading(item.chatFileId)"
            :class="['icon', 'icon-document', 'size-24']"
          />
          <span
            v-else
            class="message-user-attach-thumb-loading"
            aria-hidden="true"
          />
        </span>
      </button>
      <button
        v-else
        type="button"
        class="message-user-attach message-user-attach--file"
        :aria-label="`${item.fileName} 미리보기`"
        @click="openPreview(item)"
      >
        <span class="message-user-attach-icon-wrap">
          <i :class="['icon', 'size-20', getChatFileIconClass(item.fileName)]" />
        </span>
        <span class="message-user-attach-meta">
          <span class="message-user-attach-name">{{ item.fileName }}</span>
          <span class="message-user-attach-type">{{ getChatFileTypeLabel(item.fileName) }}</span>
        </span>
      </button>
    </li>
  </ul>
  <ChatAttachmentPreviewModal
    :is-open="previewOpen"
    :chat-file-id="previewTarget?.chatFileId ?? ''"
    :file-name="previewTarget?.fileName ?? ''"
    :mime-type="previewTarget?.mimeType ?? ''"
    :local-preview-url="previewTarget?.localPreviewUrl"
    @update:is-open="onPreviewOpenChange"
  />
</template>

<script setup lang="ts">
import type { ChatMessageAttachment } from '~/types/chat'
import {
  getChatAttachmentExtension,
  getChatFileIconClass,
  getChatFileTypeLabel,
  isImageAttachmentExtension,
} from '~/utils/chat/chatAttachmentDisplayUtil'

const props = defineProps<{
  attachments: ChatMessageAttachment[]
}>()

const { fetchViewChatFile } = useReportsApi()

const listRef = ref<HTMLElement | null>(null)
const previewOpen = ref(false)
const previewTarget = ref<ChatMessageAttachment | null>(null)

/** 새로고침 후 등: API로 받은 이미지 썸네일 URL (chatFileId → url) */
const resolvedThumbUrl = ref<Record<string, string>>({})
/** 썸네일 URL 조회 실패 시 재시도 방지 */
const thumbFailedIds = ref<Record<string, boolean>>({})
/** 원격 썸네일 요청 중 (로딩 링 표시) */
const thumbLoadingIds = ref<Set<string>>(new Set())
/** 동일 chatFileId 중복 fetch 방지 */
const thumbInflightIds = ref<Record<string, boolean>>({})

let remoteThumbLoadGen = 0
let thumbObserver: IntersectionObserver | null = null

const isAttachmentImage = (item: ChatMessageAttachment) => {
  const ext = getChatAttachmentExtension(item.fileName)
  if (isImageAttachmentExtension(ext)) return true
  return String(item.mimeType ?? '').startsWith('image/')
}

const isThumbLoading = (chatFileId: string) => thumbLoadingIds.value.has(String(chatFileId ?? '').trim())

const thumbSrc = (item: ChatMessageAttachment): string | undefined => {
  const id = String(item.chatFileId ?? '').trim()
  if (item.localPreviewUrl) return item.localPreviewUrl
  const u = id ? resolvedThumbUrl.value[id] : ''
  return u?.trim() || undefined
}

const onThumbError = (chatFileId: string) => {
  const id = String(chatFileId ?? '').trim()
  if (!id) return
  thumbFailedIds.value = { ...thumbFailedIds.value, [id]: true }
  resolvedThumbUrl.value = Object.fromEntries(Object.entries(resolvedThumbUrl.value).filter(([k]) => k !== id))
}

const loadRemoteImageThumbs = async () => {
  const gen = ++remoteThumbLoadGen
  const targets = props.attachments.filter((item) => {
    if (!isAttachmentImage(item)) return false
    if (item.localPreviewUrl) return false
    const id = String(item.chatFileId ?? '').trim()
    if (!id || thumbFailedIds.value[id]) return false
    if (resolvedThumbUrl.value[id]) return false
    if (thumbInflightIds.value[id]) return false
    return true
  })

  if (targets.length === 0) return

  for (const item of targets) {
    const id = String(item.chatFileId ?? '').trim()
    thumbInflightIds.value = { ...thumbInflightIds.value, [id]: true }
  }

  const loading = new Set(thumbLoadingIds.value)
  for (const item of targets) {
    loading.add(String(item.chatFileId))
  }
  thumbLoadingIds.value = loading

  await Promise.all(
    targets.map(async (item) => {
      const id = String(item.chatFileId ?? '').trim()
      try {
        const res = await fetchViewChatFile(id)
        if (gen !== remoteThumbLoadGen) return
        const vt = String(res.viewType ?? '').toUpperCase()
        const url = String(res.url ?? '').trim()
        if (vt === 'IMAGE' && url) {
          resolvedThumbUrl.value = { ...resolvedThumbUrl.value, [id]: url }
        } else {
          thumbFailedIds.value = { ...thumbFailedIds.value, [id]: true }
        }
      } catch {
        if (gen === remoteThumbLoadGen) {
          thumbFailedIds.value = { ...thumbFailedIds.value, [id]: true }
        }
      } finally {
        thumbInflightIds.value = Object.fromEntries(Object.entries(thumbInflightIds.value).filter(([k]) => k !== id))
        const next = new Set(thumbLoadingIds.value)
        next.delete(id)
        thumbLoadingIds.value = next
      }
    }),
  )
}

/** 아직 썸네일을 로드하지 않은 이미지 첨부파일이 있는지 확인 */
const hasPendingImageThumbs = () =>
  props.attachments.some((item) => {
    if (!isAttachmentImage(item)) return false
    if (item.localPreviewUrl) return false
    const id = String(item.chatFileId ?? '').trim()
    return id && !thumbFailedIds.value[id] && !resolvedThumbUrl.value[id] && !thumbInflightIds.value[id]
  })

/**
 * IntersectionObserver를 (재)설정한다.
 * - 로드할 이미지가 없으면 옵저버를 달지 않는다.
 * - 이미 뷰포트 안에 있으면 콜백이 즉시 실행되어 썸네일을 바로 로드한다.
 * - 뷰포트 밖이면 스크롤로 보이는 순간 로드한다.
 */
const setupThumbObserver = () => {
  thumbObserver?.disconnect()
  thumbObserver = null

  if (!hasPendingImageThumbs() || !listRef.value) return

  thumbObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        void loadRemoteImageThumbs()
        thumbObserver?.disconnect()
        thumbObserver = null
      }
    },
    { threshold: 0 },
  )
  thumbObserver.observe(listRef.value)
}

// 마운트 후 최초 1회 옵저버 설정
onMounted(() => {
  setupThumbObserver()
})

// 첨부파일 목록이 바뀌면 옵저버 재설정 (새 이미지 추가 대응)
watch(
  () => props.attachments,
  () => {
    setupThumbObserver()
  },
  { deep: true },
)

onUnmounted(() => {
  thumbObserver?.disconnect()
  thumbObserver = null
})

const isSingleImageRow = computed(() => props.attachments.length === 1 && isAttachmentImage(props.attachments[0]))

const openPreview = (item: ChatMessageAttachment) => {
  previewTarget.value = item
  previewOpen.value = true
}

const onPreviewOpenChange = (v: boolean) => {
  previewOpen.value = v
  if (!v) {
    previewTarget.value = null
  }
}
</script>
