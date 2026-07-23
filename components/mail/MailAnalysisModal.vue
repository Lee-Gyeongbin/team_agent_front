<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    :show-close="true"
    :show-overlay="true"
    max-width="560px"
    @close="emit('close')"
  >
    <template #header>
      <div class="mail-draft-modal-header">
        <h2 class="mail-detail-modal-title">AI 분석 결과</h2>
        <button
          class="btn btn-modal-close"
          @click="emit('close')"
        >
          <i class="icon icon-close-gray size-20" />
        </button>
      </div>
    </template>

    <UiEmpty
      v-if="!mail"
      title="메일을 선택해주세요"
    />

    <template v-else>
      <div class="mail-analysis-modal-body">
        <!-- AI 요약 -->
        <div class="mail-analysis-summary">{{ mail.summary || 'AI 분석 결과가 없습니다.' }}</div>

        <!-- 분석 태그 그리드 -->
        <div class="mail-analysis-tags">
          <div class="mail-analysis-tag-row">
            <span class="mail-analysis-tag-label">메일 목적</span>
            <span :class="['mail-tag', getMailCategoryTagClass(mail.mailPurposeCd, purposeOptions, 0)]">{{
              mail.mailPurposeNm
            }}</span>
          </div>
          <div class="mail-analysis-tag-row">
            <span class="mail-analysis-tag-label">필요 조치</span>
            <span :class="['mail-tag', getMailCategoryTagClass(mail.actionRequiredCd, actionOptions, 2)]">{{
              mail.actionRequiredNm
            }}</span>
          </div>
          <div class="mail-analysis-tag-row">
            <span class="mail-analysis-tag-label">긴급도</span>
            <span :class="['mail-tag', getMailUrgencyTagClass(mail.urgencyCd)]">{{ mail.urgencyNm }}</span>
          </div>
          <div class="mail-analysis-tag-row">
            <span class="mail-analysis-tag-label">중요도</span>
            <span class="mail-analysis-tag-value">{{ mail.importanceNm }}</span>
          </div>
          <div class="mail-analysis-tag-row">
            <span class="mail-analysis-tag-label">업무 영역</span>
            <span class="mail-analysis-tag-value">{{ mail.workCategoryNm || '-' }}</span>
          </div>
          <div class="mail-analysis-tag-row">
            <span class="mail-analysis-tag-label">기한</span>
            <span
              class="mail-analysis-tag-value"
              :style="isToday(mail.dueDt) ? 'color: #E5484D; font-weight: 700' : ''"
            >
              {{ mail.dueDt ? formatDate(mail.dueDt) : '기한 없음' }}
            </span>
          </div>
          <div class="mail-analysis-tag-row">
            <span class="mail-analysis-tag-label">조치 완료</span>
            <button
              class="btn btn-sm"
              :class="mail.actionCompleteYn === 'Y' ? 'btn-primary' : 'btn-outline'"
              @click="emit('toggle-complete', mail.mailId, mail.actionCompleteYn)"
            >
              {{ mail.actionCompleteYn === 'Y' ? '완료' : '미완료' }}
            </button>
          </div>
        </div>

        <!-- 회신 초안 버튼 -->
        <div class="mail-analysis-modal-footer">
          <UiButton
            variant="primary"
            size="lg"
            full-width
            @click="emit('reply-draft')"
          >
            <template #icon-left>
              <i class="icon-edit size-16" />
            </template>
            회신 초안 작성
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { ClassifiedMail } from '~/types/mail'
import { useMailStore } from '~/composables/mail/useMailStore'
import { getMailCategoryTagClass, getMailUrgencyTagClass } from '~/utils/mail/mailTagUtil'

defineProps<{
  isOpen: boolean
  mail: ClassifiedMail | null
}>()

const { purposeOptions, actionOptions } = useMailStore()

const emit = defineEmits<{
  close: []
  'reply-draft': []
  'toggle-complete': [mailId: string, currentYn: string]
}>()

const isToday = (dateStr: string | number | null) => {
  if (dateStr === null || dateStr === undefined || dateStr === '') return false
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false
  return d.toDateString() === new Date().toDateString()
}

const formatDate = (dateStr: string | number) => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '기한 없음'
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
