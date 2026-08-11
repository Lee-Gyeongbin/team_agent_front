<template>
  <UiModal
    :is-open="isOpen"
    title="채널로 보내기"
    position="center"
    max-width="800px"
    custom-class="marketing-channel-send-modal"
    @close="onClose"
  >
    <div class="marketing-channel-send-modal__body">
      <div class="marketing-channel-send-modal__summary">
        <div class="marketing-channel-send-modal__summary-head">
          <span>채널</span>
          <span>복사</span>
        </div>
        <div class="marketing-channel-send-modal__summary-body">
          <div class="marketing-channel-send-modal__channel-value">
            <i :class="[channelIcon, 'size-20']" />
            <strong>{{ delivery.label || channel }}</strong>
          </div>
          <div class="marketing-channel-send-modal__copy-actions">
            <button
              type="button"
              class="marketing-channel-send-modal__copy-btn"
              :disabled="isBusy || !body.trim()"
              @click="onCopyText"
            >
              <i class="icon-copy size-16" />
              텍스트 복사하기
            </button>
            <button
              type="button"
              class="marketing-channel-send-modal__copy-btn"
              :disabled="isBusy || !imageUrl"
              @click="onCopyImage"
            >
              <i class="icon-image size-16" />
              이미지 복사하기
            </button>
            <button
              type="button"
              class="marketing-channel-send-modal__copy-btn"
              :disabled="isBusy || (!body.trim() && !imageUrl)"
              @click="onCopyBoth"
            >
              <i class="icon-copy size-16" />
              함께 복사하기
            </button>
          </div>
        </div>
      </div>

      <div class="marketing-channel-send-modal__scroll">
        <div class="marketing-channel-send-modal__preview">
          <strong class="marketing-channel-send-modal__section-label">텍스트 미리보기</strong>
          <!-- eslint-disable vue/no-v-html — escapeHtml 후 해시태그 태그만 주입 -->
          <div
            class="marketing-channel-send-modal__preview-body"
            v-html="renderedBody"
          />
          <!-- eslint-enable vue/no-v-html -->
        </div>

        <div
          v-if="imageUrl"
          class="marketing-channel-send-modal__image"
        >
          <strong class="marketing-channel-send-modal__section-label">이미지 미리보기</strong>
          <img
            :src="imageUrl"
            alt="게시할 마케팅 이미지"
            class="marketing-channel-send-modal__thumb"
          />
        </div>
      </div>

      <div class="marketing-channel-send-modal__tip">
        <i class="icon-info size-16" />
        <p>
          {{
            delivery.externalUrl
              ? '위 내용을 클립보드에 복사한 뒤 채널 작성 화면으로 이동합니다. 이동 후 붙여넣어 게시해 주세요.'
              : '위 내용을 클립보드에 복사합니다. 채널 작성 화면에 붙여넣어 게시해 주세요.'
          }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="xlg"
          :disabled="isCopying"
          @click="onClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          :disabled="isBusy || (!body.trim() && !imageUrl)"
          @click="onConfirm"
        >
          {{ delivery.externalUrl ? '복사 후 이동' : '복사하기' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
import {
  copyMarketingPayloadToClipboard,
  renderMarketingTextHtml,
  resolveChannelDelivery,
} from '~/utils/marketing/marketingUtil'

const CHANNEL_ICONS: Record<string, string> = {
  INSTAGRAM: 'icon-sns',
  FACEBOOK: 'icon-sns',
  LINKEDIN: 'icon-sns',
  X: 'icon-sns',
  YOUTUBE_COMMUNITY: 'icon-sns',
  KAKAO_TALK: 'icon-sns',
  SMS: 'icon-sns',
  PROMOTION_EMAIL: 'icon-email',
  NEWSLETTER: 'icon-email',
  OWNED_BLOG: 'icon-document-edit',
  NAVER_BLOG: 'icon-document-edit',
}

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    channel: string
    body: string
    imageUrl?: string
  }>(),
  {
    isOpen: false,
    imageUrl: '',
  },
)

const emit = defineEmits<{
  close: []
}>()

const isCopying = ref(false)
const isPendingNavigate = ref(false)
let navigateTimer: ReturnType<typeof setTimeout> | null = null

const clearNavigateTimer = () => {
  if (!navigateTimer) return
  clearTimeout(navigateTimer)
  navigateTimer = null
  isPendingNavigate.value = false
}

const isBusy = computed(() => isCopying.value || isPendingNavigate.value)

const delivery = computed(() => resolveChannelDelivery(props.channel))
const channelIcon = computed(() => CHANNEL_ICONS[props.channel] ?? 'icon-globe')

const renderedBody = computed(() => renderMarketingTextHtml(props.body))

const onClose = () => {
  if (isCopying.value) return
  clearNavigateTimer()
  emit('close')
}

onBeforeUnmount(() => {
  clearNavigateTimer()
})

const onCopyText = async () => {
  const content = props.body.trim()
  if (!content) return
  try {
    await copyToClipboard(content)
    openToast({ message: '텍스트를 클립보드에 복사했습니다.' })
  } catch {
    openToast({ message: '텍스트 복사에 실패했습니다.', type: 'error' })
  }
}

const onCopyImage = async () => {
  const url = props.imageUrl.trim()
  if (!url) return

  try {
    const result = await copyMarketingPayloadToClipboard('', url)
    if (result.imageCopied) {
      openToast({ message: '이미지를 클립보드에 복사했습니다.' })
      return
    }
    throw new Error('image copy failed')
  } catch {
    try {
      await copyToClipboard(url)
      openToast({ message: '이미지 직접 복사를 지원하지 않아 이미지 주소를 복사했습니다.', type: 'warning' })
    } catch {
      openToast({ message: '이미지 복사에 실패했습니다.', type: 'error' })
    }
  }
}

const notifyCopyBothResult = (result: { textCopied: boolean; imageCopied: boolean }) => {
  if (result.textCopied && result.imageCopied) {
    openToast({
      message: '텍스트와 이미지를 함께 복사했습니다. 채널에서는 붙여넣기 시 하나만 적용될 수 있습니다.',
    })
    return
  }
  if (result.textCopied) {
    openToast({ message: '텍스트만 복사되었습니다.', type: 'warning' })
    return
  }
  if (result.imageCopied) {
    openToast({ message: '이미지만 복사되었습니다.', type: 'warning' })
  }
}

const onCopyBoth = async () => {
  const content = props.body.trim()
  const url = props.imageUrl.trim()
  if (!content && !url) return

  try {
    const result = await copyMarketingPayloadToClipboard(content, url)
    notifyCopyBothResult(result)
  } catch {
    openToast({ message: '함께 복사에 실패했습니다.', type: 'error' })
  }
}

const onConfirm = async () => {
  if (isBusy.value || (!props.body.trim() && !props.imageUrl)) return

  const content = props.body.trim()
  const url = delivery.value.externalUrl
  clearNavigateTimer()
  isCopying.value = true
  try {
    const result = await copyMarketingPayloadToClipboard(content, props.imageUrl)
    notifyCopyBothResult(result)
  } catch {
    openToast({ message: '클립보드 복사에 실패했습니다.', type: 'error' })
    return
  } finally {
    isCopying.value = false
  }

  if (!url) return

  isPendingNavigate.value = true
  navigateTimer = setTimeout(() => {
    navigateTimer = null
    isPendingNavigate.value = false
    window.open(url, '_blank', 'noopener,noreferrer')
  }, 1000)
}
</script>
