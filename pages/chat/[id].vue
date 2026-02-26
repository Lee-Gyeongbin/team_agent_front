<template>
  <div class="chat-detail">
    <h1>채팅방 {{ route.params.id }}</h1>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>

<style lang="scss" scoped>
.chat-detail {
  padding: $spacing-xl;
}
</style>
