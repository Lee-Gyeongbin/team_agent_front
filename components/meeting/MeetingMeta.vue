<template>
  <div
    v-if="currentMeeting"
    class="meeting2-side-section"
  >
    <div class="meeting2-meta-header">
      <span class="meeting2-section-title">회의 정보</span>
      <!--
        TODO: 회의 정보 편집 임시 비활성화
        - 현재 saveMeetingMinutes.do로 전송되지만 서버에 참석자·일시·장소를 저장하는 로직이 없어 반영되지 않음
        - 회의록 웹에디터에서 직접 수정 가능하므로 전용 API(updateMeetingInfo) 구현 전까지 숨김
      <UiButton
        variant="ghost"
        size="xs"
        @click="onClickEdit"
      >
        <template #icon-left>
          <i class="icon-edit size-14"></i>
        </template>
        편집
      </UiButton>
      -->
    </div>

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
// import { UiButton } from '@leechanyong/ispark-ui' // 편집 버튼 임시 비활성화 (템플릿 TODO 참고)
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'

const { currentMeeting } = useMeetingStore()

// 편집 버튼 임시 비활성화 (템플릿 TODO 참고)
// const { openInfoEditModal } = useMeetingStore()
// const onClickEdit = () => {
//   openInfoEditModal()
// }
</script>
