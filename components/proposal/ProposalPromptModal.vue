<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    title="프롬프트 보기 · 수정"
    :show-overlay="!nonModal"
    :custom-class="nonModal ? 'pt-prompt-side' : ''"
    @close="$emit('close')"
  >
    <div class="pt-prompt-modal">
      <!-- 로딩 -->
      <div
        v-if="isLoading"
        class="pt-prompt-modal__loading"
      >
        <div class="pt-s4-loading-spinner" />
        <span>프롬프트 불러오는 중...</span>
      </div>

      <!-- 프롬프트 없음 — 그룹 모드면 탭 구조를 그대로 보여 주고 스텝별 빈 상태를 표시 -->
      <UiEmpty
        v-else-if="!isLoading && items.length === 0 && !hasGroups"
        title="등록된 프롬프트가 없습니다."
      />

      <!-- 프롬프트 목록 -->
      <template v-else>
        <!-- 그룹 모드: 상위 탭(문제정의/승리주제) + 필요 시 하위 스텝 탭 -->
        <template v-if="hasGroups">
          <div class="pt-prompt-tabs">
            <button
              v-for="group in groups"
              :key="group.key"
              type="button"
              :class="['pt-prompt-tab', { 'is-active': activeGroupKey === group.key }]"
              @click="onSelectGroup(group.key)"
            >
              {{ group.label }}
              <span
                v-if="isGroupModified(group)"
                class="pt-prompt-tab__dot"
              />
            </button>
          </div>

          <div
            v-if="activeGroup"
            class="pt-prompt-group"
          >
            <template v-if="isMultiStepGroup">
              <!-- 탭이 아니라 순차 실행 파이프라인 — 세 프롬프트가 독립 설정처럼 보이지 않게 -->
              <div
                class="pt-prompt-flow"
                role="tablist"
                :aria-label="`${activeGroup.label} 실행 순서`"
              >
                <template
                  v-for="(step, i) in activeGroup.steps"
                  :key="step.stageCd"
                >
                  <span
                    v-if="i > 0"
                    class="pt-prompt-flow__arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                  <div class="pt-prompt-flow__step-wrap">
                    <UiTooltip
                      font-size="11px"
                      side="bottom"
                      align="center"
                      content-class="pt-prompt-flow-tip"
                      :content="stepTooltipContent(step)"
                    >
                      <button
                        type="button"
                        role="tab"
                        :aria-selected="activeStepStageCd === step.stageCd"
                        :class="['pt-prompt-flow__step', { 'is-active': activeStepStageCd === step.stageCd }]"
                        @click="onSelectStep(step.stageCd)"
                      >
                        <span class="pt-prompt-flow__label">
                          {{ step.label }}
                          <span
                            v-if="isStepModified(step.stageCd)"
                            class="pt-prompt-flow__dot"
                          />
                        </span>
                        <span class="pt-prompt-flow__num">{{ stepOrderMark(i) }}</span>
                      </button>
                    </UiTooltip>
                  </div>
                </template>
              </div>
            </template>

            <div
              v-if="activeItem"
              :key="activeItem.promptId"
              :class="['pt-prompt-item', { 'pt-prompt-item--boxed': isMultiStepGroup }]"
            >
              <div class="pt-prompt-item__meta">
                <span class="pt-prompt-item__name">{{ activeItem.promptName }}</span>
              </div>
              <UiTextarea
                v-model="editContents[activeItem.promptId]"
                :rows="isMultiStepGroup ? 28 : 25"
                border
                :auto-resize="false"
                class="pt-prompt-item__textarea"
              />
              <div class="pt-prompt-item__actions">
                <button
                  type="button"
                  class="pt-prompt-restore-btn"
                  :disabled="isSaving || !isModified(activeItem)"
                  @click="onRestore(activeItem.promptId)"
                >
                  <i class="icon-refresh size-14" />
                  원본으로 되돌리기
                </button>
              </div>
            </div>
            <UiEmpty
              v-else
              title="등록된 프롬프트가 없습니다."
            />
          </div>
        </template>

        <!-- 단일 프롬프트: 탭 없이 바로 표시 -->
        <div
          v-else-if="items.length === 1"
          class="pt-prompt-item"
        >
          <div class="pt-prompt-item__meta">
            <span class="pt-prompt-item__name">{{ items[0].promptName }}</span>
            <span class="pt-prompt-item__stage">{{ stageCdLabel(items[0].stageCd) }}</span>
          </div>
          <UiTextarea
            v-model="editContents[items[0].promptId]"
            :rows="25"
            border
            :auto-resize="false"
            class="pt-prompt-item__textarea"
          />
          <div class="pt-prompt-item__actions">
            <button
              type="button"
              class="pt-prompt-restore-btn"
              :disabled="isSaving || !isModified(items[0])"
              @click="onRestore(items[0].promptId)"
            >
              <i class="icon-refresh size-14" />
              원본으로 되돌리기
            </button>
          </div>
        </div>

        <!-- 복수 프롬프트: 탭으로 전환 -->
        <template v-else>
          <div class="pt-prompt-tabs">
            <button
              v-for="item in items"
              :key="item.promptId"
              type="button"
              :class="['pt-prompt-tab', { 'is-active': activePromptId === item.promptId }]"
              @click="activePromptId = item.promptId"
            >
              {{ stageCdLabel(item.stageCd) }}
              <span
                v-if="isModified(item)"
                class="pt-prompt-tab__dot"
              />
            </button>
          </div>

          <template
            v-for="item in items"
            :key="item.promptId"
          >
            <div
              v-show="activePromptId === item.promptId"
              class="pt-prompt-item"
            >
              <div class="pt-prompt-item__meta">
                <span class="pt-prompt-item__name">{{ item.promptName }}</span>
              </div>
              <UiTextarea
                v-model="editContents[item.promptId]"
                :rows="25"
                border
                :auto-resize="false"
                class="pt-prompt-item__textarea"
              />
              <div class="pt-prompt-item__actions">
                <button
                  type="button"
                  class="pt-prompt-restore-btn"
                  :disabled="isSaving || !isModified(item)"
                  @click="onRestore(item.promptId)"
                >
                  <i class="icon-refresh size-14" />
                  원본으로 되돌리기
                </button>
              </div>
            </div>
          </template>
        </template>
      </template>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          닫기
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          :loading="isSaving"
          :disabled="!hasAnyChange"
          @click="onSaveAll"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import type { PtPromptGroup, PtPromptGroupStep, PtPromptItem } from '~/types/proposal'

