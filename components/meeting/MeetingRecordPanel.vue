<template>
  <div class="meeting-panel">
    <div class="meeting-panel-header">
      <span class="meeting-panel-title">실시간 녹음 / STT</span>
    </div>

    <!-- 상단 고정 영역: 녹음 컨트롤 + 파형 + STT 툴바 -->
    <div class="meeting-record-fixed">
      <MeetingRecordControl />
      <MeetingWaveform />
      <MeetingSttToolbar />
    </div>

    <!-- 스크롤 영역: 발화 리스트 + 화자 목록 -->
    <div class="meeting-record-scroll">
      <MeetingSttList />
      <MeetingSpeakerList />
    </div>
  </div>
</template>
