<!--
  Step4 콘텐츠 개요 패널 (목차 | 개요 문서 | 보완 채팅)
  - 모든 상태(데이터, 로딩, 액션)는 props/emit으로 부모(ProposalStepToc)에서 관리
-->
<template>
  <div class="oc-wrap oc-document-layout">
    <!-- ===== 좌측 트리 패널 ===== -->
    <div class="oc-tree-pane">
      <div class="oc-tree-head">
        <div class="oc-tree-title-row">
          <h3>세부목차</h3>
          <UiDropdownMenu
            :items="treeMenuItems"
            align="end"
            @select="onTreeMenuSelect"
          >
            <template #trigger>
              <UiButton
                variant="ghost"
                size="sm"
                icon-only
                aria-label="목차 보기 설정"
              >
                <template #icon-left
                  ><UiIcon
                    name="ellipsis"
                    size="16"
                /></template>
              </UiButton>
            </template>
          </UiDropdownMenu>
        </div>
        <div class="oc-progress-row">
          <UiProgress
            class="oc-confirm-progress"
            :value="progressPct"
            size="sm"
            :show-value="false"
            :aria-label="`${leafNodes.length}개 중 ${confirmedCount}개 확정`"
          />
          <span class="oc-progress-label">{{ confirmedCount }} / {{ leafNodes.length }} 확정</span>
        </div>

        <UiInput
          v-model="tocSearch"
          type="search"
          size="sm"
          placeholder="목차 검색"
          aria-label="목차 검색"
          class="oc-toc-search"
        />
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
          :title="tocSearch.trim() ? '검색 결과가 없습니다.' : '세부목차가 없습니다.'"
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
              :class="{ 'is-open': isSearchExpanded || openRootIds.has(root.tocId) }"
              @click="toggleRoot(root.tocId)"
            >
              <i class="oc-chevron icon-arrow-down-gray size-14" />
              <span class="oc-node-title">{{ root.title }}</span>
              <span class="oc-node-tag">대목차</span>
            </div>

            <template v-if="isSearchExpanded || openRootIds.has(root.tocId)">
              <div
                v-for="section in visibleChildrenOf(root.tocId)"
                :key="section.tocId"
                class="oc-node-section"
              >
                <!-- 소분류: 하위 세부목차가 있으면 펼침, 없으면 개요 대상으로 선택 -->
                <div
                  class="oc-node-row is-section"
                  :class="{
                    'is-open': hasChildren(section.tocId) && (isSearchExpanded || openSectionIds.has(section.tocId)),
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
                  <span
                    v-if="hasChildren(section.tocId)"
                    class="oc-node-tag"
                    >소분류</span
                  >
                  <span
                    v-if="hasChildren(section.tocId)"
                    class="oc-node-count"
                  >
                    세부 {{ childrenOf(section.tocId).length }}
                  </span>
                  <UiBadge
                    v-else
                    size="xs"
                    :variant="statusVariant(section.outlineStatusCd)"
                  >
                    {{ batchProcessingTocId === section.tocId ? '생성 중' : statusLabel(section.outlineStatusCd) }}
                  </UiBadge>
                </div>

                <template v-if="(isSearchExpanded || openSectionIds.has(section.tocId)) && hasChildren(section.tocId)">
                  <div class="oc-leaf-list">
                    <div
                      v-for="leaf in visibleChildrenOf(section.tocId)"
                      :key="leaf.tocId"
                      class="oc-leaf"
                      :class="{
                        'is-selected': selectedTocId === leaf.tocId,
                        'is-processing': batchProcessingTocId === leaf.tocId,
                      }"
                      @click="$emit('select-node', leaf.tocId)"
                    >
                      <i class="icon-document size-13" />
                      <span class="oc-leaf-title">{{ leaf.title }}</span>
                      <UiBadge
                        size="xs"
                        :variant="statusVariant(leaf.outlineStatusCd)"
                      >
                        {{ batchProcessingTocId === leaf.tocId ? '생성 중' : statusLabel(leaf.outlineStatusCd) }}
                      </UiBadge>
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
      <div class="oc-global-toolbar">
        <div class="oc-global-toolbar-label">
          <strong>전체 개요 생성</strong><span>작성된 개요는 유지하고 미작성 항목만 생성합니다.</span>
        </div>
        <!-- 전체 생성 버튼 -->
        <div class="oc-batch-row">
          <UiButton
            v-if="!isBatchGenerating"
            variant="primary-line"
            size="sm"
            :disabled="unGeneratedCount === 0 || isLoadingToc || isGenerating || isChating"
            :title="unGeneratedCount === 0 ? '모두 생성됨' : `미생성 ${unGeneratedCount}건 일괄 생성`"
            @click="$emit('generate-all')"
          >
            {{ unGeneratedCount === 0 ? '모두 생성됨' : `미작성 개요 일괄 생성 (${unGeneratedCount}건)` }}
          </UiButton>
          <template v-else>
            <span class="oc-batch-status">
              <span class="oc-spinner oc-spinner-sm" />
              생성 중... {{ batchProgress.current }}/{{ batchProgress.total }}
            </span>
            <UiButton
              variant="ghost"
              size="sm"
              @click="$emit('cancel-batch')"
            >
              취소
            </UiButton>
          </template>
        </div>

        <!-- 실패 항목 요약 (완료 후) -->
        <div
          v-if="!isBatchGenerating && batchFailItems.length > 0"
          class="oc-batch-fail-summary"
        >
          <span class="oc-batch-fail-title">{{ batchFailItems.length }}건 생성 실패</span>
          <ul class="oc-batch-fail-list">
            <li
              v-for="item in batchFailItems"
              :key="item.tocId"
              class="oc-batch-fail-item"
            >
              <span class="oc-batch-fail-name">{{ item.title }}</span>
            </li>
          </ul>
        </div>
      </div>
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
          <UiButton
            v-if="selectedItem && !isChatOpen"
            variant="outline"
            size="sm"
            @click="isChatOpen = true"
          >
            <template #icon-left
              ><UiIcon
                name="messages-square"
                size="16"
            /></template>
            AI 보완 채팅 열기
          </UiButton>
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
        :class="{ 'is-chat-collapsed': !isChatOpen }"
      >
        <!-- 개요 문서 -->
        <div class="oc-outline-col">
          <div
            v-if="isLoadingOutline"
            class="oc-empty-card"
          >
            <div class="oc-loading-row"><span class="oc-spinner" />콘텐츠 개요를 불러오는 중…</div>
          </div>
          <!-- 미생성 상태 -->
          <div
            v-else-if="selectedItem.outlineStatusCd === '001' && !isGenerating"
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
                <UiDropdownMenu
                  :items="outlineMenuItems"
                  align="end"
                  @select="onOutlineMenuSelect"
                >
                  <template #trigger>
                    <UiButton
                      variant="ghost"
                      size="sm"
                      icon-only
                      aria-label="콘텐츠 개요 관리"
                    >
                      <template #icon-left
                        ><UiIcon
                          name="ellipsis"
                          size="18"
                      /></template>
                    </UiButton>
                  </template>
                </UiDropdownMenu>
                <UiButton
                  v-if="isEditing"
                  variant="outline"
                  size="sm"
                  :disabled="isConfirming"
                  @click="$emit('cancel-edit')"
                  >취소</UiButton
                >
                <UiButton
                  v-if="selectedItem.outlineStatusCd !== '003' || isEditing"
                  variant="primary"
                  size="sm"
                  :loading="isConfirming"
                  :disabled="isConfirming || isChating || isGenerating || isLoadingOutline || !!pendingRevision"
                  @click="onConfirm"
                  >이 개요로 확정</UiButton
                >
              </div>
            </div>

            <!-- 수정 모드: 원문 편집 / 보기 모드: 마크다운 렌더 -->
            <UiTextarea
              v-if="isEditing"
              class="oc-outline-textarea"
              :model-value="editingText"
              :auto-resize="false"
              :resizable="false"
              :rows="8"
              border
              size="md"
              placeholder="콘텐츠 개요를 입력하세요"
              @update:model-value="$emit('update:editing-text', $event)"
            />
            <!-- eslint-disable vue/no-v-html — toHtmlContent 내 DOMPurify 안전 처리 적용 -->
            <div
              v-else-if="outlineSections.length"
              class="oc-outline-preview oc-selectable-outline"
            >
              <p class="oc-selection-hint">보완할 항목을 선택하세요. 전체 개요에도 요청할 수 있습니다.</p>
              <div
                v-if="outlinePreface"
                class="markdown-body"
                v-html="toOutlineHtml(outlinePreface)"
              />
              <div
                v-for="(section, index) in outlineSections"
                :key="section.start"
                class="oc-outline-section"
                :class="{ 'is-selected': selectedSectionIndex === index }"
                @click="onSectionBodyClick($event, index)"
              >
                <button
                  type="button"
                  class="oc-section-select"
                  :aria-label="`${section.title} 보완 대상으로 선택`"
                  :aria-pressed="selectedSectionIndex === index"
                  :disabled="chatDisabled || !!pendingRevision"
                  @click.stop="selectSection(index)"
                >
                  {{ selectedSectionIndex === index ? '선택됨' : '이 항목 보완' }}
                </button>
                <div
                  class="markdown-body"
                  v-html="toOutlineHtml(section.text)"
                />
              </div>
            </div>
            <div
              v-else
              class="oc-outline-preview markdown-body"
              v-html="outlineHtml"
            />
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </div>

        <!-- 오른쪽: 보완 대화와 요청 입력 -->
        <div
          v-show="isChatOpen"
          class="oc-chat-col"
        >
          <div class="oc-chat-card">
            <div class="oc-chat-head">
              <UiIcon
                name="sparkles"
                size="16"
              />
              AI 보완 요청
              <span class="oc-chat-hint">선택한 목차에만 적용</span>
              <UiButton
                variant="ghost"
                size="sm"
                class="oc-history-toggle"
                :aria-expanded="isChatOpen"
                @click="isChatOpen = !isChatOpen"
              >
                보완 패널 접기
                <template #icon-right
                  ><UiIcon
                    name="panel-right-close"
                    size="14"
                /></template>
              </UiButton>
            </div>

            <div class="oc-refinement-body">
              <div class="oc-target-card">
                <div class="oc-target-label">
                  보완 대상
                  <UiButton
                    v-if="selectedSection && !pendingRevision"
                    variant="ghost"
                    size="sm"
                    :disabled="chatDisabled"
                    @click="selectedSectionIndex = null"
                    >전체 선택</UiButton
                  >
                </div>
                <strong>{{ pendingRevision?.targetTitle ?? targetTitle }}</strong>
              </div>

              <template v-if="pendingRevision">
                <p class="oc-review-notice">아직 개요에 반영되지 않았습니다. 변경 내용을 확인해주세요.</p>
                <!-- eslint-disable vue/no-v-html — toOutlineHtml uses DOMPurify -->
                <section class="oc-revision-card is-before">
                  <h4>변경 전</h4>
                  <div
                    class="markdown-body"
                    v-html="toOutlineHtml(pendingRevision.beforeText)"
                  />
                </section>
                <section class="oc-revision-card is-after">
                  <h4>수정안</h4>
                  <div
                    class="markdown-body"
                    v-html="toOutlineHtml(pendingRevision.afterText)"
                  />
                </section>
                <!-- eslint-enable vue/no-v-html -->
              </template>
              <template v-else>
                <div class="oc-request-form">
                  <h4>어떤 방향으로 보완할까요? <span>선택</span></h4>
                  <div class="oc-prompt-suggestions">
                    <UiButton
                      v-for="suggestion in chatSuggestions"
                      :key="suggestion.label"
                      :variant="selectedSuggestion === suggestion.label ? 'primary' : 'outline'"
                      size="sm"
                      :aria-pressed="selectedSuggestion === suggestion.label"
                      :disabled="chatDisabled"
                      @click="selectedSuggestion = selectedSuggestion === suggestion.label ? '' : suggestion.label"
                    >
                      {{ suggestion.label }}
                    </UiButton>
                  </div>
                  <label for="outline-refinement-request">어떻게 바꿀까요?</label>
                  <UiTextarea
                    id="outline-refinement-request"
                    v-model="chatInput"
                    :rows="5"
                    :auto-resize="false"
                    :resizable="true"
                    border
                    :placeholder="requestPlaceholder"
                    :disabled="chatDisabled"
                  />
                  <p class="oc-request-help">
                    {{
                      needsContext
                        ? '반영할 조건이나 실제 강점을 입력해주세요.'
                        : '방향을 선택하거나 원하는 내용을 직접 입력하세요.'
                    }}
                  </p>
                  <UiButton
                    variant="primary"
                    size="md"
                    :loading="isChating"
                    :disabled="!canRequest"
                    @click="onSendChat"
                    >{{ isChating ? '수정안 작성 중' : '수정안 만들기' }}</UiButton
                  >
                </div>
                <div
                  v-if="!chatMessages.length"
                  class="oc-request-guide"
                >
                  <UiIcon
                    name="info"
                    size="16"
                  />
                  <span>수정안을 먼저 확인하고 반영할 수 있어요. 기존 개요는 그대로 유지됩니다.</span>
                </div>
              </template>
              <details
                v-if="chatMessages.length"
                class="oc-request-history"
                :open="!pendingRevision"
              >
                <summary>요청 내역 {{ chatMessages.filter((message) => message.role === 'user').length }}</summary>
                <div
                  ref="chatScrollRef"
                  class="oc-chat-msgs"
                  aria-live="polite"
                >
                  <div
                    v-for="(msg, i) in chatMessages"
                    :key="i"
                    class="oc-chat-msg"
                    :class="msg.role === 'user' ? 'is-user' : 'is-ai'"
                  >
                    {{ msg.text }}
                  </div>
                </div>
              </details>
            </div>
            <div
              v-if="pendingRevision"
              class="oc-revision-actions"
            >
              <UiButton
                variant="outline"
                size="sm"
                :disabled="isConfirming"
                @click="$emit('discard-revision')"
                >다시 요청</UiButton
              >
              <UiButton
                variant="ghost"
                size="sm"
                :disabled="isConfirming"
                @click="$emit('discard-revision')"
                >취소</UiButton
              >
              <UiButton
                variant="primary"
                size="sm"
                :loading="isConfirming"
                :disabled="isConfirming"
                @click="$emit('apply-revision')"
                >개요에 반영</UiButton
              >
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
              : `${confirmedCount}/${leafNodes.length}개 확정됨 · 확정하지 않은 항목이 있어도 이동할 수 있습니다.`
          }}
        </span>
        <div class="oc-footer-actions">
          <UiButton
            v-if="!allConfirmed"
            variant="primary-line"
            size="md"
            :loading="isBatchConfirming"
            :disabled="isBatchConfirming || isChating || !!pendingRevision"
            @click="$emit('confirm-all')"
          >
            일괄 확정
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            @click="$emit('go-template')"
          >
            템플릿 설정으로 이동
            <template #icon-right
              ><UiIcon
                name="chevron-right"
                size="14"
            /></template>
          </UiButton>
        </div>
      </div>
    </div>
  </div>

  <!-- 콘텐츠 개요 크게 보기: 본문만 -->
  <UiModal
    :is-open="isEnlargeOpen"
    :title="selectedItem?.title ?? '콘텐츠 개요'"
    max-width="960px"
    show-fullscreen
    custom-class="pt-outline-enlarge-modal"
    @close="isEnlargeOpen = false"
  >
    <div class="pt-outline-enlarge-body">
      <p
        v-if="breadcrumbPath"
        class="pt-outline-enlarge-path"
      >
        {{ breadcrumbPath }}
      </p>
      <!-- eslint-disable vue/no-v-html — toHtmlContent 내 DOMPurify 안전 처리 적용 -->
      <div
        class="oc-outline-preview markdown-body pt-outline-enlarge-preview"
        v-html="enlargeHtml"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { UiBadge, UiButton, UiDropdownMenu, UiIcon, UiInput, UiProgress, UiTextarea } from '@leechanyong/ispark-ui'
