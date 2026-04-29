<template>
  <UiModal
    :is-open="isOpen"
    title="문서 만들기"
    :max-width="'min(1720px, calc(100vw - 32px))'"
    custom-class="doc-dataset-create-modal library-create-doc-modal library-create-doc-report-modal"
    show-fullscreen
    @close="emit('close')"
  >
    <div class="library-create-doc-report doc-dataset-create-form com-setting-form">
      <div class="library-create-doc-report-layout">
        <!-- 좌측: 웹에디터 (보고서 2열 표) -->
        <div class="library-create-doc-report-main">
          <div
            class="library-create-doc-report-sheet"
            :class="{ 'is-refine-completed': isRefineCompletedFx }"
          >
            <div class="library-create-doc-report-sheet-head">
              <div class="library-create-doc-report-sheet-head-left">
                <i class="icon icon-document size-18" />
                <span class="library-create-doc-report-sheet-title">{{ props.tmplNm || '보고서' }}</span>
              </div>
              <p class="library-create-doc-report-sheet-hint">
                라벨·내용을 직접 편집하거나 툴바로 서식을 적용할 수 있습니다
              </p>
            </div>

            <!-- 웹에디터 — 2열 표 형태로 보고서 항목 표시 -->
            <LibraryReportEditor
              v-model:html="editorHtml"
              :tmpl-html="props.tmplHtml"
            />
          </div>
        </div>

        <!-- 우측: 안내·액션·AI 보완(보고서 표 제외) -->
        <aside
          class="library-create-doc-report-side"
          aria-label="문서 도구 및 AI 보완"
        >
          <div class="library-create-doc-report-side-scroll">
            <div class="library-create-doc-report-lead-row">
              <p class="doc-dataset-subsection-desc library-create-doc-lead">
                지식창고 내용을 기반으로 문서를 자동 생성합니다
              </p>
              <UiBadge
                variant="success"
                size="sm"
              >
                <template #icon-left>
                  <i class="icon icon-check size-14"></i>
                </template>
                AI 생성 완료
              </UiBadge>
            </div>
            <div class="library-create-doc-report-toolbar">
              <UiButton
                variant="primary"
                size="md"
                icon-only
                title="내 문서보관함 저장"
                @click="emit('save-to-my-docs')"
              >
                <template #icon-left>
                  <i class="icon icon-archive size-16" />
                </template>
              </UiButton>
              <UiButton
                variant="outline"
                size="md"
                icon-only
                title="PDF 다운로드"
                @click="onPrintReport"
              >
                <template #icon-left>
                  <i class="icon icon-download size-16" />
                </template>
              </UiButton>
              <UiButton
                variant="outline"
                size="md"
                icon-only
                title="공유 링크"
                @click="emit('share-link')"
              >
                <template #icon-left>
                  <i class="icon icon-sidebar-share size-16" />
                </template>
              </UiButton>
              <UiButton
                variant="outline"
                size="md"
                class="library-create-doc-report-toolbar-wide"
                @click="emit('select-other-type')"
              >
                <template #icon-left>
                  <i class="icon icon-refresh size-16" />
                </template>
                다른 유형 선택
              </UiButton>
            </div>
            <div class="library-create-doc-report-side-divider" />
            <div class="library-create-doc-report-footer-head">
              <span class="library-create-doc-report-footer-title">AI와 대화하여 내용 보완</span>
              <p class="library-create-doc-report-footer-lead">LLM과 대화하여 문서 내용을 보완할 수 있습니다</p>
            </div>
            <div
              v-if="refineChatLog.length > 0"
              class="library-create-doc-report-last-refine"
              role="status"
              aria-live="polite"
            >
              <span class="library-create-doc-report-last-refine-label">마지막 보완 요청</span>
              <p
                class="library-create-doc-report-last-refine-text"
                :class="{ 'is-placeholder': !lastRefineMessage.trim() }"
              >
                {{ lastRefineMessage.trim() || '...' }}
              </p>
              <span
                v-if="lastRefineTimeLabel"
                class="library-create-doc-report-last-refine-time"
              >
                {{ lastRefineTimeLabel }}
              </span>
            </div>
          </div>

          <!-- 보완 대화(말풍선) — 닫거나 다시 열면 초기화 -->
          <div
            ref="refineChatListRef"
            class="library-create-doc-report-refine-chat"
            aria-label="보완 요청 대화 기록"
          >
            <p
              v-if="refineChatLog.length === 0"
              class="library-create-doc-report-refine-chat-empty"
            >
              문서 보완 요청 내역이 없습니다.
            </p>
            <ul
              v-else
              class="library-create-doc-report-refine-chat-list"
            >
              <li
                v-for="entry in refineChatLog"
                :key="entry.id"
                class="library-create-doc-report-refine-chat-item"
                :class="entry.role === 'user' ? 'role-user' : 'role-assistant'"
              >
                <i
                  v-if="entry.role === 'assistant'"
                  class="library-create-doc-report-refine-avatar icon-bot size-20"
                />
                <div class="library-create-doc-report-refine-message">
                  <p class="library-create-doc-report-refine-bubble">
                    {{ entry.text }}
                  </p>
                  <span
                    v-if="entry.role === 'user'"
                    class="library-create-doc-report-refine-time"
                  >
                    {{ entry.timeLabel }}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div class="library-create-doc-report-side-chat">
            <div
              class="library-create-doc-chat-bar"
              :class="{ 'is-active': !!refineDraft.trim() }"
            >
              <i
                v-show="!refineDraft.trim()"
                class="icon-sparkle size-20"
              />
              <UiInput
                v-model="refineDraft"
                size="md"
                class="library-create-doc-chat-bar-field"
                :spellcheck="false"
                placeholder="예: 결론 부분을 좀 더 구체적으로 보완해주세요"
                @enter="onSendRefine"
              />
              <UiButton
                variant="primary"
                size="md"
                icon-only
                class="btn-chat-send library-create-doc-chat-send"
                :disabled="!refineDraft.trim()"
                aria-label="전송"
                @click="onSendRefine"
              >
                <template #icon-left>
                  <i class="icon-send size-20" />
                </template>
              </UiButton>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import type { LibraryGeneratedReportValues } from '~/types/library'
