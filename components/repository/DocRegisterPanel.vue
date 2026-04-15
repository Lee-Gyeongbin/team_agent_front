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
        <label class="url-reg-label">문서셋 제목 <span class="required">*</span></label>
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
          size="md"
          :rows="5"
          border
          :auto-resize="false"
        />
      </div>

      <!-- 파일첨부 — 파일 관리 탭 저장소에서 선택 -->
      <div class="url-reg-field">
        <label class="url-reg-label">파일첨부</label>
        <div class="doc-reg-file-actions flex flex-wrap items-center gap-2">
          <UiButton
            variant="line-secondary"
            size="md"
            @click="onOpenFilePicker"
          >
            <template #icon-left>
              <i class="icon icon-plus size-16" />
            </template>
            파일 등록
          </UiButton>
          <span class="doc-reg-file-hint">파일 관리 탭에 등록된 파일만 선택할 수 있습니다. (최대 5개)</span>
        </div>
        <ul
          v-if="form.attachedFileList.length > 0"
          class="doc-reg-attached-list"
        >
          <li
            v-for="(file, index) in form.attachedFileList"
            :key="`${file.docFileId}-${index}`"
            class="doc-reg-attached-item flex items-center justify-between gap-2"
          >
            <span class="doc-reg-attached-name">{{ file.fileName }}</span>
            <UiButton
              variant="ghost"
              size="xxs"
              icon-only
              aria-label="첨부 제거"
              @click="onRemoveAttachedFile(file, index)"
            >
              <template #icon-left>
                <i class="icon icon-close size-14" />
              </template>
            </UiButton>
          </li>
        </ul>
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

    <FileLibraryPickerModal
      :is-open="isFilePickerOpen"
      :category-id="pickerCategoryId"
      :exclude-doc-file-ids="attachedDocFileIds"
      :max-files="5"
      @close="isFilePickerOpen = false"
      @confirm="onFilePickerConfirm"
    />
  </UiModal>
</template>

<script setup lang="ts">
import type { CategoryTreeItem, Document, FileItem } from '~/types/repository'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'
import FileLibraryPickerModal from '~/components/repository/FileLibraryPickerModal.vue'
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

const isFilePickerOpen = ref(false)
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
  dsDocCnt: '0',
  docTitle: '',
  categoryId: '',
  author: '',
  secLvl: '',
  content: '',
  files: [] as File[],
  attachedFileList: [] as FileItem[],
  /** 수정 시 기존 파일 중 사용자가 삭제한 대상 docFileId 목록 */
  deleteFileIds: [] as string[],
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

const pickerCategoryId = computed(() => docSelectedCategoryId.value.trim() || form.value.categoryId.trim())

const attachedDocFileIds = computed(() =>
  form.value.attachedFileList.map((f) => String(f.docFileId ?? '').trim()).filter(Boolean),
)

const onOpenFilePicker = () => {
  if (!pickerCategoryId.value) {
    openToast({ message: '카테고리를 먼저 선택해 주세요.', type: 'warning' })
    focusField(categoryFieldRef)
    return
  }
  isFilePickerOpen.value = true
}

const onFilePickerConfirm = (items: FileItem[]) => {
  const existing = new Set(attachedDocFileIds.value)
  const merged = [...form.value.attachedFileList]
  for (const item of items) {
    const id = String(item.docFileId ?? '').trim()
    if (!id || existing.has(id)) continue
    if (merged.length >= 5) {
      openToast({ message: '파일은 최대 5개까지 첨부할 수 있습니다.', type: 'warning' })
      break
    }
    merged.push(item)
    existing.add(id)
  }
  form.value.attachedFileList = merged
}

const applyInitialFromDocument = (src: Partial<Document>) => {
  form.value = {
    docId: String(src.docId ?? '').trim(),
    dsDocCnt: String(src.dsDocCnt ?? '0'),
    docTitle: String(src.docTitle ?? ''),
    categoryId: String(src.categoryId ?? ''),
    author: String(src.author ?? ''),
    secLvl: String(src.secLvl ?? ''),
    content: String(src.content ?? '').slice(0, 500),
    files: [],
    attachedFileList: Array.isArray(src.attachedFileList) ? src.attachedFileList : [],
    deleteFileIds: [],
    keywords: String(src.keywords ?? ''),
    refUrl: String(src.refUrl ?? ''),
  }
}

const resetForm = () => {
  form.value = {
    docId: '',
    dsDocCnt: '0',
    docTitle: '',
    categoryId: '',
    author: '',
    secLvl: '',
    content: '',
    files: [],
    attachedFileList: [],
    deleteFileIds: [],
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
  const linkDocFileIds = form.value.attachedFileList
    .filter((f) => !String(f.docId ?? '').trim())
    .map((f) => String(f.docFileId ?? '').trim())
    .filter(Boolean)
  const payload = {
    ...form.value,
    categoryId: resolvedCategoryId,
    // longtext -> varchar(500) 변경 대응: 저장 전 안전하게 최대 길이 보장
    content: String(form.value.content ?? '').slice(0, 500),
    linkDocFileIds,
  }
  const ok = await onSaveDocument(payload)
  if (!ok) return
  resetForm()
  emit('close')
}

const onRemoveAttachedFile = (file: FileItem, index: number) => {
  const docFileId = String(file.docFileId ?? '').trim()
  if (docFileId) {
    if (!form.value.deleteFileIds.includes(docFileId)) {
      form.value.deleteFileIds = [...form.value.deleteFileIds, docFileId]
    }
  }
  form.value.attachedFileList = form.value.attachedFileList.filter((_, i) => i !== index)
}
</script>

<style lang="scss" scoped>
.doc-reg-file-hint {
  color: var(--color-text-secondary, #666);
  @include typo($body-xsmall);
}

.doc-reg-attached-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.12));
  border-radius: $border-radius-base;
}

.doc-reg-attached-item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.12));

  &:last-child {
    border-bottom: none;
  }
}

.doc-reg-attached-name {
  @include typo($body-small);
  word-break: break-all;
}
</style>