/** stageCd → 사람이 읽기 좋은 레이블 */
const STAGE_LABELS: Record<string, string> = {
  S1_EXTRACT: 'RFP 구조화 추출',
  S2A_PROBLEM_TOC: '문제정의',
  ISSUE_REQUIREMENT_MAP: '근거 매핑',
  ISSUE_PD_GENERATE: '문제정의 생성',
  PROBLEM_FINAL: '최종 정리',
  S2B_WINTHEME: '승리주제',
  S2C_COVEREDREQNOS: '요구사항 기반 세부목차 생성',
  TOC_STRATEGY: 'Win Theme 기반 전략 세부목차 생성',
  S3_SLIDE: '슬라이드 생성',
  S3_TEMPLATE: '템플릿 생성',
  S3_COVER_TEMPLATE: '표지 템플릿',
  S3_IMAGE: '이미지 생성',
  S4_REVIEW: '검토',
}

interface Props {
  isOpen: boolean
  /** 조회할 stageCd 목록 */
  stageCds: string[]
  /**
   * 상위 탭으로 묶을 그룹. 넘기면 그룹 탭 → (2개 이상일 때) 하위 스텝 탭 구조로 표시.
   * 없으면 기존처럼 프롬프트 1건당 탭.
   */
  groups?: PtPromptGroup[]
  /** true면 배경을 가리지 않는 사이드 패널로 동작 — 뒤 화면을 보면서 프롬프트 수정 가능 */
  nonModal?: boolean
}

const props = withDefaults(defineProps<Props>(), { nonModal: false, groups: () => [] })

defineEmits<{ close: [] }>()

const { fetchSelectStepPrompts, fetchUpdatePromptContent, fetchRestorePromptContent } = useProposalApi()

const isLoading = ref(false)
const isSaving = ref(false)
const items = ref<PtPromptItem[]>([])
const activePromptId = ref('')
const activeGroupKey = ref('')
const activeStepStageCd = ref('')
/** 그룹별 마지막 선택 스텝 — 상위 탭을 왕복해도 보던 단계를 유지 */
const lastStepByGroup = ref<Record<string, string>>({})

