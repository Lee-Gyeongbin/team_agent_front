<template>
  <div class="pt-panel pt-panel--lg">
    <div class="pt-step-head">
      <h3 class="pt-panel-title">자사·경쟁사 정보</h3>
      <p class="pt-panel-desc">Win Theme 도출에 활용할 자사·경쟁사 자료와 기타 참고자료를 첨부하세요.</p>
    </div>

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
        <div
          v-for="slot in FILE_SLOTS"
          :key="slot.key"
          :class="['pt-settings-col', { 'pt-settings-full': slot.isFullWidth }]"
        >
          <div class="pt-settings-label-row">
            <span class="pt-settings-label">{{ slot.label }}</span>
            <span class="pt-settings-hint">PDF · 카테고리당 최대 {{ MAX_CATEGORY_MB }}MB</span>
          </div>
          <div class="pt-file-chip-list">
            <div
              v-for="f in fileListMap[slot.key]"
              :key="f.ptFileId"
              class="pt-file-chip"
            >
              <UiIcon
                name="file-text"
                size="14"
              />
              <button
                type="button"
                class="pt-file-chip-name"
                title="클릭하면 다운로드됩니다"
                :disabled="downloadingFileId === f.ptFileId"
                @click="onDownloadFile(f.ptFileId)"
              >
                {{ f.fileName }}
                <UiIcon
                  class="pt-file-chip-download"
                  name="download"
                  size="12"
                />
              </button>
              <button
                type="button"
                class="pt-file-chip-remove"
                title="첨부 해제"
                :aria-label="`${f.fileName} 첨부 해제`"
                @click="onRemoveFile(slot.key, f)"
              >
                <UiIcon
                  name="x"
                  size="14"
                />
              </button>
            </div>
            <!-- 업로드 중 자리표시 — 몇 개가 올라가는 중인지 보이게 -->
            <div
              v-for="i in uploadingCountMap[slot.key]"
              :key="`up-${i}`"
              class="pt-file-chip is-uploading"
            >
              <span class="pt-file-chip-spinner" />
              <span class="pt-file-chip-name">업로드 중...</span>
            </div>
          </div>
          <div
            :class="[
              'pt-mini-upload',
              'pt-mini-upload--add',
              { 'is-dragover': dragOverSlot === slot.key, 'is-disabled': !!uploadingCountMap[slot.key] },
            ]"
            @click="triggerFileInput(slot.key)"
            @dragover.prevent="dragOverSlot = slot.key"
            @dragleave="dragOverSlot = null"
            @drop.prevent="onDropFiles(slot.key, $event)"
          >
            <UiIcon
              name="plus"
              size="14"
            />
            <span>파일 첨부 (선택) — 끌어다 놓아도 됩니다</span>
            <!-- data-slot으로 어느 슬롯의 input인지 표시 — ref 콜백이 이 값으로 맵에 담는다 -->
            <input
              :ref="setInputRef"
              :data-slot="slot.key"
              type="file"
              accept=".pdf"
              multiple
              style="display: none"
              @change="onFileChange(slot.key, $event)"
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
            <UiIcon
              name="arrow-right"
              size="14"
            />
          </template>
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { useProposalFileStore } from '~/composables/proposal/useProposalFileStore'
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
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

// 카테고리당 최대 합산 용량
const MAX_CATEGORY_MB = 30
const MAX_CATEGORY_BYTES = MAX_CATEGORY_MB * 1024 * 1024
/** accept 속성은 선택창 필터일 뿐 — 드롭·필터 변경으로 통과하므로 확장자를 직접 검사한다 */
const ALLOWED_EXT_SET = new Set(['pdf'])

/** 슬롯별 업로드 진행 개수 */
const uploadingCountMap = ref<Record<FileSlot, number>>({ company: 0, competitor: 0, etcRef: 0 })
const dragOverSlot = ref<FileSlot | null>(null)

// 파일 목록: { ptFileId, fileName, fileSize }
const companyFiles = ref<{ ptFileId: string; fileName: string; fileSize: number }[]>([])
const competitorFiles = ref<{ ptFileId: string; fileName: string; fileSize: number }[]>([])
const etcRefFiles = ref<{ ptFileId: string; fileName: string; fileSize: number }[]>([])

/** 첨부 슬롯 정의 — 화면 3개 블록이 이 배열 하나로 렌더된다 */
const FILE_SLOTS: { key: FileSlot; label: string; purposeCd: '004' | '005' | '006'; isFullWidth: boolean }[] = [
  { key: 'company', label: '자사 정보', purposeCd: '005', isFullWidth: false },
  { key: 'competitor', label: '경쟁사 정보', purposeCd: '006', isFullWidth: false },
  // 2열 그리드에서 혼자 둘째 행에 남는 자리라 전체 폭 사용
  { key: 'etcRef', label: '기타 참고자료', purposeCd: '004', isFullWidth: true },
]

