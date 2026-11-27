<template>
  <Teleport to="body">
    <div class="modal-overlay">
      <div class="meeting-start-modal">
        <div class="meeting-start-modal-header">
          <h3 class="meeting-start-modal-title">새 회의 시작</h3>
          <button
            type="button"
            class="meeting-start-modal-close"
            aria-label="닫기"
            @click="emit('close')"
          >
            <UiIcon
              name="x"
              size="20"
            />
          </button>
        </div>

        <div class="meeting-start-modal-body">
          <!-- 회의 제목 -->
          <div class="meeting-start-modal-field">
            <div class="meeting-start-modal-label-row">
              <label class="meeting-start-modal-label">
                회의 제목
                <span
                  v-if="!form.isAutoTitle"
                  class="required"
                >
                  *
                </span>
              </label>
              <label class="meeting-start-modal-ai-check">
                <input
                  v-model="form.isAutoTitle"
                  type="checkbox"
                />
                <span>AI 제목 생성</span>
              </label>
            </div>
            <UiInput
              ref="titleRef"
              v-model="form.meetingTitle"
              :disabled="form.isAutoTitle"
              :placeholder="form.isAutoTitle ? '회의 종료 후 AI가 제목을 생성합니다.' : '회의 제목을 입력하세요'"
            />
          </div>

          <!-- 참석자 (공통 사용자 조회 — 전체 직원 검색, 하위 조직 직원 포함) -->
          <div class="meeting-start-modal-field">
            <div class="meeting-start-modal-label-row">
              <label class="meeting-start-modal-label">참석자</label>
            </div>
            <OrgUserPicker
              v-model="selectedAttendees"
              class="meeting-attendee-picker"
              search-scope="all"
              include-sub-org
              selected-title="선택된 참석자"
              selected-empty-title="직원목록에서 참석자를 선택하세요."
              search-placeholder="사용자명으로 검색 (Enter)"
            />
            <p class="meeting-attendee-hint">참석자를 지정하면 회의 시작 전 음성 등록 단계로 이동합니다.</p>
          </div>

          <!-- 설명 (AI 제목 생성용) -->
          <div class="meeting-start-modal-field">
            <label class="meeting-start-modal-label">회의 설명</label>
            <UiInput
              v-model="form.description"
              placeholder="AI 제목 생성 시 참고할 내용을 입력하세요 (선택)"
            />
          </div>

          <!-- 발언자 표시 옵션 -->
          <div class="meeting-start-modal-field">
            <label class="meeting-start-modal-ai-check">
              <input
                v-model="form.showSpeaker"
                type="checkbox"
              />
              <span>결정사항에 핵심 발언자 표시</span>
            </label>
          </div>
        </div>

        <div class="meeting-start-modal-footer">
          <button
            type="button"
            class="btn btn-ghost"
            @click="emit('close')"
          >
            취소
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="onConfirm"
          >
            회의 시작
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { UiIcon, UiInput } from '@leechanyong/ispark-ui'
import { openToast } from '~/composables/useToast'
import OrgUserPicker from '~/components/common/OrgUserPicker.vue'
import type { OrgUserPickerUser } from '~/types/org-manage'

const emit = defineEmits<{
  close: []
  confirm: [params: { meetingTitle: string; attendees: string; isAutoTitle: 'Y' | 'N'; showSpeakerYn: 'Y' | 'N' }]
}>()

const titleRef = ref<{ $el: HTMLElement } | null>(null)

const form = reactive({
  meetingTitle: '',
  description: '',
  isAutoTitle: false,
  showSpeaker: true, // 발언자 표시 여부 (기본: 표시)
})
const selectedAttendees = ref<OrgUserPickerUser[]>([])

const onConfirm = () => {
  if (!form.isAutoTitle && !form.meetingTitle.trim()) {
    openToast({ message: '회의 제목을 입력해주세요.', type: 'warning' })
    titleRef.value?.$el.querySelector('input')?.focus()
    return
  }
  const attendeesJson = JSON.stringify(selectedAttendees.value.map((u) => ({ userId: u.userId, userNm: u.userNm })))
  emit('confirm', {
    meetingTitle: form.isAutoTitle ? '' : form.meetingTitle,
    attendees: attendeesJson,
    isAutoTitle: form.isAutoTitle ? 'Y' : 'N',
    showSpeakerYn: form.showSpeaker ? 'Y' : 'N',
  })
}
</script>
