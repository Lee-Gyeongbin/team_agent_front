<template>
  <div class="idea-file-list">
    <div class="idea-file-list-header">
      <span class="idea-file-list-count">첨부파일 {{ fileList.length }}개</span>
      <button
        v-if="removable"
        type="button"
        class="idea-file-clear"
        @click="$emit('clear')"
      >
        모두 제거
      </button>
    </div>
    <ul class="idea-file-items">
      <li
        v-for="(file, idx) in fileList"
        :key="file.ideaFileId ?? `${file.fileNm}-${file.fileSize}-${idx}`"
        class="idea-file-item"
      >
        <UiIcon
          name="file"
          size="16"
        />
        <!-- 저장된 파일은 이름을 눌러 미리보기 (읽기 전용 목록) -->
        <button
          v-if="!removable && file.ideaFileId"
          type="button"
          class="idea-file-name idea-file-download"
          :title="file.fileNm"
          @click="$emit('preview', file)"
        >
          {{ file.fileNm }}
        </button>
        <span
          v-else
          class="idea-file-name"
          :title="file.fileNm"
        >
          {{ file.fileNm }}
        </span>
        <span class="idea-file-size">{{ formatIdeaFileSize(file.fileSize) }}</span>
        <button
          v-if="removable"
          type="button"
          class="idea-file-remove"
          aria-label="제거"
          @click="$emit('remove', idx)"
        >
          <UiIcon
            name="x"
            size="14"
          />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { UiIcon } from '@leechanyong/ispark-ui'
import { formatIdeaFileSize } from '~/utils/idea/ideaRichText'
import type { IdeaFile } from '~/types/idea'

interface Props {
  fileList: IdeaFile[]
  /** 등록·수정 화면에서만 제거 버튼 표시 (상세는 읽기 전용) */
  removable?: boolean
}

withDefaults(defineProps<Props>(), {
  removable: false,
})

defineEmits<{
  remove: [index: number]
  clear: []
  preview: [file: IdeaFile]
}>()
</script>
