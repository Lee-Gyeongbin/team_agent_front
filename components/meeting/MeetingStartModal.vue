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

          <!-- 참석자 (인사조직 → 직원목록 → 선택된 참석자) -->
          <div class="meeting-start-modal-field">
            <div class="meeting-start-modal-label-row">
              <label class="meeting-start-modal-label">참석자</label>
            </div>
            <div class="meeting-attendee-search">
              <UiInput
                v-model="searchInput"
                class="meeting-attendee-search-input"
                placeholder="사용자명으로 검색 (Enter)"
                @enter="onSearchAttendee"
              />
              <UiButton
                variant="outline"
                size="lg"
                @click="onSearchAttendee"
              >
                <template #icon-left>
                  <UiIcon
                    name="search"
                    size="16"
                  />
                </template>
                검색
              </UiButton>
            </div>

            <div class="meeting-attendee-panels">
              <!-- 인사조직 -->
              <div class="meeting-attendee-panel">
                <div class="meeting-attendee-panel-header">
                  <span class="meeting-attendee-panel-title">인사조직</span>
                  <span class="meeting-attendee-panel-actions">
                    <button
                      type="button"
                      aria-label="모두 접기"
                      title="모두 접기"
                      @click="handleSetAllAttendeeOrgExpanded(false)"
                    >
                      <UiIcon
                        name="chevrons-down-up"
                        size="14"
                      />
                    </button>
                    <button
                      type="button"
                      aria-label="모두 펼치기"
                      title="모두 펼치기"
                      @click="handleSetAllAttendeeOrgExpanded(true)"
                    >
                      <UiIcon
                        name="chevrons-up-down"
                        size="14"
                      />
                    </button>
                  </span>
                </div>
                <div class="meeting-attendee-panel-body">
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
                      @click="onReloadAttendeeTree"
                    >
                      다시 시도
                    </UiButton>
                  </div>
                  <UiEmpty
                    v-else-if="!attendeeTree.length"
                    title="등록된 조직이 없습니다."
                  />
                  <ul
                    v-else
                    class="meeting-attendee-tree-root"
                    role="tree"
                  >
                    <MeetingAttendeeTreeNode
                      v-for="node in attendeeTree"
                      :key="node.orgId"
                      :node="node"
                      :depth="0"
                      :active-org-id="appliedKeyword ? null : activeOrgId"
                      @toggle-expand="handleToggleAttendeeOrgExpand"
                      @select-org="onSelectOrg"
                    />
                  </ul>
                </div>
              </div>

              <!-- 직원목록 -->
              <div class="meeting-attendee-panel">
                <div class="meeting-attendee-panel-header">
                  <span class="meeting-attendee-panel-title">
                    {{ appliedKeyword ? `검색 결과 (${visibleUsers.length})` : '직원목록' }}
                  </span>
                </div>
                <div class="meeting-attendee-panel-body">
                  <UiEmpty
                    v-if="!visibleUsers.length && !isAttendeeTreeLoading"
                    :title="appliedKeyword ? '검색 결과가 없습니다.' : '소속 직원이 없습니다.'"
                  />
                  <ul
                    v-else
                    class="meeting-attendee-user-list"
                    role="listbox"
                    aria-multiselectable="true"
                  >
                    <li
                      v-for="user in visibleUsers"
                      :key="user.userId"
                      class="meeting-attendee-user-item"
                      :class="{ 'is-selected': isSelected(user.userId) }"
                      role="option"
                      tabindex="0"
                      :aria-selected="isSelected(user.userId)"
                      @click="onToggleUser(user)"
                      @keydown.enter.prevent="onToggleUser(user)"
                      @keydown.space.prevent="onToggleUser(user)"
                    >
                      <span class="meeting-attendee-user-name">{{ user.userNm }}</span>
                      <UiIcon
                        v-if="isSelected(user.userId)"
                        name="check"
                        size="14"
                      />
                    </li>
                  </ul>
                </div>
              </div>

              <!-- 선택된 참석자 -->
              <div class="meeting-attendee-panel">
                <div class="meeting-attendee-panel-header">
                  <span class="meeting-attendee-panel-title">선택된 참석자</span>
                  <span class="meeting-attendee-panel-count">{{ selectedAttendees.length }}명</span>
                </div>
                <div class="meeting-attendee-panel-body">
                  <UiEmpty
                    v-if="!selectedAttendees.length"
                    title="직원목록에서 참석자를 선택하세요."
                  />
                  <ul
                    v-else
                    class="meeting-attendee-selected-list"
                  >
                    <li
                      v-for="user in selectedAttendees"
                      :key="user.createUserId"
                      class="meeting-attendee-selected-item"
                    >
                      <span class="meeting-attendee-user-name">{{ user.userNm }}</span>
                      <button
                        type="button"
                        :aria-label="`${user.userNm} 제외`"
                        @click="onRemoveAttendee(user.createUserId)"
                      >
                        <UiIcon
                          name="x"
                          size="14"
                        />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { UiButton, UiEmpty, UiIcon, UiInput, UiLoading } from '@leechanyong/ispark-ui'