/** promptId → 현재 편집 중인 content */
const editContents = ref<Record<string, string>>({})

const groups = computed(() => props.groups ?? [])
const hasGroups = computed(() => groups.value.length > 0)

const stageCdLabel = (stageCd: string) => STAGE_LABELS[stageCd] ?? stageCd

const isModified = (item: PtPromptItem) => editContents.value[item.promptId] !== item.content

const hasAnyChange = computed(() => items.value.some((item) => isModified(item)))

/** stageCd → 조회된 프롬프트. 동일 stageCd가 여러 건이면 첫 건만 사용 */
const itemByStageCd = computed(() => {
  const map = new Map<string, PtPromptItem>()
  for (const item of items.value) {
    if (!map.has(item.stageCd)) map.set(item.stageCd, item)
  }
  return map
})

const activeGroup = computed(() => groups.value.find((g) => g.key === activeGroupKey.value) ?? groups.value[0] ?? null)

const isMultiStepGroup = computed(() => (activeGroup.value?.steps.length ?? 0) > 1)

const activeStep = computed(() => {
  const group = activeGroup.value
  if (!group) return null
  return group.steps.find((s) => s.stageCd === activeStepStageCd.value) ?? group.steps[0] ?? null
})

const activeItem = computed(() => {
  const cd = activeStep.value?.stageCd
  return cd ? (itemByStageCd.value.get(cd) ?? null) : null
})

const isStepModified = (stageCd: string) => {
  const item = itemByStageCd.value.get(stageCd)
  return item ? isModified(item) : false
}

const isGroupModified = (group: PtPromptGroup) => group.steps.some((s) => isStepModified(s.stageCd))

/** 파이프라인 순서 표기 — ①②③. 4단계 이상이면 숫자로 폴백 */
const stepOrderMark = (index: number) => ['①', '②', '③', '④', '⑤'][index] ?? String(index + 1)

/** 호버 툴팁: 역할 + 수정 시 영향 */
const stepTooltipContent = (step: PtPromptGroupStep) => [step.description, step.impact].filter(Boolean).join('\n')

const onSelectStep = (stageCd: string) => {
  activeStepStageCd.value = stageCd
  if (activeGroupKey.value) {
    lastStepByGroup.value = { ...lastStepByGroup.value, [activeGroupKey.value]: stageCd }
  }
  activePromptId.value = itemByStageCd.value.get(stageCd)?.promptId ?? ''
}

const onSelectGroup = (key: string) => {
  activeGroupKey.value = key
  const group = groups.value.find((g) => g.key === key)
  const saved = lastStepByGroup.value[key]
  const cd = saved && group?.steps.some((s) => s.stageCd === saved) ? saved : group?.steps[0]?.stageCd
  if (cd) onSelectStep(cd)
}

const applyGroupSelection = (groupKey?: string, stepStageCd?: string) => {
  const group = groups.value.find((g) => g.key === groupKey) ?? groups.value[0]
  if (!group) {
    activeGroupKey.value = ''
    activeStepStageCd.value = ''
    activePromptId.value = items.value[0]?.promptId ?? ''
    return
  }
  activeGroupKey.value = group.key
  const step = group.steps.find((s) => s.stageCd === stepStageCd) ?? group.steps[0]
  if (step) onSelectStep(step.stageCd)
}

const loadPrompts = async () => {
  if (!props.stageCds.length) return
  const prevGroup = activeGroupKey.value
  const prevStep = activeStepStageCd.value
  const prevId = activePromptId.value
  isLoading.value = true
  try {
    const res = await fetchSelectStepPrompts(props.stageCds)
    const list = res.list ?? []
    items.value = list.sort((a, b) => props.stageCds.indexOf(a.stageCd) - props.stageCds.indexOf(b.stageCd))
    editContents.value = Object.fromEntries(items.value.map((item) => [item.promptId, item.content]))
    if (hasGroups.value) {
      applyGroupSelection(prevGroup, prevStep)
    } else if (items.value.length > 0) {
      activePromptId.value = items.value.some((item) => item.promptId === prevId) ? prevId : items.value[0].promptId
    }
  } finally {
    isLoading.value = false
  }
}

