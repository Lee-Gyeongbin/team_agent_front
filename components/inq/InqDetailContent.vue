<template>
  <div class="inq-pane-top">
    <div class="notice-detail-header">
      <div class="notice-detail-meta flex items-center">
        <p class="notice-detail-writer">{{ inq.crtrNm }}</p>
        <span class="notice-detail-divider">|</span>
        <p class="notice-detail-date">등록일 {{ toInqDateOnly(inq.createDt) }}</p>
      </div>
    </div>

    <div class="notice-detail-flag-group flex items-center">
      <UiBadge
        variant="default"
        size="sm"
      >
        {{ inq.catNm }}
      </UiBadge>
      <UiBadge
        :variant="getInqStatusVariant(statusFlag)"
        size="sm"
      >
        {{ inq.statusNm }}
      </UiBadge>
      <UiBadge
        v-if="inq.secretYn === 'Y'"
        variant="default"
        size="sm"
      >
        비밀글
      </UiBadge>
    </div>

    <p
      v-if="isMasked"
      class="inq-masked-note"
    >
      비밀글입니다. 작성자와 관리자 권한자만 열람할 수 있습니다.
    </p>
    <template v-else>
      <p
        v-if="inq.agentNm"
        class="inq-agent-note"
      >
        에이전트: {{ inq.agentNm }}
      </p>

      <div class="notice-detail-body">
        <!-- eslint-disable vue/no-v-html — sanitizeMyDocPreviewHtml(DOMPurify) 적용 -->
        <div
          class="inq-rich"
          v-html="contentHtml"
        />
        <!-- eslint-enable vue/no-v-html -->
      </div>

      <ul
        v-if="files.length"
        class="inq-file-list"
      >
        <li
          v-for="file in files"
          :key="file.inqFileId"
        >
          <button
            type="button"
            class="inq-file-btn"
            @click="previewFile = file"
          >
            {{ file.fileNm }}
          </button>
          <span class="inq-file-size">{{ formatFileSize(file.fileSize) }}</span>
          <button
            type="button"
            class="inq-file-download"
            title="다운로드"
            aria-label="다운로드"
            @click="$emit('download-file', file)"
          >
            <UiIcon
              name="download"
              size="16"
            />
          </button>
        </li>
      </ul>
    </template>

    <ChatAttachmentPreviewModal
      :is-open="Boolean(previewFile)"
      :file-name="previewFile?.fileNm ?? ''"
      mime-type=""
      :fetch-preview="fetchPreviewFile"
      @close="previewFile = null"
    />
  </div>
</template>

<script setup lang="ts">
import { UiBadge, UiIcon } from '@leechanyong/ispark-ui'
import ChatAttachmentPreviewModal from '~/components/chat/ChatAttachmentPreviewModal.vue'
import type { InqFile, InqFilePreviewResponse, InqItem } from '~/types/inq'
import { formatFileSize } from '~/utils/global/byteUtil'
import { getInqStatusVariant, toInqDateOnly } from '~/utils/inq/inqUtil'
import { sanitizeMyDocPreviewHtml } from '~/utils/myDocuments/myDocPreviewUtil'

const props = defineProps<{
  inq: InqItem
  files: InqFile[]
  /** 현재 문의 처리상태의 배지 구분값 — 배지 색 */
  statusFlag: string | null
  /** 비밀글이라 본문을 볼 수 없는 상태 */
  isMasked?: boolean
  /** 첨부파일 미리보기 URL 발급 — 사용자·관리자 화면의 API가 달라 부모에서 받는다 */
  fetchPreview: (inqFileId: string) => Promise<InqFilePreviewResponse>
}>()

defineEmits<{
  'download-file': [file: InqFile]
}>()

const contentHtml = computed(() => sanitizeMyDocPreviewHtml(props.inq.content))

/** 미리보기 중인 첨부파일 — 다른 문의로 바뀌면 닫는다 */
const previewFile = ref<InqFile | null>(null)
const fetchPreviewFile = () => {
  if (!previewFile.value) throw new Error('첨부파일을 찾을 수 없습니다.')
  return props.fetchPreview(previewFile.value.inqFileId)
}
watch(
  () => props.inq.inqId,
  () => {
    previewFile.value = null
  },
)
</script>