import { getLibraryReportRows, printLibraryReportFromHtml } from '~/utils/library/libraryReportPrintUtil'
import { buildReportEditorHtml, parseReportEditorHtml } from '~/utils/library/libraryReportEditorUtil'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    tmplNm?: string
    refineCompletedAt?: number
    tmplHtml?: string
    /** AI 보완 응답 HTML — 전체 에디터 HTML(표 외 텍스트 포함)로 에디터를 직접 교체 */
    refinedHtml?: string
  }>(),
  {
    tmplNm: '',
    refineCompletedAt: 0,
    tmplHtml: '',
    refinedHtml: '',
  },
)

const report = defineModel<LibraryGeneratedReportValues>('report', { required: true })

const emit = defineEmits<{
  close: []
  'save-to-my-docs': []
  'share-link': []
  'select-other-type': []
  /** 보완 요청 — message: 사용자 입력, currentHtml: 현재 에디터 전체 HTML */
  'send-refine': [message: string, currentHtml: string]
}>()

type RefineChatRole = 'user' | 'assistant'

/** 보완 대화 한 줄(모달 세션 동안만 유지) */
interface RefineChatEntry {
  id: string
  role: RefineChatRole
  text: string
  createdAt: number
  timeLabel: string
}

const refineDraft = ref('')
const lastRefineMessage = ref('')
const lastRefineTimeLabel = ref('')
const hasUserSentRefineThisSession = ref(false)
const refineChatLog = ref<RefineChatEntry[]>([])
const refineChatListRef = ref<HTMLElement | null>(null)
let refineChatIdSeq = 0

