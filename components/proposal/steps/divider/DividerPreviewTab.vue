<template>
  <div
    class="pt-divider-preview-tab"
    :class="{ 'is-portrait': isPortrait }"
    :style="canvasVarStyle"
  >
    <!-- 안내 배너 -->
    <div class="pt-cover-notice">
      💡 간지는 선택 항목입니다. 간지를 생성하지 않아도 기본 타이포그래피 간지로 다음 단계 진행이 가능합니다.
    </div>

    <!-- 2컬럼 그리드: 캔버스 | 채팅 -->
    <div class="pt-cover-grid">
      <!-- 좌측: 간지 이미지 미리보기 -->
      <div class="pt-cover-canvas-col">
        <div class="pt-cover-col-title">미리보기</div>

        <!-- 로딩 중 -->
        <div
          v-if="isLoadingImage"
          class="pt-cover-canvas is-empty"
          :style="canvasBoxStyle"
        >
          <UiEmpty
            icon="icon-image"
            title="이미지를 불러오는 중입니다..."
          />
        </div>

        <!-- 이미지 있음: presigned URL로 간지 표시 (클릭 시 전체화면 미리보기) -->
        <div
          v-else-if="dividerPresignedUrl"
          class="pt-cover-canvas is-clickable"
          :style="canvasBoxStyle"
          title="클릭하여 크게 보기"
          @click="isPreviewOpen = true"
        >
          <img
            :src="dividerPresignedUrl"
            alt="간지 이미지"
            class="pt-cover-canvas-img"
          />
        </div>

        <!-- 이미지 없음: 안내 빈 상태 -->
        <div
          v-else
          class="pt-cover-canvas is-empty"
          :style="canvasBoxStyle"
        >
          <UiEmpty
            icon="icon-image"
            title="아직 간지 이미지가 생성되지 않았어요"
            desc="상단의 '간지 재생성' 버튼을 눌러 간지를 생성해 주세요."
          />
        </div>

        <div class="pt-cover-canvas-caption">간지 미리보기 · 클릭하면 크게 볼 수 있습니다</div>
      </div>

      <!-- 간지 이미지 전체화면 미리보기 모달 -->
      <ChatAttachmentPreviewModal
        :is-open="isPreviewOpen"
        chat-file-id=""
        file-name="간지 이미지"
        mime-type="image/png"
        size="large"
        :local-preview-url="dividerPresignedUrl ?? undefined"
        @close="isPreviewOpen = false"
        @update:is-open="isPreviewOpen = $event"
      />

      <!-- 우측: AI 보완 요청 채팅 -->
      <div class="pt-cover-chat-col">
        <div class="pt-cover-col-title">AI 보완 요청</div>

        <!-- 채팅 로그 -->
        <div
          ref="chatLogRef"
          class="pt-cover-chat-log"
        >
          <div
            v-for="(msg, idx) in chatMessages"
            :key="idx"
            :class="['pt-cover-chat-bubble', { 'is-user': msg.role === 'user' }]"
          >
            {{ msg.text }}
          </div>
          <div
            v-if="isSending"
            class="pt-cover-chat-bubble pt-chat-typing"
          >
            <span /><span /><span />
          </div>
        </div>

        <!-- 힌트 예시 -->
        <div class="pt-cover-chat-hints">
          <div class="pt-cover-chat-hint">예) 배경을 더 차분하고 미니멀하게 바꿔줘</div>
          <div class="pt-cover-chat-hint">예) 강조색을 파란 계열로 변경해줘</div>
          <div class="pt-cover-chat-hint">예) 좌측에 세로 포인트 라인을 추가해줘</div>
        </div>

        <!-- 입력 영역 -->
        <div class="pt-cover-chat-input-wrap">
          <textarea
            v-model="chatInput"
            class="pt-cover-chat-input"
            placeholder="간지 스타일 수정을 요청하세요..."
            :disabled="isSending || !hasDividerImage"
            @keydown.enter.exact.prevent="onSend"
          />
          <UiButton
            variant="primary"
            size="sm"
            class="pt-cover-chat-send"
            :loading="isSending"
            :disabled="isSending || !chatInput.trim() || !hasDividerImage"
            @click="onSend"
          >
            전송
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'

interface DividerChatMessage {
  role: 'user' | 'ai'
  text: string
}

