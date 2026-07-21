<template>
  <div class="pt-panel">
    <h3 class="pt-panel-title">템플릿 설정</h3>
    <p class="pt-panel-desc">제안서에 적용할 헤더/푸터 템플릿과 문서 사이즈를 지정하세요.</p>

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

    <div class="pt-panel-actions">
      <UiButton
        variant="primary"
        size="md"
        :loading="isSaving"
        @click="onClickNext"
      >
        다음 · 목차 구성
        <template #icon-right>
          <i class="icon-arrow-right size-14" />
        </template>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { useProposalFileStore } from '~/composables/proposal/useProposalFileStore'
import { openToast } from '~/composables/useToast'

interface Props {
  ptProjectId: string
  projectConfigJson?: string // [id].vue에서 내려오는 PROJECT_CONFIG_JSON raw string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  next: []
}>()

const { fetchUpdateProjectTemplate, fetchSelectPtRfpFile } = useProposalApi()
const { handleUploadPtFile } = useProposalFileStore()

const SIZE_OPTIONS = [
  { value: 'a4' as const, cssKey: 'a4', label: 'A4', sub: '제안서(서면)' },
  { value: '169' as const, cssKey: '169', label: '16:9 와이드', sub: '발표 장표' },
  { value: '43' as const, cssKey: '43', label: '4:3', sub: '발표 장표' },
]

const templateMode = ref<'fix' | 'new'>('fix')
const documentSize = ref<'a4' | '169' | '43'>('a4')
const attachedFile = ref<File | null>(null)
const savedTemplateFileNm = ref<string | null>(null) // DB에 이미 저장된 템플릿 파일명
const fileInputRef = ref<HTMLInputElement | null>(null)
const isSaving = ref(false)

// projectConfigJson이 내려오면 template.mode / template.docSize 복원
watch(
  () => props.projectConfigJson,
  (raw) => {
    if (!raw) return
    try {
      const config = JSON.parse(raw)
      const tpl = config?.template
      if (tpl?.mode === 'fix' || tpl?.mode === 'new') templateMode.value = tpl.mode
      if (tpl?.docSize === 'a4' || tpl?.docSize === '169' || tpl?.docSize === '43') {
        documentSize.value = tpl.docSize
      }
    } catch {
      /* 파싱 실패 시 기본값 유지 */
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const res = await fetchSelectPtRfpFile(props.ptProjectId, '003')
  if (res?.result === 'OK' && res.data?.fileName) {
    savedTemplateFileNm.value = res.data.fileName
  }
})

const onClickDropzone = () => fileInputRef.value?.click()
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  attachedFile.value = input.files?.[0] ?? null
}
const onDrop = (e: DragEvent) => {
  attachedFile.value = e.dataTransfer?.files?.[0] ?? null
}

const onClickNext = async () => {
  // fix 모드에서 파일 미첨부 + 저장된 파일도 없으면 차단
  if (templateMode.value === 'fix' && !attachedFile.value && !savedTemplateFileNm.value) {
    openToast({ message: '보완 모드에서는 템플릿 파일(.pptx, .docx)을 첨부해주세요.', type: 'warning' })
    return
  }

  isSaving.value = true
  try {
    // 파일이 있으면 먼저 업로드 → ptFileId 취득
    let templateFileId: string | undefined
    if (attachedFile.value) {
      const uploadingName = attachedFile.value.name
      const uploadRes = await handleUploadPtFile(attachedFile.value, '003', props.ptProjectId)
      if (!uploadRes || uploadRes.result !== 'OK') {
        openToast({ message: '템플릿 파일 업로드에 실패했습니다.', type: 'error' })
        return
      }
      templateFileId = uploadRes.ptFileId
      savedTemplateFileNm.value = uploadRes.fileNm || uploadingName
      attachedFile.value = null
    }

    // 템플릿 설정 저장
    const res = await fetchUpdateProjectTemplate({
      ptProjectId: props.ptProjectId,
      mode: templateMode.value,
      templateFileId,
      docSize: documentSize.value,
    })

    if (res.result !== 'OK') {
      openToast({ message: res.msg ?? '템플릿 설정 저장에 실패했습니다.', type: 'error' })
      return
    }

    emit('next')
  } catch {
    openToast({ message: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.', type: 'error' })
  } finally {
    isSaving.value = false
  }
}
</script>
