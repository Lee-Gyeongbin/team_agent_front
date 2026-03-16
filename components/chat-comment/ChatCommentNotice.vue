<template>
  <div class="chat-comment-greeting">
    <div class="chat-comment-section-header">
      <h3 class="chat-comment-section-title">안내멘트 설정</h3>
      <div class="chat-comment-setting-footer">
        <UiButton
          variant="primary"
          @click="onSave"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          @click="onReset"
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
            <UiToggle v-model="noticeForm.feature.isEnabled" />
          </div>
          <p class="chat-comment-setting-desc">챗봇이 제공하는 주요 기능 설명</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="noticeForm.feature.message"
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
            v-model="noticeForm.feature.condition"
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
            <UiToggle v-model="noticeForm.guide.isEnabled" />
          </div>
          <p class="chat-comment-setting-desc">사용자가 효과적으로 질문하는 방법 안내</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">가이드 메시지</label>
          <UiTextarea
            v-model="noticeForm.guide.message"
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
            <UiToggle v-model="noticeForm.privacy.isEnabled" />
          </div>
          <p class="chat-comment-setting-desc">민감 정보 입력 주의 안내</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="noticeForm.privacy.message"
            :rows="5"
            border
            size="sm"
            auto-resize
            :max-rows="10"
            placeholder="개인정보 보호 안내 메시지를 입력하세요"
          />
        </div>

        <UiCheckbox
          v-model="noticeForm.privacy.isAutoDetect"
          label="민감정보 패턴 감지 시 자동 표시"
        />
      </div>

      <!-- 서비스 제한 안내 -->
      <div class="chat-comment-notice-block">
        <div class="chat-comment-setting-header">
          <div class="chat-comment-setting-info">
            <span class="chat-comment-setting-name">서비스 제한 안내</span>
            <UiToggle v-model="noticeForm.limitation.isEnabled" />
          </div>
          <p class="chat-comment-setting-desc">AI의 한계 및 제한사항 설명</p>
        </div>

        <div class="chat-comment-setting-body">
          <label class="chat-comment-setting-label">안내 메시지</label>
          <UiTextarea
            v-model="noticeForm.limitation.message"
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
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
interface NoticeItem {
  isEnabled: boolean
  message: string
}

interface NoticeForm {
  feature: NoticeItem & { condition: string }
  guide: NoticeItem
  privacy: NoticeItem & { isAutoDetect: boolean }
  limitation: NoticeItem
}

const conditionOptions = [
  { label: '사용자가 "기능" 또는 "도움말" 입력 시', value: 'keyword' },
  { label: '첫 방문 시 자동 표시', value: 'first_visit' },
  { label: '항상 표시', value: 'always' },
]

const getDefaultForm = (): NoticeForm => ({
  feature: {
    isEnabled: true,
    message: 'TeamAgent는 다음과 같은 기능을 제공합니다:\n\n📋 일반 질의응답 · 업무 관련 질문에 답변드립니다\n📄 문서 검색(RAG) · 업로드된 문서에서 정보를 찾아드립니다\n📊 데이터 분석(SQL) · 데이터베이스 조회 및 분석을 지원합니다',
    condition: 'keyword',
  },
  guide: {
    isEnabled: true,
    message: '더 정확한 답변을 위한 질문 팁:\n\n✅ 구체적으로 질문해주세요\n  예: "지난주 매출은?" → "2024년 1월 15일~21일 매출 현황을 알려줘"',
  },
  privacy: {
    isEnabled: true,
    message: '🔒 개인정보 보호 안내\n\n주민등록번호, 신용카드 번호, 비밀번호 등 민감한 개인정보는 입력하지 말아주세요.\n모든 대화 내용은 암호화되어 저장되며, 보안 정책에 따라 관리됩니다.',
    isAutoDetect: true,
  },
  limitation: {
    isEnabled: true,
    message: 'ℹ️ AI 어시스턴트의 한계\n\n• 2024년 1월까지의 데이터를 기반으로 답변합니다\n• 실시간 정보나 최신 뉴스는 제공하지 못할 수 있습니다\n• 복잡한 계산이나 전문적인 법률/의료 상담은 전문가와 상담하세요',
  },
})

const noticeForm = ref<NoticeForm>(getDefaultForm())

const onSave = () => {
  console.warn('[TODO] 안내멘트 저장:', noticeForm.value)
}

const onReset = () => {
  noticeForm.value = getDefaultForm()
}
</script>
