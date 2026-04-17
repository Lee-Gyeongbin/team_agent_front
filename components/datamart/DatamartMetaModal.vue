<template>
  <UiModal
    :is-open="isOpen"
    title="메타 관리"
    max-width="960px"
    custom-class="datamart-meta-modal"
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
        <!-- 탭별 본문: key로 교체 시 AOS가 새 요소로 인식해 fade-up 재생 (pages/prompt/index.vue 동일) -->
        <div
          :key="activeTab"
          class="datamart-meta-tab-panel"
          data-aos="fade-up"
        >
          <DatamartMetaTableSelectTab
            v-if="activeTab === 'table'"
            :is-open="isOpen"
            :datamart="datamart"
            :tables="metaTables"
            :error-message="metaTableListErrorMessage"
            @retry="onRetryTableList"
            @set-table-use-yn="onSetTableUseYn"
          />
          <DatamartMetaColumnMetadataTab
            v-else-if="activeTab === 'column'"
            v-model:selected-table-id="selectedColumnMetaTableId"
            :datamart="datamart"
            :tables="metaTables"
          />
          <DatamartMetaRelationshipTab
            v-else-if="activeTab === 'relation'"
            v-model:relationships="metaRelationships"
            :datamart="datamart"
            :tables="metaTables"
          />
          <DatamartMetaCodeMappingTab
            v-else-if="activeTab === 'code'"
            v-model:code-mappings="metaCodeMappings"
            :datamart="datamart"
            :tables="metaTables"
            :relationships="metaRelationships"
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
import type {
  DatamartMetaCodeColumnMapping,
  DatamartMetaRelationship,
  DatamartMetaTableItem,
} from '~/types/datamartMeta'
import DatamartMetaTableSelectTab from '~/components/datamart/DatamartMetaTableSelectTab.vue'
import DatamartMetaColumnMetadataTab from '~/components/datamart/DatamartMetaColumnMetadataTab.vue'
import DatamartMetaRelationshipTab from '~/components/datamart/DatamartMetaRelationshipTab.vue'
import DatamartMetaCodeMappingTab from '~/components/datamart/DatamartMetaCodeMappingTab.vue'
import { useDatamartStore } from '~/composables/datamart/useDatamartStore'
import {
  createDatamartMetaCodeMappingsSeed,
  createDatamartMetaRelationshipsSeed,
} from '~/utils/datamart/datamartMetaSeed'

const props = defineProps<{
  isOpen: boolean
  datamart: Datamart | null
}>()

defineEmits<{
  close: []
}>()

const { handleFetchMetaTableList, handleSaveMetaTableSelection, handleSaveMetaColumnSelection } = useDatamartStore()

const metaTableListErrorMessage = ref<string | null>(null)

const activeTab = defineModel<string>('activeTab', { default: 'table' })

/** 테이블 선택·컬럼 메타데이터 탭 공유 상태 */
const metaTables = ref<DatamartMetaTableItem[]>([])

const selectedColumnMetaTableId = ref(metaTables.value.find((t) => t.useYn === 'Y')?.id ?? '')

const metaRelationships = ref<DatamartMetaRelationship[]>(createDatamartMetaRelationshipsSeed())

const metaCodeMappings = ref<DatamartMetaCodeColumnMapping[]>(createDatamartMetaCodeMappingsSeed())

const onSetTableUseYn = (payload: { id: string; useYn: 'Y' | 'N' }) => {
  const row = metaTables.value.find((t) => t.id === payload.id)
  if (!row || row.useYn === payload.useYn) return
  row.useYn = payload.useYn
  if (payload.useYn === 'N' && selectedColumnMetaTableId.value === payload.id) {
    selectedColumnMetaTableId.value = metaTables.value.find((t) => t.useYn === 'Y')?.id ?? ''
  }
}

function resetMetaTableState() {
  metaTables.value = []
  selectedColumnMetaTableId.value = ''
  metaTableListErrorMessage.value = null
}

async function loadMetaTableList() {
  const id = props.datamart?.datamartId?.trim() ?? ''
  if (!id) {
    metaTableListErrorMessage.value = '데이터마트 정보가 없습니다.'
    return
  }
  metaTableListErrorMessage.value = null
  openLoading({ text: '스키마정보를 불러오는 중...' })
  try {
    const list = await handleFetchMetaTableList(id)
    if (!Array.isArray(list)) {
      metaTableListErrorMessage.value = '테이블 목록을 불러오지 못했습니다.'
      return
    }
    metaTables.value = list
    selectedColumnMetaTableId.value = metaTables.value.find((t) => t.useYn === 'Y')?.id ?? metaTables.value[0]?.id ?? ''
  } finally {
    closeLoading()
  }
}

const onRetryTableList = () => {
  void loadMetaTableList()
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    resetMetaTableState()
    void loadMetaTableList()
  },
)

const metaTabs = [
  { label: '테이블 선택', value: 'table' },
  { label: '컬럼 메타데이터', value: 'column' },
  { label: '관계 정의', value: 'relation' },
  { label: '코드값 매핑', value: 'code' },
]

const onSave = async () => {
  if (activeTab.value === 'table') {
    const datamartId = props.datamart?.datamartId ?? ''
    await handleSaveMetaTableSelection(datamartId, metaTables.value)
    return
  } else if (activeTab.value === 'column') {
    const datamartId = props.datamart?.datamartId ?? ''
    await handleSaveMetaColumnSelection(datamartId, metaTables.value)
    return
  }

  openToast({ message: '현재 탭 저장 기능은 개발 중입니다.', type: 'warning' })
  console.warn('[DatamartMetaModal] 저장 — 미구현 탭', activeTab.value, {
    selectedColumnMetaTableId: selectedColumnMetaTableId.value,
    metaRelationships: metaRelationships.value,
    metaCodeMappings: metaCodeMappings.value,
  })
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
