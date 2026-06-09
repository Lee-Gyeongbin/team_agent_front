<template>
  <UiModal
    :is-open="isOpen"
    title="메타 관리"
    max-width="960px"
    :custom-class="metaModalCustomClass"
    show-fullscreen
    @close="$emit('close')"
  >
    <div class="datamart-meta-modal-inner">
      <div class="datamart-meta-modal-header">
        <UiTab
          v-model="activeTab"
          :tabs="metaTabs"
        />
      </div>

      <div class="datamart-meta-modal-body">
        <div class="datamart-meta-tab-panel">
          <DatamartMetaTableSelectTab
            v-if="activeTab === 'table'"
            :is-open="isOpen"
            :datamart="datamart"
            :tables="metaModalTables"
            :error-message="metaModalTableListError"
            @retry="onRetryTableList"
            @set-table-use-yn="setDatamartMetaModalTableUseYn"
          />
          <DatamartMetaColumnMetadataTab
            v-else-if="activeTab === 'column'"
            v-model:selected-table-id="metaModalSelectedColumnTableId"
            :datamart="datamart"
            :tables="metaModalTables"
          />
          <DatamartMetaRelationshipTab
            v-else-if="activeTab === 'relation'"
            v-model:relationships="metaModalRelationships"
            :datamart="datamart"
            :tables="metaModalTables"
          />
          <DatamartMetaCodeMappingTab
            v-else-if="activeTab === 'code'"
            v-model:code-mappings="metaModalCodeMappings"
            :datamart="datamart"
            :tables="metaModalTables"
            :relationships="metaModalRelationships"
            :code-group-list="metaModalCodeGroupList"
          />
          <DatamartMetaSynonymTab
            v-else-if="activeTab === 'synonym'"
            v-model:synonym-groups="metaModalSynonymGroups"
            :datamart="datamart"
            :error-message="metaModalSynonymListError"
            :pending-change-count="metaModalSynonymPendingChangeCount"
            @retry="onRetryTableList"
            @reset-changes="onResetSynonymChanges"
          />
          <DatamartMetaFewshotTab
            v-else-if="activeTab === 'fewshot'"
            v-model:fewshot-list="metaModalFewshotList"
            :datamart="datamart"
            :tables="metaModalTables"
            :error-message="metaModalFewshotListError"
            :pending-change-count="metaModalFewshotPendingChangeCount"
            :initial-fewshot-list="metaModalInitialFewshotList"
            @retry="onRetryTableList"
            @reset-changes="onResetFewshotChanges"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="datamart-meta-footer">
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
import type { Datamart } from '~/types/datamart'
import DatamartMetaTableSelectTab from '~/components/datamart/DatamartMetaTableSelectTab.vue'
import DatamartMetaColumnMetadataTab from '~/components/datamart/DatamartMetaColumnMetadataTab.vue'
import DatamartMetaRelationshipTab from '~/components/datamart/DatamartMetaRelationshipTab.vue'
import DatamartMetaCodeMappingTab from '~/components/datamart/DatamartMetaCodeMappingTab.vue'
import DatamartMetaSynonymTab from '~/components/datamart/DatamartMetaSynonymTab.vue'
import DatamartMetaFewshotTab from '~/components/datamart/DatamartMetaFewshotTab.vue'
import { useDatamartStore } from '~/composables/datamart/useDatamartStore'

const props = defineProps<{
  isOpen: boolean
  datamart: Datamart | null
}>()

defineEmits<{
  close: []
}>()

const {
  metaModalTables,
  metaModalRelationships,
  metaModalTableListError,
  metaModalSynonymListError,
  metaModalSelectedColumnTableId,
  metaModalCodeMappings,
  metaModalCodeGroupList,
  metaModalSynonymGroups,
  metaModalFewshotList,
  metaModalFewshotListError,
  metaModalFewshotDraft,
  metaModalSynonymDraft,
  resetDatamartMetaModal,
  hydrateDatamartMetaModal,
  setDatamartMetaModalTableUseYn,
  handleSaveMetaTableSelection,
  handleSaveMetaColumnSelection,
  handleSaveMetaRelationship,
  handleSaveMetaCodeMapping,
  handleSaveMetaSynonym,
  handleSaveMetaFewshot,
} = useDatamartStore()

const activeTab = defineModel<string>('activeTab', { default: 'table' })

const metaModalCustomClass = computed(() => {
  const classes = ['datamart-meta-modal']
  if (activeTab.value === 'fewshot') classes.push('is-fewshot-tab')
  if (activeTab.value === 'synonym') classes.push('is-synonym-tab')
  return classes.join(' ')
})

const metaModalFewshotPendingChangeCount = computed(() => metaModalFewshotDraft.pendingChangeCount.value)
const metaModalSynonymPendingChangeCount = computed(() => metaModalSynonymDraft.pendingChangeCount.value)
const metaModalInitialFewshotList = computed(() => metaModalFewshotDraft.initial.value)

const onRetryTableList = () => {
  void hydrateDatamartMetaModal(props.datamart?.datamartId ?? '')
}

const onResetFewshotChanges = () => {
  metaModalFewshotDraft.revert()
}

const onResetSynonymChanges = () => {
  metaModalSynonymDraft.revert()
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    resetDatamartMetaModal()
    void hydrateDatamartMetaModal(props.datamart?.datamartId ?? '')
  },
)

const metaTabs = [
  { label: '테이블 선택', value: 'table' },
  { label: '컬럼 메타데이터', value: 'column' },
  { label: '관계 정의', value: 'relation' },
  { label: '코드값 매핑', value: 'code' },
  { label: '동의어 관리', value: 'synonym' },
  { label: '퓨샷 관리', value: 'fewshot' },
]

const onSave = async () => {
  if (activeTab.value === 'table') {
    const datamartId = props.datamart?.datamartId ?? ''
    await handleSaveMetaTableSelection(datamartId, metaModalTables.value)
    return
  } else if (activeTab.value === 'column') {
    const datamartId = props.datamart?.datamartId ?? ''
    await handleSaveMetaColumnSelection(datamartId, metaModalTables.value)
    return
  } else if (activeTab.value === 'relation') {
    const datamartId = props.datamart?.datamartId ?? ''
    await handleSaveMetaRelationship(datamartId, metaModalRelationships.value)
    return
  } else if (activeTab.value === 'code') {
    const datamartId = props.datamart?.datamartId ?? ''
    await handleSaveMetaCodeMapping(datamartId, metaModalCodeMappings.value)
    return
  } else if (activeTab.value === 'synonym') {
    const datamartId = props.datamart?.datamartId ?? ''
    await handleSaveMetaSynonym(datamartId, metaModalSynonymGroups.value)
    return
  } else if (activeTab.value === 'fewshot') {
    const datamartId = props.datamart?.datamartId ?? ''
    await handleSaveMetaFewshot(datamartId, metaModalFewshotList.value)
    return
  }

  openToast({ message: '현재 탭 저장 기능은 개발 중입니다.', type: 'warning' })
}
</script>

<style lang="scss" scoped>
.datamart-meta-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: $spacing-sm 0 0;
  margin-top: $spacing-sm;
  border-top: 1px solid $color-border;
}
</style>
