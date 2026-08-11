<template>
  <div
    ref="layoutRef"
    class="pt-stepD-layout"
    :style="layoutStyle"
  >
    <!-- 좌측: 목차 트리 (대목차=헤더/클릭불가, 소목차=클릭가능) -->
    <div class="pt-stepD-left">
      <div class="pt-sec-list">
        <template
          v-for="item in rawTocList"
          :key="item.tocId"
        >
          <!-- 대목차 (parentId=null): 클릭 불가 헤더 -->
          <div
            v-if="item.parentId === null"
            class="pt-sec-group-title"
          >
            {{ item.title }}
          </div>
          <!-- 소목차 (자식 있음): 클릭 불가 서브 헤더 -->
          <div
            v-else-if="tocParentIdSet.has(item.tocId)"
            class="pt-sec-group-sub-title"
          >
            {{ item.title }}
          </div>
          <!-- 세부목차 또는 leaf 소목차: 클릭 가능 -->
          <div
            v-else
            :class="['pt-sec-item', { 'is-active': isLeafActive(item.tocId), 'is-done': isLeafDone(item.tocId) }]"
            @click="onSelectLeaf(item.tocId)"
          >
            <span
              :class="['pt-sec-dot', isLeafDone(item.tocId) ? 'is-done' : isLeafActive(item.tocId) ? 'is-active' : '']"
            />
            <span :class="['pt-sec-title', { 'is-bold': isLeafActive(item.tocId) }]">
              {{ item.title }}
            </span>
            <span
              v-if="leafSlideCount(item.tocId)"
              class="pt-sec-slide-badge"
            >
              {{ leafSlideCount(item.tocId) }}장
            </span>
          </div>
        </template>
        <UiEmpty
          v-if="rawTocList.length === 0"
          title="소목차가 없습니다."
        />
      </div>
    </div>

    <!-- 리사이저 1 -->
    <div
      class="pt-stepD-resizer"
      :class="{ 'is-resizing': resizingTarget === 'left' }"
      @mousedown="onResizeStart('left', $event)"
    />

    <!-- 중앙: 현재 소목차 미리보기 -->
    <div class="pt-stepD-center">
      <div
        v-if="activeSection"
        class="pt-gen-panel"
      >
        <div class="pt-gen-head">
          <div>
            <div class="pt-gen-title">{{ activeSection.title }}</div>
            <div class="pt-gen-sub">
              소목차 {{ activeSectionIndex + 1 }} / {{ sectionList.length }}
              <template v-if="currentSlides.length"> · {{ currentSlides.length }}장</template>
            </div>
          </div>
          <!-- 생성/재생성 버튼 -->
          <UiButton
            variant="outline"
            size="sm"
            :loading="isGenerating"
            @click="onGenerate"
          >
            <template #icon-left>
              <i class="icon-refresh size-14" />
            </template>
            {{ currentSlides.length ? '재생성' : '슬라이드 생성' }}
          </UiButton>
        </div>

        <!-- 생성 중 진행 표시 -->
        <div
          v-if="isGenerating"
          class="pt-gen-progress"
        >
          <div class="pt-gen-progress-bar" />
          <span class="pt-gen-progress-msg">{{ genProgressMsg || '생성 중...' }}</span>
        </div>

        <!-- 슬라이드 캐러셀 -->
        <div
          v-else-if="currentSlides.length"
          class="pt-slide-carousel"
        >
          <!-- 현재 슬라이드 미리보기 -->
          <div class="pt-slide-preview">
            <div
              v-if="activeSlide"
              class="pt-slide-mock"
              :class="`is-color-${activeSlide.colorIndex}`"
            >
              <!-- 항상 JSON 기반 목업 표시 (내용 검토용) -->
              <div class="pt-slide-eyebrow">{{ activeSlide.eyebrowTxt ?? 'PREVIEW' }}</div>
              <div class="pt-slide-ttl">{{ activeSlide.titleTxt ?? activeSection.title }}</div>
              <div
                v-if="activeSlide.subtitleTxt"
                class="pt-slide-sub"
              >
                {{ activeSlide.subtitleTxt }}
              </div>
              <div
                v-if="activeSlide.highlightBannerTxt"
                class="pt-slide-banner"
              >
                {{ activeSlide.highlightBannerTxt }}
              </div>
              <div class="pt-slide-body">
                <SlideComponentRenderer
                  v-for="(comp, idx) in activeSlideComponents"
                  :key="idx"
                  :component="comp"
                />
              </div>
              <div
                v-if="activeSlide.conclusionRibbonTxt"
                class="pt-slide-ribbon"
              >
                {{ activeSlide.conclusionRibbonTxt }}
              </div>
              <!-- 실패 표시 -->
              <div
                v-if="activeSlide.renderStatusCd === '004'"
                class="pt-slide-fail"
              >
                렌더링 실패 — 재생성 버튼을 눌러주세요
              </div>
            </div>

            <!-- 인포그래픽 이미지 상태 표시 -->
            <div
              v-if="activeSlide"
              class="pt-slide-image-status"
            >
              <template v-if="activeSlide.renderedImagePath">
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="openImageModal"
                >
                  <template #icon-left>
                    <i class="icon-view size-14" />
                  </template>
                  인포그래픽 이미지 보기
                </UiButton>
                <UiButton
                  variant="outline"
                  size="sm"
                  :loading="isRegeneratingImage"
                  @click="onRegenerateImage"
                >
                  <template #icon-left>
                    <i class="icon-refresh size-14" />
                  </template>
                  인포그래픽 재생성
                </UiButton>
              </template>
              <template v-else-if="activeSlide.renderStatusCd === '002'">
                <span class="pt-slide-image-rendering">
                  <i class="icon-sync size-16 pt-spin" />
                  인포그래픽 생성 중...
                </span>
              </template>
              <template v-else>
                <UiButton
                  variant="outline"
                  size="sm"
                  :loading="isRegeneratingImage"
                  @click="onRegenerateImage"
                >
                  <template #icon-left>
                    <i class="icon-refresh size-14" />
                  </template>
                  인포그래픽 이미지 생성
                </UiButton>
              </template>
            </div>
          </div>

          <!-- 썸네일 스트립 -->
          <div class="pt-slide-strip">
            <div
              v-for="(slide, idx) in currentSlides"
              :key="slide.slideId"
              :class="[
                'pt-slide-thumb',
                { 'is-active': idx === activeSlideIndex, 'is-fail': slide.renderStatusCd === '004' },
              ]"
              @click="activeSlideIndex = idx"
            >
              <span class="pt-slide-thumb-no">{{ slide.slideNo }}</span>
              <span
                v-if="slide.titleTxt"
                class="pt-slide-thumb-title"
                >{{ slide.titleTxt }}</span
              >
            </div>
          </div>
        </div>

        <!-- 슬라이드 미생성 상태 -->
        <div
          v-else
          class="pt-slide-empty"
        >
          <UiEmpty
            icon="icon-document"
            title="슬라이드를 생성하세요."
          />
        </div>

        <!-- 하단 액션 -->
        <div class="pt-gen-actions">
          <UiButton
            variant="ghost"
            size="md"
            :disabled="activeSectionIndex === 0"
            @click="emit('prev-section')"
          >
            <template #icon-left>
              <i class="icon-arrow-left-sm size-14" />
            </template>
            이전 소목차
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            :disabled="!currentSlides.length || isGenerating"
            @click="onConfirm"
          >
            이 소목차 확인 · 다음 진행
            <template #icon-right>
              <i class="icon-arrow-right size-14" />
            </template>
          </UiButton>
        </div>
      </div>
    </div>

    <!-- 리사이저 2 -->
    <div
      class="pt-stepD-resizer"
      :class="{ 'is-resizing': resizingTarget === 'right' }"
      @mousedown="onResizeStart('right', $event)"
    />

    <!-- 우측: 소목차별 보완요청 채팅 -->
    <div class="pt-stepD-right">
      <div
        v-if="activeSection"
        class="pt-chat-side"
      >
        <div class="pt-chat-head">💬 "{{ activeSection.title }}" 보완요청</div>
        <div
          ref="chatBodyRef"
          class="pt-chat-body"
        >
          <div
            v-for="(msg, idx) in currentMessages"
            :key="idx"
            :class="['pt-chat-msg', `is-${msg.role}`]"
          >
            {{ msg.text }}
          </div>
          <div
            v-if="isSending"
            class="pt-chat-msg is-ai pt-chat-typing"
          >
            <span /><span /><span />
          </div>
          <div
            v-if="!currentMessages.length && !isSending"
            class="pt-chat-hint"
          >
            예) 차별점을 구체적 수치로 강조해줘<br />예) 3번 슬라이드 제목을 더 강렬하게
          </div>
        </div>
        <div class="pt-chat-input">
          <input
            v-model="chatInput"
            class="pt-chat-input-field"
            placeholder="보완 요청을 입력하세요"
            :disabled="!currentSlides.length || isSending"
            @keydown.enter="onSendChat"
          />
          <UiButton
            variant="primary"
            size="sm"
            :loading="isSending"
            :disabled="!currentSlides.length"
            @click="onSendChat"
          >
            전송
          </UiButton>
        </div>
      </div>
    </div>
  </div>

  <!-- 인포그래픽 이미지 모달 -->
  <UiModal
    :is-open="isImageModalOpen"
    :title="activeSlide?.titleTxt ?? '인포그래픽 이미지'"
    custom-class="pt-image-view-modal"
    max-width="960px"
    @close="isImageModalOpen = false"
  >
    <UiLoading
      v-if="imageModalStatus === 'loading'"
      overlay
      text="이미지 불러오는 중..."
    />
    <div
      v-else-if="imageModalStatus === 'error'"
      class="pt-image-modal-error"
    >
      {{ imageModalError }}
    </div>
    <div
      v-else-if="imageModalStatus === 'ready' && imageModalUrl"
      class="pt-image-modal-img-wrap"
    >
      <img
        :src="imageModalUrl"
        class="pt-image-modal-img"
        :alt="activeSlide?.titleTxt"
      />
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { PtSection, PtSectionChatMessage, PtSlide, PtTocItem, SlideComponent } from '~/types/proposal'
import { useProposalSectionChat } from '~/composables/proposal/useProposalSectionChat'
import { openToast } from '~/composables/useToast'
import { openLoading, updateLoadingText, closeLoading } from '~/composables/useLoading'
import SlideComponentRenderer from '~/components/proposal/SlideComponentRenderer.vue'

