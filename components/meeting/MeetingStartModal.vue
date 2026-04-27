<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      @click.self="emit('close')"
    >
      <div class="meeting-start-modal">
        <div class="meeting-start-modal-header">
          <h3 class="meeting-start-modal-title">새 회의 시작</h3>
          <button
            type="button"
            class="meeting-start-modal-close"
            @click="emit('close')"
          >
            <i class="icon-close size-20" />
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
            <div class="meeting-start-modal-title-row">
              <UiInput
                ref="titleRef"
                v-model="form.meetingTitle"
                :disabled="form.isAutoTitle"
                :placeholder="form.isAutoTitle ? '회의 종료 후 AI가 제목을 생성합니다.' : '회의 제목을 입력하세요'"
              />
            </div>
          </div>

          <!-- 참석자 선택 -->
          <div class="meeting-start-modal-field">
            <label class="meeting-start-modal-label">참석자</label>
            <UiInput
              v-model="attendeeSearchKeyword"
              placeholder="참석자 이름으로 검색..."
              class="meeting-attendee-search-input"
            >
              <template #icon-right>
                <i class="icon-search size-16" />
              </template>
            </UiInput>
            <div class="meeting-attendee-list">
              <label
                v-for="user in filteredUserList"
                :key="user.createUserId"
                class="meeting-attendee-item"
                :class="{ 'is-selected': isSelected(user.createUserId) }"
              >
                <input
                  type="checkbox"
                  :value="user.createUserId"
                  :checked="isSelected(user.createUserId)"
                  @change="toggleAttendee(user)"
                />
                <span class="meeting-attendee-name">{{ user.userNm }}</span>
              </label>
              <UiEmpty
                v-if="filteredUserList.length === 0"
                title="검색 결과가 없습니다."
              />
            </div>
          </div>

          <!-- 설명 (AI 제목 생성용) -->
          <div class="meeting-start-modal-field">
            <label class="meeting-start-modal-label">회의 설명</label>
            <UiInput
              v-model="form.description"
              placeholder="AI 제목 생성 시 참고할 내용을 입력하세요 (선택)"
            />
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
import { openToast } from '~/composables/useToast'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingUser } from '~/types/meeting'

const emit = defineEmits<{
  close: []
  confirm: [params: { meetingTitle: string; attendees: string; isAutoTitle: 'Y' | 'N' }]
}>()

const { userList, handleSelectUserList } = useMeetingStore()

const titleRef = ref<{ $el: HTMLElement } | null>(null)

const form = reactive({
  meetingTitle: '',
  description: '',
  isAutoTitle: false,
})
const attendeeSearchKeyword = ref('')
const selectedAttendees = ref<MeetingUser[]>([])

const filteredUserList = computed(() => {
  const keyword = attendeeSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return userList.value
  return userList.value.filter((user) => user.userNm.toLowerCase().includes(keyword))
})

onMounted(() => {
  handleSelectUserList()
})

const isSelected = (userId: string) => selectedAttendees.value.some((u) => u.createUserId === userId)

const toggleAttendee = (user: MeetingUser) => {
  const idx = selectedAttendees.value.findIndex((u) => u.createUserId === user.createUserId)
  if (idx >= 0) {
    selectedAttendees.value.splice(idx, 1)
  } else {
    selectedAttendees.value.push(user)
  }
}

const onConfirm = () => {
  if (!form.isAutoTitle && !form.meetingTitle.trim()) {
    openToast({ message: '회의 제목을 입력해주세요.', type: 'warning' })
    titleRef.value?.$el.querySelector('input')?.focus()
    return
  }
  const attendeesJson = JSON.stringify(
    selectedAttendees.value.map((u) => ({ userId: u.createUserId, userNm: u.userNm })),
  )
  emit('confirm', {
    meetingTitle: form.isAutoTitle ? '' : form.meetingTitle,
    attendees: attendeesJson,
    isAutoTitle: form.isAutoTitle ? 'Y' : 'N',
  })
}
</script>
