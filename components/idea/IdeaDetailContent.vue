<template>
  <!-- 사용자 아이디어 내역 — 사용자 상세·관리자 상세 공통 (부모 flex 안에 바로 배치되도록 다중 루트) -->
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
    <UiBadge
      :variant="getIdeaStatusVariant(idea.statusNm)"
      size="sm"
    >
      {{ idea.statusNm }}
    </UiBadge>
  </div>

  <div class="notice-detail-body">
    <!-- v-html: toIdeaContentHtml에서 DOMPurify로 정제한 값만 사용 -->
    <div
      class="notice-content-box idea-rich"
      v-html="toIdeaContentHtml(idea.content)"
    />
  </div>

  <IdeaFileList
    v-if="idea.fileList.length"
    class="idea-file-list-ro"
    :file-list="idea.fileList"
    @download="(file) => $emit('download', file)"
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
import { getIdeaStatusVariant } from '~/types/idea'
import type { IdeaDetail, IdeaFile } from '~/types/idea'
import { toIdeaContentHtml } from '~/utils/idea/ideaRichText'

interface Props {
  idea: IdeaDetail
}

defineProps<Props>()

defineEmits<{
  like: []
  download: [file: IdeaFile]
}>()
</script>