/** 템플릿에서 슬롯 키로 목록을 꺼내기 위한 맵 (함수가 Ref를 반환하면 템플릿에서 언랩되지 않는다) */
const fileListMap = computed(() => ({
  company: companyFiles.value,
  competitor: competitorFiles.value,
  etcRef: etcRefFiles.value,
}))

/** 슬롯별 file input — ref 콜백 identity를 고정하려고 data-slot으로 구분한다 */
const inputRefs: Partial<Record<FileSlot, HTMLInputElement>> = {}
const setInputRef = (el: unknown) => {
  const input = el as HTMLInputElement | null
  const slot = input?.dataset.slot as FileSlot | undefined
  if (input && slot) inputRefs[slot] = input
}

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

const getPurposeCd = (slot: FileSlot) => FILE_SLOTS.find((s) => s.key === slot)?.purposeCd ?? '004'

const triggerFileInput = (slot: FileSlot) => {
  inputRefs[slot]?.click()
}

/**
 * 첨부 목록을 서버에 즉시 반영한다.
 * 파일 자체는 선택 즉시 업로드되는데 목록 저장이 '다음' 버튼에만 걸려 있으면
 * 칩이 보이는데도 이탈 시 사라져 사용자가 저장된 것으로 오해한다.
 */
const persistFiles = async (): Promise<boolean> => {
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
    return true
  } catch {
    openToast({ message: '첨부 정보 저장에 실패했습니다.', type: 'error' })
    return false
  }
}

const onRemoveFile = async (slot: FileSlot, file: { ptFileId: string; fileName: string }) => {
  const confirmed = await openConfirm({
    title: '첨부 해제',
    message: `'${file.fileName}' 첨부를 해제하시겠습니까?`,
  })
  if (!confirmed) return

  const list = getFileList(slot)
  const backup = [...list.value]
  list.value = list.value.filter((f) => f.ptFileId !== file.ptFileId)
  // 저장 실패 시 화면만 지워진 상태로 남지 않도록 되돌린다
  if (!(await persistFiles())) list.value = backup
  else openToast({ message: '첨부를 해제했습니다.' })
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

/** 확장자·합산 용량 검사 — 통과한 파일만 반환 */
const validateFiles = (slot: FileSlot, files: File[]): File[] | null => {
  const invalid = files.filter((f) => !ALLOWED_EXT_SET.has(f.name.split('.').pop()?.toLowerCase() ?? ''))
  if (invalid.length) {
    openToast({ message: `PDF 파일만 첨부할 수 있습니다: ${invalid.map((f) => f.name).join(', ')}`, type: 'warning' })
    return null
  }

  const currentBytes = getFileList(slot).value.reduce((sum, f) => sum + f.fileSize, 0)
  const addBytes = files.reduce((sum, f) => sum + f.size, 0)
  if (currentBytes + addBytes > MAX_CATEGORY_BYTES) {
    openToast({ message: `카테고리당 최대 ${MAX_CATEGORY_MB}MB까지 첨부할 수 있습니다.`, type: 'warning' })
    return null
  }
  return files
}

const addFiles = async (slot: FileSlot, rawFiles: File[]) => {
  if (!rawFiles.length) return
  const files = validateFiles(slot, rawFiles)
  if (!files) return

  const purposeCd = getPurposeCd(slot)
  uploadingCountMap.value[slot] += files.length

  try {
    // 순차 업로드는 파일이 여러 개일 때 체감 대기가 길어진다 → 병렬 처리
    const results = await Promise.all(
      files.map((file) =>
        handleUploadPtFile(file, purposeCd, props.ptProjectId)
          .then((res) => ({ res, file }))
          .catch(() => ({ res: null, file })),
      ),
    )

    const uploaded = results
      .filter(({ res, file }) => {
        if (res && res.result === 'OK') return true
        openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
        return false
      })
      .map(({ res, file }) => ({ ptFileId: res!.ptFileId, fileName: res!.fileName, fileSize: file.size }))

    if (!uploaded.length) return
    getFileList(slot).value.push(...uploaded)
    if (await persistFiles()) openToast({ message: `${uploaded.length}개 파일을 첨부했습니다.` })
  } finally {
    uploadingCountMap.value[slot] -= files.length
  }
}

const onFileChange = async (slot: FileSlot, e: Event) => {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // 같은 파일 재선택 허용 — 업로드 전에 비워야 await 중 참조가 끊기지 않는다
  await addFiles(slot, files)
}

const onDropFiles = async (slot: FileSlot, e: DragEvent) => {
  dragOverSlot.value = null
  if (uploadingCountMap.value[slot]) return
  await addFiles(slot, Array.from(e.dataTransfer?.files ?? []))
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
    if (await persistFiles()) emit('next')
  } finally {
    isSaving.value = false
  }
}

// ── 마운트 ───────────────────────────────────────────────────────────────────

onMounted(loadSettings)
</script>
