<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="modalTitle"
    @close="$emit('close')"
  >
    <div class="com-setting-form">
      <!-- 문서 제목 -->
      <div class="url-reg-field">
        <label class="url-reg-label">문서 제목 <span class="required">*</span></label>
        <UiInput
          ref="docTitleRef"
          v-model="form.docTitle"
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
          v-model="form.secLvl"
          :options="secLvlOptions"
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
        <UiFileUpload
          v-model="form.files"
          :max-files="5"
        />
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
import type { CategoryTreeItem, Document } from '~/types/repository'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'
import { openToast } from '~/composables/useToast'
import { useCategoryStore } from '~/composables/repository/useCategoryStore'

const props = defineProps<{
  isOpen: boolean
  /** 행 클릭·상세 조회로 열 때 채울 데이터 (신규 등록은 null) */
  initialData?: Partial<Document> | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: Record<string, any>]
}>()

const { categoryList } = useCategoryStore()
const { secLvlOptions } = useRepositoryStore()
const docTitleRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)
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
  docId: '',
  docTitle: '',
  categoryId: '',
  author: '',
  secLvl: '',
  content: '',
  files: [] as File[],
  keywords: '',
  refUrl: '',
})

const modalTitle = computed(() => (form.value.docId ? '문서 수정' : '문서 등록'))

// 선택된 카테고리명 표시
const selectedCategoryName = computed(() => {
  if (!form.value.categoryId) return ''
  const findName = (items: CategoryTreeItem[]): string => {
    for (const item of items) {
      if (item.categoryId === form.value.categoryId) return item.categoryName
      if (item.children?.length) {
        const found = findName(item.children)
        if (found) return found
      }
    }
    return ''
  }
  return findName(categoryList.value)
})

const onCategoryConfirm = (selectedId: string) => {
  form.value.categoryId = selectedId || ''
}

const applyInitialFromDocument = (src: Partial<Document>) => {
  form.value = {
    docId: String(src.docId ?? '').trim(),
    docTitle: String(src.docTitle ?? ''),
    categoryId: String(src.categoryId ?? ''),
    author: String(src.author ?? ''),
    secLvl: String(src.secLvl ?? ''),
    content: String(src.content ?? ''),
    files: [],
    keywords: String(src.keywords ?? ''),
    refUrl: String(src.refUrl ?? ''),
  }
}

const resetForm = () => {
  form.value = {
    docId: '',
    docTitle: '',
    categoryId: '',
    author: '',
    secLvl: '',
    content: '',
    files: [],
    keywords: '',
    refUrl: '',
  }
}

// 패널이 열릴 때·같은 세션에서 다른 행 선택 시: 상세 데이터 또는 빈 폼
watch(
  () => [props.isOpen, props.initialData?.docId ?? ''] as const,
  ([open]) => {
    if (!open) return
    nextTick(() => {
      const init = props.initialData
      if (init && String(init.docId ?? '').trim()) {
        applyInitialFromDocument(init)
      } else {
        resetForm()
      }
    })
  },
)

const onSave = () => {
  if (!form.value.docTitle.trim()) {
    openToast({ message: '문서 제목을 입력해주세요.', type: 'warning' })
    focusField(docTitleRef)
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
