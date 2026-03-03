<template>
  <div class="chat-index flex flex-col items-center justify-center">
    <div class="chat-index-header">
      <h1 class="chat-index-title f-center">TeamAgent</h1>
      <p class="chat-index-description f-center">어떤게 궁금하세요?</p>
    </div>

    <div class="chat-index-input-wrapper flex flex-col items-center w-full">
      <div class="chat-index-input-top flex items-start w-full">
        <i
          class="icon-sparkle size-24"
          :class="{ 'is-active': chatMessage }"
        ></i>
        <UiTextarea
          v-model="chatMessage"
          class="inp-chat-search"
          placeholder="궁금하신 내용을 입력하세요."
          :auto-resize="true"
          :max-rows="5"
        />
      </div>

      <div class="chat-index-input-bottom flex justify-end items-center w-full">
        <UiSelect
          id="ai-model"
          class="inp-select-ai-model"
          name="ai-model"
          :options="modelOptions"
          size="lg"
        />
        <button class="btn btn-chat-send"><i class="icon-send size-20"></i></button>
      </div>
    </div>

    <div class="btn-grp">
      <button class="btn btn-chat-index">
        <span class="icon-circle"><i class="icon-knowledge size-20"></i></span>
        <p>지식검색 (매뉴얼 AI)</p>
      </button>
      <button class="btn btn-chat-index">
        <span class="icon-circle"><i class="icon-database size-20"></i></span>
        <p>데이터분석 (SQL)</p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const chatMessage = ref('')

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const modelOptions = [
  { label: '자동', value: '' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
  { label: 'Claude 3 Opus', value: 'claude-3-opus' },
  { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
  { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
  { label: 'Llama 3.1 405B', value: 'llama-3.1-405b' },
  { label: 'Mixtral 8x22B', value: 'mixtral-8x22b' },
  { label: 'DeepSeek V3', value: 'deepseek-v3' },
  { label: 'Qwen 2.5 72B', value: 'qwen-2.5-72b' },
]
</script>
