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

      <!-- 섹션2: Agent 기본 설정 -->
      <AgentSettingBasic v-model="basicForm" />

      <!-- 섹션3: RAG 데이터셋 연결 -->
      <AgentSettingDataset
        :datasets="datasetList"
        @update:datasets="datasetList = $event"
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
import type { Agent } from '~/types/agent'
import { useAgentStore } from '~/composables/agent/useAgentStore'

interface Props {
  isOpen: boolean
  agent: Agent | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [form: { agentTypeCd: string; agentNm: string; description: string }]
}>()

const { datasetList, handleSelectDatasetList } = useAgentStore()

// 유형
const form = ref({
  agentTypeCd: '',
})

// 기본 설정 폼
const basicForm = ref({
  agentNm: '',
  description: '',
})

// 모달 열릴 때 폼 초기화 + 데이터셋 조회
watch(
  () => props.isOpen,
  async (open) => {
    if (!open) return
    if (props.agent) {
      form.value.agentTypeCd = props.agent.agentTypeCd
      basicForm.value = {
        agentNm: props.agent.agentNm,
        description: props.agent.description,
      }
      // 수정 모드: 데이터셋 목록 조회
      await handleSelectDatasetList(props.agent.agentId)
    } else {
      // 추가 모드: 폼 초기화
      form.value.agentTypeCd = ''
      basicForm.value = {
        agentNm: '',
        description: '',
      }
      datasetList.value = []
    }
  },
)

const onSave = () => {
  emit('save', {
    agentTypeCd: form.value.agentTypeCd,
    ...basicForm.value,
  })
}

</script>
