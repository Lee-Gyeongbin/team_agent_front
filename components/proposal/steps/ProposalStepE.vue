<template>
  <div>
    <div class="pt-stepE-layout">
      <!-- 좌측: 썸네일 그리드 -->
      <div class="pt-panel">
        <h3 class="pt-panel-title">전체 검토</h3>
        <p class="pt-panel-desc">생성된 슬라이드를 전체 확인하고, 우측 채팅으로 전역 보완 지시를 내릴 수 있습니다.</p>
        <div class="pt-thumb-grid">
          <div
            v-for="(sec, idx) in sectionList"
            :key="sec.sectionId"
            class="pt-thumb"
          >
            <div class="pt-thumb-img">
              <div class="pt-thumb-mini">
                <div class="pt-thumb-l1" />
                <div class="pt-thumb-l2" />
              </div>
            </div>
            <div class="pt-thumb-cap">
              <b>{{ idx + 1 }}. {{ sec.title }}</b>
              <i
                class="icon-check size-14"
                style="color: var(--color-primary)"
              />
            </div>
          </div>
        </div>
        <UiEmpty
          v-if="sectionList.length === 0"
          title="생성된 슬라이드가 없습니다."
        />
      </div>

      <!-- 우측: 전역 보완 채팅 -->
      <div class="pt-chat-side">
        <div class="pt-chat-head">💬 전체 보완 채팅</div>
        <div class="pt-chat-body">
          <div class="pt-chat-msg is-ai">
            전체 소목차 생성이 완료됐습니다. 슬라이드를 확인하고 수정하고 싶은 부분을 말씀해주세요.
          </div>
        </div>
        <div class="pt-chat-input">
          <input
            v-model="reviewChatInput"
            class="pt-chat-input-field"
            placeholder="수정 요청을 입력하세요"
            @keydown.enter="onSendReviewChat"
          />
          <UiButton
            variant="primary"
            size="sm"
            @click="onSendReviewChat"
          >
            전송
          </UiButton>
        </div>
      </div>
    </div>

    <div
      class="pt-panel-actions"
      style="margin-top: 18px"
    >
      <UiButton
        variant="primary"
        size="md"
        @click="emit('next')"
      >
        검토 완료 · 출력하기
        <template #icon-right>
          <i class="icon-arrow-right size-14" />
        </template>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PtSection } from '~/types/proposal'

interface Props {
  sectionList: PtSection[]
}

defineProps<Props>()

const emit = defineEmits<{
  next: []
}>()

const reviewChatInput = ref('')

const onSendReviewChat = () => {
  // TODO: 전역 보완 채팅 API 연동 시 교체
  reviewChatInput.value = ''
}
</script>