import type {
  BatchFailItem,
  OutlineChatMessage,
  OutlineRevision,
  OutlineRefinementRequest,
} from '~/composables/proposal/useProposalOutline'
import { splitOutlineSections } from '~/utils/proposal/outlineRefinement'
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
  pendingRevision: OutlineRevision | null
  isBatchGenerating: boolean
  batchProgress: { current: number; total: number }
  batchProcessingTocId: string | null
  batchFailItems: BatchFailItem[]
  unGeneratedCount: number
  isBatchConfirming: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-node': [tocId: string]
  generate: []
  chat: [request: OutlineRefinementRequest]
  'apply-revision': []
  'discard-revision': []
  confirm: [outlineTxt: string]
  'start-edit': []
  'cancel-edit': []
  'update:editing-text': [value: string]
  'generate-all': []
  'cancel-batch': []
  'confirm-all': []
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

const tocSearch = ref('')
const autoExpandSearch = ref(true)
const isSearchExpanded = computed(() => !!tocSearch.value.trim() && autoExpandSearch.value)
watch(tocSearch, () => {
  autoExpandSearch.value = true
})
const treeMenuItems = [
  { label: '전체 펼치기', value: 'expand', icon: 'chevrons-down' },
  { label: '전체 접기', value: 'collapse', icon: 'chevrons-up' },
]
const onTreeMenuSelect = (value: string) => {
  if (value !== 'expand' && value !== 'collapse') return
  autoExpandSearch.value = false
  if (value === 'collapse') {
    openRootIds.value = new Set()
    openSectionIds.value = new Set()
    return
  }
  const parents = new Set(props.tocList.map((item) => item.parentId).filter(Boolean))
  openRootIds.value = new Set(props.tocList.filter((item) => item.parentId === null).map((item) => item.tocId))
  openSectionIds.value = new Set(
    props.tocList.filter((item) => item.parentId !== null && parents.has(item.tocId)).map((item) => item.tocId),
  )
}
const visibleTocIds = computed(() => {
  const query = tocSearch.value.trim().toLocaleLowerCase()
  if (!query) return new Set(props.tocList.map((item) => item.tocId))
  const visible = new Set<string>()
  const expanded = new Set<string>()
  const byId = new Map(props.tocList.map((item) => [item.tocId, item]))
  const addDescendants = (id: string) => {
    if (expanded.has(id)) return
    expanded.add(id)
    visible.add(id)
    props.tocList.filter((item) => item.parentId === id).forEach((item) => addDescendants(item.tocId))
  }
  for (const item of props.tocList) {
    if (!item.title.toLocaleLowerCase().includes(query)) continue
    addDescendants(item.tocId)
    let parentId = item.parentId
    const visited = new Set<string>()
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId)
      visible.add(parentId)
      parentId = byId.get(parentId)?.parentId ?? null
    }
  }
  return visible
})
const rootNodes = computed(() => props.tocList.filter((t) => t.parentId === null && visibleTocIds.value.has(t.tocId)))
const childrenOf = (parentId: string) => props.tocList.filter((t) => t.parentId === parentId)
const visibleChildrenOf = (parentId: string) =>
  childrenOf(parentId).filter((item) => visibleTocIds.value.has(item.tocId))
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
const statusVariant = (cd: string) => (cd === '003' ? 'success' : cd === '002' ? 'warning' : 'default')
const statusBadgeClass = (cd: string) => {
  if (cd === '003') return 'is-confirmed'
  if (cd === '002') return 'is-draft'
  return 'is-none'
}
const statusLabel = (cd: string) => {
  if (cd === '003') return '확정'
  if (cd === '002') return '초안'
  return '미작성'
}

