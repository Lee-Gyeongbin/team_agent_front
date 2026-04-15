<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    title="파일 저장소에서 선택"
    max-width="560px"
    @close="$emit('close')"
  >
    <div class="file-library-picker">
      <UiInput
        v-model="keyword"
        type="search"
        placeholder="파일명 검색..."
        size="md"
        class="file-library-picker-search"
        @search="noop"
        @enter="noop"
      />

      <div
        v-if="loadError"
        class="file-library-picker-error flex flex-col items-center gap-2 py-6"
      >
        <p>{{ loadError }}</p>
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="loadList"
        >
          다시 시도
        </UiButton>
      </div>
      <UiLoading
        v-else-if="loading"
        text="불러오는 중..."
      />
      <UiEmpty
        v-else-if="filteredRows.length === 0"
        description="선택 가능한 파일이 없습니다."
      />
      <div
        v-else
        class="file-library-picker-list"
      >
        <label
          v-for="row in filteredRows"
          :key="row.docFileId"
          class="file-library-picker-row flex items-center gap-3"
        >
          <UiCheckbox
            :model-value="selectedIds.has(row.docFileId)"
            :disabled="isRowDisabled(row.docFileId)"
            @update:model-value="(v) => toggleRow(row, v)"
          />
          <span class="file-library-picker-name">{{ row.fileName }}</span>
          <span class="file-library-picker-meta">{{ row.fileSize }}</span>
        </label>
      </div>
      <p class="file-library-picker-hint">
        최대 {{ maxFiles }}개까지 선택할 수 있습니다. (현재 {{ selectedIds.size }}개)
      </p>
    </div>

    <template #footer>
      <div class="file-library-picker-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <div class="file-library-picker-footer-right">
          <UiButton
            variant="primary"
            size="md"
            @click="onConfirm"
          >
            확인
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import type { FileItem, FileLibraryItem } from '~/types/repository'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    categoryId: string
    excludeDocFileIds?: string[]
    maxFiles?: number
  }>(),
  {
    excludeDocFileIds: () => [],
    maxFiles: 5,
  },
)

const emit = defineEmits<{
  close: []
  confirm: [FileItem[]]
}>()

const { fetchFileLibraryList } = useRepositoryApi()

const loading = ref(false)
const loadError = ref('')
const rows = ref<FileLibraryItem[]>([])
const keyword = ref('')
const selectedIds = ref<Set<string>>(new Set())
const selectedById = ref<Map<string, FileLibraryItem>>(new Map())

const noop = () => {}

const excluded = computed(
  () => new Set((props.excludeDocFileIds ?? []).map((x) => String(x ?? '').trim()).filter(Boolean)),
)

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  let list = rows.value.filter((r) => !excluded.value.has(r.docFileId))
  if (kw) list = list.filter((r) => r.fileName.toLowerCase().includes(kw))
  return list
})

const isRowDisabled = (docFileId: string) => {
  if (selectedIds.value.has(docFileId)) return false
  return selectedIds.value.size >= props.maxFiles
}

const toggleRow = (row: FileLibraryItem, checked: boolean) => {
  const id = row.docFileId
  const next = new Set(selectedIds.value)
  const map = new Map(selectedById.value)
  if (checked) {
    if (next.size >= props.maxFiles) {
      openToast({ message: `파일은 최대 ${props.maxFiles}개까지 선택할 수 있습니다.`, type: 'warning' })
      return
    }
    next.add(id)
    map.set(id, row)
  } else {
    next.delete(id)
    map.delete(id)
  }
  selectedIds.value = next
  selectedById.value = map
}

const loadList = async () => {
  const cat = String(props.categoryId ?? '').trim()
  if (!cat) {
    loadError.value = '카테고리를 먼저 선택해 주세요.'
    rows.value = []
    return
  }
  loadError.value = ''
  loading.value = true
  try {
    const res = await fetchFileLibraryList({
      categoryId: cat,
      page: 1,
      pageSize: 200,
    })
    rows.value = res.dataList ?? []
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '목록을 불러오지 못했습니다.'
    rows.value = []
  } finally {
    loading.value = false
  }
}

const toFileItem = (row: FileLibraryItem): FileItem => ({
  docId: '',
  docFileId: row.docFileId,
  fileName: row.fileName,
  filePath: row.filePath,
  fileSize: row.fileSize,
  fileType: row.fileType,
  fileOrder: '1',
  useYn: 'Y',
})

const onConfirm = () => {
  const items: FileItem[] = []
  for (const id of selectedIds.value) {
    const row = selectedById.value.get(id)
    if (row) items.push(toFileItem(row))
  }
  emit('confirm', items)
  emit('close')
}

watch(
  () => [props.isOpen, props.categoryId] as const,
  ([open]) => {
    if (!open) return
    selectedIds.value = new Set()
    selectedById.value = new Map()
    keyword.value = ''
    void loadList()
  },
)
</script>

<style lang="scss" scoped>
.file-library-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
  width: 100%;
}

.file-library-picker-search {
  width: 100%;
}

.file-library-picker-list {
  max-height: min(360px, 50vh);
  overflow: auto;
  border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.12));
  border-radius: $border-radius-base;
  padding: 8px 12px;
}

.file-library-picker-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.12));
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }
}

.file-library-picker-name {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  @include typo($body-small);
}

.file-library-picker-meta {
  flex-shrink: 0;
  color: var(--color-text-secondary, #666);
  @include typo($body-xsmall);
}

.file-library-picker-hint {
  margin: 0;
  color: var(--color-text-secondary, #666);
  @include typo($body-xsmall);
}

.file-library-picker-error {
  color: var(--color-danger, #c62828);
}

.file-library-picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.file-library-picker-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
