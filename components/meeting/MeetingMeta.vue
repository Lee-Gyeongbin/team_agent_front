<template>
  <div
    v-if="currentMeeting"
    class="meeting-side-section"
  >
    <span class="meeting-section-title">회의 정보</span>
    <dl class="meeting-meta-list">
      <div class="meeting-meta-row">
        <dt>일시</dt>
        <dd>{{ currentMeeting.date || '-' }}</dd>
      </div>
      <div
        v-if="currentMeeting.location"
        class="meeting-meta-row"
      >
        <dt>장소</dt>
        <dd>{{ currentMeeting.location }}</dd>
      </div>
      <div
        v-if="currentMeeting.purpose"
        class="meeting-meta-row"
      >
        <dt>목적</dt>
        <dd>{{ currentMeeting.purpose }}</dd>
      </div>
      <div class="meeting-meta-row">
        <dt>참석자</dt>
        <dd>{{ currentMeeting.participants.length }}명</dd>
      </div>
    </dl>

    <div
      v-if="currentMeeting.participants.length > 0"
      class="meeting-meta-participants"
    >
      <span
        v-for="(name, idx) in currentMeeting.participants"
        :key="idx"
        class="meeting-meta-participant-chip"
      >
        {{ name }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeeting2Store } from '~/composables/meeting/useMeeting2Store'

const { currentMeeting } = useMeeting2Store()
</script>
