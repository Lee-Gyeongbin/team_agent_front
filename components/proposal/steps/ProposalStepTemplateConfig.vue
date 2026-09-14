<template>
  <div class="pt-panel pt-panel--lg tc-panel">
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

      <div class="tc-grid">
        <section
          class="tc-card"
          aria-labelledby="tc-template-title"
        >
          <h4
            id="tc-template-title"
            class="tc-card-title"
          >
            <UiIcon
              name="files"
              :size="18"
            />
            템플릿 방식
          </h4>
          <p class="tc-card-desc">기존 템플릿을 보완하거나 새롭게 생성하세요.</p>
          <div class="pt-option-row">
            <button
              type="button"
              :aria-pressed="templateMode === 'fix'"
              :class="['pt-option-card', { 'is-selected': templateMode === 'fix' }]"
              @click="templateMode = 'fix'"
            >
              <span
                class="tc-choice-dot"
                aria-hidden="true"
              />
              <b>기존 템플릿 보완</b>
              <UiIcon
                class="tc-mode-icon"
                name="file-pen-line"
                :size="30"
              />
              <span>기존 보유 템플릿을 첨부하면 헤더/푸터 스타일을 유지한 채 보완합니다</span>
            </button>
            <button
              type="button"
              :aria-pressed="templateMode === 'new'"
              :class="['pt-option-card', { 'is-selected': templateMode === 'new' }]"
              @click="templateMode = 'new'"
            >
              <span
                class="tc-choice-dot"
                aria-hidden="true"
              />
              <b>새 템플릿 생성</b>
              <UiIcon
                class="tc-mode-icon"
                name="file-plus-2"
                :size="30"
              />
              <span>참조할 템플릿이 있다면 첨부, 없으면 새로 디자인해 생성합니다</span>
            </button>
          </div>

          <div
            class="pt-dropzone"
            role="button"
            tabindex="0"
            aria-label="템플릿 파일 첨부 또는 변경"
            @click="onClickDropzone"
            @keydown.enter.self.prevent="onClickDropzone"
            @keydown.space.self.prevent="onClickDropzone"
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
                type="button"
                aria-label="선택한 파일 제거"
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
                  ? ` 파일을 첨부하세요 (${TEMPLATE_FILE_HINT})`
                  : ` 파일을 첨부하세요 (${TEMPLATE_FILE_HINT}) — 없으면 새 스타일로 생성됩니다`
              }}
            </span>
            <input
              ref="fileInputRef"
              type="file"
              :accept="TEMPLATE_FILE_ACCEPT"
              style="display: none"
              @change="onFileChange"
            />
          </div>
          <p class="tc-file-hint">
            {{ templateMode === 'fix' ? '보완할 템플릿 첨부 필수' : '참조 템플릿 첨부 선택' }} ·
            {{ TEMPLATE_FILE_HINT }}
          </p>
        </section>

        <section
          class="tc-card"
          aria-labelledby="tc-size-title"
        >
          <h4
            id="tc-size-title"
            class="tc-card-title"
          >
            <UiIcon
              name="panels-top-left"
              :size="18"
            />
            문서 사이즈
          </h4>
          <p class="tc-card-desc">제안서 용도에 맞는 화면 비율을 선택하세요.</p>
          <div class="pt-size-row">
            <button
              v-for="sz in SIZE_OPTIONS"
              :key="sz.value"
              type="button"
              :aria-pressed="documentSize === sz.value"
              :class="['pt-size-card', `pt-size-${sz.cssKey}`, { 'is-selected': documentSize === sz.value }]"
              @click="documentSize = sz.value"
            >
              <span
                class="tc-choice-dot"
                aria-hidden="true"
              />
              <span
                class="tc-document-stage"
                aria-hidden="true"
              >
                <svg
                  :class="['tc-document', `tc-document--${sz.cssKey}`]"
                  viewBox="0 0 120 90"
                  preserveAspectRatio="none"
                >
                  <rect
                    x="1"
                    y="1"
                    width="118"
                    height="88"
                    rx="3"
                    fill="white"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <rect
                    x="12"
                    y="12"
                    width="96"
                    height="43"
                    rx="2"
                    fill="#e8edf8"
                  />
                  <path
                    d="M32 45 48 28 60 40 72 32 88 45Z"
                    fill="#cbd7ee"
                  />
                  <rect
                    x="12"
                    y="64"
                    width="66"
                    height="4"
                    rx="2"
                    fill="#cbd7ee"
                  />
                  <rect
                    x="12"
                    y="74"
                    width="44"
                    height="4"
                    rx="2"
                    fill="#e8edf8"
                  />
                </svg>
              </span>
              <b>{{ sz.label }}</b>
              <span>{{ sz.sub }}</span>
              <small>{{
                sz.value === 'a4'
                  ? '인쇄 및 제출용 표준 문서'
                  : sz.value === '169'
                    ? '프레젠테이션에 적합한 와이드 화면'
                    : '일반적인 발표 화면'
              }}</small>
            </button>
          </div>
        </section>

        <!-- ── StepC 잔여 영역: 제안 대상 / 문체 / 제안사명 / 컬러 ─────────── -->

        <section
          class="tc-card"
          aria-labelledby="tc-style-title"
        >
          <h4
            id="tc-style-title"
            class="tc-card-title"
          >
            <UiIcon
              name="text-cursor-input"
              :size="18"
            />
            제안 대상 및 문체
          </h4>
          <p class="tc-card-desc">읽는 대상과 전달할 메시지에 맞춰 설정하세요.</p>
          <div class="tc-fields">
            <!-- 제안 대상 -->
            <div class="pt-settings-full">
              <div class="pt-settings-label">제안 대상</div>
              <div class="pt-toggle-row">
                <button
                  type="button"
                  :aria-pressed="targetTypeCd === 'G'"
                  :class="['pt-toggle-opt', { 'is-active': targetTypeCd === 'G' }]"
                  :disabled="isTargetSaving"
                  @click="onTargetTypeChange('G')"
                >
                  <span
                    class="tc-choice-dot"
                    aria-hidden="true"
                  />
                  <UiIcon
                    name="landmark"
                    :size="24"
                  />
                  <span><b>공공</b><small>정부·공공기관</small></span>
                </button>
                <button
                  type="button"
                  :aria-pressed="targetTypeCd === 'P'"
                  :class="['pt-toggle-opt', { 'is-active': targetTypeCd === 'P' }]"
                  :disabled="isTargetSaving"
                  @click="onTargetTypeChange('P')"
                >
                  <span
                    class="tc-choice-dot"
                    aria-hidden="true"
                  />
                  <UiIcon
                    name="users"
                    :size="24"
                  />
                  <span><b>민간</b><small>일반 기업·민간기관</small></span>
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
                  type="button"
                  :aria-pressed="writingStyle === opt.value"
                  :class="['pt-toggle-opt', { 'is-active': writingStyle === opt.value }]"
                  @click="writingStyle = opt.value"
                >
                  <span
                    class="tc-choice-dot"
                    aria-hidden="true"
                  />
                  <span
                    ><b>{{ opt.label }}</b
                    ><small>{{
                      opt.value === 'formal'
                        ? '공식적이고 신뢰감 있는 표현'
                        : opt.value === 'plain'
                          ? '핵심 중심의 간결한 표현'
                          : '성과와 차별점을 강조하는 표현'
                    }}</small></span
                  >
                </button>
              </div>
              <div class="tc-style-example">
                <UiIcon
                  name="file-pen-line"
                  :size="24"
                />
                <div>
                  <strong
                    >문체 예시 ({{ WRITING_STYLE_OPTIONS.find((opt) => opt.value === writingStyle)?.label }})</strong
                  >
                  <p>
                    {{
                      writingStyle === 'formal'
                        ? '“안정적인 사업 수행 체계를 기반으로 제안합니다.”'
                        : writingStyle === 'plain'
                          ? '“체계적인 수행 계획으로 사업을 안정적으로 추진합니다.”'
                          : '“검증된 수행 역량으로 사업의 성공과 차별화된 성과를 이끌겠습니다.”'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 제안사명 -->
        <section
          class="tc-card"
          aria-labelledby="tc-company-title"
        >
          <h4
            id="tc-company-title"
            class="tc-card-title"
          >
            <UiIcon
              name="palette"
              :size="18"
            />
            제안사 및 컬러
          </h4>
          <p class="tc-card-desc">출력물에 표시할 회사명과 색상을 지정하세요.</p>
          <div class="tc-fields">
            <div class="pt-settings-full">
              <div class="pt-settings-label">제안사명 <span class="tc-optional">선택</span></div>
              <UiInput
                v-model="submitterNm"
                aria-label="제안사명"
                placeholder="출력물 푸터에 표시될 제안사명을 입력하세요 (선택)"
                desc="입력하지 않으면 출력물 푸터 우측이 공란으로 처리됩니다."
              />
            </div>

            <!-- 컬러 지정 -->
            <div class="tc-footer-preview">
              <span>문서 하단(푸터) 적용 예시</span>
              <p class="tc-preview-callout">입력한 제안사명이<br />문서 푸터 우측에 표시됩니다.</p>
              <div>
                <span>제안서</span><strong>{{ submitterNm.trim() || '제안사명 미입력' }}</strong>
              </div>
            </div>
            <div class="pt-settings-full">
              <div class="pt-settings-label">컬러 지정</div>
              <div class="pt-color-block">
                <label
                  v-for="(item, idx) in COLOR_ROWS"
                  :key="item.key"
                  class="pt-color-row"
                >
                  <span class="pt-color-clabel">{{ item.label }}</span>
                  <input
                    type="color"
                    class="pt-color-picker"
                    :value="colorValues[idx]"
                    @input="colorValues[idx] = ($event.target as HTMLInputElement).value"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="tc-footer">
        <div class="tc-summary">
          <strong>선택한 설정</strong>
          <span>{{ templateMode === 'fix' ? '기존 템플릿 보완' : '새 템플릿 생성' }}</span>
          <span>{{ SIZE_OPTIONS.find((option) => option.value === documentSize)?.label }}</span>
          <span>{{ targetTypeCd === 'G' ? '공공' : '민간' }}</span>
          <span>{{ WRITING_STYLE_OPTIONS.find((option) => option.value === writingStyle)?.label }}</span>
        </div>
        <UiButton
          variant="primary"
          size="md"
          :loading="isSaving"
          :disabled="isTargetSaving"
          @click="onClickNext"
        >
          설정 저장 후 템플릿 생성
          <template #icon-right>
            <UiIcon
              name="arrow-right"
              :size="16"
            />
          </template>
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiInput } from '@leechanyong/ispark-ui'
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

const ALLOWED_TEMPLATE_EXT = ['pdf', 'docx', 'png', 'jpg', 'jpeg'] as const
const ALLOWED_TEMPLATE_EXT_SET = new Set<string>(ALLOWED_TEMPLATE_EXT)
const TEMPLATE_FILE_ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg'
const TEMPLATE_FILE_HINT = '.pdf, .docx, .png, .jpg, .jpeg'

// ── 상태: 템플릿 설정 (구 StepA) ─────────────────────────────────────────────

const templateMode = ref<'fix' | 'new'>('fix')
const documentSize = ref<'a4' | '169' | '43'>('a4')
const attachedFile = ref<File | null>(null)
const savedTemplateFileNm = ref<string | null>(null)
const savedTemplateFileId = ref<string | undefined>() // 기존 저장된 templateFileId 캐시
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

// 파싱 결과가 바뀌면 templateMode / documentSize / savedTemplateFileId 폼 상태에 동기화
watch(
  parsedProjectConfig,
  (cfg) => {
    const tpl = cfg?.template
    if (tpl?.mode === 'fix' || tpl?.mode === 'new') templateMode.value = tpl.mode
    if (tpl?.docSize === 'a4' || tpl?.docSize === '169' || tpl?.docSize === '43') {
      documentSize.value = tpl.docSize
    }
    savedTemplateFileId.value = tpl?.templateFileId ?? undefined
  },
  { immediate: true },
)

const getFileExt = (fileName: string): string => {
  const trimmed = fileName.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot < 0 || lastDot === trimmed.length - 1) return ''
  return trimmed.slice(lastDot + 1).toLowerCase()
}

