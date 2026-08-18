<template>
  <div class="pt-panel">
    <div class="pt-final-box">
      <div class="pt-final-icon">
        <i class="icon-document size-28" />
      </div>
      <h3 class="pt-final-title">제안서 출력 준비 완료</h3>
      <p class="pt-final-desc">전체 소목차가 하나의 문서로 병합됩니다. 문서 크기 설정에 따라 형식이 자동 결정됩니다.</p>

      <!-- 출력 시작 — 빌드 진행 전 -->
      <div
        v-if="!exportData"
        class="pt-final-actions"
      >
        <!-- 이전 파일 받기: selectReusableExport 결과가 있을 때만 활성 -->
        <UiButton
          variant="outline"
          size="md"
          :disabled="!reusableExport || isLoadingReusable || isExporting"
          :loading="isLoadingReusable"
          @click="onReceivePrevious"
        >
          <template #icon-left>
            <i class="icon-download size-16" />
          </template>
          이전 파일 받기
        </UiButton>

        <!-- 다시 만들기: forceRebuild=true -->
        <UiButton
          variant="primary"
          size="md"
          :loading="isExporting"
          :disabled="isLoadingReusable"
          @click="onRebuild"
        >
          <template #icon-left>
            <i class="icon-refresh size-16" />
          </template>
          다시 만들기
        </UiButton>
      </div>

      <!-- 빌드 진행 상태 -->
      <template v-else>
        <!-- 빌드 중 -->
        <div
          v-if="
            exportData.buildStatusCd === '001' ||
            exportData.buildStatusCd === '002' ||
            exportData.buildStatusCd === '003'
          "
          class="pt-final-status is-building"
        >
          <i class="icon-spinner size-20" />
          <span>출력 준비 중...</span>
        </div>

        <!-- 완료 -->
        <div
          v-else-if="exportData.buildStatusCd === '004'"
          class="pt-final-status is-done"
        >
          <i class="icon-check size-20" />
          <span>출력 완료</span>
          <span class="pt-final-format-badge">{{ exportFormatLabel }}</span>
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

          <!-- 재시도 / 다시 내보내기 -->
          <UiButton
            variant="ghost"
            size="md"
            :disabled="
              exportData.buildStatusCd === '001' ||
              exportData.buildStatusCd === '002' ||
              exportData.buildStatusCd === '003'
            "
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

const { fetchSelectReusableExport, fetchStartExport, fetchSelectExportStatus } = useProposalApi()

const isLoadingReusable = ref(false)
const isExporting = ref(false)
const reusableExport = ref<PtExportVO | null>(null)
const exportData = ref<PtExportVO | null>(null)

let pollTimer: ReturnType<typeof setInterval> | null = null

const exportFormatLabel = computed(() => (exportData.value?.exportTypeCd === '002' ? 'PDF' : 'PPTX'))

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

/** 탭 진입 시 이전 파일 재사용 가능 여부 조회 */
const loadReusableExport = async () => {
  isLoadingReusable.value = true
  try {
    const res = await fetchSelectReusableExport(props.ptProjectId)
    reusableExport.value = res.result === 'OK' ? (res.data ?? null) : null
  } catch {
    reusableExport.value = null
  } finally {
    isLoadingReusable.value = false
  }
}

/** 이전 파일 받기 — selectReusableExport 결과를 즉시 다운로드 */
const onReceivePrevious = () => {
  if (!reusableExport.value?.downloadUrl) {
    openToast({ message: '재사용 가능한 이전 파일이 없습니다. 다시 만들어 주세요.', type: 'warning' })
    return
  }
  window.open(reusableExport.value.downloadUrl, '_blank')
}

/**
 * 다시 만들기 — forceRebuild:true 로 startExport 호출.
 * cacheReused===true 이면 폴링 없이 즉시 다운로드 가능.
 */
const onRebuild = async () => {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const res = await fetchStartExport({
      ptProjectId: props.ptProjectId,
      agentId: props.agentId,
      forceRebuild: true,
    })
    if (res.result !== 'OK' || !res.data) {
      openToast({ message: res.msg || '출력 요청에 실패했습니다.', type: 'error' })
      return
    }
    exportData.value = res.data

    // 캐시 히트(cacheReused=true)이면 buildStatusCd가 004이므로 폴링 불필요
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

onMounted(() => {
  loadReusableExport()
})

onUnmounted(() => {
  stopPoll()
})
</script>
