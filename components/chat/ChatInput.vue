<template>
  <div class="chat-input">
    <div class="chat-input-inner">
      <div class="chat-input-top flex items-start">
        <i
          class="icon-sparkle size-24"
          :class="{ 'is-active': modelValue }"
        ></i>
        <UiTextarea
          :model-value="modelValue"
          class="inp-chat-search"
          placeholder="궁금하신 내용을 입력하세요."
          :auto-resize="true"
          :max-rows="5"
          @update:model-value="emit('update:modelValue', $event)"
          @keydown.enter.exact.prevent="onSend"
        />
      </div>

      <div class="chat-input-bottom flex justify-end items-center">
        <UiSelect
          v-model="selectedModel"
          id="ai-model"
          class="w-180"
          name="ai-model"
          :options="modelOptions"
          size="lg"
        />
        <button
          class="btn btn-chat-send"
          :disabled="!modelValue.trim()"
          @click="onSend"
        >
          <i class="icon-send size-20"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'on-send': []
}>()

const selectedModel = ref('auto')

const onSend = () => {
  emit('on-send')
}

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const modelOptions = [
  { label: '자동', value: 'auto' },
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

<style lang="scss" scoped>
.chat-input {
  width: 100%;

  .chat-input-inner {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: $spacing-md;
    border-radius: 20px;
    border: 1px solid $color-border;
    background: #fff;
  }

  .chat-input-top {
    gap: $spacing-sm;

    .icon-sparkle {
      flex-shrink: 0;
      transition: background-color $transition-base;

      &.is-active {
        background-color: $color-primary;
      }
    }

    .inp-chat-search {
      width: calc(100% - 32px);
      min-height: 24px;
    }
  }

  .chat-input-bottom {
    gap: 12px;

    .inp-select-ai-model {
      width: 180px;
    }
  }
}
</style>
