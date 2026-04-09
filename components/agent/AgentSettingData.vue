<template>
  <div class="agent-setting-data">
    <!-- 헤더 -->
    <div class="agent-setting-data-header">
      <div class="agent-setting-data-header-title">
        <span class="com-setting-section-title is-inline">{{ sectionTitle }}</span>
        <span class="agent-setting-data-sub">{{ sectionDesc }}</span>
      </div>
    </div>

    <!-- 요약 + 필터 -->
    <div class="agent-setting-data-toolbar">
      <div class="agent-setting-data-summary">
        전체 <strong>{{ items.length }}</strong> · 연결
        <strong>{{ connectedCount }}</strong>
      </div>
      <UiSelect
        v-model="statusFilter"
        :options="statusOptions"
        size="sm"
        placeholder="전체 상태"
      />
    </div>

    <!-- 목록 -->
    <draggable
      v-if="svcTy === 'M'"
      v-model="draggableList"
      class="agent-setting-data-list"
      handle=".agent-data-card-drag"
      item-key="datasetId"
      animation="200"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <AgentSettingDataCard
          :svc-ty="svcTy"
          :item="element"
          @toggle="onToggleItem"
        />
      </template>
    </draggable>

    <!-- 002: 드래그 없이 단순 리스트 -->
    <div
      v-else
      class="agent-setting-data-list"
    >
      <AgentSettingDataCard
        v-for="item in filteredItems"
        :key="(item as AgtDm).datamartId"
        :svc-ty="svcTy"
        :item="item"
        @toggle="onToggleItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { AgtDs, AgtDm } from '~/types/agent'

interface Props {
  svcTy: string
  datasetList: AgtDs[]
  datamartList: AgtDm[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:datasetList': [list: AgtDs[]]
  'update:datamartList': [list: AgtDm[]]
}>()

// 현재 타입에 맞는 아이템 목록
const items = computed(() => (props.svcTy === 'M' ? props.datasetList : props.datamartList))

// 섹션 텍스트
const sectionTitle = computed(() => (props.svcTy === 'M' ? 'RAG 데이터셋 연결' : '데이터마트 연결'))
const sectionDesc = computed(() =>
  props.svcTy === 'M' ? 'Agent가 참조할 데이터셋(벡터DB)을 선택합니다.' : 'Agent가 참조할 데이터마트를 선택합니다.',
)

// 필터
const statusFilter = ref('all')

const resetFilter = () => {
  statusFilter.value = 'all'
}

defineExpose({ resetFilter })

const statusOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '연결됨', value: 'Y' },
  { label: '미연결', value: 'N' },
]

const filteredItems = computed(() => {
  const list = items.value
  if (statusFilter.value === 'all') return list
  return list.filter((d) => d.connYn === statusFilter.value)
})

// 요약
const connectedCount = computed(() => items.value.filter((d) => d.connYn === 'Y').length)

// 드래그 정렬용 (001 전용)
const draggableList = computed({
  get: () => filteredItems.value as AgtDs[],
  set: (val: AgtDs[]) => {
    emit('update:datasetList', val)
  },
})

const onDragEnd = () => {
  const orderList = draggableList.value.map((item, i) => ({
    ...item,
    sortOrd: i,
  }))
  emit('update:datasetList', orderList)
}

// connYn 토글
const onToggleItem = (target: AgtDs | AgtDm) => {
  const newConnYn = target.connYn === 'Y' ? 'N' : 'Y'

  if (props.svcTy === 'M') {
    const updated = props.datasetList.map((d) =>
      d.datasetId === (target as AgtDs).datasetId ? ({ ...d, connYn: newConnYn } as AgtDs) : d,
    )
    emit('update:datasetList', updated)
  } else {
    const updated = props.datamartList.map((d) =>
      d.datamartId === (target as AgtDm).datamartId ? ({ ...d, connYn: newConnYn } as AgtDm) : d,
    )
    emit('update:datamartList', updated)
  }
}
</script>