// ── 진행률 ────────────────────────────────────────────────────────────────
const progressPct = computed(() => {
  if (props.leafNodes.length === 0) return 0
  return Math.round((props.confirmedCount / props.leafNodes.length) * 100)
})

// ── 채팅 ─────────────────────────────────────────────────────────────────
const chatInput = ref('')
const isChatOpen = ref(true)
const selectedSuggestion = ref('')
const selectedSectionIndex = ref<number | null>(null)
const outlineSections = computed(() => splitOutlineSections(props.selectedItem?.contentOutlineTxt ?? ''))
const outlinePreface = computed(() =>
  (props.selectedItem?.contentOutlineTxt ?? '').slice(0, outlineSections.value[0]?.start ?? 0),
)
const selectedSection = computed(() =>
  selectedSectionIndex.value == null ? null : (outlineSections.value[selectedSectionIndex.value] ?? null),
)
const targetTitle = computed(() => selectedSection.value?.title ?? '개요 전체')
const selectSection = (index: number) => {
  selectedSectionIndex.value = selectedSectionIndex.value === index ? null : index
  isChatOpen.value = true
}
const onSectionBodyClick = (event: MouseEvent, index: number) => {
  if (chatDisabled.value || props.pendingRevision || window.getSelection()?.toString()) return
  if ((event.target as Element).closest('a, button, input')) return
  selectSection(index)
}
const chatSuggestions = [
  { label: '구체화', prompt: '수행 방법과 절차를 더 구체적으로 설명해줘.' },
  { label: '고객 조건 반영', prompt: '입력한 고객 요구사항과 제약 조건을 반영해줘.' },
  { label: '강점 강조', prompt: '입력한 우리 회사의 강점과 차별점을 강조해줘.' },
  { label: '간결하게', prompt: '핵심 내용은 유지하면서 중복을 없애고 간결하게 정리해줘.' },
]
const needsContext = computed(() => ['고객 조건 반영', '강점 강조'].includes(selectedSuggestion.value))
const canRequest = computed(
  () => !chatDisabled.value && (!!chatInput.value.trim() || (!!selectedSuggestion.value && !needsContext.value)),
)
const requestPlaceholder = computed(() =>
  selectedSuggestion.value === '고객 조건 반영'
    ? '예: 설치 가능 시간은 22시~06시이며, 서비스 중단은 불가합니다.'
    : selectedSuggestion.value === '강점 강조'
      ? '예: 전담 상주 인력과 24시간 원격 지원 체계를 갖추고 있습니다.'
      : '예: 3단계 수행 절차와 단계별 검증 방법을 구체화해줘.',
)
const chatDisabled = computed(
  () =>
    !props.selectedItem ||
    props.selectedItem.outlineStatusCd === '001' ||
    props.isChating ||
    props.isGenerating ||
    props.isLoadingOutline ||
    props.isConfirming ||
    props.isEditing,
)
const chatScrollRef = ref<HTMLElement | null>(null)

