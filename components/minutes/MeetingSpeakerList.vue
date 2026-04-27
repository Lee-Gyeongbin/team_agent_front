<template>
  <div class="meeting-speaker-list">
    <div class="meeting-speaker-list-header">
      <span class="meeting-section-title">
        화자 목록 ({{ speakers.length }})
        <span
          v-if="isEditMode"
          class="meeting-speaker-edit-hint"
        >
          — 편집 중
        </span>
      </span>
      <div
        v-if="isEditMode"
        class="meeting-speaker-edit-actions"
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
      class="meeting-speaker-chips"
    >
      <span
        v-for="(speaker, idx) in displayList"
        :key="speaker.id"
        class="meeting-speaker-chip"
        :class="{ 'is-editing': isEditMode }"
        @click="onClickChip(speaker.id)"
      >
        <span
          class="meeting-speaker-chip-avatar"
          :class="`meeting-speaker-color-${speaker.colorIndex}`"
        >
          {{ avatarChar(idx) }}
        </span>

        <template v-if="isEditMode">
          <input
            :ref="(el) => setInputRef(el, idx)"
            v-model="editForm[idx].name"
            class="meeting-speaker-chip-input"
            :placeholder="`화자${idx + 1}`"
            :size="Math.max((editForm[idx].name?.length ?? 0) + 1, 4)"
            @keydown.enter.prevent="onEnterKey(idx)"
            @keydown.esc.prevent="onCancelEdit"
            @click.stop
          />
          <span
            v-if="speaker.alias"
            class="meeting-speaker-chip-alias"
          >
            ({{ speaker.alias }})
          </span>
        </template>
        <template v-else>
          {{ speaker.name }}
          <span
            v-if="speaker.alias"
            class="meeting-speaker-chip-alias"
          >
            ({{ speaker.alias }})
          </span>
        </template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/minutes/useMeetingStore'
import type { MeetingSpeaker } from '~/types/meeting'

const { currentMeeting, openSpeakerEditModal, handleSaveSpeakers } = useMeetingStore()

const speakers = computed(() => currentMeeting.value?.speakers ?? [])

const isEditMode = ref(false)
const editForm = ref<MeetingSpeaker[]>([])
const inputRefs = ref<HTMLInputElement[]>([])

// 편집 모드일 땐 editForm을, 아니면 원본을 표시 (아바타 이니셜이 입력값에 따라 갱신되도록)
const displayList = computed<MeetingSpeaker[]>(() => (isEditMode.value ? editForm.value : speakers.value))

const setInputRef = (el: unknown, idx: number) => {
  if (el) inputRefs.value[idx] = el as HTMLInputElement
}

const avatarChar = (idx: number) => {
  const name = isEditMode.value ? editForm.value[idx]?.name : speakers.value[idx]?.name
  return name?.charAt(0) || '?'
}

const onClickEdit = () => {
  // 깊은 복사로 원본 보호
  editForm.value = speakers.value.map((s) => ({ ...s }))
  inputRefs.value = []
  isEditMode.value = true
  nextTick(() => inputRefs.value[0]?.focus())
}

const onCancelEdit = () => {
  isEditMode.value = false
  editForm.value = []
}

const onSaveEdit = async () => {
  // 빈 이름 허용 (점진적 매핑) — trim만 적용
  const payload: Partial<MeetingSpeaker>[] = editForm.value.map((s) => ({
    id: s.id,
    name: s.name.trim(),
    alias: s.alias,
    colorIndex: s.colorIndex,
  }))
  await handleSaveSpeakers(payload)
  isEditMode.value = false
  editForm.value = []
}

const onEnterKey = (idx: number) => {
  // 다음 input으로 이동, 마지막이면 저장
  if (idx < editForm.value.length - 1) {
    inputRefs.value[idx + 1]?.focus()
  } else {
    onSaveEdit()
  }
}

const onClickChip = (speakerId: string) => {
  // 편집 모드에선 칩 클릭 무시 (input focus는 input 자체에 위임)
  if (isEditMode.value) return
  const speaker = currentMeeting.value?.speakers.find((s) => s.id === speakerId)
  if (speaker) openSpeakerEditModal(speaker)
}
</script>
