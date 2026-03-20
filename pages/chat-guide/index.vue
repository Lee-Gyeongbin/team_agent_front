<template>
  <div class="chat-comment-page">
    <div class="chat-comment-page-header">
      <UiTab
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div class="chat-comment-page-body s-center">
      <!-- 인사멘트 -->
      <ChatGuideGreeting v-if="activeTab === 'greeting'" />

      <!-- 안내멘트 -->
      <ChatGuideNotice v-else-if="activeTab === 'notice'" />

      <!-- 오류메시지 -->
      <ChatGuideError v-else-if="activeTab === 'error'" />

      <!-- 점검/장애 -->
      <ChatGuideMaintenance v-else-if="activeTab === 'maintenance'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatGuideGreeting from '~/components/chat-guide/ChatGuideGreeting.vue'
import ChatGuideNotice from '~/components/chat-guide/ChatGuideNotice.vue'
import ChatGuideError from '~/components/chat-guide/ChatGuideError.vue'
import ChatGuideMaintenance from '~/components/chat-guide/ChatGuideMaintenance.vue'

const activeTab = ref('greeting')

const tabs = [
  { label: '인사멘트', value: 'greeting' },
  { label: '안내멘트', value: 'notice' },
  { label: '오류메시지', value: 'error' },
  { label: '점검/장애', value: 'maintenance' },
]
</script>
