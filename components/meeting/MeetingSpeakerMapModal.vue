<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      @click.self="emit('close')"
    >
      <div class="meeting-speaker-modal">
        <div class="meeting-speaker-modal-header">
          <h3 class="meeting-speaker-modal-title">화자 매핑</h3>
          <button
            type="button"
            class="meeting-start-modal-close"
            @click="emit('close')"
          >
            <i class="icon-close size-20" />
          </button>
        </div>

        <div class="meeting-speaker-modal-body">
          <p class="meeting-speaker-modal-desc">LLM이 분리한 화자와 실제 참석자를 연결해주세요.</p>

          <div
            v-if="speakers.length === 0"
            class="meeting-speaker-modal-empty"
          >
            <UiEmpty title="화자 정보가 없습니다." />
          </div>

          <div
            v-else
            class="meeting-speaker-list"
          >
            <table class="meeting-speaker-table">
              <colgroup>
                <col class="meeting-speaker-col-speaker" />
                <col class="meeting-speaker-col-attendee" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">화자</th>
                  <th scope="col">참여자</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="sp in localSpeakers"
                  :key="sp.speakerId"
                >
                  <td>{{ sp.speakerLabel }}</td>
                  <td>
                    <select
                      v-model="sp.speakerUserId"
                      class="meeting-speaker-select"
                      @change="onChangeMapping(sp)"
                    >
                      <option value="">참여자 선택</option>
                      <option
                        v-for="user in attendees"
                        :key="user.userId"
                        :value="user.userId"
                      >
                        {{ user.userNm }}
                      </option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="meeting-speaker-modal-footer">
          <button
            type="button"
            class="btn btn-ghost"
            @click="emit('close')"
          >
            닫기
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="isSaving"
            @click="onSaveAll"
          >
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingSpeaker } from '~/types/meeting'

interface AttendeeItem {
  userId: string
  userNm: string
}

const props = defineProps<{
  speakers: MeetingSpeaker[]
  attendees: AttendeeItem[] // meeting.attendees JSON 파싱 결과
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { handleSaveSpeakerMapping } = useMeetingStore()

// 로컬 복사본 — 드롭다운 변경을 추적
const localSpeakers = ref(
  props.speakers.map((sp) => ({
    speakerId: sp.speakerId,
    speakerLabel: sp.speakerLabel,
    speakerNm: sp.speakerNm ?? '',
    speakerUserId: sp.speakerUserId ?? '',
  })),
)

const isSaving = ref(false)

/** 드롭다운 변경 시 speakerNm 자동 설정 */
const onChangeMapping = (sp: (typeof localSpeakers.value)[0]) => {
  const found = props.attendees.find((u) => u.userId === sp.speakerUserId)
  sp.speakerNm = found?.userNm ?? ''
}

/** 전체 저장 */
const onSaveAll = async () => {
  isSaving.value = true
  try {
    const tasks = localSpeakers.value.map((sp) =>
      handleSaveSpeakerMapping({
        speakerId: sp.speakerId,
        speakerNm: sp.speakerNm,
        speakerUserId: sp.speakerUserId,
      }),
    )
    await Promise.all(tasks)
    openToast({ message: '화자 매핑이 저장되었습니다.' })
    emit('saved')
    emit('close')
  } finally {
    isSaving.value = false
  }
}
</script>
