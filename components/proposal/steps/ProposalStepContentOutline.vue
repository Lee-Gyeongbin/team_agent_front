<!--
  Step4 콘텐츠 개요 패널 (3컬럼: 트리 | 개요 카드 | 채팅)
  - 모든 상태(데이터, 로딩, 액션)는 props/emit으로 부모(ProposalStepToc)에서 관리
-->
<template>
  <div class="oc-wrap">
    <!-- ===== 좌측 트리 패널 ===== -->
    <div class="oc-tree-pane">
      <div class="oc-tree-head">
        <h3>세부목차</h3>
        <div class="oc-progress-row">
          <div class="oc-progress-bar">
            <div
              class="oc-progress-fill"
              :style="{ width: progressPct + '%' }"
            />
          </div>
          <span class="oc-progress-label">{{ confirmedCount }} / {{ leafNodes.length }} 확정</span>
        </div>
      </div>

      <div class="oc-tree-scroll">
        <template v-if="isLoadingToc">
          <div
            v-for="i in 6"
            :key="i"
            class="pt-skeleton"
            style="height: 36px; margin-bottom: 6px"
          />
        </template>
        <UiEmpty
          v-else-if="rootNodes.length === 0"
          title="세부목차가 없습니다."
        />
        <template v-else>
          <div
            v-for="root in rootNodes"
            :key="root.tocId"
            class="oc-node-group"
          >
            <!-- 대목차 -->
            <div
              class="oc-node-row is-root"
              :class="{ 'is-open': openRootIds.has(root.tocId) }"
              @click="toggleRoot(root.tocId)"
            >
              <i class="oc-chevron icon-arrow-down-gray size-14" />
              <span class="oc-node-title">{{ root.title }}</span>
              <span class="oc-node-tag">대목차</span>
            </div>

            <template v-if="openRootIds.has(root.tocId)">
              <div
                v-for="section in childrenOf(root.tocId)"
                :key="section.tocId"
                class="oc-node-section"
              >
                <!-- 소분류: 하위 세부목차가 있으면 펼침, 없으면 개요 대상으로 선택 -->
                <div
                  class="oc-node-row is-section"
                  :class="{
                    'is-open': hasChildren(section.tocId) && openSectionIds.has(section.tocId),
                    'is-selected': selectedTocId === section.tocId,
                  }"
                  @click="onSectionClick(section)"
                >
                  <i
                    v-if="hasChildren(section.tocId)"
                    class="oc-chevron icon-arrow-down-gray size-14"
                  />
                  <span
                    v-else
                    class="oc-chevron-placeholder"
                  />
                  <span class="oc-node-title">{{ section.title }}</span>
                  <span class="oc-node-tag">소분류</span>
                  <span
                    v-if="hasChildren(section.tocId)"
                    class="oc-node-count"
                  >
                    세부 {{ childrenOf(section.tocId).length }}
                  </span>
                  <span
                    v-else
                    class="oc-status-dot"
                    :class="statusDotClass(section.outlineStatusCd)"
                  />
                </div>

                <template v-if="openSectionIds.has(section.tocId) && hasChildren(section.tocId)">
                  <div class="oc-leaf-list">
                    <div
                      v-for="leaf in childrenOf(section.tocId)"
                      :key="leaf.tocId"
                      class="oc-leaf"
                      :class="{ 'is-selected': selectedTocId === leaf.tocId }"
                      @click="$emit('select-node', leaf.tocId)"
                    >
                      <i class="icon-document size-13" />
                      <span class="oc-leaf-title">{{ leaf.title }}</span>
                      <span
                        class="oc-status-dot"
                        :class="statusDotClass(leaf.outlineStatusCd)"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- ===== 우측 영역 ===== -->
    <div class="oc-right-pane">
      <!-- 선택 노드 헤더 -->
      <div class="oc-detail-head">
        <div
          v-if="selectedItem"
          class="oc-breadcrumb"
        >
          {{ breadcrumbPath }}
        </div>
        <div class="oc-detail-title-row">
          <h3 class="oc-detail-title">
            {{ selectedItem ? selectedItem.title : '왼쪽에서 목차를 선택하세요' }}
          </h3>
          <span
            v-if="selectedItem"
            class="oc-status-badge"
            :class="statusBadgeClass(selectedItem.outlineStatusCd)"
          >
            <span class="oc-status-badge-dot" />
            {{ statusLabel(selectedItem.outlineStatusCd) }}
          </span>
        </div>
      </div>

      <!-- 노드 미선택 -->
      <div
        v-if="!selectedItem"
        class="oc-empty-select"
      >
        <UiEmpty
          icon="icon-document"
          title="왼쪽 목차에서 세부목차, 또는 하위가 없는 소분류를 선택하면 콘텐츠 개요를 작성할 수 있어요."
        />
      </div>

      <!-- 노드 선택됨 -->
      <div
        v-else
        class="oc-detail-body"
      >
        <!-- 가운데: 개요 카드 -->
        <div class="oc-outline-col">
          <!-- 미생성 상태 -->
          <div
            v-if="selectedItem.outlineStatusCd === '001' && !isGenerating"
            class="oc-empty-card"
          >
            <div class="oc-empty-icon">💡</div>
            <p>
              아직 이 세부목차의 콘텐츠 개요가 없어요.<br />관련 요구사항을 바탕으로 넣을 수 있는 아이디어를 여러 개
              던져 드릴게요.
            </p>
            <button
              class="oc-btn oc-btn-primary"
              @click="$emit('generate')"
            >
              개요 생성
            </button>
          </div>

          <!-- 생성 중 -->
          <div
            v-else-if="isGenerating"
            class="oc-empty-card"
          >
            <div class="oc-loading-row">
              <span class="oc-spinner" />
              관련 요구사항을 분석해 개요를 작성하는 중...
            </div>
          </div>

          <!-- 개요 있음 -->
          <div
            v-else
            class="oc-outline-card"
          >
            <div class="oc-outline-card-head">
              <span class="oc-outline-card-title">콘텐츠 개요</span>
              <div class="oc-outline-card-actions">
                <button
                  v-if="!isEditing"
                  class="oc-btn oc-btn-ghost oc-btn-sm"
                  @click="$emit('start-edit')"
                >
                  수정
                </button>
                <button
                  class="oc-btn oc-btn-ghost oc-btn-sm"
                  :disabled="isGenerating"
                  @click="$emit('generate')"
                >
                  재생성
                </button>
              </div>
            </div>

            <!-- 수정 모드: 원문 편집 / 보기 모드: 마크다운 렌더 -->
            <UiTextarea
              v-if="isEditing"
              class="oc-outline-textarea"
              :model-value="editingText"
              :auto-resize="false"
              :rows="8"
              border
              size="md"
              placeholder="콘텐츠 개요를 입력하세요"
              @update:model-value="$emit('update:editing-text', $event)"
            />
            <!-- eslint-disable vue/no-v-html — toHtmlContent 내 DOMPurify 안전 처리 적용 -->
            <div
              v-else
              class="oc-outline-preview markdown-body"
              v-html="outlineHtml"
            />
            <!-- eslint-enable vue/no-v-html -->

            <div class="oc-outline-foot">
              <button
                v-if="selectedItem.outlineStatusCd !== '003' || isEditing"
                class="oc-btn oc-btn-primary oc-btn-sm"
                :disabled="isConfirming"
                @click="onConfirm"
              >
                이 개요로 확정
              </button>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 채팅 카드 -->
        <div class="oc-chat-col">
          <div class="oc-chat-card">
            <div class="oc-chat-head">
              보완 요청 채팅
              <span class="oc-chat-hint">이 세부목차 전용</span>
            </div>
            <div
              ref="chatScrollRef"
              class="oc-chat-msgs"
            >
              <div
                v-if="chatMessages.length === 0"
                class="oc-chat-empty"
              >
                개요에 반영하고 싶은 내용을 자유롭게 요청해보세요.
              </div>
              <div
                v-for="(msg, i) in chatMessages"
                :key="i"
                class="oc-chat-msg"
                :class="msg.role === 'user' ? 'is-user' : 'is-ai'"
              >
                {{ msg.text }}
              </div>
              <div
                v-if="isChating"
                class="oc-chat-msg is-ai"
              >
                <span class="oc-spinner oc-spinner-sm" />
              </div>
            </div>
            <div class="oc-chat-input-row">
              <input
                v-model="chatInput"
                class="oc-chat-input"
                placeholder="예: 2번 빼고 4번은 수치로 보완해줘"
                :disabled="isChating || selectedItem.outlineStatusCd === '001'"
                @keydown.enter="onSendChat"
              />
              <button
                class="oc-chat-send"
                :disabled="!chatInput.trim() || isChating || selectedItem.outlineStatusCd === '001'"
                @click="onSendChat"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 -->
      <div class="oc-footer">
        <span class="oc-footer-note">
          {{
            allConfirmed
              ? '모든 세부목차의 콘텐츠 개요가 확정되었습니다.'
              : '모든 세부목차의 콘텐츠 개요를 확정해야 템플릿 설정으로 이동할 수 있어요.'
          }}
        </span>
        <button
          class="oc-btn oc-btn-primary"
          :disabled="!allConfirmed"
          @click="$emit('go-template')"
        >
          템플릿 설정으로 이동 ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OutlineChatMessage } from '~/composables/proposal/useProposalOutline'
