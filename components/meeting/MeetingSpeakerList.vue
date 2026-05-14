<template>
  <div class="meeting2-speaker-list">
    <div class="meeting2-speaker-list-header">
      <span class="meeting2-section-title">
        화자 목록 ({{ speakers.length }})
        <span
          v-if="isEditMode"
          class="meeting2-speaker-edit-hint"
        >
          — 편집 중
        </span>
      </span>
      <div
        v-if="isEditMode"
        class="meeting2-speaker-edit-actions"
      >
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="onCancelEdit"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          @click="onSaveEdit"
        >
          저장
        </UiButton>
      </div>
      <UiButton
        v-else
        variant="ghost"
        size="xs"
        @click="onClickEdit"
      >
        <template #icon-left>
          <i class="icon-edit size-14" />
        </template>
        편집
      </UiButton>
    </div>

    <UiEmpty
      v-if="speakers.length === 0"
      title="화자가 없습니다."
    />

    <div
      v-else
      class="meeting2-speaker-chips"
    >
      <span
        v-for="(speaker, idx) in displayList"
        :key="speaker.id"
        class="meeting2-speaker-chip"
        :class="{ 'is-editing': isEditMode }"
      >
        <span
          class="meeting2-speaker-chip-avatar"
          :class="`meeting2-speaker-color-${speaker.colorIndex}`"
        >
          {{ avatarChar(idx) }}
        </span>

        <template v-if="isEditMode">
          <span class="meeting2-speaker-chip-edit-wrap">
            <input
              :ref="(el) => setInputRef(el, idx)"
              v-model="editForm[idx].name"
              class="meeting2-speaker-chip-input"
              :placeholder="`화자${idx + 1}`"
              :size="Math.max((editForm[idx].name?.length ?? 0) + 1, 4)"
              @keydown.enter.prevent="onEnterKey(idx)"
              @keydown.esc.prevent="onCancelEdit"
              @focus="onSpeakerInputFocus(idx)"
              @blur="onSpeakerInputBlur"
              @input="onSpeakerNameInput(idx)"
              @click.stop
            />
            <div
              v-show="suggestOpenIdx === idx"
              class="meeting2-speaker-suggest"
            >
              <button
                v-for="user in filteredUsersForRow(idx)"
                :key="user.userId"
                type="button"
                class="meeting2-speaker-suggest-item"
                @mousedown.prevent="onPickDetailUser(idx, user)"
              >
                {{ user.userNm }}
              </button>
              <UiEmpty
                v-if="filteredUsersForRow(idx).length === 0"
                title="검색 결과가 없습니다."
              />
            </div>
          </span>
          <span
            v-if="speaker.alias"
            class="meeting2-speaker-chip-alias"
          >
            ({{ speaker.alias }})
          </span>
        </template>
        <template v-else>
          {{ speaker.name }}
          <span
            v-if="speaker.alias"
            class="meeting2-speaker-chip-alias"
          >
            ({{ speaker.alias }})
          </span>
        </template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { openConfirm } from '~/composables/useDialog'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { computeSpeakerAvatarMap } from '~/utils/meeting/speakerAvatarUtil'
import type { User, MeetingViewSpeaker as MeetingSpeaker, MergeGroup } from '~/types/meeting'

const { currentMeeting, meetingDetail, handleSaveSpeakers } = useMeetingStore()

const speakers = computed(() => currentMeeting.value?.speakers ?? [])

const isEditMode = ref(false)
const editForm = ref<MeetingSpeaker[]>([])
const inputRefs = ref<HTMLInputElement[]>([])
/** 인라인 편집 시 회의 상세 userList 자동완성 — 포커스된 행 */
const suggestOpenIdx = ref<number | null>(null)
let suggestBlurTimer: ReturnType<typeof setTimeout> | null = null

const detailUsers = computed(() => meetingDetail.value.userList ?? [])

const filteredUsersForRow = (idx: number) => {
  const keyword = (editForm.value[idx]?.name ?? '').trim().toLowerCase()
  const list = detailUsers.value
  if (!keyword) return list
  return list.filter((u) => u.userNm.toLowerCase().includes(keyword))
}

// 편집 모드일 땐 editForm을, 아니면 원본을 표시 (아바타 이니셜이 입력값에 따라 갱신되도록)
const displayList = computed<MeetingSpeaker[]>(() => (isEditMode.value ? editForm.value : speakers.value))

const setInputRef = (el: unknown, idx: number) => {
  if (el) inputRefs.value[idx] = el as HTMLInputElement
}

// 화자 목록 컨텍스트로 아바타 1글자 계산 (공통 util)
const avatarMap = computed(() => computeSpeakerAvatarMap(displayList.value))
const avatarChar = (idx: number) => {
  const id = displayList.value[idx]?.id
  return (id && avatarMap.value.get(id)) || '?'
}