const props = defineProps<{
  ptProjectId: string
  agentId: string
  /** TB_PT_TEMPLATE.DIVIDER_IMAGE_PATH (NCP object key). 변경 시 presigned URL 재조회. */
  dividerImagePath?: string | null
  /** 슬라이드 비율 (예: '595 / 842'). 미지정 시 16/9. */
  aspectRatio?: string
  /** 부모가 재생성 완료 시 증가시키는 카운터. 경로가 동일해도 강제 이미지 재조회 트리거. */
  reloadKey?: number
}>()

const resolvedAspectRatio = computed(() => props.aspectRatio || '16 / 9')

const isPortrait = computed(() => {
  const [w, h] = resolvedAspectRatio.value.split('/').map((s) => Number(s.trim()))
  return Boolean(w && h && w < h)
})

const canvasVarStyle = computed<Record<string, string>>(() => {
  const ratioStr = resolvedAspectRatio.value
  const [w, h] = ratioStr.split('/').map((s) => Number(s.trim()))
  const numeric = w > 0 && h > 0 ? w / h : 16 / 9
  return {
    '--cover-aspect': ratioStr,
    '--cover-ratio': String(numeric),
  }
})

const canvasBoxStyle = computed(() => ({ aspectRatio: resolvedAspectRatio.value }))

const emit = defineEmits<{
  'divider-updated': [dividerImagePath: string]
}>()

const { fetchViewPtDividerImage, fetchChatDivider } = useProposalApi()

const hasDividerImage = computed(() => Boolean(props.dividerImagePath))

// ── 간지 이미지 presigned URL ──────────────────────────────────────────────────

const dividerPresignedUrl = ref<string | null>(null)
const isLoadingImage = ref(false)
const isPreviewOpen = ref(false)

const loadDividerImage = async (path: string | null | undefined) => {
  if (!path) {
    dividerPresignedUrl.value = null
    return
  }
  isLoadingImage.value = true
  try {
    const res = await fetchViewPtDividerImage(props.ptProjectId)
    dividerPresignedUrl.value = res.url ?? null
  } catch {
    dividerPresignedUrl.value = null
  } finally {
    isLoadingImage.value = false
  }
}

// dividerImagePath 또는 reloadKey가 바뀔 때마다 presigned URL 재조회
// reloadKey: 경로가 동일한 채로 파일만 교체된 경우(재생성)에도 강제로 새 URL을 받아오기 위해 사용
watch([() => props.dividerImagePath, () => props.reloadKey], ([newPath]) => loadDividerImage(newPath), {
  immediate: true,
})

// ── 상태 ──────────────────────────────────────────────────────────────────────

const chatMessages = ref<DividerChatMessage[]>([
  {
    role: 'ai',
    text: '사업 특성을 분석해 간지 배경 이미지를 생성했어요. 마음에 들지 않으면 아래에 보완 요청을 해주세요.',
  },
])
const chatInput = ref('')
const isSending = ref(false)
const chatLogRef = ref<HTMLElement | null>(null)

// ── 채팅 전송 ──────────────────────────────────────────────────────────────────

const scrollChatToBottom = async () => {
  await nextTick()
  if (chatLogRef.value) {
    chatLogRef.value.scrollTop = chatLogRef.value.scrollHeight
  }
}

watch(chatMessages, () => scrollChatToBottom(), { deep: true })

const onSend = async () => {
  const text = chatInput.value.trim()
  if (!text || isSending.value || !hasDividerImage.value) return

  chatMessages.value.push({ role: 'user', text })
  chatInput.value = ''
  isSending.value = true
  await scrollChatToBottom()

  try {
    const res = await fetchChatDivider(props.ptProjectId, props.agentId, text)

    if (res.result !== 'OK') {
      openToast({ message: res.msg ?? '보완 요청 처리 중 오류가 발생했습니다.', type: 'error' })
      chatMessages.value.pop()
      return
    }

    const aiMsg = res.data?.aiMessage ?? '보완 요청이 처리되었습니다.'
    chatMessages.value.push({ role: 'ai', text: aiMsg })

    const newPath = res.data?.dividerImagePath
    if (newPath && newPath !== props.dividerImagePath) {
      emit('divider-updated', newPath)
    } else {
      await loadDividerImage(newPath ?? props.dividerImagePath)
    }
  } catch (e) {
    console.warn('[DividerPreviewTab] 간지 보완 요청 실패:', e)
    openToast({ message: '보완 요청 전송 중 오류가 발생했습니다.', type: 'error' })
    chatMessages.value.pop()
  } finally {
    isSending.value = false
    await scrollChatToBottom()
  }
}
</script>
