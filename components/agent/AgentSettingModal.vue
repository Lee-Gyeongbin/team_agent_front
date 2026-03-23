<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    :title="agent ? 'Agent 설정' : 'Agent 추가'"
    @close="$emit('close')"
  >
    <div class="com-setting-form">
      <!-- 섹션1: Agent 유형 -->
      <AgentSettingType v-model="form.agentTypeCd" />

      <!-- 섹션2: Agent 기본 설정 + 유형별 상세 설정 -->
      <AgentSettingBasic
        v-model="basicForm"
        :agent-type-cd="form.agentTypeCd"
        :rag-form="ragForm"
        :sql-form="sqlForm"
        :sql-model-options="sqlModelOptions"
        @update:rag-form="ragForm = $event"
        @update:sql-form="sqlForm = $event"
      />

      <!-- 섹션3: 데이터 연결 (agentTypeCd 기반 분기) -->
      <AgentSettingData
        v-if="form.agentTypeCd"
        :agent-type-cd="form.agentTypeCd"
        :dataset-list="localDatasetList"
        :datamart-list="localDatamartList"
        @update:dataset-list="localDatasetList = $event"
        @update:datamart-list="localDatamartList = $event"
      />
    </div>

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
import type { Agent, AgtDs, AgtDm } from '~/types/agent'
import { useAgentStore } from '~/composables/agent/useAgentStore'

interface Props {
  isOpen: boolean
  agent: Agent | null
}

const props = defineProps<Props>()

const { modelOptions } = useAgentStore()

const sqlModelOptions = computed(() => modelOptions.value.map((m) => ({ value: m.modelId, label: m.modelName })))

const emit = defineEmits<{
  close: []
  save: [form: Partial<Agent>]
}>()

// 유형
const form = ref({
  agentTypeCd: '',
})

// 기본 설정 폼
const basicForm = ref({
  agentNm: '',
  description: '',
})

// RAG 설정 (001)
const ragForm = ref({
  simThresh: 0,
  maxSrchRslt: 0,
})

// SQL 설정 (002)
const sqlForm = ref({
  modelId: '',
  maxQrySec: 0,
  sqlValidYn: 'N' as 'Y' | 'N',
  readonlyYn: 'Y' as 'Y' | 'N',
  userCfrmYn: 'N' as 'Y' | 'N',
})

// 데이터 연결 (agent 객체에서 직접 가져옴)
const localDatasetList = ref<AgtDs[]>([])
const localDatamartList = ref<AgtDm[]>([])

// 모달 열릴 때 폼 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    if (props.agent) {
      form.value.agentTypeCd = props.agent.agentTypeCd
      basicForm.value = {
        agentNm: props.agent.agentNm,
        description: props.agent.description,
      }
      ragForm.value = {
        simThresh: props.agent.simThresh ?? 0,
        maxSrchRslt: props.agent.maxSrchRslt ?? 0,
      }
      sqlForm.value = {
        modelId: props.agent.modelId ?? '',
        maxQrySec: props.agent.maxQrySec ?? 0,
        sqlValidYn: props.agent.sqlValidYn ?? 'N',
        readonlyYn: props.agent.readonlyYn ?? 'Y',
        userCfrmYn: props.agent.userCfrmYn ?? 'N',
      }
      localDatasetList.value = [...(props.agent.datasetList ?? [])]
      localDatamartList.value = [...(props.agent.datamartList ?? [])]
    } else {
      form.value.agentTypeCd = ''
      basicForm.value = { agentNm: '', description: '' }
      ragForm.value = { simThresh: 0, maxSrchRslt: 0 }
      sqlForm.value = { modelId: '', maxQrySec: 0, sqlValidYn: 'N', readonlyYn: 'Y', userCfrmYn: 'N' }
      localDatasetList.value = []
      localDatamartList.value = []
    }
  },
)

const onSave = () => {
  const base: Partial<Agent> = {
    agentTypeCd: form.value.agentTypeCd,
    ...basicForm.value,
  }

  if (form.value.agentTypeCd === '001') {
    Object.assign(base, ragForm.value, { datasetList: localDatasetList.value })
  } else if (form.value.agentTypeCd === '002') {
    Object.assign(base, sqlForm.value, { datamartList: localDatamartList.value })
  }

  emit('save', base)
}
</script>