import type { PtTocItem } from '~/types/proposal'
import { toHtmlContent } from '~/utils/chat/htmlUtil'

interface Props {
  tocList: PtTocItem[]
  leafNodes: PtTocItem[]
  confirmedCount: number
  allConfirmed: boolean
  isLoadingToc: boolean
  selectedTocId: string | null
  selectedItem: PtTocItem | null
  isLoadingOutline: boolean
  isGenerating: boolean
  isChating: boolean
  isConfirming: boolean
  isEditing: boolean
  editingText: string
  chatMessages: OutlineChatMessage[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-node': [tocId: string]
  generate: []
  chat: [message: string]
  confirm: [outlineTxt: string]
  'start-edit': []
  'update:editing-text': [value: string]
  'go-template': []
}>()

// ── 트리 펼침 상태 ────────────────────────────────────────────────────────
const openRootIds = ref<Set<string>>(new Set())
const openSectionIds = ref<Set<string>>(new Set())

// tocList 변경 시 자동으로 모두 펼치기
watch(
  () => props.tocList,
  (list) => {
    const parentIdSet = new Set(list.map((t) => t.parentId).filter(Boolean))
    list.forEach((t) => {
      if (t.parentId === null) openRootIds.value.add(t.tocId)
      else if (parentIdSet.has(t.tocId)) openSectionIds.value.add(t.tocId)
    })
  },
  { immediate: true },
)

const toggleRoot = (id: string) => {
  if (openRootIds.value.has(id)) openRootIds.value.delete(id)
  else openRootIds.value.add(id)
}
const toggleSection = (id: string) => {
  if (openSectionIds.value.has(id)) openSectionIds.value.delete(id)
  else openSectionIds.value.add(id)
}

const rootNodes = computed(() => props.tocList.filter((t) => t.parentId === null))
const childrenOf = (parentId: string) => props.tocList.filter((t) => t.parentId === parentId)
const hasChildren = (tocId: string) => childrenOf(tocId).length > 0

/** 하위 세부목차가 없으면 소분류 자체를 개요 대상으로 선택 */
const onSectionClick = (section: PtTocItem) => {
  if (!hasChildren(section.tocId)) {
    emit('select-node', section.tocId)
    return
  }
  toggleSection(section.tocId)
}

// ── 빵크럼 경로 ───────────────────────────────────────────────────────────
const breadcrumbPath = computed(() => {
  if (!props.selectedItem) return ''
  const item = props.selectedItem
  const parts: string[] = [item.title]
  let current = item
  while (current.parentId) {
    const parent = props.tocList.find((t) => t.tocId === current.parentId)
    if (!parent) break
    parts.unshift(parent.title)
    current = parent
  }
  return parts.join(' › ')
})

// ── 상태 표시 헬퍼 ────────────────────────────────────────────────────────
const statusDotClass = (cd: string) => {
  if (cd === '003') return 'is-confirmed'
  if (cd === '002') return 'is-draft'
  return 'is-none'
}
const statusBadgeClass = (cd: string) => {
  if (cd === '003') return 'is-confirmed'
  if (cd === '002') return 'is-draft'
  return 'is-none'
}
const statusLabel = (cd: string) => {
  if (cd === '003') return '확정'
  if (cd === '002') return '초안'
  return '미생성'
}

// ── 진행률 ────────────────────────────────────────────────────────────────
const progressPct = computed(() => {
  if (props.leafNodes.length === 0) return 0
  return Math.round((props.confirmedCount / props.leafNodes.length) * 100)
})

// ── 채팅 ─────────────────────────────────────────────────────────────────
const chatInput = ref('')
const chatScrollRef = ref<HTMLElement | null>(null)

const onSendChat = () => {
  const msg = chatInput.value.trim()
  if (!msg) return
  chatInput.value = ''
  emit('chat', msg)
}

// 채팅 메시지 추가 시 자동 스크롤
watch(
  () => props.chatMessages.length,
  () =>
    nextTick(() => {
      if (chatScrollRef.value) chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
    }),
)

// 선택 노드 변경 시 채팅 입력 초기화
watch(
  () => props.selectedTocId,
  () => {
    chatInput.value = ''
  },
)

// ── 개요 마크다운 미리보기 ────────────────────────────────────────────────
const outlineHtml = computed(() => {
  const raw = props.selectedItem?.contentOutlineTxt ?? ''
  // 단일 \n + 불릿 조합은 marked가 리스트로 인식 못함 → 불릿 앞 빈 줄 보장
  const normalized = raw.replace(/([^\n])\n([ \t]*[-*+] )/g, '$1\n\n$2')
  return toHtmlContent(normalized)
})

// ── 확정 ─────────────────────────────────────────────────────────────────
const onConfirm = () => {
  const txt = props.isEditing ? props.editingText : (props.selectedItem?.contentOutlineTxt ?? '')
  emit('confirm', txt)
}
</script>