// ===== 웹에디터 HTML 상태 =====
/** 에디터와 연결된 HTML 문자열 — buildReportEditorHtml 결과가 들어가고, 편집 시 업데이트됨 */
const editorHtml = ref('')
/** 외부(AI 보완/초기 로딩)에서 에디터를 업데이트하는 동안 write-back을 막는 플래그 */
let isExternalEditorUpdate = false
let writebackTimer: ReturnType<typeof setTimeout> | null = null

/** report → editorHtml 동기화 (모달 열기·AI 보완 완료 시) */
const setEditorFromReport = () => {
  isExternalEditorUpdate = true
  const rows = getLibraryReportRows(report.value ?? {})
  const tableHtml = buildReportEditorHtml(report.value ?? {}, rows)
  // tmplHtml이 있으면 표 위에 머리글 HTML 삽입
  editorHtml.value = props.tmplHtml ? `${props.tmplHtml}${tableHtml}` : tableHtml
  // Vue watcher는 동기적으로 실행되므로 nextTick에서 플래그 해제
  nextTick(() => {
    isExternalEditorUpdate = false
  })
}

/** editorHtml → report 역파싱 (디바운스 400ms) */
watch(editorHtml, (html) => {
  if (isExternalEditorUpdate) return
  if (writebackTimer) clearTimeout(writebackTimer)
  writebackTimer = setTimeout(() => {
    const parsed = parseReportEditorHtml(html)
    report.value = { ...parsed }
    writebackTimer = null
  }, 400)
})

// ===== AI 보완 완료 강조 효과 =====
const isRefineCompletedFx = ref(false)
let refineCompletedFxTimer: ReturnType<typeof setTimeout> | null = null

const nextRefineChatId = () => {
  refineChatIdSeq += 1
  return `refine-chat-${refineChatIdSeq}`
}

const resetRefineSessionUi = () => {
  refineChatLog.value = []
  hasUserSentRefineThisSession.value = false
  lastRefineMessage.value = ''
  lastRefineTimeLabel.value = ''
  refineChatIdSeq = 0
}

const scrollRefineChatToBottom = () => {
  nextTick(() => {
    const el = refineChatListRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  })
}

const toRefineTimeLabel = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

// ===== 모달 열기/닫기 =====
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      if (refineCompletedFxTimer) {
        clearTimeout(refineCompletedFxTimer)
        refineCompletedFxTimer = null
      }
      if (writebackTimer) {
        clearTimeout(writebackTimer)
        writebackTimer = null
      }
      isRefineCompletedFx.value = false
      refineDraft.value = ''
      editorHtml.value = ''
      resetRefineSessionUi()
      return
    }
    resetRefineSessionUi()
    setEditorFromReport()
    nextTick(() => scrollRefineChatToBottom())
  },
)

// ===== AI 보완 완료 감지 =====
// refinedHtml prop이 바뀌면 에디터를 직접 교체 (표 외 텍스트도 보존)
watch(
  () => props.refinedHtml,
  (newHtml) => {
    if (!props.isOpen || !newHtml) return

    // 에디터 HTML 직접 교체 (report JSON 재빌드 없음 → 표 외 텍스트 유지)
    isExternalEditorUpdate = true
    editorHtml.value = newHtml
    nextTick(() => {
      isExternalEditorUpdate = false
    })

    if (hasUserSentRefineThisSession.value) {
      refineChatLog.value.push({
        id: nextRefineChatId(),
        role: 'assistant',
        text: '보고서를 수정했습니다.',
        createdAt: Date.now(),
        timeLabel: toRefineTimeLabel(Date.now()),
      })
      scrollRefineChatToBottom()
    }

    isRefineCompletedFx.value = false
    requestAnimationFrame(() => {
      isRefineCompletedFx.value = true
      if (refineCompletedFxTimer) clearTimeout(refineCompletedFxTimer)
      refineCompletedFxTimer = setTimeout(() => {
        isRefineCompletedFx.value = false
        refineCompletedFxTimer = null
      }, 4000)
    })
  },
)

