<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="agent ? 'Agent 설정' : 'Agent 추가'"
    @close="$emit('close')"
  >
    <div class="agent-setting-form">
      <!-- 섹션1: Agent 유형 -->
      <AgentSettingType v-model="form.type" />

      <!-- 섹션2: Agent 기본 설정 -->
      <AgentSettingBasic v-model="basicForm" />

      <!-- 섹션3: RAG 데이터셋 연결 -->
      <AgentSettingDataset
        :datasets="datasetList"
        @update:datasets="datasetList = $event"
        @add="onAddDataset"
        @dataset-setting="onDatasetSetting"
        @dataset-sync="onDatasetSync"
      />
    </div>

    <!-- 데이터셋 추가/수정 모달 -->
    <AgentSettingDatasetModal
      :is-open="isDatasetModalOpen"
      :dataset="editingDataset"
      @close="isDatasetModalOpen = false"
      @save="onSaveDataset"
    />

    <!-- 푸터 -->
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
  </UiModal>
</template>

<script setup lang="ts">
import type { Agent, AgentDataset } from '~/types/agent'
import { useAgentStore } from '~/composables/agent/useAgentStore'

interface Props {
  isOpen: boolean
  agent: Agent | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [form: { type: string; name: string; description: string; similarityThreshold: number; maxSearchResults: number }]
}>()

const { datasetList, handleSelectDatasetList, handleSaveDataset, handleSyncDataset } = useAgentStore()

// 유형
const form = ref({
  type: '',
})

// 기본 설정 폼
const basicForm = ref({
  name: '',
  description: '',
  similarityThreshold: 0.7,
  maxSearchResults: 5,
})

// 모달 열릴 때 폼 초기화 + 데이터셋 조회
watch(
  () => props.isOpen,
  async (open) => {
    if (!open) return
    if (props.agent) {
      form.value.type = props.agent.type
      basicForm.value = {
        name: props.agent.name,
        description: props.agent.description,
        similarityThreshold: props.agent.similarityThreshold ?? 0.7,
        maxSearchResults: props.agent.maxSearchResults ?? 5,
      }
      // 수정 모드: 데이터셋 목록 조회
      await handleSelectDatasetList(props.agent.id)
    } else {
      // 추가 모드: 폼 초기화
      form.value.type = ''
      basicForm.value = {
        name: '',
        description: '',
        similarityThreshold: 0.7,
        maxSearchResults: 5,
      }
      datasetList.value = []
    }
  },
)

const onSave = () => {
  emit('save', {
    type: form.value.type,
    ...basicForm.value,
  })
}

// 데이터셋 모달
const isDatasetModalOpen = ref(false)
const editingDataset = ref<AgentDataset | null>(null)

const onAddDataset = () => {
  editingDataset.value = null
  isDatasetModalOpen.value = true
}

const onDatasetSetting = (dataset: AgentDataset) => {
  editingDataset.value = dataset
  isDatasetModalOpen.value = true
}

// 데이터셋 저장
const onSaveDataset = async (dataset: AgentDataset) => {
  const agentId = props.agent?.id ?? ''
  await handleSaveDataset(agentId, dataset)
}

// 데이터셋 동기화
const onDatasetSync = async (dataset: AgentDataset) => {
  const agentId = props.agent?.id ?? ''
  await handleSyncDataset(agentId, dataset.id)
}
</script>
