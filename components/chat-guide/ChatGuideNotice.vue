<template>
  <div class="chat-guide-panel">
    <div class="chat-guide-section-header">
      <h3 class="chat-guide-section-title">안내멘트 설정</h3>
      <div class="chat-guide-setting-footer">
        <UiButton
          variant="primary"
          :disabled="isLoading"
          @click="onSave"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          :disabled="isLoading"
          @click="onReset"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <UiLoading
      v-if="isLoading"
      overlay
      text="안내멘트를 불러오는 중..."
    />

    <UiEmpty
      v-else-if="isError"
      :title="errorTitle"
      :description="errorMessage"
    >
      <UiButton
        size="sm"
        variant="secondary"
        @click="load"
      >
        다시 시도
      </UiButton>
    </UiEmpty>

    <div
      v-else
      class="chat-guide-notice-list"
    >
      <!-- 사용 가능 기능 안내 -->
      <div class="chat-guide-notice-block">
        <div class="chat-guide-setting-header">
          <div class="chat-guide-setting-info">
            <span class="chat-guide-setting-name">사용 가능 기능 안내</span>
            <UiToggle
              :model-value="localNoticeForm.feature.enblYn === 'Y'"
              @update:model-value="(v) => (localNoticeForm.feature.enblYn = toYn(v))"
            />
          </div>
          <p class="chat-guide-setting-desc">챗봇이 제공하는 주요 기능 설명</p>
        </div>

        <div class="chat-guide-setting-body">
          <label class="chat-guide-setting-label">안내 메시지</label>
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

        <div class="chat-guide-notice-condition">
          <span class="chat-guide-notice-condition-label">표시 조건:</span>
          <UiSelect
            v-model="localNoticeForm.feature.dsplCond"
            :options="chatGuideNoticeConditionOptions"
            size="sm"
          />
        </div>
      </div>

      <!-- 입력 방법 가이드 -->
      <div class="chat-guide-notice-block">
        <div class="chat-guide-setting-header">
          <div class="chat-guide-setting-info">
            <span class="chat-guide-setting-name">입력 방법 가이드</span>
            <UiToggle
              :model-value="localNoticeForm.guide.enblYn === 'Y'"
              @update:model-value="(v) => (localNoticeForm.guide.enblYn = toYn(v))"
            />
          </div>
          <p class="chat-guide-setting-desc">사용자가 효과적으로 질문하는 방법 안내</p>
        </div>

        <div class="chat-guide-setting-body">
          <label class="chat-guide-setting-label">가이드 메시지</label>
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
      <div class="chat-guide-notice-block">
        <div class="chat-guide-setting-header">
          <div class="chat-guide-setting-info">
            <span class="chat-guide-setting-name">개인정보 보호 안내</span>
            <UiToggle
              :model-value="localNoticeForm.privacy.enblYn === 'Y'"
              @update:model-value="(v) => (localNoticeForm.privacy.enblYn = toYn(v))"
            />
          </div>
          <p class="chat-guide-setting-desc">민감 정보 입력 주의 안내</p>
        </div>

        <div class="chat-guide-setting-body">
          <label class="chat-guide-setting-label">안내 메시지</label>
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
          @update:model-value="(v) => (localNoticeForm.privacy.autoDetectYn = toYn(v))"
        />
      </div>

      <!-- 서비스 제한 안내 -->
      <div class="chat-guide-notice-block">
        <div class="chat-guide-setting-header">
          <div class="chat-guide-setting-info">
            <span class="chat-guide-setting-name">서비스 제한 안내</span>
            <UiToggle
              :model-value="localNoticeForm.limitation.enblYn === 'Y'"
              @update:model-value="(v) => (localNoticeForm.limitation.enblYn = toYn(v))"
            />
          </div>
          <p class="chat-guide-setting-desc">AI의 한계 및 제한사항 설명</p>
        </div>

        <div class="chat-guide-setting-body">
          <label class="chat-guide-setting-label">안내 메시지</label>
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
import { toYn, useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const { localNoticeForm, chatGuideNoticeConditionOptions, handleSelectNotice, handleSaveNotice } = useChatGuideStore()

const isLoading = ref(false)
const isError = ref(false)
const errorMessage = ref('')
const errorTitle = ref('불러오기 실패')

const load = async () => {
  isLoading.value = true
  isError.value = false
  errorMessage.value = ''
  try {
    await handleSelectNotice()
  } catch (err) {
    isError.value = true
    errorMessage.value =
      err instanceof Error && err.message
        ? `안내멘트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`
        : '안내멘트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
  }
}

const onSave = async () => {
  const confirmed = await openConfirm({
    title: '안내멘트 저장',
    message: '변경된 안내멘트 내용을 저장하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await handleSaveNotice(localNoticeForm.value)
    openToast({ message: '저장되었습니다.', type: 'success' })
  } catch (err) {
    openToast({
      message:
        err instanceof Error && err.message
          ? `안내멘트 설정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`
          : '안내멘트 설정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      type: 'error',
    })
  }
}

const onReset = async () => {
  const confirmed = await openConfirm({
    title: '안내멘트 초기화',
    message: '초기화 시 변경된 안내멘트 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await load()
    openToast({ message: '안내멘트 설정이 초기화되었습니다.', type: 'info' })
  } catch {
    // load에서 UI로 에러 처리
  }
}

onMounted(() => {
  load()
})
</script>