const onSendChat = () => {
  if (!canRequest.value) return
  const direction = chatSuggestions.find((item) => item.label === selectedSuggestion.value)?.prompt
  const msg = [direction, chatInput.value.trim()].filter(Boolean).join('\n')
  isChatOpen.value = true
  emit('chat', {
    message: msg,
    targetStart: selectedSection.value?.start,
    targetEnd: selectedSection.value?.end,
    targetTitle: targetTitle.value,
  })
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
    selectedSuggestion.value = ''
    selectedSectionIndex.value = null
  },
)

watch(isChatOpen, (open) => {
  if (open)
    nextTick(() => {
      if (chatScrollRef.value) chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
    })
})

watch(
  () => props.selectedItem?.contentOutlineTxt,
  () => {
    selectedSectionIndex.value = null
  },
)

// ── 개요 마크다운 미리보기 ────────────────────────────────────────────────
const toOutlineHtml = (raw: string) => {
  // 단일 \n + 불릿 조합은 marked가 리스트로 인식 못함 → 불릿 앞 빈 줄 보장
  const normalized = raw.replace(/([^\n])\n([ \t]*[-*+] )/g, '$1\n\n$2')
  return toHtmlContent(normalized)
}

const outlineHtml = computed(() => toOutlineHtml(props.selectedItem?.contentOutlineTxt ?? ''))

