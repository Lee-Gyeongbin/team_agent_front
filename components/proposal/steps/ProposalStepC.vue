<template>
  <div class="pt-panel">
    <h3 class="pt-panel-title">제안 설정</h3>
    <p class="pt-panel-desc">본문 생성에 사용할 참고 자료와 스타일을 지정하세요.</p>

    <!-- 로딩 스켈레톤 -->
    <template v-if="isLoading">
      <div
        v-for="i in 4"
        :key="i"
        class="pt-skeleton"
        style="height: 56px; margin-bottom: 12px"
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
              <span class="pt-file-chip-name">{{ f.fileName }}</span>
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
              accept=".pdf,.docx,.hwp,.pptx"
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
              <span class="pt-file-chip-name">{{ f.fileName }}</span>
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
              accept=".pdf,.docx,.hwp,.pptx"
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
              <span class="pt-file-chip-name">{{ f.fileName }}</span>
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
              accept=".pdf,.docx,.hwp,.pptx"
              multiple
              style="display: none"
              @change="onFileChange('etcRef', $event)"
            />
          </div>
        </div>

        <!-- 제안 대상 -->
        <div class="pt-settings-full">
          <div class="pt-settings-label">제안 대상</div>
          <div class="pt-toggle-row">
            <button
              :class="['pt-toggle-opt', { 'is-active': targetTypeCd === 'G' }]"
              :disabled="isTargetSaving"
              @click="onTargetTypeChange('G')"
            >
              공공
            </button>
            <button
              :class="['pt-toggle-opt', { 'is-active': targetTypeCd === 'P' }]"
              :disabled="isTargetSaving"
              @click="onTargetTypeChange('P')"
            >
              민간
            </button>
          </div>
          <p class="pt-hint">대상에 따라 어조와 강조 요소(정량 성과 vs 준법·공익성 등)가 다르게 적용됩니다.</p>
        </div>

        <!-- 문체 스타일 -->
        <div class="pt-settings-full">
          <div class="pt-settings-label">문체 스타일</div>
          <div class="pt-toggle-row">
            <button
              v-for="opt in WRITING_STYLE_OPTIONS"
              :key="opt.value"
              :class="['pt-toggle-opt', { 'is-active': writingStyle === opt.value }]"
              @click="writingStyle = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 컬러 지정 -->
        <div class="pt-settings-full">
          <div class="pt-settings-label">컬러 지정</div>
          <div class="pt-color-block">
            <div
              v-for="(item, idx) in COLOR_ROWS"
              :key="item.key"
              class="pt-color-row"
            >
              <span class="pt-color-clabel">{{ item.label }}</span>
              <span class="pt-color-rank">{{ item.rank }}</span>
              <input
                type="color"
                class="pt-color-picker"
                :value="colorValues[idx]"
                @input="colorValues[idx] = ($event.target as HTMLInputElement).value"
              />
            </div>
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
          {{ isSaving ? '저장 중...' : '다음 · 본문 생성 시작' }}
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
import type { PtTargetTypeCd, PtWritingStyle } from '~/types/proposal'

const props = defineProps<{
  ptProjectId: string
}>()

const emit = defineEmits<{
  next: []
}>()

const { fetchSelectProjectSettings, fetchUpdateProjectSettings, fetchUpdateProjectTargetType } = useProposalApi()
const { handleUploadPtFile } = useProposalFileStore()

// ── 상수 ───────────────────────────────────────────────────────────────────────

const WRITING_STYLE_OPTIONS: { value: PtWritingStyle; label: string }[] = [
  { value: 'formal', label: '공식·격식체' },
  { value: 'plain', label: '간결·실무체' },
  { value: 'persuasive', label: '설득·강조체' },
]

const COLOR_ROWS = [
  { key: 'base1', label: '기본색조 1순위', rank: 'Primary' },
  { key: 'base2', label: '기본색조 2순위', rank: 'Secondary' },
  { key: 'base3', label: '기본색조 3순위', rank: 'Tertiary' },
  { key: 'accent1', label: '강조색조 1순위', rank: 'Accent 1' },
  { key: 'accent2', label: '강조색조 2순위', rank: 'Accent 2' },
]

// ── 상태 ───────────────────────────────────────────────────────────────────────

type FileSlot = 'company' | 'competitor' | 'etcRef'

const isLoading = ref(true)
const isSaving = ref(false)
const isTargetSaving = ref(false)

const targetTypeCd = ref<PtTargetTypeCd>('G')
const writingStyle = ref<PtWritingStyle>('formal')
const colorValues = ref<string[]>(['#5B4FE9', '#8B7FFF', '#EFECFE', '#E08A2C', '#22A06B'])

// 파일 목록: { ptFileId, fileName }
const companyFiles = ref<{ ptFileId: string; fileName: string }[]>([])
const competitorFiles = ref<{ ptFileId: string; fileName: string }[]>([])
const etcRefFiles = ref<{ ptFileId: string; fileName: string }[]>([])

const companyInputRef = ref<HTMLInputElement | null>(null)
const competitorInputRef = ref<HTMLInputElement | null>(null)
const etcRefInputRef = ref<HTMLInputElement | null>(null)

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

const onFileChange = async (slot: FileSlot, e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (!files.length) return

  const purposeCd = getPurposeCd(slot)
  const fileList = getFileList(slot)

  for (const file of files) {
    try {
      const res = await handleUploadPtFile(file, purposeCd, props.ptProjectId)
      if (!res || res.result !== 'OK') {
        openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
        continue
      }
      fileList.value.push({ ptFileId: res.ptFileId, fileName: res.fileName })
    } catch {
      openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
    }
  }

  // input 초기화 (같은 파일 재선택 허용)
  ;(e.target as HTMLInputElement).value = ''
}

// ── 제안 대상 즉시 저장 ───────────────────────────────────────────────────────

const onTargetTypeChange = async (cd: PtTargetTypeCd) => {
  if (cd === targetTypeCd.value || isTargetSaving.value) return
  isTargetSaving.value = true
  try {
    await fetchUpdateProjectTargetType(props.ptProjectId, cd)
    targetTypeCd.value = cd
  } catch {
    openToast({ message: '제안 대상 변경에 실패했습니다.', type: 'error' })
  } finally {
    isTargetSaving.value = false
  }
}

// ── 초기 데이터 로드 ──────────────────────────────────────────────────────────

const loadSettings = async () => {
  isLoading.value = true
  try {
    const res = await fetchSelectProjectSettings(props.ptProjectId)
    const d = res.data
    targetTypeCd.value = d.targetTypeCd
    writingStyle.value = d.writingStyle
    companyFiles.value = d.companyFiles ?? []
    competitorFiles.value = d.competitorFiles ?? []
    etcRefFiles.value = d.etcRefFiles ?? []
    colorValues.value = [...d.baseColors, ...d.accentColors]
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
      writingStyle: writingStyle.value,
      baseColors: [colorValues.value[0], colorValues.value[1], colorValues.value[2]] as [string, string, string],
      accentColors: [colorValues.value[3], colorValues.value[4]] as [string, string],
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
