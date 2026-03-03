<template>
  <div class="chat-index flex flex-col items-center justify-center">
    <div class="chat-index-header">
      <h1 class="chat-index-title f-center">TeamAgent</h1>
      <p class="chat-index-description f-center">어떤게 궁금하세요?</p>
    </div>

    <div class="chat-index-input-wrapper flex flex-col items-center w-full">
      <div class="chat-index-input-top flex items-start w-full">
        <i class="icon icon-sparkle"></i>
        <input class="inp-chat-search" type="text" placeholder="궁금하신 내용을 입력하세요." />
      </div>

      <div class="chat-index-input-bottom flex justify-end items-center w-full">
        <select class="inp-select inp-select-ai-model" name="ai-model" id="ai-model">
          <option value="1">자동</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
        <button class="btn btn-chat-send"><i class="icon icon-send"></i></button>
      </div>
    </div>

    <div class="btn-grp">
      <button class="btn btn-chat-index">
        <span class="icon-circle"><i class="icon-knowledge"></i></span>
        <p>지식검색 (매뉴얼 AI)</p>
      </button>
      <button class="btn btn-chat-index">
        <span class="icon-circle"><i class="icon-database"></i></span>
        <p>데이터분석 (SQL)</p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.chat-index {
  padding: $spacing-xl;
}
</style>