onBeforeUnmount(() => {
  if (refineCompletedFxTimer) {
    clearTimeout(refineCompletedFxTimer)
    refineCompletedFxTimer = null
  }
  if (writebackTimer) {
    clearTimeout(writebackTimer)
    writebackTimer = null
  }
})

const onSendRefine = () => {
  const msg = refineDraft.value.trim()
  if (!msg) return
  const createdAt = Date.now()
  hasUserSentRefineThisSession.value = true
  lastRefineMessage.value = msg
  lastRefineTimeLabel.value = toRefineTimeLabel(createdAt)
  refineChatLog.value.push({
    id: nextRefineChatId(),
    role: 'user',
    text: msg,
    createdAt,
    timeLabel: toRefineTimeLabel(createdAt),
  })
  // 현재 에디터 전체 HTML을 함께 전달 (표 외 텍스트 포함)
  emit('send-refine', msg, editorHtml.value)
  refineDraft.value = ''
  scrollRefineChatToBottom()
}

const onPrintReport = () => {
  // 에디터 전체 HTML 기반으로 인쇄 (표 외 텍스트 포함)
  const ok = printLibraryReportFromHtml(editorHtml.value, props.tmplNm || '보고서')
  if (!ok) {
    openToast({
      message: '인쇄할 보고서 내용이 없습니다.',
      type: 'warning',
      duration: 2500,
    })
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';

// 모달 본문 높이를 채운 뒤 좌(표)·우(도구) 분할
.library-create-doc-report {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  min-width: 0;
  padding-bottom: 0;
}

.library-create-doc-report-layout {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  gap: $spacing-md;
  min-height: 0;
  width: 100%;
  min-width: 0;
}

.library-create-doc-report-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

// 우측 패널: 안내·버튼·AI 입력 (고정 폭, 세로 flex)
.library-create-doc-report-side {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: clamp(300px, 26vw, 400px);
  min-width: 280px;
  max-width: 100%;
  min-height: 0;
  padding-left: $spacing-md;
  border-left: 1px solid $color-border;
  box-sizing: border-box;
}

// 상단 안내·버튼·마지막 요청
.library-create-doc-report-side-scroll {
  flex: 0 1 auto;
  min-height: 250px;
  max-height: min(520px, 62vh);
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 2px;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

// 말풍선 영역 — 세로 스크롤
.library-create-doc-report-refine-chat {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 140px;
  margin-top: $spacing-md;
  padding: $spacing-xs 2px $spacing-xs 0;
  overflow-x: hidden;
  overflow-y: auto;
  @include custom-scrollbar(4px);
}

.library-create-doc-report-refine-chat-empty {
  margin: 0;
  padding: $spacing-md $spacing-sm;
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.45;
  text-align: center;
}

.library-create-doc-report-refine-chat-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin: 0;
  padding: 0;
  list-style: none;
}

.library-create-doc-report-refine-chat-item {
  display: flex;
  width: 100%;
  max-width: 100%;
  gap: 8px;
  align-items: flex-start;

  &.role-user {
    justify-content: flex-end;
  }

  &.role-assistant {
    justify-content: flex-start;
  }
}

.library-create-doc-report-refine-avatar {
  flex-shrink: 0;
  color: var(--color-primary);
}

.library-create-doc-report-refine-message {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 94%;
}

.library-create-doc-report-refine-bubble {
  max-width: 100%;
  margin: 0;
  padding: 8px 12px;
  border-radius: 18px;
  font-size: $font-size-sm;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  box-sizing: border-box;
  border: 1px solid transparent;
}

.library-create-doc-report-refine-time {
  margin-top: 4px;
  align-self: flex-end;
  font-size: $font-size-xs;
  line-height: 1.2;
  color: $color-text-muted;
}

.role-user .library-create-doc-report-refine-bubble {
  background: #eef2f6;
  color: #2d3139;
  border-color: #dfe3e8;
  font-weight: 500;
}

.role-assistant .library-create-doc-report-refine-bubble {
  background: transparent;
  border-color: transparent;
  color: $color-text-heading;
  border-radius: 0;
  padding: 0;
  font-weight: $font-weight-semibold;
}

.library-create-doc-report-side-divider {
  flex-shrink: 0;
  height: 1px;
  margin: $spacing-md 0;
  background: $color-border;
}

.library-create-doc-report-side-chat {
  flex-shrink: 0;
  margin-top: $spacing-sm;
  padding-top: $spacing-md;
  border-top: 1px solid $color-border;
}

.library-create-doc-report-lead-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-sm;
  width: 100%;
  min-width: 0;

  .library-create-doc-lead {
    margin: 0;
    flex: 1 1 auto;
    min-width: 0;
  }

  :deep(.ui-badge) {
    flex-shrink: 0;
  }
}

.library-create-doc-report-toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: $spacing-sm;
  width: 100%;
  margin-top: $spacing-sm;
}