import { openToast } from '~/composables/useToast'
import {
  collectAttendeeUsers,
  findAttendeeOrgNode,
  useMeetingAttendeeTree,
} from '~/composables/meeting/useMeetingAttendeeTree'
import MeetingAttendeeTreeNode from '~/components/meeting/MeetingAttendeeTreeNode.vue'
import type { MeetingAttendeeUserItem, MeetingUser } from '~/types/meeting'

const emit = defineEmits<{
  close: []
  confirm: [params: { meetingTitle: string; attendees: string; isAutoTitle: 'Y' | 'N'; showSpeakerYn: 'Y' | 'N' }]
}>()

const {
  attendeeTree,
  allAttendeeUsers,
  isAttendeeTreeLoading,
  attendeeTreeErrorMessage,
  handleLoadAttendeeTree,
  handleToggleAttendeeOrgExpand,
  handleSetAllAttendeeOrgExpanded,
} = useMeetingAttendeeTree()

const titleRef = ref<{ $el: HTMLElement } | null>(null)

const form = reactive({
  meetingTitle: '',
  description: '',
  isAutoTitle: false,
  showSpeaker: true, // 발언자 표시 여부 (기본: 표시)
})
const selectedAttendees = ref<MeetingUser[]>([])

/** 인사조직에서 선택된 조직 */
const activeOrgId = ref<string | null>(null)
/** 검색창 입력값 */
const searchInput = ref('')
/** 검색 버튼/Enter 로 확정된 검색어 — 있으면 직원목록이 전체 조직 대상 검색 결과로 바뀜 */
const appliedKeyword = ref('')

/** 직원목록: 검색 중이면 전체 직원 중 이름 일치, 아니면 선택 조직(하위 조직 포함) 소속 직원 */
const visibleUsers = computed<MeetingAttendeeUserItem[]>(() => {
  const keyword = appliedKeyword.value.toLowerCase()
  if (keyword) {
    return allAttendeeUsers.value.filter((user) => user.userNm.toLowerCase().includes(keyword))
  }
  if (!activeOrgId.value) return []
  const node = findAttendeeOrgNode(attendeeTree.value, activeOrgId.value)
  return node ? collectAttendeeUsers(node) : []
})

/** 조직도 로드 후 첫 최상위 조직을 기본 선택 */
const onReloadAttendeeTree = async (): Promise<void> => {
  await handleLoadAttendeeTree()
  activeOrgId.value = attendeeTree.value[0]?.orgId ?? null
}

onMounted(() => {
  void onReloadAttendeeTree()
})

const isSelected = (userId: string): boolean => selectedAttendees.value.some((user) => user.createUserId === userId)

const onSelectOrg = (orgId: string): void => {
  activeOrgId.value = orgId
  // 조직을 고르면 검색 모드 해제
  appliedKeyword.value = ''
  searchInput.value = ''
}

/** 검색 버튼 / Enter — 한글 IME로 Enter가 두 번 들어와도 결과 동일 */
const onSearchAttendee = (): void => {
  appliedKeyword.value = searchInput.value.trim()
}

const onToggleUser = (user: MeetingAttendeeUserItem): void => {
  const idx = selectedAttendees.value.findIndex((item) => item.createUserId === user.userId)
  if (idx >= 0) {
    selectedAttendees.value.splice(idx, 1)
    return
  }
  selectedAttendees.value.push({ createUserId: user.userId, userNm: user.userNm })
}

const onRemoveAttendee = (userId: string): void => {
  selectedAttendees.value = selectedAttendees.value.filter((item) => item.createUserId !== userId)
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
