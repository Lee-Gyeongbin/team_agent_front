<template>
  <div
    class="com-setting-field-row"
    :class="{ 'is-top': alignTop }"
  >
    <label class="com-setting-label">
      <span
        v-if="required"
        class="is-required"
      >*</span>
      {{ label }}
    </label>
    <div
      v-if="hint || unit || $slots.hint"
      class="com-setting-field-input"
      style="flex: 1"
    >
      <div
        v-if="unit"
        class="com-setting-inline"
      >
        <slot />
        <span class="com-setting-unit">{{ unit }}</span>
      </div>
      <template v-else>
        <slot />
      </template>
      <p
        v-if="hint"
        class="com-setting-hint"
      >
        {{ hint }}
      </p>
      <slot name="hint" />
    </div>
    <template v-else>
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  required?: boolean
  hint?: string
  unit?: string
  alignTop?: boolean
}

withDefaults(defineProps<Props>(), {
  required: false,
  hint: '',
  unit: '',
  alignTop: false,
})
</script>