/** 선택·드롭 파일을 검증하고, 통과한 1개만 반환 */
const applyTemplateFileValidation = (file: File | null | undefined): File | null => {
  if (!file) return null
  const ext = getFileExt(file.name)
  if (!ALLOWED_TEMPLATE_EXT_SET.has(ext)) {
    openToast({ message: `${TEMPLATE_FILE_HINT} 파일만 첨부할 수 있습니다.`, type: 'warning' })
    return null
  }
  return file
}

const onClickDropzone = () => fileInputRef.value?.click()
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const validated = applyTemplateFileValidation(input.files?.[0])
  if (validated) attachedFile.value = validated
  input.value = ''
}
const onDrop = (e: DragEvent) => {
  const validated = applyTemplateFileValidation(e.dataTransfer?.files?.[0])
  if (validated) attachedFile.value = validated
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
    openToast({ message: `보완 모드에서는 템플릿 파일(${TEMPLATE_FILE_HINT})을 첨부해주세요.`, type: 'warning' })
    return
  }

  if (attachedFile.value && !applyTemplateFileValidation(attachedFile.value)) {
    attachedFile.value = null
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
      savedTemplateFileId.value = templateFileId
      attachedFile.value = null
    }

    const templateRes = await fetchUpdateProjectTemplate({
      ptProjectId: props.ptProjectId,
      mode: templateMode.value,
      templateFileId: templateFileId ?? savedTemplateFileId.value, // 재업로드 없이 다음 이동 시 기존 ID 유지
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
.tc-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  align-content: start;
  padding: 2px 8px 20px 2px;
  counter-reset: setting-card;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}
.tc-card {
  counter-increment: setting-card;
  min-width: 0;
  padding: 22px;
  border: 1px solid $color-border;
  border-radius: 12px;
  background: #fff;
}
.tc-card-title {
  &::before {
    content: '0' counter(setting-card);
    color: #8aaaff;
    font-size: 28px;
    line-height: 1;
    margin-right: 6px;
  }
  :deep(.ui-icon) {
    display: none;
  }
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: $color-text-primary;
  font-size: 15px;
  font-weight: 700;
}
.tc-card-desc {
  margin: 8px 0 20px;
  color: $color-text-muted;
  font-size: 13px;
  line-height: 1.6;
}
.tc-fields {
  display: grid;
  gap: 20px;
}
.tc-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  .pt-panel-title,
  .pt-panel-desc {
    flex-shrink: 0;
  }
  .pt-option-row,
  .pt-size-row {
    gap: 10px;
  }
  .pt-option-card,
  .pt-size-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    font-family: inherit;
    background: #fff;
    color: $color-text-primary;
    transition:
      background 0.15s,
      border-color 0.15s;
    &:hover {
      background: #f7f9ff;
    }
    &:focus-visible {
      outline: 2px solid #4065e7;
      outline-offset: 3px;
    }
    &.is-selected {
      background: #eef3ff;
      border-color: #4065e7;
    }
  }
  .pt-option-card {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    align-items: start;
    gap: 14px 10px;
    min-width: 0;
    text-align: left;
    padding: 16px;
    b {
      display: block;
      margin: 0;
      line-height: 1.5;
    }
    > span:last-child {
      display: block;
      font-size: 12px;
      line-height: 1.7;
    }
  }
  .pt-size-card {
    min-height: 230px;
    justify-content: center;
    padding: 26px 12px 18px;
    small {
      display: block;
      font-size: 11px;
      line-height: 1.6;
      color: $color-text-muted;
    }
    > .tc-choice-dot {
      position: absolute;
      top: 14px;
      left: 14px;
    }
  }
  .pt-dropzone {
    margin-top: 16px;
    padding: 16px;
    min-height: 64px;
    background: #f8faff;
    font-size: 13px;
    &:focus-visible {
      outline: 2px solid #4065e7;
      outline-offset: 3px;
    }
  }
  .pt-dropzone-file {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .pt-settings-label {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
  }
  .pt-toggle-row {
    display: flex;
    width: 100%;
    overflow: visible;
    gap: 10px;
    border: 0;
    border-radius: 0;
  }
  .pt-toggle-opt {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    padding: 14px;
    min-width: 0;
    border: 1px solid $color-border;
    border-radius: 7px;
    text-align: left;
    white-space: normal;
    b,
    small {
      display: block;
    }
    small {
      margin-top: 5px;
      font-size: 11px;
      line-height: 1.5;
      color: $color-text-muted;
    }
    &.is-active {
      color: #3863e8;
      background: #eef3ff;
      border-color: #4065e7;
    }
  }
  .pt-hint {
    margin-top: 10px;
    font-size: 12px;
    line-height: 1.6;
  }
  .pt-color-block {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }
  .pt-color-row {
    flex: 1 1 95px;
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 8px;
    padding: 10px;
    border: 1px solid $color-border;
    border-radius: 8px;
  }
  .pt-color-clabel {
    width: auto;
    font-size: 11px;
  }
  .pt-color-picker {
    width: 100%;
    height: 30px;
  }
}
.tc-file-hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-muted;
}
.tc-optional {
  margin-left: 4px;
  font-size: 11px;
  font-weight: 400;
  color: $color-text-muted;
}
.tc-footer {
  flex-shrink: 0;
  background: #fff;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 0;
  padding: 16px 0 0;
  border-top: 1px solid $color-border;
}
.tc-choice-dot {
  flex-shrink: 0;
  display: block;
  width: 17px;
  height: 17px;
  border: 1.5px solid #98a4b9;
  border-radius: 50%;
  background: #fff;
  box-sizing: border-box;
  .is-selected &,
  .is-active & {
    border: 5px solid #4065e7;
  }
}
.tc-mode-icon {
  color: #7c8fb6;
}
.tc-document-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  width: 100%;
}
.tc-document {
  color: #8797b6;
  filter: drop-shadow(0 3px 4px #18264a0d);
  &--a4 {
    width: 67px;
    height: 95px;
  }
  &--169 {
    width: 116px;
    height: 65px;
  }
  &--43 {
    width: 100px;
    height: 75px;
  }
}
.tc-footer-preview {
  position: relative;
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fb;
  color: $color-text-muted;
  font-size: 11px;
  > div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 66px;
    padding: 16px;
    background: #fff;
    border: 1px solid $color-border;
  }
  strong {
    color: #4065e7;
    overflow-wrap: anywhere;
    padding: 5px 9px;
    border: 1px dashed #86a4ff;
    border-radius: 4px;
  }
}
.tc-preview-callout {
  position: absolute;
  right: 20px;
  top: 36px;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid #86a4ff;
  border-radius: 6px;
  background: #f7faff;
  color: #4065e7;
  line-height: 1.6;
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    right: 22px;
    width: 8px;
    height: 8px;
    background: #f7faff;
    border-right: 1px solid #86a4ff;
    border-bottom: 1px solid #86a4ff;
    transform: rotate(45deg);
  }
}
.tc-style-example {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  padding: 14px;
  border-radius: 8px;
  background: #f0f6ff;
  color: #4065e7;
  strong {
    font-size: 11px;
    color: $color-text-muted;
  }
  p {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: $color-text-primary;
  }
}
.tc-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  strong {
    margin-right: 4px;
  }
  span {
    padding: 5px 9px;
    border-radius: 6px;
    background: #f3f6fa;
    color: $color-text-muted;
  }
}
@media (max-width: 900px) {
  .tc-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 480px) {
  .tc-card {
    padding: 16px;
  }
  .tc-panel .pt-option-row {
    flex-direction: column;
  }
  .tc-panel .pt-size-card {
    padding: 12px 6px;
    min-height: 130px;
  }
  .tc-panel .pt-toggle-row {
    flex-wrap: wrap;
  }
  .tc-document {
    max-width: 100%;
  }
}
</style>
