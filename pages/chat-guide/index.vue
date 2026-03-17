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
      <ChatCommentGreeting v-if="activeTab === 'greeting'" />

      <!-- 안내멘트 -->
      <ChatCommentNotice v-else-if="activeTab === 'notice'" />

      <!-- 오류메시지 -->
      <ChatCommentError v-else-if="activeTab === 'error'" />

      <!-- 점검/장애 -->
      <ChatCommentMaintenance v-else-if="activeTab === 'maintenance'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatCommentGreeting from '~/components/chat-comment/ChatCommentGreeting.vue'
import ChatCommentNotice from '~/components/chat-comment/ChatCommentNotice.vue'
import ChatCommentError from '~/components/chat-comment/ChatCommentError.vue'
import ChatCommentMaintenance from '~/components/chat-comment/ChatCommentMaintenance.vue'

const activeTab = ref('greeting')

const tabs = [
  { label: '인사멘트', value: 'greeting' },
  { label: '안내멘트', value: 'notice' },
  { label: '오류메시지', value: 'error' },
  { label: '점검/장애', value: 'maintenance' },
]
</script>
