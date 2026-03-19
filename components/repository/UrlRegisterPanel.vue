<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    title="URL 등록"
    @close="$emit('close')"
  >
    <div class="com-setting-form">
      <!-- 상태 -->
      <div class="url-reg-field url-reg-status-field flex items-center justify-between">
        <div>
          <label class="url-reg-label">상태</label>
          <p class="url-reg-desc">활성화된 URL만 배치 수집 대상입니다.</p>
        </div>
        <UiToggle v-model="form.active" />
      </div>

      <!-- 카테고리 -->
      <div class="url-reg-field">
        <label class="url-reg-label">카테고리</label>
        <UiSelect
          v-model="form.category"
          :options="categoryOptions"
          placeholder="카테고리 선택"
          size="md"
        />
      </div>

      <!-- URL 이름 -->
      <div class="url-reg-field">
        <label class="url-reg-label">URL 이름 <span class="required">*</span></label>
        <UiInput
          v-model="form.urlName"
          placeholder="예: 공식 블로그"
          size="md"
        />
      </div>

      <!-- URL 주소 -->
      <div class="url-reg-field">
        <label class="url-reg-label">URL 주소 <span class="required">*</span></label>
        <UiInput
          v-model="form.urlAddress"
          placeholder="https://example.com"
          size="md"
        />
      </div>

      <!-- 수집주기 + 스크래핑 단계 -->
      <div class="url-reg-field url-reg-row">
        <div class="url-reg-col">
          <label class="url-reg-label">수집 주기</label>
          <UiSelect
            v-model="form.collectionCycle"
            :options="cycleOptions"
            size="md"
          />
        </div>
        <div class="url-reg-col">
          <label class="url-reg-label">스크래핑 단계</label>
          <UiSelect
            v-model="form.scrapingDepth"
            :options="depthOptions"
            size="md"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { openAlert } from '~/composables/useDialog'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: Record<string, any>]
}>()

const form = ref({
  active: true,
  category: '',
  urlName: '',
  urlAddress: '',
  collectionCycle: 'daily',
  scrapingDepth: '1',
})

const categoryOptions = [
  { label: '블로그', value: '블로그' },
  { label: '뉴스', value: '뉴스' },
  { label: '문서', value: '문서' },
  { label: '지원센터', value: '지원센터' },
  { label: '위키', value: '위키' },
]

const cycleOptions = [
  { label: '매일', value: 'daily' },
  { label: '매주', value: 'weekly' },
  { label: '매월', value: 'monthly' },
  { label: '수동', value: 'manual' },
]

const depthOptions = [
  { label: '1단계', value: '1' },
  { label: '2단계', value: '2' },
  { label: '3단계', value: '3' },
]

const resetForm = () => {
  form.value = {
    active: true,
    category: '',
    urlName: '',
    urlAddress: '',
    collectionCycle: 'daily',
    scrapingDepth: '1',
  }
}

const onSave = () => {
  if (!form.value.urlName.trim()) {
    openAlert({ title: '알림', message: 'URL 이름을 입력해주세요.' })
    return
  }
  if (!form.value.urlAddress.trim()) {
    openAlert({ title: '알림', message: 'URL 주소를 입력해주세요.' })
    return
  }
  emit('save', { ...form.value })
  resetForm()
  emit('close')
}
</script>
