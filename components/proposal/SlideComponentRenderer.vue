<template>
  <component
    :is="componentMap[component.type]"
    v-if="componentMap[component.type]"
    :content="component.content"
  />
</template>

<script setup lang="ts">
import type { SlideComponent } from '~/types/proposal'
import SlideCardGrid from './slide-parts/SlideCardGrid.vue'
import SlideProcessFlow from './slide-parts/SlideProcessFlow.vue'
import SlideRequirementTable from './slide-parts/SlideRequirementTable.vue'
import SlideCredentialGrid from './slide-parts/SlideCredentialGrid.vue'
import SlideIconChipGroup from './slide-parts/SlideIconChipGroup.vue'
import SlideStepFlowBar from './slide-parts/SlideStepFlowBar.vue'
import SlideCalloutBox from './slide-parts/SlideCalloutBox.vue'

defineProps<{ component: SlideComponent }>()

const componentMap: Record<string, unknown> = {
  card_grid: SlideCardGrid,
  process_flow: SlideProcessFlow,
  requirement_table: SlideRequirementTable,
  credential_grid: SlideCredentialGrid,
  icon_chip_group: SlideIconChipGroup,
  step_flow_bar: SlideStepFlowBar,
  callout_box: SlideCalloutBox,
}
</script>