const enlargeHtml = computed(() =>
  toOutlineHtml(props.isEditing ? props.editingText : (props.selectedItem?.contentOutlineTxt ?? '')),
)

const isEnlargeOpen = ref(false)
const outlineActionBusy = computed(
  () =>
    props.isGenerating || props.isChating || props.isConfirming || props.isLoadingOutline || !!props.pendingRevision,
)
const outlineMenuItems = computed(() => [
  { label: '크게 보기', value: 'enlarge', icon: 'maximize-2' },
  ...(!props.isEditing ? [{ label: '수정', value: 'edit', icon: 'pencil', disabled: outlineActionBusy.value }] : []),
  { label: '재생성', value: 'regenerate', icon: 'refresh-cw', disabled: outlineActionBusy.value || props.isEditing },
])
const onOutlineMenuSelect = (value: string) => {
  if (value === 'enlarge') isEnlargeOpen.value = true
  else if (!outlineActionBusy.value) {
    if (value === 'edit' && !props.isEditing) emit('start-edit')
    if (value === 'regenerate' && !props.isEditing) emit('generate')
  }
}

// ── 확정 ─────────────────────────────────────────────────────────────────
const onConfirm = () => {
  const txt = props.isEditing ? props.editingText : (props.selectedItem?.contentOutlineTxt ?? '')
  emit('confirm', txt)
}
</script>

