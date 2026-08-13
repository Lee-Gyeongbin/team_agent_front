<template>
  <!-- 안내 배너 -->
  <div class="pt-cover-notice">
    💡 표지는 선택 항목입니다. 표지를 생성하지 않아도 기본 타이포그래피 표지로 다음 단계 진행이 가능합니다.
  </div>

  <!-- 2컬럼 그리드: 캔버스 | 채팅 -->
  <div class="pt-cover-grid">
    <!-- 좌측: 표지 이미지 미리보기 -->
    <div class="pt-cover-canvas-col">
      <div class="pt-cover-col-title">미리보기</div>

      <!-- 로딩 중 -->
      <div
        v-if="isLoadingImage"
        class="pt-cover-canvas is-empty"
      >
        <UiEmpty
          icon="icon-image"
          title="이미지를 불러오는 중입니다..."
        />
      </div>

      <!-- 이미지 있음: presigned URL로 표지 표시 (클릭 시 전체화면 미리보기) -->
      <div
        v-else-if="coverPresignedUrl"
        class="pt-cover-canvas is-clickable"
        title="클릭하여 크게 보기"
        @click="isPreviewOpen = true"
      >
        <img
          :src="coverPresignedUrl"
          alt="표지 이미지"
          class="pt-cover-canvas-img"
        />
      </div>

      <!-- 이미지 없음: 안내 빈 상태 -->
      <div
        v-else
        class="pt-cover-canvas is-empty"
      >
        <UiEmpty
          icon="icon-image"
          title="아직 표지 이미지가 생성되지 않았어요"
          desc="상단의 '표지 재생성' 버튼을 눌러 표지를 생성해 주세요."
        />
      </div>

      <div class="pt-cover-canvas-caption">표지 미리보기 · 클릭하면 크게 볼 수 있습니다</div>
    </div>

    <!-- 표지 이미지 전체화면 미리보기 모달 -->
    <ChatAttachmentPreviewModal
      :is-open="isPreviewOpen"
      chat-file-id=""
      file-name="표지 이미지"
      mime-type="image/png"
      size="large"
      :local-preview-url="coverPresignedUrl ?? undefined"
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
          placeholder="표지 스타일 수정을 요청하세요..."
          :disabled="isSending"
          @keydown.enter.exact.prevent="onSend"
        />
        <UiButton
          variant="primary"
          size="sm"
          class="pt-cover-chat-send"
          :disabled="isSending || !chatInput.trim()"
          @click="onSend"
        >
          {{ isSending ? '전송 중...' : '전송' }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProposalApi } from '~/composables/proposal/useProposalApi'

// ── 타입 정의 ────────────────────────────────────────────────────────────────

interface CoverChatMessage {
  role: 'user' | 'assistant'
  text: string
}

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  ptProjectId: string
  /** TB_PT_TEMPLATE.COVER_IMAGE_PATH (NCP object key). 변경 시 presigned URL 재조회. */
  coverImagePath?: string | null
}>()

// ── API ───────────────────────────────────────────────────────────────────────

const { fetchViewPtCoverImage } = useProposalApi()

// ── 표지 이미지 presigned URL ─────────────────────────────────────────────────

const coverPresignedUrl = ref<string | null>(null)
const isLoadingImage = ref(false)
const isPreviewOpen = ref(false)

const loadCoverImage = async (path: string | null | undefined) => {
  if (!path) {
    coverPresignedUrl.value = null
    return
  }
  isLoadingImage.value = true
  try {
    const res = await fetchViewPtCoverImage(props.ptProjectId)
    coverPresignedUrl.value = res.url ?? null
  } catch {
    coverPresignedUrl.value = null
  } finally {
    isLoadingImage.value = false
  }
}

// coverImagePath가 바뀔 때마다 presigned URL 재조회 (생성 완료 후 자동 반영)
watch(
  () => props.coverImagePath,
  (newPath) => loadCoverImage(newPath),
  { immediate: true },
)

// ── 상태 ─────────────────────────────────────────────────────────────────────

const chatMessages = ref<CoverChatMessage[]>([
  {
    role: 'assistant',
    text: '사업 특성을 분석해 표지 배경 이미지를 생성했어요. 마음에 들지 않으면 아래에 보완 요청을 해주세요.',
  },
])
const chatInput = ref('')
const isSending = ref(false)
const chatLogRef = ref<HTMLElement | null>(null)

// ── 채팅 전송 ─────────────────────────────────────────────────────────────────

const scrollChatToBottom = async () => {
  await nextTick()
  if (chatLogRef.value) {
    chatLogRef.value.scrollTop = chatLogRef.value.scrollHeight
  }
}

const onSend = async () => {
  const text = chatInput.value.trim()
  if (!text || isSending.value) return

  chatMessages.value.push({ role: 'user', text })
  chatInput.value = ''
  isSending.value = true
  await scrollChatToBottom()

  await new Promise((r) => setTimeout(r, 800))

  // TODO: 백엔드 연동 필요 - POST /api/pt/{ptProjectId}/cover/refine
  chatMessages.value.push({
    role: 'assistant',
    text: '요청 사항을 반영해서 표지를 다시 생성할게요. 잠시만 기다려 주세요.',
  })
  isSending.value = false
  await scrollChatToBottom()
}
</script>
