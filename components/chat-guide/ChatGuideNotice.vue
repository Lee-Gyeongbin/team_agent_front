<template>
  <div class="chat-comment-panel">
    <div class="chat-comment-section-header">
      <h3 class="chat-comment-section-title">안내멘트 설정</h3>
      <div class="chat-comment-setting-footer">
        <UiButton
          variant="primary"
          @click="onSaveNotice"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          @click="onResetNotice"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <div class="chat-comment-notice-list">
      <!-- 사용 가능 기능 안내 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">사용 가능 기능 안내</span>
            <UiToggle
              :model-value="localNoticeForm.feature.enblYn === 'Y'"
              @update:model-value="(v) => handleToggleEnblYn(localNoticeForm.feature, v)"
            />
          </div>
          <p class="chat-comment-setting-desc">챗봇이 제공하는 주요 기능 설명</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="localNoticeForm.feature.content"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="기능 안내 메시지를 입력하세요"
          />
        </div>

        <div class="chat-comment-notice-condition">
          <span class="chat-comment-notice-condition-label">표시 조건:</span>
          <UiSelect
            v-model="localNoticeForm.feature.dsplCond"
            :options="conditionOptions"
            size="sm"
          />
        </div>
      </div>

      <!-- 입력 방법 가이드 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">입력 방법 가이드</span>
            <UiToggle
              :model-value="localNoticeForm.guide.enblYn === 'Y'"
              @update:model-value="(v) => handleToggleEnblYn(localNoticeForm.guide, v)"
            />
          </div>
          <p class="chat-comment-setting-desc">사용자가 효과적으로 질문하는 방법 안내</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">가이드 메시지</label>
          <UiTextarea
            v-model="localNoticeForm.guide.content"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="가이드 메시지를 입력하세요"
          />
        </div>
      </div>

      <!-- 개인정보 보호 안내 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">개인정보 보호 안내</span>
            <UiToggle
              :model-value="localNoticeForm.privacy.enblYn === 'Y'"
              @update:model-value="(v) => handleToggleEnblYn(localNoticeForm.privacy, v)"
            />
          </div>
          <p class="chat-comment-setting-desc">민감 정보 입력 주의 안내</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="localNoticeForm.privacy.content"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="개인정보 보호 안내 메시지를 입력하세요"
          />
        </div>

        <UiCheckbox
          :model-value="localNoticeForm.privacy.autoDetectYn === 'Y'"
          label="민감정보 패턴 감지 시 자동 표시"
          @update:model-value="(v) => handleToggleAutoDetectYn(localNoticeForm.privacy, v)"
        />
      </div>

      <!-- 서비스 제한 안내 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">서비스 제한 안내</span>
            <UiToggle
              :model-value="localNoticeForm.limitation.enblYn === 'Y'"
              @update:model-value="(v) => handleToggleEnblYn(localNoticeForm.limitation, v)"
            />
          </div>
          <p class="chat-comment-setting-desc">AI의 한계 및 제한사항 설명</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="localNoticeForm.limitation.content"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="서비스 제한 안내 메시지를 입력하세요"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { cloneChatNoticeForm, getEmptyChatNoticeForm, type ChatNoticeForm } from '~/types/chat-guide'
import { useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const {
  noticeForm,
  conditionOptions,
  handleSelectNotice,
  handleSaveNotice,
  handleToggleEnblYn,
  handleToggleAutoDetectYn,
} = useChatGuideStore()

const localNoticeForm = ref<ChatNoticeForm>(getEmptyChatNoticeForm())

const syncLocalNotice = () => {
  if (!noticeForm.value) return
  localNoticeForm.value = cloneChatNoticeForm(noticeForm.value)
}

onMounted(async () => {
  await handleSelectNotice()
  syncLocalNotice()
})

const onSaveNotice = async () => {
  openConfirm({
    title: '안내멘트 저장',
    message: '변경된 안내멘트 내용을 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        await handleSaveNotice(localNoticeForm.value)
        openToast({ message: '저장되었습니다.', type: 'success' })
      } catch {
        openToast({ message: '안내멘트 설정 저장 실패', type: 'error' })
      }
    },
  })
}

const onResetNotice = async () => {
  openConfirm({
    title: '안내멘트 초기화',
    message: '초기화 시 변경된 안내멘트 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
    onConfirm: async () => {
      await handleSelectNotice()
      syncLocalNotice()
      openToast({ message: '안내멘트 설정이 초기화되었습니다.', type: 'info' })
    },
  })
}
</script>