<style scoped lang="scss">
.oc-document-layout {
  .oc-outline-textarea {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    :deep(.ui-textarea-wrap) {
      position: relative;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    :deep(textarea.ui-textarea) {
      position: absolute;
      inset: 0;
      width: 100%;
      min-height: 0;
      height: 100%;
      box-sizing: border-box;
      overflow-y: scroll;
      overscroll-behavior-y: contain;
      scrollbar-gutter: stable;
    }
  }
  .oc-tree-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .oc-tree-title-row h3 {
    margin: 0;
  }
  .oc-confirm-progress {
    flex: 1;
    min-width: 0;
  }
  .oc-global-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 16px;
    padding: 8px 20px;
    border-bottom: 1px solid $color-border;
    background: #f8faff;
    flex-shrink: 0;
  }
  .oc-global-toolbar-label {
    display: flex;
    flex: 1;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 12px;
  }
  .oc-global-toolbar-label span {
    color: $color-text-muted;
    font-size: 11px;
  }
  .oc-global-toolbar .oc-batch-row {
    margin: 0;
  }
  .oc-global-toolbar .oc-batch-fail-summary {
    flex-basis: 100%;
  }
  .oc-tree-pane {
    width: clamp(240px, 24%, 340px);
  }
  .oc-toc-search {
    margin-top: 10px;
  }
  .oc-right-pane {
    min-height: 0;
  }
  .oc-detail-head {
    min-height: 52px;
    height: auto;
    padding: 8px 20px;
  }
  .oc-detail-body {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
    overflow: hidden;
    &.is-chat-collapsed {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .oc-outline-col {
    flex: 1;
    padding: 8px 20px;
  }
  .oc-outline-preview {
    padding: 16px 24px;
    color: $color-text-primary;
    font-size: 15px;
    line-height: 1.8;
  }
  .oc-selectable-outline {
    padding: 12px 16px;
    line-height: 1.65;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid $color-border;
    border-radius: 6px;
    box-sizing: border-box;
  }
  .oc-selectable-outline :deep(ol),
  .oc-revision-card :deep(ol) {
    list-style: decimal;
    padding-left: 24px;
  }
  .oc-selectable-outline :deep(ul),
  .oc-revision-card :deep(ul) {
    list-style: disc;
    padding-left: 24px;
  }
  .oc-selectable-outline :deep(p),
  .oc-revision-card :deep(p) {
    margin: 4px 0;
  }
  .oc-selectable-outline :deep(ol),
  .oc-selectable-outline :deep(ul) {
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .oc-selectable-outline :deep(li) {
    margin-bottom: 3px;
  }
  .oc-selectable-outline :deep(h1),
  .oc-selectable-outline :deep(h2),
  .oc-selectable-outline :deep(h3) {
    margin: 0 0 6px;
    font-size: 15px;
    line-height: 1.65;
  }
  .oc-outline-textarea :deep(textarea.ui-textarea) {
    font-size: 15px;
    line-height: 1.8;
    padding: 16px 24px;
  }
  .oc-outline-preview :deep(p),
  .oc-outline-preview :deep(li) {
    font-size: inherit;
    line-height: inherit;
  }
  .oc-outline-preview :deep(li) {
    margin-bottom: 3px;
  }
  .oc-outline-card-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .oc-outline-foot {
    margin-top: 10px;
  }

  .oc-chat-col {
    min-height: 0;
    border-left: 1px solid $color-border;
    padding: 8px 16px 8px 12px;
  }
  .oc-chat-card {
    flex: 1;
    padding: 8px 12px;
    background: #f8faff;
    border: 1px solid $color-border;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .oc-refinement-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 6px 2px;
  }
  .oc-target-card {
    padding: 12px;
    background: #edf3ff;
    border: 1px solid #d9e5fc;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  .oc-target-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #62718a;
    font-size: 12px;
    margin-bottom: 4px;
  }
  .oc-request-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .oc-request-form h4,
  .oc-request-form label {
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }
  .oc-request-form h4 span {
    font-size: 11px;
    color: #75839a;
    font-weight: 400;
  }
  .oc-request-form label {
    margin-top: 10px;
  }
  .oc-request-help,
  .oc-review-notice {
    margin: 0;
    color: #63718b;
    font-size: 12px;
    line-height: 1.6;
  }
  .oc-request-guide {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background: #eef4ff;
    border-radius: 6px;
    font-size: 12px;
    color: #536784;
    line-height: 1.7;
  }
  .oc-request-guide :deep(svg) {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .oc-request-history {
    margin-top: 20px;
    font-size: 12px;
  }
  .oc-request-history summary {
    cursor: pointer;
    padding: 8px 0;
    color: #63718b;
  }
  .oc-request-history .oc-chat-msgs {
    max-height: 220px;
    padding: 8px;
  }
  .oc-revision-card {
    border: 1px solid #dce4ef;
    border-radius: 8px;
    padding: 12px;
    margin-top: 12px;
    background: white;
  }
  .oc-revision-card.is-before {
    border-color: #ebdfb6;
    background: #fffcf3;
  }
  .oc-revision-card.is-after {
    border-color: #c9dafd;
    background: #f2f7ff;
  }
  .oc-revision-card h4 {
    margin: 0 0 10px;
    font-size: 13px;
  }
  .oc-revision-card :deep(.markdown-body) {
    font-size: 13px;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  .oc-revision-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px;
    flex-shrink: 0;
    border-top: 1px solid #dce4ef;
    padding-top: 12px;
    margin-top: 10px;
  }
  .oc-selection-hint {
    color: #77869a;
    font-size: 12px;
    margin: 0 0 8px;
  }
  .oc-outline-section {
    position: relative;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 4px;
  }
  .oc-outline-section:hover {
    background: #f6f8fd;
  }
  .oc-outline-section.is-selected {
    border-color: #b9ceff;
    background: #eef4ff;
  }
  .oc-section-select {
    float: right;
    display: block;
    margin: 0 0 4px 12px;
    padding: 3px 8px;
    border: 1px solid #d9e3f3;
    border-radius: 5px;
    color: #4467c6;
    background: white;
    font-size: 11px;
    cursor: pointer;
  }
  .oc-outline-section {
    display: flow-root;
  }
  .oc-section-select[aria-pressed='true'] {
    background: #4065e7;
    border-color: #4065e7;
    color: white;
  }
  .oc-section-select:focus-visible {
    outline: 2px solid #4065e7;
    outline-offset: 2px;
  }
  .oc-section-select:disabled {
    cursor: default;
    opacity: 0.6;
  }
  .oc-chat-head {
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }
  .oc-chat-hint {
    flex-basis: 100%;
    order: 1;
  }
  .oc-history-toggle {
    margin-left: auto;
  }
  .oc-chat-msgs {
    flex: 1;
    max-height: none;
    margin: 4px 0 10px;
  }
  .oc-chat-msg {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .oc-chat-input-row {
    padding-top: 0;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .oc-prompt-suggestions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    flex-basis: 100%;
  }
  .oc-refinement-input {
    flex: 1 1 120px;
    min-width: 0;
  }
  .oc-footer {
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 20px;
    padding: 8px 20px;
    min-height: 52px;
    box-sizing: border-box;
  }
  .oc-footer-note {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.6;
    color: $color-text-primary;
  }
  .oc-footer-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    flex-shrink: 0;
  }
  .oc-node-row > .ui-badge,
  .oc-leaf > .ui-badge {
    flex-shrink: 0;
    margin-left: 4px;
  }

  @media (max-width: 1050px) {
    .oc-detail-body {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .oc-outline-col {
      flex: 1 0 320px;
    }
    .oc-chat-col {
      flex: 0 0 300px;
      border-left: 0;
      border-top: 1px solid $color-border;
      padding: 12px;
    }
  }
  @media (max-width: 720px) {
    flex-direction: column;
    overflow-y: auto;
    .oc-tree-pane {
      width: 100%;
      max-height: 230px;
      border-right: 0;
      border-bottom: 1px solid $color-border;
    }
    .oc-right-pane {
      flex: 1 0 500px;
    }
    .oc-outline-col {
      padding: 12px;
    }
    .oc-outline-preview {
      padding: 14px;
    }
    .oc-chat-col {
      padding: 0 12px 12px;
    }
    .oc-chat-hint {
      display: none;
    }
    .oc-footer-actions {
      margin-left: auto;
    }
  }
}
</style>
