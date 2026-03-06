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

      <div class="chat-input-bottom flex justify-between items-center">
        <ChatSearchMode />
        <div class="chat-input-bottom-right flex gap-8 items-center">
          <UiSelect
            v-if="currentSubOptions.length > 0"
            :model-value="selectedSubOption"
            id="sub-option"
            class="w-170"
            name="sub-option"
            :options="currentSubOptions"
            size="xlg"
            @update:model-value="selectedSubOption = String($event)"
          />
          <UiSelect
            v-else
            :model-value="selectedModel"
            id="ai-model"
            class="w-170"
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

const { currentSubOptions, selectedSubOption } = useChatStore()

const onSend = () => {
  emit('on-send')
}
</script>
