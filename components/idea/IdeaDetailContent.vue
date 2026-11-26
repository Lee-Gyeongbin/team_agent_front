<template>
  <div class="notice-detail-header">
    <div class="notice-detail-meta flex items-center">
      <p class="notice-detail-writer">{{ idea.createNm }}</p>
      <span class="notice-detail-divider">|</span>
      <p class="notice-detail-date">등록일 {{ idea.createDt }}</p>
    </div>
  </div>

  <p
    v-if="idea.agentNm"
    class="idea-detail-agent"
  >
    에이전트: {{ idea.agentNm }}
  </p>

  <div class="notice-detail-flag-group flex items-center">
    <UiBadge
      variant="default"
      size="sm"
    >
      {{ idea.ideaTypeNm }}
    </UiBadge>
  </div>

  <div class="notice-detail-body">
    <!-- eslint-disable vue/no-v-html — sanitizeMyDocPreviewHtml(DOMPurify) 적용 -->
    <div
      class="notice-content-box inq-rich"
      v-html="contentHtml"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>

  <IdeaFileList
    v-if="idea.fileList.length"
    class="idea-file-list-ro"
    :file-list="idea.fileList"
    @preview="openPreview"
  />

  <ChatAttachmentPreviewModal
    :is-open="Boolean(previewFile)"
    :file-name="previewFile?.fileNm ?? ''"
    mime-type=""
    :fetch-preview="fetchPreview"
    @close="previewFile = null"
  />

  <div class="idea-like-grp">
    <UiButton
      :variant="idea.likedYn === 'Y' ? 'primary' : 'outline'"
      size="sm"
      :aria-pressed="idea.likedYn === 'Y'"
      @click="$emit('like')"
    >
      <template #icon-left>
        <UiIcon
          name="thumbs-up"
          size="16"
        />
      </template>
      추천 {{ idea.likeCnt }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { UiBadge, UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { useIdeaApi } from '~/composables/idea/useIdeaApi'
import type { IdeaDetail, IdeaFile } from '~/types/idea'
import { sanitizeMyDocPreviewHtml } from '~/utils/myDocuments/myDocPreviewUtil'

interface Props {
  idea: IdeaDetail
}

const props = defineProps<Props>()
/** 서버는 받은 HTML을 그대로 저장하므로 출력 직전에 DOMPurify로 거른다 */
const contentHtml = computed(() => sanitizeMyDocPreviewHtml(props.idea.content))
const { fetchIdeaFilePreview } = useIdeaApi()
const previewFile = ref<IdeaFile | null>(null)

const openPreview = (file: IdeaFile) => {
  previewFile.value = file
}
const fetchPreview = () => {
  const id = previewFile.value?.ideaFileId
  if (!id) throw new Error('첨부파일을 찾을 수 없습니다.')
  return fetchIdeaFilePreview(id)
}
watch(() => props.idea.ideaId, () => { previewFile.value = null })

defineEmits<{
  like: []
}>()
</script>
