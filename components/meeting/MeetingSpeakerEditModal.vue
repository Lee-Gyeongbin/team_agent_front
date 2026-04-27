<template>
  <UiModal
    :is-open="isSpeakerEditOpen"
    title="화자 편집"
    max-width="420px"
    @close="onClose"
  >
    <div style="display: flex; flex-direction: column; gap: 16px">
      <div class="meeting2-field-row">
        <span
          class="meeting2-stt-item-avatar"
          :class="`meeting2-speaker-color-${form.colorIndex}`"
        >
          {{ form.name.charAt(0) || '?' }}
        </span>
        <div style="flex: 1">
          <span class="meeting2-label">이름</span>
          <UiInput
            v-model="form.name"
            placeholder="화자 이름"
            size="md"
          />
        </div>
      </div>

      <div>
        <span class="meeting2-label">별칭 (선택)</span>
        <UiInput
          v-model="form.alias"
          placeholder="예: 나"
          size="md"
        />
      </div>

      <div>
        <span class="meeting2-label">색상</span>
        <div
          style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px"
          role="radiogroup"
        >
          <button
            v-for="i in 8"
            :key="i - 1"
            type="button"
            :class="`meeting2-stt-item-avatar meeting2-speaker-color-${i - 1}`"
            :style="{
              cursor: 'pointer',
              border: form.colorIndex === i - 1 ? '2px solid var(--color-primary)' : '2px solid transparent',
            }"
            @click="form.colorIndex = i - 1"
          >
            {{ form.name.charAt(0) || '?' }}
          </button>
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
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'
import type { MeetingSpeaker } from '~/types/meeting2'

const { isSpeakerEditOpen, selectedSpeaker, handleSaveSpeaker } = useMeeting2Store()

const form = reactive<{ id?: string; name: string; alias?: string; colorIndex: number }>({
  name: '',
  alias: '',
  colorIndex: 0,
})

watch(isSpeakerEditOpen, (open) => {
  if (!open) return
  if (selectedSpeaker.value) {
    form.id = selectedSpeaker.value.id
    form.name = selectedSpeaker.value.name
    form.alias = selectedSpeaker.value.alias ?? ''
    form.colorIndex = selectedSpeaker.value.colorIndex
  } else {
    form.id = undefined
    form.name = ''
    form.alias = ''
    form.colorIndex = 0
  }
})

const onClose = () => {
  isSpeakerEditOpen.value = false
}

const onSave = async () => {
  if (!form.name.trim()) {
    openToast({ message: '이름을 입력해주세요.', type: 'warning' })
    return
  }
  const speaker: Partial<MeetingSpeaker> = {
    id: form.id,
    name: form.name.trim(),
    alias: form.alias?.trim() || undefined,
    colorIndex: form.colorIndex,
  }
  await handleSaveSpeaker(speaker)
}
</script>
