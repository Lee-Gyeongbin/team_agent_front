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
          @keydown.enter.exact.prevent="handleSend"
        />
      </div>

      <div class="chat-input-bottom flex justify-between items-center">
        <ChatSearchMode />
        <div class="chat-input-bottom-right flex gap-8 items-center">
          <UiSelect
            id="sub-option"
            class="w-170"
            name="sub-option"
            :model-value="selectedSubOption"
            :options="subOptions"
            size="xlg"
            @update:model-value="selectedSubOption = String($event)"
          />
          <UiButton
            variant="primary"
            size="xlg"
            icon-only
            class="btn-chat-send"
            :disabled="!modelValue.trim()"
            @click="handleSend"
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
const { chatRoom, createChatRoom, onSend, subOptions, selectedSubOption } = useChatStore()

interface Props {
  modelValue: string
}

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const props = defineProps<Props>()

const handleSend = () => {
  if (!chatRoom.value.roomId) {
    void createChatRoom(props.modelValue)
  } else {
    onSend()
  }
}
</script>
