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
          :max-length="300"
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
          :max-length="100"
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
          :max-length="500"
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
          :attached-file-list="form.attachedFileList"
          :is-downloadable="true"
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
          :max-length="500"
        />
      </div>

      <!-- 참고 URL -->
      <div class="url-reg-field">
        <label class="url-reg-label">참고URL</label>
        <UiInput
          v-model="form.refUrl"
          placeholder="https://"
          size="md"
          :max-length="500"
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
import type { CategoryTreeItem, Document, FileItem } from '~/types/repository'
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
}>()

const { categoryList } = useCategoryStore()
const { secLvlOptions, onSaveDocument, docSelectedCategoryId } = useRepositoryStore()
const docTitleRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null)
const categoryFieldRef = ref<HTMLElement | null>(null)

type FocusFieldValue = { $el?: HTMLElement } | HTMLElement | null | undefined
const isVueComponentLike = (value: FocusFieldValue): value is { $el?: HTMLElement } =>
  !!value && typeof value === 'object' && '$el' in value

const focusField = (fieldRef: { value: FocusFieldValue }) => {
  nextTick(() => {
    const raw = fieldRef.value
    const el = raw && isVueComponentLike(raw) ? raw.$el : raw
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
  attachedFileList: [] as FileItem[],
  keywords: '',
  refUrl: '',
})

const modalTitle = computed(() => (form.value.docId ? '문서 수정' : '문서 등록'))

// 선택된 카테고리명 표시 (트리 선택 docSelectedCategoryId 우선, 없으면 모달에서 고른 form.categoryId)
const selectedCategoryName = computed(() => {
  const id = docSelectedCategoryId.value.trim() || form.value.categoryId
  if (!id) return ''
  const findName = (items: CategoryTreeItem[]): string => {
    for (const item of items) {
      if (item.categoryId === id) return item.categoryName
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
    content: String(src.content ?? '').slice(0, 500),
    files: [],
    attachedFileList: Array.isArray(src.attachedFileList) ? src.attachedFileList : [],
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
    attachedFileList: [],
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

const onSave = async () => {
  if (!form.value.docTitle.trim()) {
    openToast({ message: '문서 제목을 입력해주세요.', type: 'warning' })
    focusField(docTitleRef)
    return
  }
  const resolvedCategoryId = docSelectedCategoryId.value.trim() || form.value.categoryId.trim()
  if (!resolvedCategoryId) {
    openToast({ message: '카테고리를 선택해주세요.', type: 'warning' })
    focusField(categoryFieldRef)
    return
  }
  const payload = {
    ...form.value,
    // longtext -> varchar(500) 변경 대응: 저장 전 안전하게 최대 길이 보장
    content: String(form.value.content ?? '').slice(0, 500),
  }
  const ok = await onSaveDocument(payload)
  if (!ok) return
  resetForm()
  emit('close')
}
</script>