.library-create-doc-report-toolbar-wide {
  flex: 1 1 auto;
  min-width: 0;
  justify-content: center;
}

// 시트 박스
.library-create-doc-report-sheet {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-lg;
  background: #fff;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(30, 50, 77, 0.08);
}

.library-create-doc-report-sheet.is-refine-completed {
  animation: report-refine-glow 3.2s ease-out forwards;
}

.library-create-doc-report-sheet::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-130%);
  background:
    linear-gradient(
      96deg,
      rgba(255, 255, 255, 0) 40%,
      rgba(255, 255, 255, 0.65) 47.5%,
      rgba(255, 255, 255, 0.98) 50%,
      rgba(255, 255, 255, 0.5) 53%,
      rgba(255, 255, 255, 0) 60%
    ),
    linear-gradient(
      105deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(56, 189, 248, 0.28) 34%,
      rgba(255, 255, 255, 0.72) 45%,
      rgba(167, 139, 250, 0.2) 52%,
      rgba(74, 222, 128, 0.26) 58%,
      rgba(255, 255, 255, 0) 100%
    );
  background-blend-mode: screen, normal;
  filter: saturate(112%) brightness(1.02);
  will-change: transform, opacity, filter;
}

.library-create-doc-report-sheet.is-refine-completed::before {
  animation: report-refine-sweep 3.35s cubic-bezier(0.18, 0.72, 0.32, 1) forwards;
}

@keyframes report-refine-glow {
  0% {
    border-color: #c6d2db;
    box-shadow:
      0 1px 3px rgba(30, 50, 77, 0.08),
      0 0 0 0 rgba(59, 130, 246, 0),
      0 0 0 0 rgba(34, 197, 94, 0);
  }
  24% {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow:
      0 1px 3px rgba(30, 50, 77, 0.08),
      0 0 0 2px rgba(59, 130, 246, 0.18),
      0 0 16px 4px rgba(34, 197, 94, 0.1);
  }
  62% {
    border-color: rgba(59, 130, 246, 0.28);
    box-shadow:
      0 1px 3px rgba(30, 50, 77, 0.08),
      0 0 0 1px rgba(59, 130, 246, 0.1),
      0 0 10px 2px rgba(34, 197, 94, 0.06);
  }
  100% {
    border-color: #c6d2db;
    box-shadow:
      0 1px 3px rgba(30, 50, 77, 0.08),
      0 0 0 0 rgba(59, 130, 246, 0),
      0 0 0 0 rgba(34, 197, 94, 0);
  }
}

