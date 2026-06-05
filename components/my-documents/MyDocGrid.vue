<template>
  <div class="my-doc-grid">
    <MyDocCard
      v-for="doc in docs"
      :key="doc.docId"
      :doc="doc"
      :is-active="selectedDocId === doc.docId"
      @open="emit('openDoc', $event)"
      @menu-select="(doc, action) => emit('menuSelect', doc, action)"
    />

    <div
      v-if="docs.length === 0"
      class="my-doc-grid-empty"
    >
      <UiEmpty
        :icon="listFilter === 'archived' ? 'icon-archive' : 'icon-document'"
        :title="emptyTitle"
        :description="emptyDescription"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MyDoc } from '~/types/mydoc'

type ListFilter = 'saved' | 'archived'

interface Props {
  docs: MyDoc[]
  selectedDocId?: string | null
  listFilter: ListFilter
  emptyTitle: string
  emptyDescription: string
}

withDefaults(defineProps<Props>(), {
  selectedDocId: null,
})

const emit = defineEmits<{
  openDoc: [doc: MyDoc]
  menuSelect: [doc: MyDoc, action: string]
}>()
</script>
