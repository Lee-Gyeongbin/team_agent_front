<template>
  <div class="pt-panel pt-panel--lg pt-detail-toc">
    <div class="pt-detail-toc-head">
      <div class="pt-panel-title-row">
        <h3 class="pt-panel-title">세부목차</h3>
        <UiButton
          variant="ghost"
          size="sm"
          @click="isPromptModalOpen = true"
        >
          <template #icon-left>
            <i class="icon-edit size-14" />
          </template>
          프롬프트
        </UiButton>
      </div>
      <p class="pt-panel-desc">전략검토 결과를 바탕으로 제안서의 세부목차를 구성하는 단계입니다.</p>
    </div>

    <!-- 세부목차 생성 로딩 -->
    <div
      v-if="isLoadingToc"
      class="pt-s4-loading"
    >
      <div class="pt-s4-loading-box">
        <div class="pt-s4-loading-spinner" />
        <h3>{{ isRegeneratingToc ? '세부목차 재생성 중입니다' : '세부목차 생성 중입니다' }}</h3>
        <p>
          {{
            isRegeneratingToc
              ? 'Win Theme와 요구사항을 바탕으로 세부목차를 다시 구성하고 있어요. 잠시만 기다려주세요.'
              : 'Win Theme와 요구사항을 바탕으로 소목차별 슬라이드 구성을 생성하고 있어요. 잠시만 기다려주세요.'
          }}
        </p>
        <div
          v-if="!isRegeneratingToc"
          class="pt-s4-loading-steps"
        >
          <div
            v-for="(s, i) in loadingSteps"
            :key="s.key"
            class="pt-s4l-step"
            :class="{ done: i < loadingStepIdx, active: i === loadingStepIdx }"
          >
            <span class="pt-s4l-dot">{{ i < loadingStepIdx ? '✓' : '' }}</span>
            <div>
              <b>{{ s.title }}</b>
              <small>{{ i < loadingStepIdx ? s.doneMsg : i === loadingStepIdx ? s.activeMsg : s.waitMsg }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 완료 상태: 세부목차 / 콘텐츠 개요 탭 -->
    <div
      v-else-if="isDone"
      class="pt-detail-toc-body"
    >
      <UiTab
        v-model="activeTab"
        class="pt-detail-toc-tabs"
        :tabs="subTabs"
      />

      <!-- 세부목차 탭 -->
      <div
        v-show="activeTab === 'toc'"
        class="pt-detail-toc-tab"
      >
        <div class="pt-toc-toolbar">
          <span class="pt-badge is-ok">
            {{ tocCount > 0 ? `완료 ${tocCount}개` : '완료' }}
          </span>
          <span class="pt-muted">세부목차 생성이 완료되었습니다.</span>
          <div class="pt-toc-toolbar-actions">
            <UiButton
              variant="primary-line"
              size="sm"
              :loading="isRegeneratingToc"
              @click="onRegenerateToc"
            >
              ↻ 세부목차 재생성
            </UiButton>
            <UiButton
              variant="ghost"
              size="sm"
              class="pt-toc-add-root"
              @click="startAdd(null)"
            >
              <template #icon-left>
                <i class="icon icon-plus size-16" />
              </template>
              대목차 추가
            </UiButton>
          </div>
        </div>

        <div
          v-if="isLoadingResult"
          class="pt-detail-toc-loading"
        >
          <div class="pt-s4-loading-spinner" />
          <span class="pt-muted">목차 불러오는 중…</span>
        </div>

        <div
          v-else
          class="pt-detail-toc-tree"
          role="tree"
        >
          <div
            v-if="isAdding && addingParentId === null"
            class="pt-dtree-row is-add"
            @click.stop
          >
            <span class="pt-dtree-chevron-placeholder" />
            <UiInput
              :ref="bindAddInputRef"
              v-model="addingName"
              type="text"
              class="pt-dtree-name-input"
              :placeholder="addingPlaceholder"
              size="sm"
              radius="base"
              @enter="submitAdd"
            />
          </div>

          <div
            v-for="root in tocTree"
            :key="root.tocId"
            class="pt-dtree-node"
            role="treeitem"
            :aria-expanded="openGroups.has(root.tocId)"
          >
            <ProposalTocTreeRow
              variant="root"
              :title="root.title"
              tag-label="대목차"
              tag-class="is-rfp"
              :count-label="`소분류 ${root.children.length}`"
              :is-open="openGroups.has(root.tocId)"
              :has-toggle="hasToggle(root)"
              :is-editing="editingTocId === root.tocId"
              :editing-name="editingName"
              edit-placeholder="대목차명 입력 (엔터)"
              :menu-items="menuRoot"
              @toggle="toggleGroup(root.tocId)"
              @menu-select="onMenuSelect($event, root)"
              @update:editing-name="editingName = $event"
              @save-rename="saveRename"
            />

            <div
              v-show="isChildrenVisible(root)"
              class="pt-dtree-children"
              role="group"
            >
              <div
                v-for="section in root.children"
                :key="section.tocId"
                class="pt-dtree-node"
                role="treeitem"
                :aria-expanded="openGroups.has(section.tocId)"
              >
                <ProposalTocTreeRow
                  variant="section"
                  :title="section.title"
                  tag-label="소분류"
                  tag-class="is-user"
                  :count-label="`세부 ${section.children.length}`"
                  :is-open="openGroups.has(section.tocId)"
                  :has-toggle="hasToggle(section)"
                  :is-editing="editingTocId === section.tocId"
                  :editing-name="editingName"
                  edit-placeholder="소분류명 입력 (엔터)"
                  :menu-items="menuSection"
                  @toggle="toggleGroup(section.tocId)"
                  @menu-select="onMenuSelect($event, section)"
                  @update:editing-name="editingName = $event"
                  @save-rename="saveRename"
                />

                <div
                  v-show="isChildrenVisible(section)"
                  class="pt-dtree-children"
                  role="group"
                >
                  <ProposalTocTreeRow
                    v-for="sub in section.children"
                    :key="sub.tocId"
                    variant="leaf"
                    :title="sub.title"
                    tag-label="세부목차"
                    tag-class="is-detail"
                    :is-editing="editingTocId === sub.tocId"
                    :editing-name="editingName"
                    edit-placeholder="세부목차명 입력 (엔터)"
                    :menu-items="menuLeaf"
                    @menu-select="onMenuSelect($event, sub)"
                    @update:editing-name="editingName = $event"
                    @save-rename="saveRename"
                  />
                  <div
                    v-if="isAdding && addingParentId === section.tocId"
                    class="pt-dtree-row is-add is-leaf"
                    @click.stop
                  >
                    <span class="pt-dtree-chevron-placeholder" />
                    <UiInput
                      :ref="bindAddInputRef"
                      v-model="addingName"
                      type="text"
                      class="pt-dtree-name-input"
                      :placeholder="addingPlaceholder"
                      size="sm"
                      radius="base"
                      @enter="submitAdd"
                    />
                  </div>
                </div>
              </div>

              <div
                v-if="isAdding && addingParentId === root.tocId"
                class="pt-dtree-row is-add is-section"
                @click.stop
              >
                <span class="pt-dtree-chevron-placeholder" />
                <UiInput
                  :ref="bindAddInputRef"
                  v-model="addingName"
                  type="text"
                  class="pt-dtree-name-input"
                  :placeholder="addingPlaceholder"
                  size="sm"
                  radius="base"
                  @enter="submitAdd"
                />
              </div>
            </div>
          </div>

          <UiEmpty
            v-if="tocTree.length === 0 && !(isAdding && addingParentId === null)"
            title="세부목차가 없습니다."
          />
        </div>

        <div class="pt-panel-actions pt-strategy-actions">
          <UiButton
            variant="primary"
            size="md"
            @click="activeTab = 'outline'"
          >
            콘텐츠 개요 작성
            <template #icon-right>
              <i class="icon-arrow-right size-14" />
            </template>
          </UiButton>
        </div>
      </div>

      <!-- 콘텐츠 개요 탭 -->
      <div
        v-show="activeTab === 'outline'"
        class="pt-detail-toc-tab pt-detail-toc-tab--outline"
      >
        <ProposalStepContentOutline
          :toc-list="outlineTocList"
          :leaf-nodes="leafNodes"
          :confirmed-count="confirmedCount"
          :all-confirmed="allConfirmed"
          :is-loading-toc="isLoadingOutlineToc"
          :selected-toc-id="selectedTocId"
          :selected-item="selectedItem"
          :is-loading-outline="isLoadingOutline"
          :is-generating="isGenerating"
          :is-chating="isChating"
          :is-confirming="isConfirming"
          :is-editing="isEditing"
          :editing-text="editingText"
          :chat-messages="chatMessages"
          @select-node="handleSelectNode"
          @generate="handleGenerate"
          @chat="handleChat"
          @confirm="handleConfirm"
          @start-edit="handleStartEdit"
          @update:editing-text="editingText = $event"
          @go-template="emit('next')"
        />
      </div>
    </div>

    <!-- 오류 상태 -->
    <div
      v-else-if="hasError"
      class="pt-s4-wrap"
    >
      <div class="pt-s4-content">
        <UiEmpty
          icon="icon-warning-triangle"
          title="세부목차 생성 중 오류가 발생했습니다."
          :description="errorMessage"
        >
          <UiButton
            variant="primary-line"
            size="sm"
            @click="startToc"
          >
            다시 시도
          </UiButton>
        </UiEmpty>
      </div>
    </div>
  </div>

  <!-- 프롬프트 보기/수정 모달 (항상 렌더링) -->
  <ProposalPromptModal
    :is-open="isPromptModalOpen"
    :stage-cds="['S2C_COVEREDREQNOS']"
    @close="isPromptModalOpen = false"
  />
</template>

<script setup lang="ts">
import ProposalTocTreeRow from '~/components/proposal/steps/ProposalTocTreeRow.vue'
import ProposalStepContentOutline from '~/components/proposal/steps/ProposalStepContentOutline.vue'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { useProposalOutline } from '~/composables/proposal/useProposalOutline'
import { openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import type { PtTocItem, TocMappingNode } from '~/types/proposal'

const props = defineProps<{
  ptProjectId: string
  modelId: string
  agentId: string
}>()

const emit = defineEmits<{
  next: []
}>()

const activeTab = ref<'toc' | 'outline'>('toc')

const {
  tocList: outlineTocList,
  leafNodes,
  confirmedCount,
  allConfirmed,
  isLoadingToc: isLoadingOutlineToc,
  selectedTocId,
  selectedItem,
  isLoadingOutline,
  isGenerating,
  isChating,
  isConfirming,
  isEditing,
  editingText,
  chatMessages,
  handleLoadToc,
  handleSelectNode,
  handleGenerate,
  handleChat,
  handleConfirm,
  handleStartEdit,
} = useProposalOutline(
  computed(() => props.ptProjectId),
  computed(() => props.modelId),
  computed(() => props.agentId),
)

const subTabs = computed(() => [
  { label: '세부목차', value: 'toc' },
  {
    label: leafNodes.value.length > 0 ? `콘텐츠 개요 ${confirmedCount.value}/${leafNodes.value.length}` : '콘텐츠 개요',
    value: 'outline',
  },
])

const {
  streamAnalyzeStage2Toc,
  fetchSelectStage2TocMapping,
  fetchSelectStage2Summary,
  fetchRegenerateStage2Mapping,
  fetchInsertTocItem,
  fetchUpdateTocItem,
  fetchDeleteTocItem,
} = useProposalApi()

const loadingSteps = [
  {
    key: 'req_mapping',
    title: '요구사항·목차 매핑',
    doneMsg: '소목차별 요구사항 배정 완료',
    activeMsg: '소목차별 관련 요구사항 배정 중…',
    waitMsg: '대기 중',
  },
  {
    key: 'extract_ref',
    title: '참조 자료 분석',
    doneMsg: '참조 자료 분석 완료',
    activeMsg: '참조 자료 추출 중…',
    waitMsg: '대기 중',
  },
]

// 프롬프트 모달
const isPromptModalOpen = ref(false)

const isLoadingToc = ref(false)
const isRegeneratingToc = ref(false)
const isDone = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const loadingStepIdx = ref(0)
const tocCount = ref(0)

// 완료 후 목차 트리 데이터
const isLoadingResult = ref(false)

interface TocTreeNode extends TocMappingNode {
  children: TocTreeLeaf[]
}
interface TocTreeLeaf extends TocMappingNode {
  children: TocMappingNode[]
}

const tocTree = ref<TocTreeNode[]>([])
const openGroups = ref<Set<string>>(new Set())

const editingTocId = ref<string | null>(null)
const editingName = ref('')
const isAdding = ref(false)
const addingParentId = ref<string | null>(null)
const addingName = ref('')
const addInputRef = ref<{ focus: () => void } | null>(null)
const isSavingToc = ref(false)

const bindAddInputRef = (el: unknown) => {
  if (el) addInputRef.value = el as { focus: () => void }
}

const focusAddInput = () => {
  nextTick(() => {
    nextTick(() => addInputRef.value?.focus())
  })
}

const menuRoot: DropdownMenuItemDef[] = [
  { label: '이름 수정', value: 'rename', icon: 'icon-edit' },
  { label: '소분류 추가', value: 'addChild', icon: 'icon-plus' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]
const menuSection: DropdownMenuItemDef[] = [
  { label: '이름 수정', value: 'rename', icon: 'icon-edit' },
  { label: '세부목차 추가', value: 'addChild', icon: 'icon-plus' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]
const menuLeaf: DropdownMenuItemDef[] = [
  { label: '이름 수정', value: 'rename', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]

const addingPlaceholder = computed(() => {
  if (addingParentId.value === null) return '대목차명 입력 (엔터)'
  const ctx = findTocContext(addingParentId.value)
  if (ctx?.level === 1) return '소분류명 입력 (엔터)'
  return '세부목차명 입력 (엔터)'
})

const buildTocTree = (nodes: TocMappingNode[]): TocTreeNode[] => {
  const sorted = [...nodes].sort((a, b) => a.sortOrd - b.sortOrd)
  const roots = sorted.filter((n) => !n.parentTocId)
  return roots.map((root) => {
    const level2 = sorted.filter((n) => n.parentTocId === root.tocId)
    return {
      ...root,
      children: level2.map((l2) => ({
        ...l2,
        children: sorted.filter((n) => n.parentTocId === l2.tocId),
      })),
    }
  })
}

/** 대목차·소분류 기본 펼침 */
const expandAllGroups = (tree: TocTreeNode[]) => {
  const next = new Set<string>()
  for (const root of tree) {
    next.add(root.tocId)
    for (const section of root.children) next.add(section.tocId)
  }
  openGroups.value = next
}

const toggleGroup = (tocId: string) => {
  const next = new Set(openGroups.value)
  if (next.has(tocId)) next.delete(tocId)
  else next.add(tocId)
  openGroups.value = next
}

const hasToggle = (node: TocTreeNode | TocTreeLeaf) =>
  node.children.length > 0 || (isAdding.value && addingParentId.value === node.tocId)

const isChildrenVisible = (node: TocTreeNode | TocTreeLeaf) => openGroups.value.has(node.tocId) && hasToggle(node)

const findTocContext = (tocId: string): { node: TocMappingNode; level: 1 | 2 | 3; hasChildren: boolean } | null => {
  for (const root of tocTree.value) {
    if (root.tocId === tocId) return { node: root, level: 1, hasChildren: root.children.length > 0 }
    for (const section of root.children) {
      if (section.tocId === tocId) return { node: section, level: 2, hasChildren: section.children.length > 0 }
      for (const sub of section.children) {
        if (sub.tocId === tocId) return { node: sub, level: 3, hasChildren: false }
      }
    }
  }
  return null
}

const cancelEdit = () => {
  editingTocId.value = null
  editingName.value = ''
}

const cancelAdd = () => {
  isAdding.value = false
  addingParentId.value = null
  addingName.value = ''
}

const startRename = (node: TocMappingNode) => {
  cancelAdd()
  editingTocId.value = node.tocId
  editingName.value = node.title
}

const startAdd = (parentId: string | null) => {
  cancelEdit()
  if (isAdding.value && addingParentId.value === parentId) {
    cancelAdd()
    return
  }
  isAdding.value = true
  addingParentId.value = parentId
  addingName.value = ''
  if (parentId) {
    const next = new Set(openGroups.value)
    next.add(parentId)
    openGroups.value = next
  }
  focusAddInput()
}

const toMappingNode = (item: PtTocItem): TocMappingNode => ({
  tocId: item.tocId,
  title: item.title,
  parentTocId: item.parentId,
  coveredReqIds: [],
  linkedEvalCriteriaId: null,
  sortOrd: item.order,
})

const insertTocNode = (item: PtTocItem): boolean => {
  const node = toMappingNode(item)
  if (!item.parentId) {
    tocTree.value = [...tocTree.value, { ...node, children: [] }]
    return true
  }
  for (const root of tocTree.value) {
    if (root.tocId === item.parentId) {
      root.children.push({ ...node, children: [] })
      return true
    }
    for (const section of root.children) {
      if (section.tocId === item.parentId) {
        section.children.push(node)
        return true
      }
    }
  }
  return false
}

const removeTocNode = (tocId: string) => {
  tocTree.value = tocTree.value.filter((root) => {
    if (root.tocId === tocId) return false
    root.children = root.children.filter((section) => {
      if (section.tocId === tocId) return false
      section.children = section.children.filter((sub) => sub.tocId !== tocId)
      return true
    })
    return true
  })
}

const updateTocTitleLocal = (tocId: string, title: string) => {
  const ctx = findTocContext(tocId)
  if (ctx) ctx.node.title = title
}

const submitAdd = async () => {
  const title = addingName.value.trim()
  if (!title) {
    openToast({ message: '목차명을 입력해 주세요.', type: 'warning' })
    nextTick(() => addInputRef.value?.focus())
    return
  }
  if (isSavingToc.value) return
  isSavingToc.value = true
  const parentId = addingParentId.value
  try {
    const res = await fetchInsertTocItem({
      ptProjectId: props.ptProjectId,
      parentTocId: parentId,
      sectionNm: title,
    })
    if (res.result !== 'OK' || !res.data) {
      openToast({ message: res.msg || '목차 추가에 실패했습니다.', type: 'error' })
      return
    }
    if (!insertTocNode(res.data)) await loadTocResult()
    cancelAdd()
    openToast({ message: '목차가 추가되었습니다.' })
  } catch {
    openToast({ message: '목차 추가에 실패했습니다.', type: 'error' })
  } finally {
    isSavingToc.value = false
  }
}

const saveRename = async () => {
  const tocId = editingTocId.value
  if (!tocId) return
  const title = editingName.value.trim()
  if (!title) {
    openToast({ message: '목차명을 입력해 주세요.', type: 'warning' })
    return
  }
  const ctx = findTocContext(tocId)
  if (!ctx || ctx.node.title === title) {
    cancelEdit()
    return
  }
  const oldTitle = ctx.node.title
  ctx.node.title = title
  cancelEdit()
  try {
    await fetchUpdateTocItem(tocId, title)
  } catch {
    updateTocTitleLocal(tocId, oldTitle)
    openToast({ message: '목차 제목 수정에 실패했습니다.', type: 'error' })
  }
}

const onDeleteItem = async (node: TocMappingNode) => {
  const ctx = findTocContext(node.tocId)
  const childMsg = ctx?.hasChildren ? '\n하위 목차도 함께 삭제됩니다.' : ''
  const confirmed = await openConfirm({
    title: '목차 삭제',
    message: `'${node.title}'을(를) 삭제하시겠습니까?${childMsg}`,
  })
  if (!confirmed) return
  try {
    const res = await fetchDeleteTocItem(node.tocId)
    if (res.result !== 'OK') {
      openToast({ message: '목차 삭제에 실패했습니다.', type: 'error' })
      return
    }
    removeTocNode(node.tocId)
    if (editingTocId.value === node.tocId) cancelEdit()
    if (addingParentId.value === node.tocId) cancelAdd()
    openToast({ message: '목차가 삭제되었습니다.' })
  } catch {
    openToast({ message: '목차 삭제에 실패했습니다.', type: 'error' })
  }
}

const onMenuSelect = (value: string, node: TocMappingNode) => {
  if (value === 'rename') startRename(node)
  else if (value === 'addChild') startAdd(node.tocId)
  else if (value === 'delete') onDeleteItem(node)
}

const applyTocNodes = (nodes: TocMappingNode[]) => {
  const tree = buildTocTree(nodes)
  tocTree.value = tree
  expandAllGroups(tree)
  tocCount.value = nodes.length
}

const loadTocResult = async () => {
  isLoadingResult.value = true
  try {
    const res = await fetchSelectStage2TocMapping(props.ptProjectId)
    if (res?.data?.tocNodes) applyTocNodes(res.data.tocNodes)
  } catch (e) {
    console.warn('[ProposalStepToc] 목차 조회 실패:', e)
  } finally {
    isLoadingResult.value = false
  }
}

/** 세부목차 재생성 — 기존 목차·콘텐츠 개요를 덮어씀 */
const onRegenerateToc = async () => {
  const ok = await openConfirm({
    title: '세부목차 재생성',
    message: '세부목차를 다시 생성합니다. 직접 수정한 목차와 작성 중인 콘텐츠 개요가 사라집니다.',
  })
  if (!ok) return

  isRegeneratingToc.value = true
  isLoadingToc.value = true
  hasError.value = false
  cancelEdit()
  cancelAdd()

  try {
    const res = await fetchRegenerateStage2Mapping({
      ptProjectId: props.ptProjectId,
      modelId: props.modelId,
      agentId: props.agentId,
    })
    if (res.result !== 'OK' || !res.data?.tocNodes) {
      openToast({ message: '세부목차 재생성에 실패했습니다.', type: 'error' })
      return
    }
    applyTocNodes(res.data.tocNodes)
    await handleLoadToc()
    openToast({ message: '세부목차가 재생성되었습니다.' })
  } catch {
    openToast({ message: '세부목차 재생성에 실패했습니다.', type: 'error' })
  } finally {
    isLoadingToc.value = false
    isRegeneratingToc.value = false
  }
}

const startToc = () => {
  isLoadingToc.value = true
  isDone.value = false
  hasError.value = false
  errorMessage.value = ''
  loadingStepIdx.value = 0
  tocTree.value = []
  openGroups.value = new Set()
  cancelEdit()
  cancelAdd()

  streamAnalyzeStage2Toc(props.ptProjectId, props.modelId, props.agentId, {
    onProgress: (data) => {
      if (data.step === 'req_mapping') loadingStepIdx.value = 0
      if (data.step === 'extract_ref') loadingStepIdx.value = 1
      if (data.step === 'save') loadingStepIdx.value = 2
    },
    onDone: (data) => {
      isLoadingToc.value = false
      isDone.value = true
      tocCount.value = data.tocCount ?? 0
      loadTocResult()
    },
    onError: (msg) => {
      isLoadingToc.value = false
      hasError.value = true
      errorMessage.value = msg || '세부목차 생성에 실패했습니다.'
    },
  })
}

// isDone이 true가 되면 콘텐츠 개요용 TOC 목록 로드
watch(isDone, (val) => {
  if (val) handleLoadToc()
})

onMounted(async () => {
  try {
    const res = await fetchSelectStage2Summary(props.ptProjectId)
    if (res.result === 'OK' && res.data?.stage2StatusCd === '003') {
      // 전체완료 — TOC 재생성 없이 기존 결과 표시
      isDone.value = true
      await loadTocResult()
      return
    }
  } catch {
    /* 조회 실패 시 fallback으로 재생성 */
  }
  startToc()
})
</script>
