<template>
  <UiModal
    :is-open="isMailSendOpen"
    title="회의록 메일 발송"
    max-width="720px"
    @close="onClose"
  >
    <div class="meeting-modal-form">
      <!-- 받는 사람 -->
      <div class="meeting-modal-field">
        <div class="meeting-modal-field-head">
          <span class="meeting-label">받는 사람 ({{ recipients.length }})</span>
          <button
            v-if="canFillParticipants"
            type="button"
            class="meeting-modal-link-btn"
            @click="onClickFillParticipants"
          >
            참석자 {{ participantsCount }}명 자동 채움
          </button>
        </div>

        <!-- 검색 입력 (Enter로 추가) -->
        <UiInput
          v-model="searchKeyword"
          type="search"
          size="md"
          placeholder="이름 · 메일 · 부서 검색"
          @enter="onPressEnterSearch"
        />

        <!-- 검색 결과 드롭다운 -->
        <div
          v-if="hasSearchResults"
          class="meeting-mail-search-results"
        >
          <button
            v-for="user in filteredSearchResults"
            :key="user.id"
            type="button"
            class="meeting-mail-search-result-item"
            @click="onAddUser(user)"
          >
            <span
              class="meeting-stt-item-avatar"
              :class="`meeting-speaker-color-${user.id.charCodeAt(2) % 8}`"
            >
              {{ user.name.charAt(0) }}
            </span>
            <div class="meeting-mail-search-result-text">
              <span class="meeting-mail-search-result-name">{{ user.name }}</span>
              <span class="meeting-mail-search-result-email">{{ user.email }} · {{ user.dept }}</span>
            </div>
          </button>
        </div>

        <!-- 추가된 수신자 칩 (UiTag 공통 컴포넌트) -->
        <div
          class="meeting-mail-recipient-grid"
          :class="{ 'is-empty': recipients.length === 0 }"
        >
          <UiEmpty
            v-if="recipients.length === 0"
            title="수신자를 추가해주세요."
          />
          <template v-else>
            <UiTag
              v-for="recipient in recipients"
              :key="recipient.id"
              closable
              size="md"
              variant="default"
              @close="onRemoveRecipient(recipient.id)"
            >
              <span :title="recipient.email ?? recipient.name">{{ recipient.name }}</span>
            </UiTag>
          </template>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="onClose"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          :disabled="recipients.length === 0"
          @click="onSend"
        >
          {{ recipients.length > 0 ? `${recipients.length}명에게 발송` : '발송' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'
import type { MeetingRecipient, MeetingUser } from '~/types/meeting2'

const { isMailSendOpen, currentMeeting, mailInitialRecipients, userSearchResults, handleSearchUsers, doSendMail } =
  useMeeting2Store()

const recipients = ref<MeetingRecipient[]>([])
const searchKeyword = ref('')

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(isMailSendOpen, async (open) => {
  if (!open) return
  recipients.value = [...mailInitialRecipients.value]
  searchKeyword.value = ''
  // 모달 열 때 전체 사용자 한 번 로드 (빈 검색 = 전체)
  await handleSearchUsers('')
})

watch(searchKeyword, (kw) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    handleSearchUsers(kw)
  }, 200)
})

const participantsCount = computed(() => currentMeeting.value?.participants?.length ?? 0)

/** 자동 채움 링크 노출 — 참석자 중 아직 안 추가된 사람이 있을 때만 */
const canFillParticipants = computed(() => {
  if (participantsCount.value === 0) return false
  const addedIds = new Set(recipients.value.map((r) => r.id))
  return mailInitialRecipients.value.some((p) => !addedIds.has(p.id))
})

/** 검색 결과에서 이미 추가된 사용자 제외 */
const filteredSearchResults = computed(() => {
  const addedIds = new Set(recipients.value.map((r) => r.id))
  return userSearchResults.value.filter((u) => !addedIds.has(u.id)).slice(0, 8)
})

const hasSearchResults = computed(() => filteredSearchResults.value.length > 0 && searchKeyword.value.trim() !== '')

const onAddUser = (user: MeetingUser) => {
  if (recipients.value.some((r) => r.id === user.id)) {
    openToast({ message: '이미 추가된 수신자입니다.', type: 'warning' })
    return
  }
  recipients.value = [...recipients.value, { id: user.id, name: user.name, email: user.email }]
  searchKeyword.value = ''
}

/** Enter: 검색 결과 1건이면 자동 추가, 메일 형식이면 외부 메일로 추가 */
const onPressEnterSearch = () => {
  const kw = searchKeyword.value.trim()
  if (!kw) return

  // 검색 결과 정확 일치 우선
  const exact = userSearchResults.value.find((u) => u.name === kw || u.email === kw)
  if (exact) {
    onAddUser(exact)
    return
  }
  // 검색 결과 1건이면 자동 추가
  if (filteredSearchResults.value.length === 1) {
    onAddUser(filteredSearchResults.value[0])
    return
  }
  // 메일 형식이면 외부 메일로 추가
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kw)
  if (!isEmail) {
    openToast({ message: '사용자를 검색해서 선택하거나 유효한 메일 주소를 입력해주세요.', type: 'warning' })
    return
  }
  if (recipients.value.some((r) => r.email === kw)) {
    openToast({ message: '이미 추가된 수신자입니다.', type: 'warning' })
    return
  }
  recipients.value = [...recipients.value, { id: `ext-${Date.now()}`, name: kw, email: kw }]
  searchKeyword.value = ''
}

const onRemoveRecipient = (id: string) => {
  recipients.value = recipients.value.filter((r) => r.id !== id)
}

const onClickFillParticipants = async () => {
  // mailInitialRecipients는 모달 열 때 참석자 매칭 결과로 채워짐
  // → 그대로 복사. 단, 이미 추가된 사용자는 중복 없게 합치기
  const merged = [...recipients.value]
  mailInitialRecipients.value.forEach((p) => {
    if (!merged.some((r) => r.id === p.id || r.email === p.email)) merged.push(p)
  })
  recipients.value = merged
}

const onClose = () => {
  isMailSendOpen.value = false
}

const onSend = () => {
  if (recipients.value.length === 0) {
    openToast({ message: '수신자를 1명 이상 추가해주세요.', type: 'warning' })
    return
  }
  openConfirm({
    title: '메일 발송',
    message: `${recipients.value.length}명에게 회의록을 발송하시겠습니까?`,
    onConfirm: () => {
      doSendMail(recipients.value)
    },
  })
}

onBeforeUnmount(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
})
</script>
