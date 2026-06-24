<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="editingUrl ? 'URL 수정' : 'URL 등록'"
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
          v-model="form.categoryId"
          :options="categoryOptions"
          placeholder="카테고리 선택"
          size="md"
        />
      </div>

      <!-- URL 이름 -->
      <div class="url-reg-field">
        <label class="url-reg-label">URL 이름 <span class="required">*</span></label>
        <UiInput
          ref="urlNameRef"
          v-model="form.urlName"
          placeholder="예: 공식 블로그"
          size="md"
        />
      </div>

      <!-- URL 주소 -->
      <div class="url-reg-field">
        <label class="url-reg-label">URL 주소 <span class="required">*</span></label>
        <UiInput
          ref="urlAddrRef"
          v-model="form.urlAddr"
          placeholder="https://example.com"
          size="md"
        />
      </div>

      <!-- 수집주기 + 스크래핑 단계 -->
      <div class="url-reg-field url-reg-row">
        <div class="url-reg-col">
          <label class="url-reg-label">수집 주기</label>
          <UiSelect
            v-model="form.crawlIntvl"
            :options="cycleOptions"
            size="md"
          />
        </div>
        <div class="url-reg-col">
          <label class="url-reg-label">스크래핑 단계</label>
          <UiSelect
            v-model="form.crawlDpth"
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
import type { UrlItem } from '~/types/repository'
import { openToast } from '~/composables/useToast'

const props = defineProps<{
  isOpen: boolean
  categoryOptions: { label: string; value: string }[]
  initialCategoryId?: string
  editingUrl?: UrlItem | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: Record<string, any>]
}>()

const urlNameRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)
const urlAddrRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)

const focusField = (fieldRef: typeof urlNameRef) => {
  nextTick(() => {
    const el = fieldRef.value?.$el || fieldRef.value
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = el.querySelector('input') || el
      if ('focus' in input) (input as HTMLElement).focus()
    }
  })
}

const form = ref({
  urlId: '',
  active: true,
  categoryId: '',
  urlName: '',
  urlAddr: '',
  crawlIntvl: 'DAILY',
  crawlDpth: '1',
})

const cycleOptions = [
  { label: '매일', value: 'DAILY' },
  { label: '매주', value: 'WEEKLY' },
  { label: '수동', value: 'MANUAL' },
]

const depthOptions = [
  { label: '1단계', value: '1' },
  { label: '2단계', value: '2' },
  { label: '3단계', value: '3' },
]

const resetForm = () => {
  if (props.editingUrl) {
    form.value = {
      urlId: props.editingUrl.urlId,
      active: props.editingUrl.useYn === 'Y',
      categoryId: props.editingUrl.categoryId ?? '',
      urlName: props.editingUrl.urlName,
      urlAddr: props.editingUrl.urlAddr,
      crawlIntvl: props.editingUrl.crawlIntvl || 'DAILY',
      crawlDpth: String(props.editingUrl.crawlDpth ?? '1'),
    }
  } else {
    form.value = {
      urlId: '',
      active: true,
      categoryId: props.initialCategoryId ?? '',
      urlName: '',
      urlAddr: '',
      crawlIntvl: 'DAILY',
      crawlDpth: '1',
    }
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) resetForm()
  },
)

const onSave = () => {
  if (!form.value.urlName.trim()) {
    openToast({ message: 'URL 이름을 입력해주세요.', type: 'warning' })
    focusField(urlNameRef)
    return
  }
  if (!form.value.urlAddr.trim()) {
    openToast({ message: 'URL 주소를 입력해주세요.', type: 'warning' })
    focusField(urlAddrRef)
    return
  }
  emit('save', { ...form.value })
  resetForm()
  emit('close')
}
</script>
