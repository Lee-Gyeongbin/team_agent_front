<template>
  <div
    v-if="currentMeeting"
    class="meeting2-side-section"
  >
    <span class="meeting2-section-title">회의 정보</span>
    <dl class="meeting2-meta-list">
      <div class="meeting2-meta-row">
        <dt>일시</dt>
        <dd>{{ currentMeeting.date || '-' }}</dd>
      </div>
      <div
        v-if="currentMeeting.location"
        class="meeting2-meta-row"
      >
        <dt>장소</dt>
        <dd>{{ currentMeeting.location }}</dd>
      </div>
      <div
        v-if="currentMeeting.purpose"
        class="meeting2-meta-row"
      >
        <dt>목적</dt>
        <dd>{{ currentMeeting.purpose }}</dd>
      </div>
      <div class="meeting2-meta-row">
        <dt>참석자</dt>
        <dd>{{ currentMeeting.participants.length }}명</dd>
      </div>
    </dl>

    <div
      v-if="currentMeeting.participants.length > 0"
      class="meeting2-meta-participants"
    >
      <span
        v-for="(name, idx) in currentMeeting.participants"
        :key="idx"
        class="meeting2-meta-participant-chip"
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