const RENDER_IMAGE_STEP_MESSAGES: Record<string, string> = {
  load: '슬라이드 목록을 불러오는 중...',
  render: '이미지를 생성하는 중...',
}

const { fetchViewSlideImage, streamRenderSectionImages } = useProposalApi()

interface Props {
  sectionList: PtSection[]
  /** 트리 사이드바용 전체 TOC 목록 (대목차 + 소목차) */
  rawTocList: PtTocItem[]
  /** 소목차별 슬라이드 캐시 (슬라이드 생성 여부 표시용) */
  slidesCache: Record<string, PtSlide[]>
  activeSection: PtSection | null
  activeSectionIndex: number
  currentMessages: PtSectionChatMessage[]
  isSending: boolean
  isGenerating: boolean
  genProgressMsg: string
  /** 현재 활성 소목차의 슬라이드 목록 */
  currentSlides: PtSlide[]
  modelId: string
  agentId: string
  ptProjectId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** 소목차 리스트 클릭 시 해당 인덱스로 직접 이동 */
  'select-section': [index: number]
  'prev-section': []
  'confirm-section': [sectionId: string]
  'send-chat': [text: string]
  'generate-section': [tocId: string]
  /** 채팅 재생성 후 슬라이드 갱신 */
  'slides-updated': [slides: PtSlide[]]
}>()

