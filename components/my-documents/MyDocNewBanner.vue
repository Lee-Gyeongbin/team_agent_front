<template>
  <div class="my-doc-new-banner">
    <i class="icon-notification size-16" />
    <span class="my-doc-new-banner__text">
      새로 저장된 문서가 {{ newDocCount }}개 있어요. 지식창고에서 만든 AI 보고서를 확인해 보세요.
    </span>
    <button
      class="my-doc-new-banner__close"
      title="닫기"
      @click="emit('close')"
    >
      <i class="icon-close size-12" />
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  newDocCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()
</script>
