<template>
  <div class="pt-panel pt-panel--lg">
    <h3 class="pt-panel-title">템플릿 설정</h3>
    <p class="pt-panel-desc">제안서 템플릿 방식·사이즈와 본문 생성에 사용할 스타일을 지정하세요.</p>

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
      <!-- ── StepA 영역: 템플릿 방식 / 파일 / 사이즈 ─────────────────────── -->

      <div class="pt-section-label">1. 템플릿 방식</div>
      <div class="pt-option-row">
        <div
          :class="['pt-option-card', { 'is-selected': templateMode === 'fix' }]"
          @click="templateMode = 'fix'"
        >
          <b>보완</b>
          <span>기존 보유 템플릿을 첨부하면 헤더/푸터 스타일을 유지한 채 보완합니다</span>
        </div>
        <div
          :class="['pt-option-card', { 'is-selected': templateMode === 'new' }]"
          @click="templateMode = 'new'"
        >
          <b>생성</b>
          <span>참조할 템플릿이 있다면 첨부, 없으면 새로 디자인해 생성합니다</span>
        </div>
      </div>

      <div
        class="pt-dropzone"
        @click="onClickDropzone"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <i class="icon-attach size-18" />
        <!-- 새로 선택한 파일 -->
        <span
          v-if="attachedFile"
          class="pt-dropzone-file"
        >
          <i class="icon-document size-14" />
          {{ attachedFile.name }}
          <button
            class="pt-dropzone-remove"
            @click.stop="attachedFile = null"
          >
            <i class="icon-close size-12" />
          </button>
        </span>
        <!-- DB에 이미 저장된 템플릿 파일 -->
        <span
          v-else-if="savedTemplateFileNm"
          class="pt-dropzone-file"
        >
          <i class="icon-document size-14" />
          {{ savedTemplateFileNm }}
          <span class="pt-dropzone-tag">저장됨</span>
        </span>
        <!-- 파일 없음 -->
        <span v-else>
          <b>{{ templateMode === 'fix' ? '보완 대상 템플릿' : '참조 템플릿(선택)' }}</b>
          {{
            templateMode === 'fix'
              ? ' 파일을 첨부하세요 (.pptx, .docx)'
              : ' 파일을 첨부하세요 — 없으면 새 스타일로 생성됩니다'
          }}
        </span>
        <input
          ref="fileInputRef"
          type="file"
          accept=".pptx,.docx"
          style="display: none"
          @change="onFileChange"
        />
      </div>

      <div class="pt-section-label">2. 문서 사이즈</div>
      <div class="pt-size-row">
        <div
          v-for="sz in SIZE_OPTIONS"
          :key="sz.value"
          :class="['pt-size-card', `pt-size-${sz.cssKey}`, { 'is-selected': documentSize === sz.value }]"
          @click="documentSize = sz.value"
        >
          <div class="pt-size-ratio" />
          <b>{{ sz.label }}</b>
          <span>{{ sz.sub }}</span>
        </div>
      </div>

      <!-- ── StepC 잔여 영역: 제안 대상 / 문체 / 제안사명 / 컬러 ─────────── -->

      <div class="pt-settings-grid pt-settings-grid--top-gap">
        <!-- 제안 대상 -->
        <div class="pt-settings-full">
          <div class="pt-settings-label">3. 제안 대상</div>
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
          <div class="pt-settings-label">4. 문체 스타일</div>
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

        <!-- 제안사명 -->
        <div class="pt-settings-full">
          <div class="pt-settings-label">5. 제안사명</div>
          <UiInput
            v-model="submitterNm"
            placeholder="출력물 푸터에 표시될 제안사명을 입력하세요 (선택)"
            desc="입력하지 않으면 출력물 푸터 우측이 공란으로 처리됩니다."
          />
        </div>

        <!-- 컬러 지정 -->
        <div class="pt-settings-full">
          <div class="pt-settings-label">6. 컬러 지정</div>
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
          :loading="isSaving"
          @click="onClickNext"
        >
          다음 · 템플릿 생성
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

interface Props {
  ptProjectId: string
  projectConfigJson?: string // [id].vue에서 내려오는 PROJECT_CONFIG_JSON raw string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  next: []
}>()

const {
  fetchUpdateProjectTemplate,
  fetchSelectPtRfpFile,
  fetchSelectProjectSettings,
  fetchUpdateProjectSettings,
  fetchUpdateProjectTargetType,
} = useProposalApi()
const { handleUploadPtFile } = useProposalFileStore()

// ── 상수 ───────────────────────────────────────────────────────────────────────

const SIZE_OPTIONS = [
  { value: 'a4' as const, cssKey: 'a4', label: 'A4', sub: '제안서(서면)' },
  { value: '169' as const, cssKey: '169', label: '16:9 와이드', sub: '발표 장표' },
  { value: '43' as const, cssKey: '43', label: '4:3', sub: '발표 장표' },
]

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

// ── 상태: 템플릿 설정 (구 StepA) ─────────────────────────────────────────────

const templateMode = ref<'fix' | 'new'>('fix')
const documentSize = ref<'a4' | '169' | '43'>('a4')
const attachedFile = ref<File | null>(null)
const savedTemplateFileNm = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// ── 상태: 스타일 설정 (구 StepC 잔여) ────────────────────────────────────────

const isLoading = ref(true)
const isSaving = ref(false)
const isTargetSaving = ref(false)

