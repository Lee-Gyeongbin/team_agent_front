<template>
  <UiModal
    :is-open="isOpen"
    title="근거 상세"
    max-width="720px"
    @close="emit('close')"
  >
    <div class="pt-pd-evidence-modal">
      <!-- 로딩 -->
      <div
        v-if="isLoading"
        class="pt-pd-evidence-modal__loading"
      >
        <div class="pt-s4-loading-spinner" />
        <span>근거 데이터 불러오는 중...</span>
      </div>

      <!-- 에러 -->
      <UiEmpty
        v-else-if="loadError"
        :title="loadError"
        description="잠시 후 다시 시도해 주세요."
      />

      <!-- 데이터 없음 -->
      <UiEmpty
        v-else-if="!matchedIssues.length && !matchedRequirements.length"
        title="표시할 근거가 없습니다."
        description="연결된 이슈·요구사항을 찾지 못했습니다."
      />

      <template v-else>
        <section
          v-if="matchedIssues.length"
          class="pt-pd-evidence-section"
        >
          <h4 class="pt-pd-evidence-section-title">현황·이슈</h4>
          <div class="pt-pd-evidence-list">
            <article
              v-for="issue in matchedIssues"
              :key="issue.issueId"
              class="pt-pd-evidence-card is-issue"
            >
              <div class="pt-pd-evidence-card-head">
                <UiBadge
                  :variant="issueTypeVariant(issue.issueTypeCd)"
                  size="sm"
                >
                  {{ issueTypeLabel(issue.issueTypeCd) }}
                </UiBadge>
                <h5 class="pt-pd-evidence-card-title">{{ issue.issueLabel || '제목 없음' }}</h5>
              </div>
              <p
                class="pt-pd-evidence-card-body"
                :class="{ 'is-empty': !issue.issueContent }"
              >
                {{ issue.issueContent || '내용 없음' }}
              </p>
              <p class="pt-pd-evidence-card-meta">
                출처: {{ issue.sourceSection || '—' }}
                <template v-if="issue.sourcePage"> · {{ issue.sourcePage }}p</template>
              </p>
            </article>
          </div>
        </section>

        <section
          v-if="matchedRequirements.length"
          class="pt-pd-evidence-section"
        >
          <h4 class="pt-pd-evidence-section-title">요구사항</h4>
          <div class="pt-pd-evidence-list">
            <article
              v-for="req in matchedRequirements"
              :key="req.requirementId"
              class="pt-pd-evidence-card is-req"
            >
              <div class="pt-pd-evidence-card-head">
                <UiBadge
                  :variant="req.mandatoryYn === 'Y' ? 'success' : 'default'"
                  size="sm"
                >
                  {{ req.mandatoryYn === 'Y' ? '필수' : '선택' }}
                </UiBadge>
                <UiBadge
                  :variant="sourceBadgeVariant(req.sourceTypeCd)"
                  size="sm"
                >
                  {{ sourceLabel(req.sourceTypeCd) }}
                </UiBadge>
                <h5 class="pt-pd-evidence-card-title">
                  <span
                    v-if="req.reqNo"
                    class="pt-pd-evidence-req-no"
                  >
                    {{ req.reqNo }}
                  </span>
                  {{ req.reqContent }}
                </h5>
              </div>
              <p
                v-if="req.reqDetailTxt"
                class="pt-pd-evidence-card-body"
              >
                {{ req.reqDetailTxt }}
              </p>
              <p
                v-if="req.reqCategoryTxt"
                class="pt-pd-evidence-card-meta"
              >
                분류: {{ req.reqCategoryTxt }}
              </p>
            </article>
          </div>
        </section>

        <p
          v-if="missingCount > 0"
          class="pt-pd-evidence-missing"
        >
          {{ missingCount }}건의 근거는 현재 데이터에서 찾을 수 없습니다.
        </p>
      </template>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="emit('close')"
        >
          닫기
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { UiBadge, UiButton, UiEmpty, UiModal } from '@leechanyong/ispark-ui'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import type { PtRequirement, PtRfpIssue } from '~/types/proposal'

