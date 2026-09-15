<template>
  <IsparkTooltip v-bind="$attrs">
    <slot />
    <template
      v-if="$slots.content"
      #content
    >
      <slot name="content" />
    </template>
  </IsparkTooltip>
</template>

<script setup lang="ts">
import { UiTooltip as IsparkTooltip } from '@leechanyong/ispark-ui'

defineOptions({ inheritAttrs: false })
</script>
