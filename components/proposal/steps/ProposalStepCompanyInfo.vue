<template>
  <div class="pt-panel pt-panel--lg">
    <h3 class="pt-panel-title">자사·경쟁사 정보</h3>
    <p class="pt-panel-desc">Win Theme 도출에 활용할 자사·경쟁사 자료와 기타 참고자료를 첨부하세요.</p>

    <!-- 로딩 스켈레톤 -->
    <template v-if="isLoading">
      <div
        v-for="i in 3"
        :key="i"
        class="pt-skeleton"
        style="height: 80px; margin-bottom: 12px"
      />
    </template>

    <template v-else>
      <div class="pt-settings-grid">
        <!-- 자사 정보 (다중 파일) -->
        <div class="pt-settings-col">
          <div class="pt-settings-label">자사 정보</div>
          <div class="pt-file-chip-list">
            <div
              v-for="f in companyFiles"
              :key="f.ptFileId"
              class="pt-file-chip"
            >
              <i class="icon-document size-12" />
              <button
                type="button"
                class="pt-file-chip-name"
                title="다운로드"
                :disabled="downloadingFileId === f.ptFileId"
                @click="onDownloadFile(f.ptFileId)"
              >
                {{ f.fileName }}
              </button>
              <button
                class="pt-file-chip-remove"
                @click="removeFile('company', f.ptFileId)"
              >
                <i class="icon-close size-10" />
              </button>
            </div>
          </div>
          <div
            class="pt-mini-upload pt-mini-upload--add"
            @click="triggerFileInput(companyInputRef)"
          >
            <i class="icon-plus size-12" />
            <span>파일 첨부 (선택)</span>
            <input
              ref="companyInputRef"
              type="file"
              accept=".pdf"
              multiple
              style="display: none"
              @change="onFileChange('company', $event)"
            />
          </div>
        </div>

        <!-- 경쟁사 정보 (다중 파일) -->
        <div class="pt-settings-col">
          <div class="pt-settings-label">경쟁사 정보</div>
          <div class="pt-file-chip-list">
            <div
              v-for="f in competitorFiles"
              :key="f.ptFileId"
              class="pt-file-chip"
            >
              <i class="icon-document size-12" />
              <button
                type="button"
                class="pt-file-chip-name"
                title="다운로드"
                :disabled="downloadingFileId === f.ptFileId"
                @click="onDownloadFile(f.ptFileId)"
              >
                {{ f.fileName }}
              </button>
              <button
                class="pt-file-chip-remove"
                @click="removeFile('competitor', f.ptFileId)"
              >
                <i class="icon-close size-10" />
              </button>
            </div>
          </div>
          <div
            class="pt-mini-upload pt-mini-upload--add"
            @click="triggerFileInput(competitorInputRef)"
          >
            <i class="icon-plus size-12" />
            <span>파일 첨부 (선택)</span>
            <input
              ref="competitorInputRef"
              type="file"
              accept=".pdf"
              multiple
              style="display: none"
              @change="onFileChange('competitor', $event)"
            />
          </div>
        </div>

        <!-- 기타 참고자료 (다중 파일) -->
        <div class="pt-settings-col">
          <div class="pt-settings-label">기타 참고자료</div>
          <div class="pt-file-chip-list">
            <div
              v-for="f in etcRefFiles"
              :key="f.ptFileId"
              class="pt-file-chip"
            >
              <i class="icon-document size-12" />
              <button
                type="button"
                class="pt-file-chip-name"
                title="다운로드"
                :disabled="downloadingFileId === f.ptFileId"
                @click="onDownloadFile(f.ptFileId)"
              >
                {{ f.fileName }}
              </button>
              <button
                class="pt-file-chip-remove"
                @click="removeFile('etcRef', f.ptFileId)"
              >
                <i class="icon-close size-10" />
              </button>
            </div>
          </div>
          <div
            class="pt-mini-upload pt-mini-upload--add"
            @click="triggerFileInput(etcRefInputRef)"
          >
            <i class="icon-plus size-12" />
            <span>파일 첨부 (선택)</span>
            <input
              ref="etcRefInputRef"
              type="file"
              accept=".pdf"
              multiple
              style="display: none"
              @change="onFileChange('etcRef', $event)"
            />
          </div>
        </div>
      </div>

      <div class="pt-panel-actions">
        <UiButton
          variant="primary"
          size="md"
          :disabled="isSaving"
          @click="onNext"
        >
          {{ isSaving ? '저장 중...' : '다음 · 전략검토' }}
          <template #icon-right>
            <i class="icon-arrow-right size-14" />
          </template>
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { useProposalFileStore } from '~/composables/proposal/useProposalFileStore'
import { openToast } from '~/composables/useToast'
import type { PtWritingStyle } from '~/types/proposal'

const props = defineProps<{
  ptProjectId: string
}>()

const emit = defineEmits<{
  next: []
}>()

const { fetchSelectProjectSettings, fetchUpdateProjectSettings } = useProposalApi()
const { handleUploadPtFile, handleDownloadPtFile } = useProposalFileStore()

// ── 상태 ───────────────────────────────────────────────────────────────────────

type FileSlot = 'company' | 'competitor' | 'etcRef'

const isLoading = ref(true)
const isSaving = ref(false)
const downloadingFileId = ref<string | null>(null)

