<template>
  <div class="chat-input">
    <div
      class="chat-input-inner"
      :class="{ 'is-active': modelValue.trim() }"
    >
      <div class="chat-input-top flex items-start">
        <i
          v-show="!modelValue"
          class="icon-sparkle size-24"
        ></i>
        <UiTextarea
          :model-value="modelValue"
          class="inp-chat-search"
          placeholder="궁금하신 내용을 입력하세요."
          :auto-resize="true"
          :max-rows="7"
          @update:model-value="emit('update:modelValue', $event)"
          @keydown.enter.exact.prevent="onSend"
        />
      </div>

      <div class="chat-input-bottom flex justify-end items-center">
        <UiSelect
          :model-value="selectedModel"
          id="ai-model"
          class="w-180"
          name="ai-model"
          :options="modelOptions"
          size="xlg"
          @update:model-value="emit('update:selectedModel', String($event))"
        />
        <UiButton
          variant="primary"
          size="xlg"
          icon-only
          class="btn-chat-send"
          :disabled="!modelValue.trim()"
          @click="onSend"
        >
          <template #icon-left>
            <i class="icon-send size-16" />
          </template>
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelOption } from '~/types/chat'

interface Props {
  modelValue: string
  selectedModel?: string
  modelOptions?: ModelOption[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedModel: 'auto',
  modelOptions: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:selectedModel': [value: string]
  'on-send': []
}>()

const onSend = () => {
  emit('on-send')
}
</script>
