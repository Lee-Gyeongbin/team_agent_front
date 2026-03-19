<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': collapsed }"
    :style="labelWidth ? `--label-width: ${labelWidth}` : undefined"
  >
    <!-- 접기/펼치기 헤더 -->
    <div
      v-if="collapsible"
      class="com-setting-section-header"
      @click="toggleCollapse"
    >
      <span class="com-setting-section-title">{{ title }}</span>
      <span class="com-setting-section-arrow">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 10l4-4 4 4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <!-- 고정 타이틀 (접기 불가) -->
    <div
      v-else
      class="com-setting-section-title"
    >
      {{ title }}
    </div>

    <!-- 본문 -->
    <div class="com-setting-section-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  labelWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: false,
  defaultCollapsed: false,
  labelWidth: '',
})

const collapsed = ref(props.defaultCollapsed)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

// 외부에서 제어할 수 있도록 expose
defineExpose({ collapsed, toggleCollapse })
</script>
