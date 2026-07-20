<template>
  <div class="pt-panel">
    <h3 class="pt-panel-title">목차(TOC) 구성</h3>
    <p class="pt-panel-desc">
      RFP에 명시된 목차를 자동으로 불러오거나 직접 입력하세요.<br />
      Stage 1에서 추출된 <b>mandatedToc</b>를 기반으로 하며, LLM 호출 없이 즉시 반영됩니다.
    </p>

    <!-- RFP 파일 업로드 -->
    <div class="pt-section-label">RFP 파일</div>
    <div
      class="pt-dropzone"
      @click="onClickRfpDropzone"
      @dragover.prevent
      @drop.prevent="onDropRfp"
    >
      <i class="icon-attach size-18" />
      <span v-if="!rfpFile"> <b>RFP 파일</b>을 첨부하세요 (.pdf, .hwp, .hwpx, .docx) </span>
      <span
        v-else
        class="pt-dropzone-file"
      >
        <i class="icon-document size-14" />
        {{ rfpFile.name }}
        <button
          class="pt-dropzone-remove"
          @click.stop="rfpFile = null"
        >
          <i class="icon-close size-12" />
        </button>
      </span>
      <input
        ref="rfpInputRef"
        type="file"
        accept=".pdf,.hwp,.hwpx,.docx,.doc"
        style="display: none"
        @change="onRfpFileChange"
      />
    </div>
    <UiButton
      variant="primary-line"
      size="sm"
      class="pt-rfp-upload-btn"
      :loading="isUploading"
      :disabled="!rfpFile"
      @click="onUploadRfp"
    >
      <template #icon-left>
        <i class="icon-upload size-14" />
      </template>
      RFP 업로드
    </UiButton>

    <!-- 툴바 -->
    <div class="pt-toc-toolbar">
      <UiButton
        variant="primary-line"
        size="sm"
        :loading="isExtracting"
        @click="onAutoExtract"
      >
        <template #icon-left>
          <i class="icon-lightning size-14" />
        </template>
        RFP에서 목차 자동 추출
      </UiButton>
      <UiButton
        variant="ghost"
        size="sm"
        @click="onAddItem(null)"
      >
        <template #icon-left>
          <i class="icon-plus size-14" />
        </template>
        대목차 추가
      </UiButton>
    </div>

    <!-- 로딩 스켈레톤 -->
    <template v-if="isLoading">
      <div
        v-for="i in 4"
        :key="i"
        class="pt-toc-skeleton"
      />
    </template>

    <!-- 목차 리스트 (vuedraggable) -->
    <draggable
      v-else-if="tocList.length > 0"
      v-model="tocList"
      item-key="tocId"
      handle=".pt-toc-drag"
      animation="200"
      class="pt-toc-list"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <div :class="['pt-toc-item', { 'is-sub': element.parentId !== null }]">
          <span class="pt-toc-drag">
            <i class="icon-move-handle size-14" />
          </span>
          <input
            :value="element.title"
            class="pt-toc-input"
            @blur="onTitleBlur(element.tocId, ($event.target as HTMLInputElement).value)"
          />
          <span :class="['pt-toc-tag', element.source === 'rfp' ? 'is-rfp' : 'is-user']">
            {{ element.source === 'rfp' ? 'RFP 추출' : '사용자 입력' }}
          </span>
          <!-- 대목차에만 소목차 추가 버튼 노출 -->
          <button
            v-if="element.parentId === null"
            class="pt-toc-add-child"
            title="소목차 추가"
            @click="onAddItem(element.tocId)"
          >
            <i class="icon-plus size-12" />
          </button>
          <button
            class="pt-toc-del"
            @click="onDeleteItem(element.tocId)"
          >
            <i class="icon-close size-12" />
          </button>
        </div>
      </template>
    </draggable>

    <UiEmpty
      v-else-if="!isLoading && !isExtracting"
      title="목차가 없습니다. RFP 자동 추출 또는 직접 추가하세요."
    />

    <p class="pt-hint">
      드래그( <i class="icon-move-handle size-12" /> )로 순서를 바꾸거나, 제목을 클릭해 직접 수정하세요.
    </p>

    <div class="pt-panel-actions">
      <UiButton
        variant="primary"
        size="md"
        :disabled="tocList.length === 0"
        @click="emit('next')"
      >
        다음 · 설정 입력
        <template #icon-right>
          <i class="icon-arrow-right size-14" />
        </template>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { openToast } from '~/composables/useToast'
import { useProposalToc } from '~/composables/proposal/useProposalToc'
import { useProposalFileStore } from '~/composables/proposal/useProposalFileStore'

interface Props {
  ptProjectId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  next: []
}>()

const ptProjectIdRef = computed(() => props.ptProjectId)

const { handleUploadPtFile } = useProposalFileStore()

// ── RFP 파일 업로드 ────────────────────────────────────────────────────────────
const rfpInputRef = ref<HTMLInputElement | null>(null)
const rfpFile = ref<File | null>(null)
const isUploading = ref(false)

const onClickRfpDropzone = () => rfpInputRef.value?.click()
const onRfpFileChange = (e: Event) => {
  rfpFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}
const onDropRfp = (e: DragEvent) => {
  rfpFile.value = e.dataTransfer?.files?.[0] ?? null
}
const onUploadRfp = async () => {
  if (!rfpFile.value) return
  isUploading.value = true
  try {
    const res = await handleUploadPtFile(rfpFile.value, '001', props.ptProjectId)
    if (!res || res.result !== 'OK') {
      openToast({ message: 'RFP 파일 업로드에 실패했습니다.', type: 'error' })
      return
    }
    openToast({ message: 'RFP 파일이 업로드되었습니다.' })
  } catch {
    openToast({ message: '업로드 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isUploading.value = false
  }
}
// ──────────────────────────────────────────────────────────────────────────────

const {
  tocList,
  isLoading,
  isExtracting,
  handleSelectTocList,
  handleAutoExtractToc,
  handleAddTocItem,
  handleUpdateTocTitle,
  handleDeleteTocItem,
  handleReorderToc,
} = useProposalToc(ptProjectIdRef)

onMounted(() => {
  handleSelectTocList()
})

const onAutoExtract = async () => {
  const msg = await handleAutoExtractToc()
  if (msg) {
    openToast({ message: msg, type: 'warning' })
  }
}

const onAddItem = async (parentId: string | null) => {
  await handleAddTocItem(parentId)
}

const onTitleBlur = async (tocId: string, title: string) => {
  await handleUpdateTocTitle(tocId, title)
}

const onDeleteItem = async (tocId: string) => {
  await handleDeleteTocItem(tocId)
}

const onDragEnd = async () => {
  await handleReorderToc()
}
</script>