const onRestore = async (promptId: string) => {
  const confirmed = await openConfirm({ message: '원본 프롬프트로 되돌리겠습니까?' })
  if (!confirmed) return

  isSaving.value = true
  try {
    await fetchRestorePromptContent(promptId)
    // 화면 갱신
    await loadPrompts()
    openToast({ message: '원본으로 되돌렸습니다.' })
  } catch {
    openToast({ message: '복구에 실패했습니다.', type: 'error' })
  } finally {
    isSaving.value = false
  }
}

const onSaveAll = async () => {
  const changed = items.value.filter((item) => isModified(item))
  if (!changed.length) return

  isSaving.value = true
  try {
    await Promise.all(changed.map((item) => fetchUpdatePromptContent(item.promptId, editContents.value[item.promptId])))
    // 저장된 값을 items에 반영 (isModified 초기화)
    items.value = items.value.map((item) => ({
      ...item,
      content: editContents.value[item.promptId] ?? item.content,
    }))
    openToast({ message: '저장되었습니다.' })
  } catch {
    openToast({ message: '저장에 실패했습니다.', type: 'error' })
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadPrompts()
    else {
      items.value = []
      editContents.value = {}
      activePromptId.value = ''
      activeGroupKey.value = ''
      activeStepStageCd.value = ''
      lastStepByGroup.value = {}
    }
  },
)
</script>

<style lang="scss" scoped>
.pt-prompt-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  min-height: 200px;

  &__loading {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-lg 0;
    @include typo($body-small);
    color: $color-text-muted;
  }
}

.pt-prompt-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  border-bottom: 1px solid $color-border;
  padding-bottom: 0;
}

.pt-prompt-tab {
  position: relative;
  padding: 6px 14px;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: $border-radius-sm $border-radius-sm 0 0;
  background: transparent;
  @include typo($body-small);
  color: $color-text-secondary;
  cursor: pointer;
  transition:
    color $transition-fast,
    border-color $transition-fast;

  &.is-active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    font-weight: $font-weight-semibold;
  }

  &:hover:not(.is-active) {
    color: $color-text-dark;
  }

  &__dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
  }
}

.pt-prompt-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.pt-prompt-flow {
  display: flex;
  align-items: flex-start;
  width: 100%;
  gap: $spacing-xs;
  padding: 2px 0 $spacing-sm;
  border-bottom: 1px solid $color-border;
}

.pt-prompt-flow__step-wrap {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  width: 100%;

  :deep(> *) {
    flex: 1;
    min-width: 0;
    width: 100%;
  }
}

.pt-prompt-flow__arrow {
  flex: 0 0 auto;
  padding-top: 6px;
  @include typo($body-small);
  color: $color-text-muted;
  line-height: 1.4;
}

.pt-prompt-flow__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: $color-text-muted;
  min-width: 0;

  &:hover:not(.is-active) {
    color: $color-text-dark;
  }

  &.is-active {
    color: var(--color-primary);

    .pt-prompt-flow__label {
      border-color: var(--color-primary);
      background: rgba(var(--color-primary-rgb), 0.1);
      color: var(--color-primary);
      font-weight: $font-weight-semibold;
    }

    .pt-prompt-flow__num {
      color: var(--color-primary);
    }
  }
}

.pt-prompt-flow__label {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  @include typo($body-small);
  text-align: center;
  line-height: 1.4;
  transition:
    color $transition-fast,
    border-color $transition-fast,
    background $transition-fast;
}

.pt-prompt-flow__num {
  @include typo($body-xsmall);
  line-height: 1.2;
}

.pt-prompt-flow__dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
}

.pt-prompt-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &--boxed {
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
    padding: $spacing-sm;

    .pt-prompt-item__textarea {
      min-height: 28em;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__name {
    @include typo($body-small-bold);
    color: $color-text-heading-sub;
  }

  &__stage {
    @include typo($body-xsmall);
    color: $color-text-muted;
    background: $color-surface;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-sm;
    padding: 2px 8px;
  }

  &__textarea {
    @include typo($body-xsmall);
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
  }
}

.pt-prompt-restore-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  @include typo($body-small);
  color: $color-text-secondary;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color $transition-fast;

  &:hover:not(:disabled) {
    color: var(--color-primary);
  }

  &:disabled {
    color: $color-text-disabled;
    cursor: default;
    text-decoration: none;
  }
}
</style>

<style lang="scss">
/* Radix 툴팁은 body 포탈 — scoped 불가 */
.pt-prompt-flow-tip {
  max-width: 280px;
  white-space: pre-line;
}
</style>
