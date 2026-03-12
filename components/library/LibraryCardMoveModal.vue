<template>
  <div class="library-card-move-modal">
    <div class="library-card-move-body">
      <div
        v-if="moveTargetOptions.length === 0"
        class="library-card-move-empty"
      >
        <p>이동할 수 있는 다른 카테고리가 없습니다.</p>
      </div>
      <div
        v-else
        class="form-row"
      >
        <label class="form-label">이동할 카테고리</label>
        <UiSelect
          v-model="selectedCategoryId"
          :options="moveTargetOptions"
          placeholder="카테고리를 선택하세요"
          size="md"
        />
      </div>
    </div>
    <div class="modal-dialog-footer">
      <UiButton
        class="btn-modal-dialog"
        variant="outline"
        size="xlg"
        @click="emit('close')"
      >
        취소
      </UiButton>
      <UiButton
        class="btn-modal-dialog"
        variant="dark"
        size="xlg"
        :disabled="!selectedCategoryId || moveTargetOptions.length === 0"
        @click="onMove"
      >
        이동
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LibraryCard } from '~/types/library'
import type { SelectOption } from '~/components/ui/UiSelect.vue'

interface Props {
  card: LibraryCard | null
  moveTargetOptions: SelectOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  move: [targetCategoryId: string, cardId: string]
  close: []
}>()

const selectedCategoryId = ref<string | number>('')

watch(
  () => props.card,
  () => {
    selectedCategoryId.value = ''
  },
  { immediate: true },
)

const onMove = () => {
  const targetId = String(selectedCategoryId.value)
  if (!targetId) return
  const cardId = props.card?.cardId
  if (!cardId) return
  emit('move', targetId, cardId)
}
</script>

<style lang="scss" scoped>
.library-card-move-modal {
  padding: $spacing-md;
  width: 100%;
  align-self: stretch;
  min-width: 0;
}

.library-card-move-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.library-card-move-empty {
  padding: $spacing-md;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.modal-dialog-footer {
  margin-top: $spacing-lg;
  display: flex;
  gap: $spacing-sm;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  width: 100%;

  .form-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  :deep(.ui-select-wrap) {
    width: 100%;
    min-width: 0;
  }
}
</style>
