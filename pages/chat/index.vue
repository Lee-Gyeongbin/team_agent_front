<template>
  <div class="chat-index flex flex-col items-center justify-center">
    <div class="chat-index-header">
      <h1 class="chat-index-title f-center">TeamAgent</h1>
      <p class="chat-index-description f-center">어떤게 궁금하세요?</p>
    </div>

    <div class="chat-index-content flex flex-col items-center w-full">
      <div class="chat-index-input-wrapper">
        <input type="text" placeholder="질문을 입력해주세요." />
      </div>

      <div class="btn-grp">
        <button class="btn btn-chat-index">
          <span class="icon-circle white"><i class="icon-manual"></i></span>
          <p>지식검색 (매뉴얼 AI)</p>
        </button>
        <button class="btn btn-chat-index">
          <span class="icon-circle white"><i class="icon-date"></i></span>
          <p>데이터분석 (SQL)</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.chat-index {
  padding: $spacing-xl;
}
</style>
