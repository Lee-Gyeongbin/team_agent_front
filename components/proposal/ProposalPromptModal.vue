<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    title="프롬프트 보기 · 수정"
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

      <!-- 프롬프트 없음 -->
      <UiEmpty
        v-else-if="!isLoading && items.length === 0"
        title="등록된 프롬프트가 없습니다."
      />

      <!-- 프롬프트 목록 -->
      <template v-else>
        <!-- 단일 프롬프트: 탭 없이 바로 표시 -->
        <div
          v-if="items.length === 1"
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
import type { PtPromptItem } from '~/types/proposal'

/** stageCd → 사람이 읽기 좋은 레이블 */
const STAGE_LABELS: Record<string, string> = {
  S1_EXTRACT: 'RFP 구조화 추출',
  S2A_PROBLEM_TOC: '문제정의',
  S2B_WINTHEME: '승리주제',
  S2C_COVEREDREQNOS: '요구사항 매핑',
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
}

const props = defineProps<Props>()

defineEmits<{ close: [] }>()

const { fetchSelectStepPrompts, fetchUpdatePromptContent, fetchRestorePromptContent } = useProposalApi()

const isLoading = ref(false)
const isSaving = ref(false)
const items = ref<PtPromptItem[]>([])
const activePromptId = ref('')

/** promptId → 현재 편집 중인 content */
const editContents = ref<Record<string, string>>({})

const stageCdLabel = (stageCd: string) => STAGE_LABELS[stageCd] ?? stageCd

const isModified = (item: PtPromptItem) => editContents.value[item.promptId] !== item.content

const hasAnyChange = computed(() => items.value.some((item) => isModified(item)))

const loadPrompts = async () => {
  if (!props.stageCds.length) return
  isLoading.value = true
  try {
    const res = await fetchSelectStepPrompts(props.stageCds)
    const list = res.list ?? []
    items.value = list.sort((a, b) => props.stageCds.indexOf(a.stageCd) - props.stageCds.indexOf(b.stageCd))
    editContents.value = Object.fromEntries(items.value.map((item) => [item.promptId, item.content]))
    if (items.value.length > 0) activePromptId.value = items.value[0].promptId
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

.pt-prompt-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

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