const chatInput = ref('')
const chatBodyRef = ref<HTMLElement | null>(null)

// 현재 보고 있는 슬라이드 인덱스
const activeSlideIndex = ref(0)

// ── 레이아웃 리사이즈 (meeting2 동일 패턴) ──────────────────────────
const leftWidth = ref(22)
const rightWidth = ref(24)
const resizingTarget = ref<'left' | 'right' | null>(null)
const layoutRef = ref<HTMLElement | null>(null)

const layoutStyle = computed(() => ({
  '--stepD-left': `${leftWidth.value}%`,
  '--stepD-right': `${rightWidth.value}%`,
}))

const onResizeStart = (target: 'left' | 'right', e: MouseEvent) => {
  e.preventDefault()
  resizingTarget.value = target
  document.body.classList.add('is-resizing')

  const onMouseMove = (ev: MouseEvent) => {
    const rect = layoutRef.value?.getBoundingClientRect()
    const baseWidth = rect?.width || window.innerWidth
    const baseLeft = rect?.left || 0
    if (target === 'left') {
      const percent = ((ev.clientX - baseLeft) / baseWidth) * 100
      leftWidth.value = Math.min(32, Math.max(16, percent))
    } else {
      const percent = ((baseLeft + baseWidth - ev.clientX) / baseWidth) * 100
      rightWidth.value = Math.min(34, Math.max(18, percent))
    }
  }

  const onMouseUp = () => {
    resizingTarget.value = null
    document.body.classList.remove('is-resizing')
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 인포그래픽 이미지 모달
const isImageModalOpen = ref(false)
const imageModalStatus = ref<'loading' | 'ready' | 'error'>('loading')
const imageModalUrl = ref('')
const imageModalError = ref('')

// 인포그래픽 이미지 생성/재생성
const isRegeneratingImage = ref(false)
let renderEventSource: EventSource | null = null

// 현재 소목차에 이미 생성된 이미지가 하나라도 있는지
const hasSectionImages = computed(() => props.currentSlides.some((s) => s.renderedImagePath))

const openImageModal = async () => {
  if (!activeSlide.value?.slideId) return
  isImageModalOpen.value = true
  imageModalStatus.value = 'loading'
  imageModalUrl.value = ''
  imageModalError.value = ''

  try {
    const res = await fetchViewSlideImage(activeSlide.value.slideId)
    const vt = String(res.viewType ?? '').toUpperCase()
    if (vt === 'IMAGE' && res.url) {
      imageModalUrl.value = res.url
      imageModalStatus.value = 'ready'
    } else {
      imageModalError.value = res.reason?.trim() || '이미지를 불러올 수 없습니다.'
      imageModalStatus.value = 'error'
    }
  } catch {
    imageModalError.value = '이미지를 불러오는 중 오류가 발생했습니다.'
    imageModalStatus.value = 'error'
  }
}

const activeSlide = computed<PtSlide | null>(() => props.currentSlides[activeSlideIndex.value] ?? null)

// componentsJson 안전 파싱
// 백엔드가 세 가지 포맷으로 내려올 수 있으므로 통일된 { type, content } 구조로 정규화
// 포맷 1 (표준): { type: "card_grid", content: { cards: [...] } }
// 포맷 2 (flat):  { type: "card_grid", cards: [...] }
// 포맷 3 (키형): { card_grid: { cards: [...] } }
const SLIDE_COMPONENT_TYPES = new Set<string>([
  'card_grid',
  'process_flow',
  'requirement_table',
  'credential_grid',
  'icon_chip_group',
  'step_flow_bar',
  'callout_box',
])

const activeSlideComponents = computed<SlideComponent[]>(() => {
  if (!activeSlide.value?.componentsJson) return []
  try {
    const raw = JSON.parse(activeSlide.value.componentsJson) as Record<string, unknown>[]
    return raw
      .map((item): SlideComponent | null => {
        // 포맷 1: type + content 모두 있음
        if (typeof item.type === 'string' && item.content !== undefined) {
          return item as unknown as SlideComponent
        }
        // 포맷 2: type 있지만 content 없음 → 나머지 키들이 content
        if (typeof item.type === 'string') {
          const { type, ...rest } = item
          return { type, content: rest } as unknown as SlideComponent
        }
        // 포맷 3: 타입명이 키로 쓰임 → 첫 번째로 매칭되는 키를 type으로 사용
        const typeKey = Object.keys(item).find((k) => SLIDE_COMPONENT_TYPES.has(k))
        if (typeKey) {
          return { type: typeKey, content: item[typeKey] } as unknown as SlideComponent
        }
        return null
      })
      .filter((item): item is SlideComponent => item !== null)
  } catch {
    return []
  }
})

// ── 트리 사이드바 헬퍼 ──────────────────────────────────────────────────────────

/** rawTocList 중 자식을 가진 tocId 집합 — 3단계 계층에서 소목차(자식 있음) vs 리프 구분용 */
const tocParentIdSet = computed(() => {
  const s = new Set<string>()
  for (const item of props.rawTocList) {
    if (item.parentId !== null) s.add(item.parentId)
  }
  return s
})

/** 소목차(tocId)가 현재 활성 소목차인지 확인 */
const isLeafActive = (tocId: string) => props.sectionList[props.activeSectionIndex]?.tocId === tocId

/** 소목차(tocId)가 완료 상태인지 확인 */
const isLeafDone = (tocId: string) => props.sectionList.find((s) => s.tocId === tocId)?.status === 'done'

/** 소목차 클릭 → sectionList 인덱스로 변환하여 emit */
const onSelectLeaf = (tocId: string) => {
  const idx = props.sectionList.findIndex((s) => s.tocId === tocId)
  if (idx > -1) emit('select-section', idx)
}

/** 소목차(tocId)의 생성된 슬라이드 수 (0이면 미생성) */
const leafSlideCount = (tocId: string) => props.slidesCache[tocId]?.length ?? 0

// 소목차 전환 시 첫 슬라이드로 리셋
watch(
  () => props.activeSection?.tocId,
  () => {
    activeSlideIndex.value = 0
  },
)

// 메시지 추가 시 자동 스크롤
watch(
  () => props.currentMessages.length,
  async () => {
    await nextTick()
    if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  },
)

const onSendChat = () => {
  if (!chatInput.value.trim() || props.isSending) return
  emit('send-chat', chatInput.value.trim())
  chatInput.value = ''
}

const onRegenerateImage = () => {
  if (!props.activeSection || isRegeneratingImage.value) return
  isRegeneratingImage.value = true

  // progress 이벤트 후 hasSectionImages가 true로 바뀌기 전에 미리 캡처
  const isFirstGeneration = !hasSectionImages.value

  // 즉시 전체 슬라이드를 '002'(생성중)으로 표시 → "인포그래픽 생성 중..." UI 즉시 반영
  const initializing = props.currentSlides.map((s) => ({ ...s, renderStatusCd: '002' as const }))
  emit('slides-updated', initializing as PtSlide[])

  openLoading({ text: '이미지를 생성하는 중...' })

  // 기존 SSE 연결 정리
  renderEventSource?.close()
  renderEventSource = streamRenderSectionImages(props.ptProjectId, props.activeSection.tocId, {
    onProgress: (data) => {
      // 1. step 이벤트 → 로딩 텍스트 갱신
      if (data.step) {
        if (data.current != null && data.total != null) {
          updateLoadingText(`이미지를 생성하는 중... (${data.current}/${data.total}장)`)
        } else {
          const msg = RENDER_IMAGE_STEP_MESSAGES[data.step]
          if (msg) updateLoadingText(msg)
        }
      }

      // 2. 슬라이드별 진행 이벤트 → 슬라이드 상태 갱신
      if (data.slideId) {
        const updated = props.currentSlides.map((s) =>
          s.slideId === data.slideId
            ? { ...s, renderStatusCd: data.renderStatusCd, renderedImagePath: data.renderedImagePath }
            : s,
        )
        emit('slides-updated', updated as PtSlide[])
      }
    },
    onDone: () => {
      closeLoading()
      isRegeneratingImage.value = false
      openToast({
        message: isFirstGeneration ? '인포그래픽 이미지가 생성되었습니다.' : '인포그래픽 이미지가 재생성되었습니다.',
      })
    },
    onError: () => {
      closeLoading()
      isRegeneratingImage.value = false
      openToast({ message: '이미지 생성 중 오류가 발생했습니다.', type: 'error' })
    },
  })
}

const onGenerate = () => {
  if (!props.activeSection || props.isGenerating) return
  emit('generate-section', props.activeSection.tocId)
}

const onConfirm = () => {
  if (!props.activeSection) return
  emit('confirm-section', props.activeSection.sectionId)
}

onUnmounted(() => {
  renderEventSource?.close()
  document.body.classList.remove('is-resizing') // 안전 정리
})
</script>