// 카테고리당 최대 합산 용량: 30MB
const MAX_CATEGORY_BYTES = 30 * 1024 * 1024

// 파일 목록: { ptFileId, fileName, fileSize }
const companyFiles = ref<{ ptFileId: string; fileName: string; fileSize: number }[]>([])
const competitorFiles = ref<{ ptFileId: string; fileName: string; fileSize: number }[]>([])
const etcRefFiles = ref<{ ptFileId: string; fileName: string; fileSize: number }[]>([])

const companyInputRef = ref<HTMLInputElement | null>(null)
const competitorInputRef = ref<HTMLInputElement | null>(null)
const etcRefInputRef = ref<HTMLInputElement | null>(null)

// 파일 UI에서 표시하지 않는 설정값 — 저장 시 기존 값 유지를 위해 캐싱
const cachedWritingStyle = ref<PtWritingStyle>('formal')
const cachedBaseColors = ref<[string, string, string]>(['#5B4FE9', '#8B7FFF', '#EFECFE'])
const cachedAccentColors = ref<[string, string]>(['#E08A2C', '#22A06B'])
const cachedSubmitterNm = ref<string | undefined>(undefined)

// ── 파일 헬퍼 ─────────────────────────────────────────────────────────────────

const getFileList = (slot: FileSlot) => {
  if (slot === 'company') return companyFiles
  if (slot === 'competitor') return competitorFiles
  return etcRefFiles
}

const getPurposeCd = (slot: FileSlot): '004' | '005' | '006' => {
  if (slot === 'company') return '005'
  if (slot === 'competitor') return '006'
  return '004'
}

const triggerFileInput = (inputEl: HTMLInputElement | null) => {
  inputEl?.click()
}

const removeFile = (slot: FileSlot, ptFileId: string) => {
  const list = getFileList(slot)
  list.value = list.value.filter((f) => f.ptFileId !== ptFileId)
}

const onDownloadFile = async (ptFileId: string) => {
  if (!ptFileId || downloadingFileId.value) return
  downloadingFileId.value = ptFileId
  try {
    await handleDownloadPtFile(ptFileId)
  } finally {
    downloadingFileId.value = null
  }
}

const onFileChange = async (slot: FileSlot, e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (!files.length) return

  const purposeCd = getPurposeCd(slot)
  const fileList = getFileList(slot)

  // 카테고리별 합산 용량 체크 (기존 + 추가 예정 파일)
  const currentBytes = fileList.value.reduce((sum, f) => sum + f.fileSize, 0)
  const addBytes = files.reduce((sum, f) => sum + f.size, 0)
  if (currentBytes + addBytes > MAX_CATEGORY_BYTES) {
    openToast({ message: '카테고리당 최대 30MB까지 첨부할 수 있습니다.', type: 'warning' })
    ;(e.target as HTMLInputElement).value = ''
    return
  }

  for (const file of files) {
    try {
      const res = await handleUploadPtFile(file, purposeCd, props.ptProjectId)
      if (!res || res.result !== 'OK') {
        openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
        continue
      }
      fileList.value.push({ ptFileId: res.ptFileId, fileName: res.fileName, fileSize: file.size })
    } catch {
      openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
    }
  }

  // input 초기화 (같은 파일 재선택 허용)
  ;(e.target as HTMLInputElement).value = ''
}

// ── 초기 데이터 로드 ──────────────────────────────────────────────────────────

const loadSettings = async () => {
  isLoading.value = true
  try {
    const res = await fetchSelectProjectSettings(props.ptProjectId)
    const d = res.data
    // 파일 UI 표시 필드
    companyFiles.value = d.companyFiles ?? []
    competitorFiles.value = d.competitorFiles ?? []
    etcRefFiles.value = d.etcRefFiles ?? []
    // 비표시 설정 캐싱 — 저장 시 기존 값 유지용
    cachedWritingStyle.value = d.writingStyle
    cachedBaseColors.value = d.baseColors ?? ['#5B4FE9', '#8B7FFF', '#EFECFE']
    cachedAccentColors.value = d.accentColors ?? ['#E08A2C', '#22A06B']
    cachedSubmitterNm.value = d.submitterNm
  } catch {
    openToast({ message: '설정 로드에 실패했습니다.', type: 'error' })
  } finally {
    isLoading.value = false
  }
}

// ── 저장 후 다음 단계 ─────────────────────────────────────────────────────────

const onNext = async () => {
  isSaving.value = true
  try {
    await fetchUpdateProjectSettings({
      ptProjectId: props.ptProjectId,
      companyFileIds: companyFiles.value.map((f) => f.ptFileId),
      competitorFileIds: competitorFiles.value.map((f) => f.ptFileId),
      etcRefFileIds: etcRefFiles.value.map((f) => f.ptFileId),
      writingStyle: cachedWritingStyle.value,
      baseColors: cachedBaseColors.value,
      accentColors: cachedAccentColors.value,
      submitterNm: cachedSubmitterNm.value,
    })
    emit('next')
  } catch {
    openToast({ message: '설정 저장에 실패했습니다.', type: 'error' })
  } finally {
    isSaving.value = false
  }
}

// ── 마운트 ───────────────────────────────────────────────────────────────────

onMounted(loadSettings)
</script>
