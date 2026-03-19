<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    title="문서 등록"
    @close="$emit('close')"
  >
    <div class="com-setting-form">
      <!-- 문서 제목 -->
      <div class="url-reg-field">
        <label class="url-reg-label">문서 제목 <span class="required">*</span></label>
        <UiInput
          ref="titleRef"
          v-model="form.title"
          placeholder="문서 제목을 입력하세요"
          size="md"
        />
      </div>

      <!-- 카테고리 -->
      <div
        ref="categoryFieldRef"
        class="url-reg-field"
      >
        <label class="url-reg-label">카테고리 <span class="required">*</span></label>
        <div class="doc-reg-category-row flex items-center">
          <UiInput
            :model-value="selectedCategoryName"
            placeholder="카테고리 선택"
            size="md"
            readonly
            class="doc-reg-category-input"
          />
          <UiButton
            variant="line-secondary"
            size="md"
            @click="isCategoryModalOpen = true"
          >
            선택
          </UiButton>
        </div>
      </div>

      <!-- 작성자 -->
      <div class="url-reg-field">
        <label class="url-reg-label">작성자</label>
        <UiInput
          v-model="form.author"
          placeholder="작성자명"
          size="md"
        />
      </div>

      <!-- 보안등급 -->
      <div class="url-reg-field">
        <label class="url-reg-label">보안등급</label>
        <UiSelect
          v-model="form.security"
          :options="securityOptions"
          placeholder="선택"
          size="md"
        />
      </div>

      <!-- 문서내용 -->
      <div class="url-reg-field">
        <label class="url-reg-label">문서내용</label>
        <UiTextarea
          v-model="form.content"
          placeholder="문서 내용을 입력하세요"
          :rows="5"
          border
          :auto-resize="false"
        />
      </div>

      <!-- 파일첨부 -->
      <div class="url-reg-field">
        <label class="url-reg-label">파일첨부</label>
        <UiFileUpload v-model="form.files" />
      </div>

      <!-- 키워드 -->
      <div class="url-reg-field">
        <label class="url-reg-label">키워드</label>
        <UiInput
          v-model="form.keywords"
          placeholder="쉼표로 구분하여 입력 (예: 매뉴얼, ERP, 사용법)"
          size="md"
        />
      </div>

      <!-- 참고 URL -->
      <div class="url-reg-field">
        <label class="url-reg-label">참고URL</label>
        <UiInput
          v-model="form.refUrl"
          placeholder="https://"
          size="md"
        />
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

    <!-- 카테고리 선택 모달 -->
    <CategorySelectModal
      :is-open="isCategoryModalOpen"
      @close="isCategoryModalOpen = false"
      @confirm="onCategoryConfirm"
    />
  </UiModal>
</template>

<script setup lang="ts">
import type { CategoryItem } from '~/types/repository'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'
import { openToast } from '~/composables/useToast'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: Record<string, any>]
}>()

const { categoryList } = useRepositoryStore()

const titleRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)
const categoryFieldRef = ref<HTMLElement | null>(null)

const focusField = (fieldRef: { value: any }) => {
  nextTick(() => {
    const el = fieldRef.value?.$el || fieldRef.value
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = el.querySelector('input') || el
      if ('focus' in input) (input as HTMLElement).focus()
    }
  })
}

const isCategoryModalOpen = ref(false)

const form = ref({
  title: '',
  categoryId: '',
  author: '',
  security: '',
  content: '',
  files: [] as File[],
  keywords: '',
  refUrl: '',
})

// 선택된 카테고리명 표시
const selectedCategoryName = computed(() => {
  if (!form.value.categoryId) return ''
  const findName = (items: CategoryItem[]): string => {
    for (const item of items) {
      if (item.id === form.value.categoryId) return item.name
      if (item.children?.length) {
        const found = findName(item.children)
        if (found) return found
      }
    }
    return ''
  }
  return findName(categoryList.value)
})

const securityOptions = [
  { label: '일반(공개)', value: 'public' },
  { label: '내부', value: 'internal' },
  { label: '대외비', value: 'confidential' },
  { label: '기밀', value: 'secret' },
]

const onCategoryConfirm = (selectedIds: string[]) => {
  // 마지막 선택된 카테고리 사용
  form.value.categoryId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : ''
}

const resetForm = () => {
  form.value = {
    title: '',
    categoryId: '',
    author: '',
    security: '',
    content: '',
    files: [],
    keywords: '',
    refUrl: '',
  }
}

const onSave = () => {
  if (!form.value.title.trim()) {
    openToast({ message: '문서 제목을 입력해주세요.', type: 'warning' })
    focusField(titleRef)
    return
  }
  if (!form.value.categoryId) {
    openToast({ message: '카테고리를 선택해주세요.', type: 'warning' })
    focusField(categoryFieldRef)
    return
  }
  emit('save', { ...form.value })
  resetForm()
  emit('close')
}
</script>
