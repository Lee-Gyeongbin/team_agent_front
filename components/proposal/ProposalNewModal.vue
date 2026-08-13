<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="pt-modal-overlay"
      @click.self="onClose"
    >
      <div class="pt-modal">
        <div class="pt-modal-header">
          <h2 class="pt-modal-title">새 PT 제안 시작</h2>
          <button
            class="pt-modal-close"
            @click="onClose"
          >
            <i class="icon-close size-18" />
          </button>
        </div>

        <div class="pt-modal-body">
          <div class="pt-form-field">
            <label class="pt-form-label">사업명 <span class="pt-req">*</span></label>
            <UiInput
              v-model="form.projectNm"
              placeholder="예) 전자여행허가(K-ETA) 3차 고도화 사업"
              size="sm"
            />
          </div>
          <div class="pt-form-field">
            <label class="pt-form-label">발주기관</label>
            <UiInput
              v-model="form.orgNm"
              placeholder="예) 법무부 서울출입국·외국인청"
              size="sm"
            />
          </div>
          <div class="pt-form-field">
            <label class="pt-form-label">사업개요</label>
            <textarea
              v-model="form.summary"
              class="pt-textarea"
              placeholder="사업의 목적, 범위, 주요 요구사항을 간단히 입력하세요 (선택)"
              rows="3"
            />
          </div>
          <div class="pt-form-field">
            <label class="pt-form-label">제안 구분</label>
            <div class="pt-toggle-row">
              <button
                :class="['pt-toggle-opt', { 'is-active': form.targetTypeCd === 'G' }]"
                @click="form.targetTypeCd = 'G'"
              >
                공공
              </button>
              <button
                :class="['pt-toggle-opt', { 'is-active': form.targetTypeCd === 'P' }]"
                @click="form.targetTypeCd = 'P'"
              >
                민간
              </button>
            </div>
          </div>
          <div class="pt-form-field">
            <label class="pt-form-label">제출 마감일</label>
            <UiInput
              v-model="form.dueDt"
              placeholder="YYYY-MM-DD (선택)"
              size="sm"
            />
          </div>
        </div>

        <div class="pt-modal-footer">
          <UiButton
            variant="ghost"
            size="md"
            @click="onClose"
          >
            취소
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            :loading="isSaving"
            @click="onSubmit"
          >
            시작
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'

interface Props {
  isOpen: boolean
  isSaving?: boolean
}

withDefaults(defineProps<Props>(), { isSaving: false })

const emit = defineEmits<{
  close: []
  submit: [form: { projectNm: string; orgNm: string; summary: string; targetTypeCd: 'G' | 'P'; dueDt: string }]
}>()

// TODO: 테스트용 기본값 — 추후 삭제 예정 (빈 값으로 되돌릴 것)
const defaultForm = () => ({
  projectNm: '전자여행허가(K-ETA) 3차 고도화 사업',
  orgNm: '법무부 서울출입국·외국인청',
  summary: '사업의 목적, 범위, 주요 요구사항을 간단히 입력하세요 (선택)',
  targetTypeCd: 'G' as 'G' | 'P',
  dueDt: '2026-08-30',
})

const form = ref(defaultForm())

const onClose = () => {
  form.value = defaultForm()
  emit('close')
}

const onSubmit = () => {
  if (!form.value.projectNm.trim()) {
    openToast({ message: '사업명을 입력해주세요.', type: 'warning' })
    return
  }
  emit('submit', { ...form.value })
}
</script>