const onClickEdit = () => {
  if (suggestBlurTimer) {
    clearTimeout(suggestBlurTimer)
    suggestBlurTimer = null
  }
  // 깊은 복사로 원본 보호
  editForm.value = speakers.value.map((s) => ({ ...s }))
  inputRefs.value = []
  suggestOpenIdx.value = null
  isEditMode.value = true
  nextTick(() => inputRefs.value[0]?.focus())
}

const onCancelEdit = () => {
  if (suggestBlurTimer) {
    clearTimeout(suggestBlurTimer)
    suggestBlurTimer = null
  }
  isEditMode.value = false
  editForm.value = []
  suggestOpenIdx.value = null
}

const onSpeakerInputFocus = (idx: number) => {
  if (suggestBlurTimer) {
    clearTimeout(suggestBlurTimer)
    suggestBlurTimer = null
  }
  suggestOpenIdx.value = idx
}

const onSpeakerInputBlur = () => {
  suggestBlurTimer = window.setTimeout(() => {
    suggestOpenIdx.value = null
    suggestBlurTimer = null
  }, 180)
}

/** 수동 입력 시 목록으로 고른 userId는 무효화 */
const onSpeakerNameInput = (idx: number) => {
  const row = editForm.value[idx]
  if (row) row.speakerUserId = undefined
}

const onPickDetailUser = (idx: number, user: User) => {
  const row = editForm.value[idx]
  if (!row) return
  row.name = user.userNm
  row.speakerUserId = user.userId
  nextTick(() => inputRefs.value[idx]?.focus())
}

type DuplicateNameGroup = {
  name: string
  indexes: number[]
}

const getDuplicateNameGroups = (list: MeetingSpeaker[]): DuplicateNameGroup[] => {
  const nameIndexMap = new Map<string, number[]>()
  list.forEach((speaker, idx) => {
    const name = (speaker.name ?? '').trim()
    if (!name) return
    const indexes = nameIndexMap.get(name) ?? []
    indexes.push(idx)
    nameIndexMap.set(name, indexes)
  })
  return Array.from(nameIndexMap.entries())
    .filter(([, indexes]) => indexes.length > 1)
    .map(([name, indexes]) => ({ name, indexes }))
}

const applyMergedDuplicateNames = (list: MeetingSpeaker[], groups: DuplicateNameGroup[]) => {
  groups.forEach((group) => {
    const mergedUserId = group.indexes.map((idx) => list[idx]?.speakerUserId?.trim()).find((userId) => !!userId)
    group.indexes.forEach((idx) => {
      const row = list[idx]
      if (!row) return
      row.name = group.name
      if (mergedUserId) row.speakerUserId = mergedUserId
    })
  })
}

const applyDistinctDuplicateNames = (list: MeetingSpeaker[], groups: DuplicateNameGroup[]) => {
  groups.forEach((group) => {
    group.indexes.forEach((idx, order) => {
      const row = list[idx]
      if (!row) return
      row.name = `${group.name}${order + 1}`
    })
  })
}

const onSaveEdit = async () => {
  const nextForm = editForm.value.map((speaker) => ({
    ...speaker,
    name: speaker.name.trim(),
  }))

  const duplicateGroups = getDuplicateNameGroups(nextForm)
  let mergeGroups: MergeGroup[] | undefined

  if (duplicateGroups.length > 0) {
    const isMerge = await openConfirm({
      title: '동명이인 확인',
      message: '동명이인이 있습니다. 화자를 합치겠습니까?',
    })
    if (isMerge) {
      applyMergedDuplicateNames(nextForm, duplicateGroups)
      // 첫 번째 화자를 keepSpeaker로, 나머지를 removeSpeaker로 구성
      mergeGroups = duplicateGroups.map((group) => ({
        keepSpeakerId: nextForm[group.indexes[0]]!.id,
        removeSpeakerIds: group.indexes.slice(1).map((idx) => nextForm[idx]!.id),
      }))
    } else {
      applyDistinctDuplicateNames(nextForm, duplicateGroups)
    }
  }

  // 빈 이름 허용 (점진적 매핑) — trim만 적용
  const payload: Partial<MeetingSpeaker>[] = nextForm.map((s) => ({
    id: s.id,
    name: s.name,
    alias: s.alias,
    colorIndex: s.colorIndex,
    speakerUserId: s.speakerUserId,
  }))
  await handleSaveSpeakers(payload, mergeGroups)
  if (suggestBlurTimer) {
    clearTimeout(suggestBlurTimer)
    suggestBlurTimer = null
  }
  isEditMode.value = false
  editForm.value = []
  suggestOpenIdx.value = null
}

const onEnterKey = (idx: number) => {
  // 다음 input으로 이동, 마지막이면 저장
  if (idx < editForm.value.length - 1) {
    inputRefs.value[idx + 1]?.focus()
  } else {
    onSaveEdit()
  }
}
</script>