const targetTypeCd = ref<PtTargetTypeCd>('G')
const writingStyle = ref<PtWritingStyle>('formal')
const submitterNm = ref('')
const colorValues = ref<string[]>(['#5B4FE9', '#8B7FFF', '#EFECFE', '#E08A2C', '#22A06B'])

// 파일 ID 캐싱 — fetchUpdateProjectSettings 호출 시 파일 목록 유지
const cachedCompanyFileIds = ref<string[]>([])
const cachedCompetitorFileIds = ref<string[]>([])
const cachedEtcRefFileIds = ref<string[]>([])

// ── 템플릿 파일 입력 ─────────────────────────────────────────────────────────

// projectConfigJson 파싱 (computed로 캐싱 — JSON.parse 는 문자열이 바뀔 때만 실행)
const parsedProjectConfig = computed(() => {
  try {
    return JSON.parse(props.projectConfigJson ?? '{}')
  } catch {
    return {}
  }
})

// 파싱 결과가 바뀌면 templateMode / documentSize 폼 상태에 동기화
watch(
  parsedProjectConfig,
  (cfg) => {
    const tpl = cfg?.template
    if (tpl?.mode === 'fix' || tpl?.mode === 'new') templateMode.value = tpl.mode
    if (tpl?.docSize === 'a4' || tpl?.docSize === '169' || tpl?.docSize === '43') {
      documentSize.value = tpl.docSize
    }
  },
  { immediate: true },
)

const onClickDropzone = () => fileInputRef.value?.click()
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  attachedFile.value = input.files?.[0] ?? null
}
const onDrop = (e: DragEvent) => {
  attachedFile.value = e.dataTransfer?.files?.[0] ?? null
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
    // 템플릿 파일 조회 (구 StepA)
    const rfpRes = await fetchSelectPtRfpFile(props.ptProjectId, '003')
    if (rfpRes?.result === 'OK' && rfpRes.data?.fileName) {
      savedTemplateFileNm.value = rfpRes.data.fileName
    }

    // 스타일 설정 + 파일 ID 캐시 조회 (구 StepC)
    const settingsRes = await fetchSelectProjectSettings(props.ptProjectId)
    const d = settingsRes.data
    targetTypeCd.value = d.targetTypeCd
    writingStyle.value = d.writingStyle
    submitterNm.value = d.submitterNm ?? ''
    colorValues.value = [...d.baseColors, ...d.accentColors]
    // 파일 목록 캐싱 — 저장 시 기존 파일 연결 유지
    cachedCompanyFileIds.value = (d.companyFiles ?? []).map((f) => f.ptFileId)
    cachedCompetitorFileIds.value = (d.competitorFiles ?? []).map((f) => f.ptFileId)
    cachedEtcRefFileIds.value = (d.etcRefFiles ?? []).map((f) => f.ptFileId)
  } catch {
    openToast({ message: '설정 로드에 실패했습니다.', type: 'error' })
  } finally {
    isLoading.value = false
  }
}

// ── 저장 후 다음 단계 ─────────────────────────────────────────────────────────

const onClickNext = async () => {
  // fix 모드에서 파일 미첨부 + 저장된 파일도 없으면 차단
  if (templateMode.value === 'fix' && !attachedFile.value && !savedTemplateFileNm.value) {
    openToast({ message: '보완 모드에서는 템플릿 파일(.pptx, .docx)을 첨부해주세요.', type: 'warning' })
    return
  }

  isSaving.value = true
  try {
    // ① 템플릿 파일 업로드 → 템플릿 설정 저장 (구 StepA)
    let templateFileId: string | undefined
    if (attachedFile.value) {
      const uploadingName = attachedFile.value.name
      const uploadRes = await handleUploadPtFile(attachedFile.value, '003', props.ptProjectId)
      if (!uploadRes || uploadRes.result !== 'OK') {
        openToast({ message: '템플릿 파일 업로드에 실패했습니다.', type: 'error' })
        return
      }
      templateFileId = uploadRes.ptFileId
      savedTemplateFileNm.value = uploadRes.fileName || uploadingName
      attachedFile.value = null
    }

    const templateRes = await fetchUpdateProjectTemplate({
      ptProjectId: props.ptProjectId,
      mode: templateMode.value,
      templateFileId,
      docSize: documentSize.value,
    })
    if (templateRes.result !== 'OK') {
      openToast({ message: templateRes.msg ?? '템플릿 설정 저장에 실패했습니다.', type: 'error' })
      return
    }

    // ② 스타일 설정 저장 (구 StepC 잔여) — 캐싱된 파일 ID 함께 전달
    await fetchUpdateProjectSettings({
      ptProjectId: props.ptProjectId,
      companyFileIds: cachedCompanyFileIds.value,
      competitorFileIds: cachedCompetitorFileIds.value,
      etcRefFileIds: cachedEtcRefFileIds.value,
      writingStyle: writingStyle.value,
      baseColors: [colorValues.value[0], colorValues.value[1], colorValues.value[2]] as [string, string, string],
      accentColors: [colorValues.value[3], colorValues.value[4]] as [string, string],
      submitterNm: submitterNm.value.trim() || undefined,
    })

    emit('next')
  } catch {
    openToast({ message: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.', type: 'error' })
  } finally {
    isSaving.value = false
  }
}

// ── 마운트 ───────────────────────────────────────────────────────────────────

onMounted(loadSettings)
</script>

<style lang="scss" scoped>
.pt-settings-grid--top-gap {
  margin-top: $spacing-lg;
}
</style>
