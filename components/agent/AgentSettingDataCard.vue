<template>
  <div
    class="agent-data-card"
    :class="{ 'is-connected': item.connYn === 'Y' }"
  >
    <!-- RAG 데이터셋 (001) -->
    <template v-if="isRag">
      <div class="agent-data-card-drag">
        <i class="icon-move-handle size-20" />
      </div>
      <div class="agent-data-card-info">
        <div class="agent-data-card-title">{{ ds.dsNm }}</div>
        <p class="agent-data-card-desc">{{ ds.description }}</p>
        <div class="agent-data-card-meta">
          <span class="agent-data-card-meta-item">
            <i class="icon-document size-12" /> 문서 <strong>{{ ds.docCount }}개</strong>
          </span>
          <span class="agent-data-card-meta-item">
            <i class="icon-chunk size-12" /> 청크 <strong>{{ ds.chunkSize?.toLocaleString() }}개</strong>
          </span>
          <span class="agent-data-card-meta-item">
            최종업데이트 <strong>{{ ds.modifyDt }}</strong>
          </span>
        </div>
      </div>
      <div class="agent-data-card-actions">
        <UiToggle
          :model-value="ds.connYn === 'Y'"
          @update:model-value="$emit('toggle', ds)"
        />
      </div>
    </template>

    <!-- SQL 데이터마트 (002) -->
    <template v-else>
      <div class="agent-data-card-info">
        <div class="agent-data-card-title">{{ dm.dmNm }}</div>
        <p class="agent-data-card-desc">{{ dm.description }}</p>
        <div class="agent-data-card-meta">
          <span class="agent-data-card-meta-item">
            <i class="icon-document size-12" /> DB <strong>{{ dm.dbType }}</strong>
          </span>
          <span class="agent-data-card-meta-item">
            <i class="icon-chunk size-12" /> 테이블 <strong>{{ dm.tblCnt.toLocaleString() }}개</strong>
          </span>
          <span class="agent-data-card-meta-item">
            최종업데이트 <strong>{{ dm.lastVerifyDt }}</strong>
          </span>
        </div>
      </div>
      <div class="agent-data-card-actions">
        <UiToggle
          :model-value="dm.connYn === 'Y'"
          @update:model-value="$emit('toggle', dm)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AgtDs, AgtDm } from '~/types/agent'

interface Props {
  agentTypeCd: string
  item: AgtDs | AgtDm
}

const props = defineProps<Props>()

defineEmits<{
  toggle: [item: AgtDs | AgtDm]
}>()

const isRag = computed(() => props.agentTypeCd === '001')
const ds = computed(() => props.item as AgtDs)
const dm = computed(() => props.item as AgtDm)
</script>
