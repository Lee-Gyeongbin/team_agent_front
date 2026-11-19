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
        <UiMarkdownEditor
          :model-value="inq.content ?? ''"
          :editable="false"
        />
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
            @click="$emit('download-file', file)"
          >
            {{ file.fileNm }}
          </button>
          <span class="inq-file-size">{{ formatFileSize(file.fileSize) }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { UiBadge, UiMarkdownEditor } from '@leechanyong/ispark-ui'
import type { InqFile, InqItem } from '~/types/inq'
import { formatFileSize } from '~/utils/global/byteUtil'
import { getInqStatusVariant, toInqDateOnly } from '~/utils/inq/inqUtil'

defineProps<{
  inq: InqItem
  files: InqFile[]
  /** 현재 문의 처리상태의 배지 구분값 — 배지 색 */
  statusFlag: string | null
  /** 비밀글이라 본문을 볼 수 없는 상태 */
  isMasked?: boolean
}>()

defineEmits<{
  'download-file': [file: InqFile]
}>()
</script>
