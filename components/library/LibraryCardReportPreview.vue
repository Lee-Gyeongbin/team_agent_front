<template>
  <div
    v-if="hasPreviewHtml"
    class="library-card-report-preview"
    aria-label="생성 보고서 미리보기"
  >
    <div class="library-card-report-preview-frame">
      <div class="library-card-report-preview-head">
        <div class="library-card-report-preview-head-row">
          <span class="library-card-report-preview-icon-wrap">
            <i class="icon icon-dropdown-document size-16" />
          </span>
          <div class="library-card-report-preview-head-text">
            <h3 class="library-card-report-preview-title">생성 보고서</h3>
            <p class="library-card-report-preview-desc">AI가 생성한 문서 형식의 보고서입니다</p>
          </div>
        </div>
      </div>

      <div class="library-card-report-preview-body">
        <!-- eslint-disable-next-line vue/no-v-html — sanitizeMyDocPreviewHtml(DOMPurify) 적용 -->
        <div
          class="library-card-report-preview-content library-report-editor-body"
          v-html="sanitizedHtml"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sanitizeMyDocPreviewHtml } from '~/utils/myDocuments/myDocPreviewUtil'

interface Props {
  reportHtml?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  reportHtml: '',
})

const sanitizedHtml = computed(() => sanitizeMyDocPreviewHtml(props.reportHtml))
const hasPreviewHtml = computed(() => !!sanitizedHtml.value)
</script>
