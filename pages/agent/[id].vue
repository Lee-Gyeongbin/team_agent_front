<template>
  <div class="agents-detail">
    <h1>에이전트 상세 {{ route.params.id }}</h1>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>

<style lang="scss" scoped>
.agents-detail {
  padding: $spacing-xl;
}
</style>
