<template>
  <div class="pt-panel pt-panel--lg pt-detail-toc">
    <h3 class="pt-panel-title">세부목차</h3>
    <p class="pt-panel-desc">전략검토 결과를 바탕으로 제안서의 세부목차를 구성하는 단계입니다.</p>

    <!-- 세부목차 생성 로딩 -->
    <div
      v-if="isLoadingToc"
      class="pt-s4-loading"
    >
      <div class="pt-s4-loading-box">
        <div class="pt-s4-loading-spinner" />
        <h3>세부목차 생성 중입니다</h3>
        <p>Win Theme와 요구사항을 바탕으로 소목차별 슬라이드 구성을 생성하고 있어요. 잠시만 기다려주세요.</p>
        <div class="pt-s4-loading-steps">
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

    <!-- 완료 상태 -->
    <div
      v-else-if="isDone"
      class="pt-s4-wrap"
    >
      <div class="pt-s4-content">
        <div class="pt-toc-toolbar">
          <span class="pt-badge is-ok">
            {{ tocCount > 0 ? `완료 ${tocCount}개` : '완료' }}
          </span>
          <span class="pt-muted">세부목차 생성이 완료되었습니다.</span>
        </div>

        <div
          v-if="isLoadingResult"
          class="pt-detail-toc-loading"
        >
          <div class="pt-s4-loading-spinner" />
          <span class="pt-muted">목차 불러오는 중…</span>
        </div>

        <div
          v-else-if="tocTree.length > 0"
          class="pt-detail-toc-tree pt-toc-list--scroll"
          role="tree"
        >
          <div
            v-for="root in tocTree"
            :key="root.tocId"
            class="pt-dtree-node"
            role="treeitem"
            :aria-expanded="openGroups.has(root.tocId)"
          >
            <button
              type="button"
              class="pt-dtree-row is-root"
              @click="toggleGroup(root.tocId)"
            >
              <i
                class="icon-arrow-down-gray size-16 pt-dtree-chevron"
                :class="{ 'is-open': openGroups.has(root.tocId) }"
              />
              <i
                :class="[
                  'size-16',
                  'pt-dtree-icon',
                  openGroups.has(root.tocId) ? 'icon-folder-open' : 'icon-folder-close',
                ]"
              />
              <span class="pt-dtree-title">{{ root.title }}</span>
              <span class="pt-toc-tag is-rfp">대목차</span>
              <span class="pt-dtree-count">소분류 {{ root.children.length }}</span>
            </button>

            <div
              v-show="openGroups.has(root.tocId)"
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
                <button
                  type="button"
                  class="pt-dtree-row is-section"
                  @click="toggleGroup(section.tocId)"
                >
                  <i
                    class="icon-arrow-down-gray size-16 pt-dtree-chevron"
                    :class="{ 'is-open': openGroups.has(section.tocId) }"
                  />
                  <i
                    :class="[
                      'size-16',
                      'pt-dtree-icon',
                      openGroups.has(section.tocId) ? 'icon-folder-open' : 'icon-folder-close',
                    ]"
                  />
                  <span class="pt-dtree-title">{{ section.title }}</span>
                  <span class="pt-toc-tag is-user">소분류</span>
                  <span class="pt-dtree-count">세부 {{ section.children.length }}</span>
                </button>

                <div
                  v-show="openGroups.has(section.tocId)"
                  class="pt-dtree-children"
                  role="group"
                >
                  <div
                    v-for="sub in section.children"
                    :key="sub.tocId"
                    class="pt-dtree-row is-leaf"
                    role="treeitem"
                  >
                    <span class="pt-dtree-chevron-placeholder" />
                    <i class="icon-document size-16 pt-dtree-icon is-leaf" />
                    <span class="pt-dtree-title">{{ sub.title }}</span>
                    <span class="pt-toc-tag is-detail">세부목차</span>
                  </div>
                  <div
                    v-if="section.children.length === 0"
                    class="pt-dtree-empty"
                  >
                    세부목차 없음
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <UiEmpty
          v-else
          title="세부목차가 없습니다."
        />
      </div>

      <div class="pt-panel-actions pt-strategy-actions">
        <UiButton
          variant="primary"
          size="md"
          :disabled="!isDone"
          @click="emit('next')"
        >
          다음 · 템플릿 설정
          <template #icon-right>
            <i class="icon-arrow-right size-14" />
          </template>
        </UiButton>
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
</template>

<script setup lang="ts">
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import type { TocMappingNode } from '~/types/proposal'

const props = defineProps<{
  ptProjectId: string
  modelId: string
  agentId: string
}>()

const emit = defineEmits<{
  next: []
}>()

const { streamAnalyzeStage2Toc, fetchSelectStage2TocMapping, fetchSelectStage2Summary } = useProposalApi()

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

const isLoadingToc = ref(false)
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

const loadTocResult = async () => {
  isLoadingResult.value = true
  try {
    const res = await fetchSelectStage2TocMapping(props.ptProjectId)
    if (res?.data?.tocNodes) {
      const tree = buildTocTree(res.data.tocNodes)
      tocTree.value = tree
      expandAllGroups(tree)
    }
  } catch (e) {
    console.warn('[ProposalStepToc] 목차 조회 실패:', e)
  } finally {
    isLoadingResult.value = false
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
