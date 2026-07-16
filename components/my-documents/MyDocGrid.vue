<template>
  <draggable
    v-if="docs.length > 0"
    v-model="docsModel"
    class="my-doc-grid"
    item-key="docId"
    handle=".my-doc-card-drag"
    animation="200"
    :disabled="docs.length < 2"
    @start="emit('dragStart')"
    @end="emit('dragEnd')"
  >
    <template #item="{ element: doc }">
      <MyDocCard
        :doc="doc"
        :is-active="selectedDocId === doc.docId"
        :is-preview-target="previewDocId === doc.docId"
        @open="emit('openDoc', $event)"
        @preview="emit('previewDoc', $event)"
        @menu-select="(item, action) => emit('menuSelect', item, action)"
      />
    </template>
  </draggable>

  <div
    v-else
    class="my-doc-grid-empty"
  >
    <UiEmpty
      icon="icon-document"
      :title="emptyTitle"
      :description="emptyDescription"
    />
  </div>
</template>

<script setup lang="ts">
import { UiEmpty } from '@leechanyong/ispark-ui'
import draggable from 'vuedraggable'
import type { MyDoc } from '~/types/mydoc'

interface Props {
  docs: MyDoc[]
  selectedDocId?: string | null
  previewDocId?: string | null
  emptyTitle: string
  emptyDescription: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedDocId: null,
  previewDocId: null,
})

const emit = defineEmits<{
  'update:docs': [docs: MyDoc[]]
  openDoc: [doc: MyDoc]
  previewDoc: [doc: MyDoc]
  menuSelect: [doc: MyDoc, action: string]
  dragStart: []
  dragEnd: []
}>()

const docsModel = computed({
  get: () => props.docs,
  set: (value) => emit('update:docs', value),
})
</script>
