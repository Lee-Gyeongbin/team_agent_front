<template>
  <div class="meeting-side-section">
    <span class="meeting-section-title">작업</span>
    <div class="meeting-side-action-grp">
      <button
        class="meeting-side-action-btn"
        @click="onClickDownload"
      >
        <i class="icon-download size-16" />
        파일로 저장
      </button>
      <button
        class="meeting-side-action-btn"
        @click="onClickShare"
      >
        <i class="icon-link-agent size-16" />
        회의록 공유
      </button>
      <button
        class="meeting-side-action-btn"
        @click="onClickMail"
      >
        <i class="icon-send size-16" />
        메일 발송
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/minutes/useMeetingStore'

const { handleOpenFileSave, handleShareMeeting, handleOpenMailSend } = useMeetingStore()

const onClickDownload = () => handleOpenFileSave()
const onClickShare = () => handleShareMeeting()
const onClickMail = () => handleOpenMailSend()
</script>
