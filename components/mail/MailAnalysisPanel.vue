<template>
  <div
    class="mail-analysis-panel"
    :class="{ 'is-collapsed': collapsed }"
  >
    <div
      class="mail-analysis-head"
      :class="{ 'is-clickable': collapsed }"
      @click="onHeadClick"
    >
      <h3>
        <span class="mail-analysis-dot" />
        AI 분석 결과
      </h3>
      <button
        type="button"
        class="mail-chat-expand-btn"
        :aria-label="collapsed ? 'AI 분석 패널 펼치기' : 'AI 분석 패널 접기'"
        @click.stop="emit('toggle-analysis')"
      >
        <i
          class="icon-arrow-down size-16"
          :class="{ 'is-up': !collapsed }"
        />
      </button>
    </div>
    <div
      v-show="!collapsed"
      class="mail-analysis-body"
    >
      <!-- 로딩 -->
      <template v-if="isLoading">
        <div class="mail-briefing-skeleton">
          <span
            v-for="i in 5"
            :key="i"
            class="mail-skeleton mail-skeleton-line"
            :style="{ width: i % 2 === 0 ? '75%' : '100%' }"
          />
        </div>
      </template>

      <!-- 미선택 -->
      <div
        v-else-if="!mail"
        class="mail-analysis-empty"
      >
        좌측 목록에서 메일을 선택하면<br />AI 분석 결과가 표시됩니다.
      </div>

      <!-- 분석 결과 -->
      <template v-else>
        <div class="mail-analysis-summary">{{ mail.summary || 'AI 분석 결과가 없습니다.' }}</div>
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
        <div class="mail-analysis-actions">
          <UiButton
            variant="outline"
            size="lg"
            full-width
            @click="openDetailModal"
          >
            <template #icon-left>
              <i class="icon-view size-16" />
            </template>
            메일 상세 보기
          </UiButton>
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
      </template>
    </div>
  </div>

  <MailDetailModal
    v-if="mail"
    :is-open="isDetailModalOpen"
    :subject="mail.subject"
    sender-label="발신자"
    :sender-name="mail.fromName || mail.fromAddr"
    :sender-email="parseSenderEmail(mail.fromAddr)"
    date-label="수신일"
    :date="toModalDate(mail.mailDt)"
    :body="mail.bodyText"
    @close="closeDetailModal"
  />
</template>

<script setup lang="ts">
import type { ClassifiedMail } from '~/types/mail'
import { useMailStore } from '~/composables/mail/useMailStore'
import { getMailCategoryTagClass, getMailUrgencyTagClass } from '~/utils/mail/mailTagUtil'

const props = defineProps<{
  mail: ClassifiedMail | null
  isLoading: boolean
  collapsed?: boolean
}>()

const { purposeOptions, actionOptions } = useMailStore()

const emit = defineEmits<{
  'reply-draft': []
  'toggle-complete': [mailId: string, currentYn: string]
  'toggle-analysis': []
  expand: []
}>()

const onHeadClick = () => {
  if (props.collapsed) {
    emit('expand')
  }
}

const isDetailModalOpen = ref(false)

const openDetailModal = () => {
  isDetailModalOpen.value = true
}

const closeDetailModal = () => {
  isDetailModalOpen.value = false
}

const parseSenderEmail = (fromAddr: string) => {
  const match = fromAddr.match(/<([^>]+)>/)
  if (match) return match[1]
  return fromAddr.includes('@') ? fromAddr : ''
}

const toModalDate = (value: string | number | null) => {
  if (value === null || value === undefined || value === '') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

// ─── 날짜 헬퍼 ────────────────────────────────────────────
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
