<template>
  <div class="pt-panel">
    <div class="pt-final-box">
      <div class="pt-final-icon">
        <i class="icon-document size-28" />
      </div>
      <h3 class="pt-final-title">제안서 출력 준비 완료</h3>
      <p class="pt-final-desc">전체 소목차가 하나의 문서로 병합됩니다. 문서 크기 설정에 따라 형식이 자동 결정됩니다.</p>

      <!-- 출력 시작 -->
      <div
        v-if="!exportData"
        class="pt-final-actions"
      >
        <UiButton
          variant="primary"
          size="md"
          :loading="isExporting"
          @click="onExport"
        >
          <template #icon-left>
            <i class="icon-download size-16" />
          </template>
          내보내기
        </UiButton>
      </div>

      <!-- 빌드 진행 상태 -->
      <template v-else>
        <!-- 빌드 중 (대기/이미지생성중/PPT조립중) -->
        <div
          v-if="exportData.buildStatusCd === '001' || exportData.buildStatusCd === '002' || exportData.buildStatusCd === '003'"
          class="pt-final-status is-building"
        >
          <i class="icon-spinner size-20" />
          <span>{{ buildStatusLabel }} 중...</span>
        </div>

        <!-- 완료 -->
        <div
          v-else-if="exportData.buildStatusCd === '004'"
          class="pt-final-status is-done"
        >
          <i class="icon-check size-20" />
          <span>출력 완료</span>
          <span class="pt-final-format-badge">{{ exportData.exportTypeCd === '002' ? 'PDF' : 'PPTX' }}</span>
          <template v-if="exportData.fileSize">
            <span class="pt-final-filesize">{{ fileSizeLabel }}</span>
          </template>
        </div>

        <!-- 실패 -->
        <div
          v-else-if="exportData.buildStatusCd === '005'"
          class="pt-final-status is-fail"
        >
          <i class="icon-alert-triangle size-20" />
          <span>출력 실패: {{ exportData.errorMsg || '알 수 없는 오류' }}</span>
        </div>

        <!-- 하단 액션 -->
        <div class="pt-final-actions">
          <!-- 다운로드 -->
          <UiButton
            v-if="exportData.downloadUrl && exportData.buildStatusCd === '004'"
            variant="primary"
            size="md"
            @click="onDownload"
          >
            <template #icon-left>
              <i class="icon-download size-16" />
            </template>
            파일 다운로드
          </UiButton>

          <!-- 재시도 -->
          <UiButton
            variant="ghost"
            size="md"
            :disabled="exportData.buildStatusCd === '001' || exportData.buildStatusCd === '002' || exportData.buildStatusCd === '003'"
            @click="resetExport"
          >
            다시 내보내기
          </UiButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PtExportVO } from '~/types/proposal'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'

interface Props {
  ptProjectId: string
  agentId: string
}

const props = defineProps<Props>()

const { fetchStartExport, fetchSelectExportStatus } = useProposalApi()

const isExporting = ref(false)
const exportData = ref<PtExportVO | null>(null)

let pollTimer: ReturnType<typeof setInterval> | null = null

const buildStatusLabel = computed(() => {
  switch (exportData.value?.buildStatusCd) {
    case '001': return '대기'
    case '002': return '이미지 생성'
    case '003': return 'PPT 조립'
    default:    return '처리'
  }
})

const fileSizeLabel = computed(() => {
  const bytes = exportData.value?.fileSize
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const stopPoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const pollStatus = (exportId: string) => {
  stopPoll()
  pollTimer = setInterval(async () => {
    try {
      const res = await fetchSelectExportStatus(exportId)
      if (res.result === 'OK' && res.data) {
        exportData.value = res.data
        const done = ['004', '005'].includes(res.data.buildStatusCd)
        if (done) stopPoll()
      }
    } catch {
      // 조용히 재시도
    }
  }, 3000)
}

const onExport = async () => {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const res = await fetchStartExport({
      ptProjectId: props.ptProjectId,
      agentId: props.agentId,
    })
    if (res.result !== 'OK' || !res.data) {
      openToast({ message: res.msg || '출력 요청에 실패했습니다.', type: 'error' })
      return
    }
    exportData.value = res.data
    // 완료(004) 또는 실패(005)가 아니면 폴링 시작
    if (!['004', '005'].includes(res.data.buildStatusCd)) {
      pollStatus(res.data.exportId)
    }
  } catch {
    openToast({ message: '출력 요청 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isExporting.value = false
  }
}

const onDownload = () => {
  if (!exportData.value?.downloadUrl) return
  window.open(exportData.value.downloadUrl, '_blank')
}

const resetExport = () => {
  stopPoll()
  exportData.value = null
}

onUnmounted(() => {
  stopPoll()
})
</script>
