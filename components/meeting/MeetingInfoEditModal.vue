<template>
  <UiModal
    :is-open="isInfoEditOpen"
    title="회의 정보 편집"
    max-width="520px"
    @close="onClose"
  >
    <div class="meeting2-info-form">
      <!-- 일시 -->
      <div class="meeting2-info-field">
        <span class="meeting2-label">일시</span>
        <UiInput
          v-model="form.date"
          size="md"
          placeholder="예: 2026.05.20 (월) 10:00 ~ 11:30"
        />
      </div>

      <!-- 장소 -->
      <div class="meeting2-info-field">
        <span class="meeting2-label">장소</span>
        <UiInput
          v-model="form.location"
          size="md"
          placeholder="예: 회의실 A / 온라인"
        />
      </div>

      <!-- 목적 -->
      <div class="meeting2-info-field">
        <span class="meeting2-label">목적</span>
        <UiTextarea
          v-model="form.purpose"
          :rows="3"
          placeholder="회의 목적을 입력해주세요."
        />
      </div>

      <!-- 참석자 (칩 입력) -->
      <div class="meeting2-info-field">
        <span class="meeting2-label">참석자 ({{ form.participants.length }}명)</span>

        <div
          class="meeting2-info-chip-input"
          :class="{ 'is-empty': form.participants.length === 0 && !inputName }"
        >
          <span
            v-for="(name, idx) in form.participants"
            :key="`${name}-${idx}`"
            class="meeting2-info-chip"
          >
            {{ name }}
            <button
              type="button"
              class="meeting2-info-chip-remove"
              title="삭제"
              @click="onRemoveParticipant(idx)"
            >
              ×
            </button>
          </span>

          <input
            ref="participantInputRef"
            v-model="inputName"
            type="text"
            class="meeting2-info-chip-input-text"
            :placeholder="form.participants.length === 0 ? '이름 입력 후 Enter / 쉼표로 추가' : '+ 추가'"
            @keydown.enter.prevent="onAddParticipant"
            @keydown="onChipInputKeydown"
            @blur="onAddParticipant"
          />
        </div>
        <p class="meeting2-info-hint">Enter, 쉼표(,)로 추가 — 빈 입력에서 Backspace로 마지막 칩 삭제</p>
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

const { isInfoEditOpen, currentMeeting, handleSaveMeeting } = useMeeting2Store()

interface InfoForm {
  date: string
  location: string
  purpose: string
  participants: string[]
}

const form = reactive<InfoForm>({
  date: '',
  location: '',
  purpose: '',
  participants: [],
})

const inputName = ref('')
const participantInputRef = ref<HTMLInputElement | null>(null)

watch(isInfoEditOpen, async (open) => {
  if (!open || !currentMeeting.value) return
  form.date = currentMeeting.value.date ?? ''
  form.location = currentMeeting.value.location ?? ''
  form.purpose = currentMeeting.value.purpose ?? ''
  form.participants = [...(currentMeeting.value.participants ?? [])]
  inputName.value = ''
  await nextTick()
  // 일시 input이 자동 focus될 수도 있어서 일단 참석자 input은 수동 focus 유지
})

/** 참석자 추가 — Enter / 쉼표 / blur */
const onAddParticipant = () => {
  const raw = inputName.value
  if (!raw) return
  // 쉼표로 여러 개 한꺼번에 입력 가능
  const names = raw
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
  for (const name of names) {
    if (form.participants.includes(name)) continue
    form.participants.push(name)
  }
  inputName.value = ''
}

/** 빈 input에서 Backspace → 마지막 칩 삭제 / 쉼표 → 추가 */
const onChipInputKeydown = (e: KeyboardEvent) => {
  if (e.key === ',') {
    e.preventDefault()
    onAddParticipant()
    return
  }
  if (e.key === 'Backspace' && inputName.value === '' && form.participants.length > 0) {
    form.participants.pop()
  }
}

const onRemoveParticipant = (idx: number) => {
  form.participants.splice(idx, 1)
}

const onClose = () => {
  isInfoEditOpen.value = false
}

const onSave = async () => {
  if (!currentMeeting.value) return
  if (!form.date.trim()) {
    openToast({ message: '일시를 입력해주세요.', type: 'warning' })
    return
  }
  // 입력 중이던 이름이 있으면 저장 직전 자동 추가
  if (inputName.value.trim()) onAddParticipant()

  await handleSaveMeeting({
    id: currentMeeting.value.id,
    date: form.date.trim(),
    location: form.location.trim() || undefined,
    purpose: form.purpose.trim() || undefined,
    participants: form.participants,
  })
  isInfoEditOpen.value = false
}
</script>