@keyframes report-refine-sweep {
  0% {
    opacity: 0;
    transform: translateX(-135%) skewX(-6deg);
    filter: saturate(105%) brightness(1);
  }
  14% {
    opacity: 0.72;
    filter: saturate(128%) brightness(1.04) blur(0);
  }
  32% {
    opacity: 0.94;
    filter: saturate(152%) brightness(1.12) blur(0);
  }
  48% {
    opacity: 0.78;
    filter: saturate(138%) brightness(1.07) blur(0);
  }
  68% {
    opacity: 0.38;
    filter: saturate(118%) brightness(1.02);
  }
  100% {
    opacity: 0;
    transform: translateX(135%) skewX(-6deg);
    filter: saturate(105%) brightness(1);
  }
}

.library-create-doc-report-sheet-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  flex-wrap: wrap;
  padding: $spacing-sm $spacing-md;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.library-create-doc-report-sheet-head-left {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  min-width: 0;
  color: $color-text-heading;

  .icon {
    flex-shrink: 0;
    color: var(--color-primary);
  }
}

.library-create-doc-report-sheet-title {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
}

.library-create-doc-report-sheet-hint {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-muted;
}

// 아이콘 열 / 텍스트 열 분리
.library-create-doc-report-footer-head {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 8px;
  row-gap: 6px;
  align-items: start;
  margin-bottom: $spacing-md;
  margin-top: 0;
  min-width: 0;
}

.library-create-doc-report-footer-icon {
  grid-row: 1;
  grid-column: 1;
  color: var(--color-primary);
}

.library-create-doc-report-footer-title {
  grid-row: 1;
  grid-column: 2;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: $color-text-heading;
  min-width: 0;
}

.library-create-doc-report-footer-lead {
  grid-row: 2;
  grid-column: 2;
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.45;
  min-width: 0;
}

// 마지막 보완 요청 박스
.library-create-doc-report-last-refine {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  width: 100%;
  margin: 0 0 $spacing-sm;
  padding: 8px 10px;
  box-sizing: border-box;
  min-width: 0;
  text-align: left;
  border-radius: 10px;
  border: 1px solid #dfe3e8;
  background: #ecf0f3;
}

.library-create-doc-report-last-refine-label {
  align-self: flex-start;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  line-height: 1.25;
  max-width: 100%;
  text-align: left;
}

.library-create-doc-report-last-refine-text {
  margin: 0;
  width: 100%;
  max-width: 100%;
  font-size: $font-size-sm;
  font-weight: $font-weight-normal;
  color: #2d3139;
  line-height: 1.4;
  text-align: right;
  white-space: pre-wrap;
  word-break: break-word;

  &.is-placeholder {
    color: $color-text-muted;
    font-weight: $font-weight-normal;
  }
}

.library-create-doc-report-last-refine-time {
  align-self: flex-end;
  margin-top: 2px;
  font-size: $font-size-xs;
  line-height: 1.2;
  color: $color-text-muted;
}

.library-create-doc-report-side .library-create-doc-report-last-refine-text {
  text-align: right;
}

// 보완 입력 바
.library-create-doc-chat-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 8px 12px;
  box-sizing: border-box;
  border-radius: 20px;
  border: 1px solid #c6d2db;
  background: #fff;
  transition:
    border-color $transition-base,
    box-shadow $transition-base;

  &.is-active {
    border: 2px solid var(--color-primary);
    padding: 7px 11px;
    box-shadow: 0 0 0 1px rgba(var(--color-primary-rgb, 60, 105, 219), 0.12);
  }

  .icon-sparkle {
    flex-shrink: 0;
    color: var(--color-primary);
  }
}

.library-create-doc-chat-bar-field {
  flex: 1 1 auto;
  min-width: 0;
}

.library-create-doc-chat-bar :deep(.ui-input-outer) {
  width: 100%;
}

.library-create-doc-chat-bar :deep(.ui-input-wrap) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.library-create-doc-chat-send.btn-chat-send.ui-button {
  width: 32px;
  height: 32px;
  min-height: 32px;
}
</style>