const props = defineProps<{
  isOpen: boolean
  ptProjectId: string
  issueIds: string[]
  requirementIds: string[]
}>()

const emit = defineEmits<{ close: [] }>()

const { fetchSelectStage1Result } = useProposalApi()

const isLoading = ref(false)
const loadError = ref('')
const rfpIssues = ref<PtRfpIssue[]>([])
const requirements = ref<PtRequirement[]>([])

const sourceLabel = (cd: string) =>
  (({ '001': '명시', '002': '추론', '003': '확인필요', '999': '직접입력' }) as Record<string, string>)[cd] || cd

const sourceBadgeVariant = (cd: string) => (cd === '003' ? 'warning' : cd === '002' ? 'info' : 'default')

const issueTypeLabel = (cd: string) =>
  (({ '001': '문제점', '002': '개선방향', '003': '배경·필요성' }) as Record<string, string>)[cd] || cd

const issueTypeVariant = (cd: string) => (cd === '001' ? 'danger' : cd === '002' ? 'success' : 'warning')

const matchedIssues = computed(() =>
  props.issueIds
    .map((id) => rfpIssues.value.find((issue) => issue.issueId === id))
    .filter((issue): issue is PtRfpIssue => !!issue),
)

const matchedRequirements = computed(() =>
  props.requirementIds
    .map((id) => requirements.value.find((req) => req.requirementId === id))
    .filter((req): req is PtRequirement => !!req),
)

const missingCount = computed(() => {
  const missingIssues = props.issueIds.filter((id) => !rfpIssues.value.some((issue) => issue.issueId === id)).length
  const missingReqs = props.requirementIds.filter(
    (id) => !requirements.value.some((req) => req.requirementId === id),
  ).length
  return missingIssues + missingReqs
})

const loadEvidence = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await fetchSelectStage1Result(props.ptProjectId)
    rfpIssues.value = res.data.rfpIssues || []
    requirements.value = res.data.requirements || []
  } catch {
    loadError.value = '근거 데이터를 불러오지 못했습니다.'
    rfpIssues.value = []
    requirements.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadEvidence()
    else {
      loadError.value = ''
      rfpIssues.value = []
      requirements.value = []
    }
  },
)
</script>

<style lang="scss" scoped>
.pt-pd-evidence-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  min-height: 160px;
  max-height: min(70vh, 640px);
  overflow-y: auto;
  @include custom-scrollbar;

  &__loading {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-lg 0;
    @include typo($body-small, $color-text-muted);
  }
}

.pt-pd-evidence-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.pt-pd-evidence-section-title {
  margin: 0;
  @include typo($body-small-bold, $color-text-heading);
}

.pt-pd-evidence-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pt-pd-evidence-card {
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  padding: 12px 14px;
  background: #fff;

  &.is-issue {
    border-left: 3px solid rgba(#e08a2c, 0.55);
  }

  &.is-req {
    border-left: 3px solid rgba(var(--color-primary-rgb), 0.45);
  }
}

.pt-pd-evidence-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.pt-pd-evidence-card-title {
  flex: 1 1 100%;
  margin: 0;
  @include typo($body-medium-bold, $color-text-heading);
  word-break: break-word;
}

.pt-pd-evidence-req-no {
  margin-right: 6px;
  @include typo($body-caption-bold, $color-text-muted);
}

.pt-pd-evidence-card-body {
  margin: 0;
  @include typo($body-small, $color-text-primary);
  white-space: pre-wrap;
  line-height: 1.6;
  word-break: break-word;

  &.is-empty {
    color: $color-text-muted;
  }
}

.pt-pd-evidence-card-meta {
  margin: 8px 0 0;
  @include typo($body-xsmall, $color-text-muted);
}

.pt-pd-evidence-missing {
  margin: 0;
  @include typo($body-xsmall, $color-text-muted);
}
</style>
