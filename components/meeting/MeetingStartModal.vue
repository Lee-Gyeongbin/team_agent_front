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

          <!-- 참석자 선택 (조직 트리 + 소속 사용자) -->
          <div class="meeting-start-modal-field">
            <div class="meeting-start-modal-label-row">
              <label class="meeting-start-modal-label">참석자</label>
              <span
                v-if="selectedAttendees.length"
                class="meeting-attendee-selected"
              >
                {{ selectedAttendees.length }}명 선택
              </span>
            </div>
            <UiInput
              v-model="searchKeyword"
              placeholder="조직/참석자 이름으로 검색..."
              class="meeting-attendee-search-input"
            >
              <template #icon-right>
                <i class="icon-search size-16" />
              </template>
            </UiInput>
            <div class="meeting-attendee-list">
              <UiLoading
                v-if="isAttendeeTreeLoading"
                overlay
                text="조직도를 불러오는 중..."
              />
              <div
                v-else-if="attendeeTreeErrorMessage"
                class="meeting-attendee-state"
              >
                <p class="meeting-attendee-state__error">{{ attendeeTreeErrorMessage }}</p>
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="handleLoadAttendeeTree"
                >
                  다시 시도
                </UiButton>
              </div>
              <UiEmpty
                v-else-if="!filteredAttendeeTree.length"
                :title="searchKeyword.trim() ? '검색 결과가 없습니다.' : '등록된 조직이 없습니다.'"
              />
              <ul
                v-else
                class="meeting-attendee-tree-root"
                role="tree"
              >
                <MeetingAttendeeTreeNode
                  v-for="node in filteredAttendeeTree"
                  :key="node.orgId"
                  :node="node"
                  :depth="0"
                  :selected-user-ids="selectedUserIds"
                  @toggle-expand="handleToggleAttendeeOrgExpand"
                  @toggle-org="onToggleOrg"
                  @toggle-user="onToggleUser"
                />
              </ul>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { UiButton, UiEmpty, UiInput, UiLoading } from '@leechanyong/ispark-ui'
import { openToast } from '~/composables/useToast'
import { collectAttendeeUsers, useMeetingAttendeeTree } from '~/composables/meeting/useMeetingAttendeeTree'
import MeetingAttendeeTreeNode from '~/components/meeting/MeetingAttendeeTreeNode.vue'
import type { MeetingAttendeeOrgNode, MeetingAttendeeUserItem, MeetingUser } from '~/types/meeting'

const emit = defineEmits<{
  close: []
  confirm: [params: { meetingTitle: string; attendees: string; isAutoTitle: 'Y' | 'N'; showSpeakerYn: 'Y' | 'N' }]
}>()

const {
  filteredAttendeeTree,
  isAttendeeTreeLoading,
  attendeeTreeErrorMessage,
  searchKeyword,
  handleLoadAttendeeTree,
  handleToggleAttendeeOrgExpand,
} = useMeetingAttendeeTree()

const titleRef = ref<{ $el: HTMLElement } | null>(null)

const form = reactive({
  meetingTitle: '',
  description: '',
  isAutoTitle: false,
  showSpeaker: true, // 발언자 표시 여부 (기본: 표시)
})
const selectedAttendees = ref<MeetingUser[]>([])

const selectedUserIds = computed(() => selectedAttendees.value.map((user) => user.createUserId))

onMounted(() => {
  void handleLoadAttendeeTree()
})

const isSelected = (userId: string): boolean => selectedAttendees.value.some((user) => user.createUserId === userId)

const toMeetingUser = (user: MeetingAttendeeUserItem): MeetingUser => ({
  createUserId: user.userId,
  userNm: user.userNm,
})

const onToggleUser = (user: MeetingAttendeeUserItem): void => {
  const idx = selectedAttendees.value.findIndex((item) => item.createUserId === user.userId)
  if (idx >= 0) {
    selectedAttendees.value.splice(idx, 1)
    return
  }
  selectedAttendees.value.push(toMeetingUser(user))
}

const onToggleOrg = (node: MeetingAttendeeOrgNode): void => {
  const users = collectAttendeeUsers(node)
  if (!users.length) return

  const allSelected = users.every((user) => isSelected(user.userId))
  if (allSelected) {
    const removeIds = new Set(users.map((user) => user.userId))
    selectedAttendees.value = selectedAttendees.value.filter((item) => !removeIds.has(item.createUserId))
    return
  }

  const next = [...selectedAttendees.value]
  for (const user of users) {
    if (next.some((item) => item.createUserId === user.userId)) continue
    next.push(toMeetingUser(user))
  }
  selectedAttendees.value = next
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
    showSpeakerYn: form.showSpeaker ? 'Y' : 'N',
  })
}
</script>
