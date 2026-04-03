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
          :placeholder="inputPlaceholder"
          :disabled="isSearchModeMissingSubOptions"
          :auto-resize="true"
          :max-rows="6"
          @update:model-value="emit('update:modelValue', $event)"
          @keydown.enter.exact.prevent="handleSend"
        />
      </div>

      <div class="chat-input-bottom flex justify-between items-center">
        <div class="chat-input-bottom-left flex gap-8 items-center">
          <!-- TODO: 파일첨부 버튼 추가 -->
          <UiButton
            type="button"
            variant="ghost"
            size="xlg"
            icon-only
            class="btn-chat-attach"
            aria-label="파일 첨부"
          >
            <template #icon-left>
              <i class="icon-attach-file size-24" />
            </template>
          </UiButton>
          <ChatSearchMode />
        </div>
        <div class="chat-input-bottom-right flex gap-8 items-center">
          <UiSelect
            id="sub-option"
            class="w-170"
            name="sub-option"
            :model-value="selectedModelOption"
            :options="modelOptions"
            size="xlg"
            @update:model-value="selectedModelOption = String($event)"
          />
          <UiButton
            variant="primary"
            size="xlg"
            icon-only
            class="btn-chat-send"
            :disabled="!modelValue.trim() || isSearchModeMissingSubOptions"
            @click="handleSend"
          >
            <template #icon-left>
              <i class="icon-send size-20" />
            </template>
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  chatRoom,
  createChatRoom,
  onSend,
  modelOptions,
  selectedModelOption,
  isSearchModeMissingSubOptions,
  searchModeSubOptionsEmptyMessage,
} = useChatStore()

const DEFAULT_INPUT_PLACEHOLDER = '궁금하신 내용을 입력하세요.'

const inputPlaceholder = computed(() =>
  isSearchModeMissingSubOptions.value ? searchModeSubOptionsEmptyMessage.value : DEFAULT_INPUT_PLACEHOLDER,
)

interface Props {
  modelValue: string
}

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const props = defineProps<Props>()

const handleSend = () => {
  if (isSearchModeMissingSubOptions.value) return
  if (!chatRoom.value.roomId) {
    void createChatRoom(props.modelValue)
  } else {
    onSend()
  }
}
</script>
