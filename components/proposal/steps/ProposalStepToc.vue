<template>
  <div class="pt-panel pt-panel--lg">
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
      class="pt-toc-done"
    >
      <i class="icon-check size-32" />
      <p class="pt-toc-done-msg">세부목차 생성이 완료되었습니다.</p>
      <p
        v-if="tocCount > 0"
        class="pt-toc-done-sub"
      >
        총 {{ tocCount }}개의 소목차가 구성되었습니다.
      </p>
    </div>

    <!-- 오류 상태 -->
    <div
      v-else-if="hasError"
      class="pt-toc-error"
    >
      <p class="pt-toc-error-msg">세부목차 생성 중 오류가 발생했습니다.</p>
      <p class="pt-toc-error-sub">{{ errorMessage }}</p>
    </div>

    <div class="pt-panel-actions">
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
</template>

<script setup lang="ts">
import { useProposalApi } from '~/composables/proposal/useProposalApi'

const props = defineProps<{
  ptProjectId: string
  modelId: string
  agentId: string
}>()

const emit = defineEmits<{
  next: []
}>()

const { streamAnalyzeStage2Toc } = useProposalApi()

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

const startToc = () => {
  isLoadingToc.value = true
  isDone.value = false
  hasError.value = false
  errorMessage.value = ''
  loadingStepIdx.value = 0

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
    },
    onError: (msg) => {
      isLoadingToc.value = false
      hasError.value = true
      errorMessage.value = msg || '세부목차 생성에 실패했습니다.'
    },
  })
}

onMounted(async () => {
  // TODO: fetchSelectStage2Summary로 stage2StatusCd 확인
  // 003(전체완료)이면 재실행 없이 완료 상태로 바로 표시 (현재는 항상 실행)
  startToc()
})
</script>

<style lang="scss" scoped>
.pt-toc-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xl * 2 $spacing-md;
  text-align: center;
  color: $color-text-muted;

  .pt-toc-done-msg {
    @include typo($body-large-bold);
    color: $color-text-secondary;
    margin-top: $spacing-sm;
  }

  .pt-toc-done-sub {
    @include typo($body-small);
    color: $color-text-muted;
  }
}

.pt-toc-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xl * 2 $spacing-md;
  text-align: center;

  .pt-toc-error-msg {
    @include typo($body-large-bold);
    color: $color-error;
  }

  .pt-toc-error-sub {
    @include typo($body-small);
    color: $color-text-muted;
    max-width: 480px;
  }
}
</style>
