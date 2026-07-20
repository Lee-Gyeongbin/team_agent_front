<template>
  <div class="pt-panel">
    <div class="pt-final-box">
      <div class="pt-final-icon">
        <i class="icon-document size-28" />
      </div>
      <h3 class="pt-final-title">제안서 출력 준비 완료</h3>
      <p class="pt-final-desc">전체 소목차가 하나의 문서로 병합됩니다. 형식을 선택해 내보내세요.</p>
      <div class="pt-final-actions">
        <UiButton
          variant="primary"
          size="md"
          @click="onExportPdf"
        >
          <template #icon-left>
            <i class="icon-download size-16" />
          </template>
          PDF로 내보내기
        </UiButton>
        <UiButton
          variant="ghost"
          size="md"
          @click="onExportRaw"
        >
          원본 포맷으로 내보내기
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'

const onExportPdf = () => {
  // TODO: 실제 PDF 내보내기 API 연동 시 교체
  openToast({ message: '전체 슬라이드를 병합하여 PDF로 추출합니다. (준비 중)', type: 'info' })
}

const onExportRaw = () => {
  // TODO: 실제 원본 포맷 내보내기 API 연동 시 교체
  openToast({ message: '편집 가능한 원본 포맷(PPTX/DOCX)으로 내보냅니다. (준비 중)', type: 'info' })
}
</script>
