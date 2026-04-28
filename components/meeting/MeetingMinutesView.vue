<template>
  <div class="meeting-minutes-report">
    <table class="meeting-minutes-report-table">
      <colgroup>
        <col class="meeting-minutes-report-col-label" />
        <col class="meeting-minutes-report-col-value" />
      </colgroup>
      <tbody>
        <tr>
          <th scope="row">제목</th>
          <td>{{ meeting?.meetingTitle || '-' }}</td>
        </tr>
        <tr>
          <th scope="row">회의시간</th>
          <td>{{ meetingTimeDisplay }}</td>
        </tr>
        <tr>
          <th scope="row">장소</th>
          <td>-</td>
        </tr>
        <tr>
          <th scope="row">인포그래픽</th>
          <td>
            <div
              v-if="infographicList.length > 0"
              class="meeting-infographic-list"
            >
              <div
                v-for="(item, idx) in infographicList"
                :key="item.infographicId ?? idx"
                class="meeting-infographic-item"
              >
                <p class="meeting-infographic-topic">{{ item.topicNm || `인포그래픽 ${idx + 1}` }}</p>
                <p
                  v-if="item.topicSummary"
                  class="meeting-infographic-summary"
                >
                  {{ item.topicSummary }}
                </p>
                <img
                  v-if="item.infographicImg"
                  class="meeting-infographic-image"
                  :src="toInfographicSrc(item.infographicImg)"
                  :alt="item.topicNm || '회의 인포그래픽'"
                />
              </div>
            </div>
            <p
              v-else
              class="meeting-minutes-empty-text"
            >
              인포그래픽이 없습니다.
            </p>
          </td>
        </tr>
        <tr>
          <th scope="row">회의 내용</th>
          <td class="meeting-report-prewrap">{{ minutes.summary || '-' }}</td>
        </tr>
        <tr>
          <th scope="row">결정사항</th>
          <td>
            <ul
              v-if="decisions.length > 0"
              class="meeting-minutes-list"
            >
              <li
                v-for="(item, idx) in decisions"
                :key="idx"
                class="meeting-minutes-list-item"
              >
                {{ item }}
              </li>
            </ul>
            <p
              v-else
              class="meeting-minutes-empty-text"
            >
              결정사항이 없습니다.
            </p>
          </td>
        </tr>
        <tr>
          <th scope="row">ToDoList</th>
          <td>
            <div
              v-if="todoList.length > 0"
              class="meeting-todo-list"
            >
              <div
                v-for="(item, idx) in todoList"
                :key="idx"
                class="meeting-todo-item"
              >
                <div class="meeting-todo-content">{{ item.content || '-' }}</div>
                <div class="meeting-todo-meta">
                  <span
                    v-if="item.due_date"
                    class="meeting-todo-meta-tag"
                  >
                    <i class="icon-calendar size-14" />
                    {{ item.due_date }}
                  </span>
                  <span
                    v-if="item.collaborators"
                    class="meeting-todo-meta-tag"
                  >
                    <i class="icon-user size-14" />
                    {{ item.collaborators }}
                  </span>
                </div>
              </div>
            </div>
            <p
              v-else
              class="meeting-minutes-empty-text"
            >
              ToDoList가 없습니다.
            </p>
          </td>
        </tr>
        <tr>
          <th scope="row">전체 녹취록</th>
          <td class="meeting-report-prewrap">
            <template v-if="speakerTranscriptLines.length > 0">
              <template
                v-for="(line, idx) in speakerTranscriptLines"
                :key="`${line.seq}-${idx}`"
              >
                {{ line.speaker }}: {{ line.text }}
                <br v-if="idx < speakerTranscriptLines.length - 1" />
              </template>
            </template>
            <template v-else>
              {{ minutes.fullText || '-' }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { Meeting, MeetingInfographic, MeetingMinutes, MeetingSpeaker, TodoItem } from '~/types/meeting'

const props = defineProps<{
  meeting: Meeting | null
  minutes: MeetingMinutes
  infographicList: MeetingInfographic[]
  speakers: MeetingSpeaker[]
}>()

const { parseJsonArray } = useMeetingStore()

const decisions = computed(() => parseJsonArray<string>(props.minutes.decisions))
const todoList = computed(() => parseJsonArray<TodoItem>(props.minutes.todoList))

const meetingTimeDisplay = computed(() => {
  const start = props.meeting?.startDt ?? ''
  const end = props.meeting?.endDt ?? ''
  if (start && end) return `${start} ~ ${end}`
  if (start) return start
  return '-'
})

const toInfographicSrc = (value: string) => {
  if (!value) return ''
  if (value.startsWith('data:image')) return value
  return `data:image/png;base64,${value}`
}

interface SpeakerLine {
  seq: number
  speaker: string
  text: string
}

interface UtteranceItem {
  seq?: number
  start?: number
  text?: string
}

const speakerTranscriptLines = computed<SpeakerLine[]>(() => {
  const lines: SpeakerLine[] = []
  let fallbackSeq = 0

  props.speakers.forEach((speaker) => {
    const speakerName = speaker.speakerNm?.trim() || speaker.speakerLabel?.trim() || '화자'
    try {
      const parsed = JSON.parse(speaker.utterances) as UtteranceItem[]
      if (!Array.isArray(parsed)) return

      parsed.forEach((item) => {
        const text = String(item?.text ?? '').trim()
        if (!text) return
        // start 있으면 start 기준, 없으면 seq, 둘 다 없으면 fallback
        const seq =
          typeof item?.start === 'number'
            ? item.start
            : typeof item?.seq === 'number'
              ? item.seq
              : 100000 + fallbackSeq++
        lines.push({ seq, speaker: speakerName, text })
      })
    } catch {
      // utterances 파싱 실패 시 해당 화자는 스킵
    }
  })

  return lines.sort((a, b) => a.seq - b.seq)
})
</script>
