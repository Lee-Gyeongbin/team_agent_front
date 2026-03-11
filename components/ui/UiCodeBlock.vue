<template>
  <div class="ui-code-block">
    <pre class="ui-code-block-pre"><code>{{ code }}</code></pre>
    <button
      class="btn btn-icon ui-code-block-copy"
      title="코드 복사"
      @click="onCopy"
    >
      <i
        :class="isCopied ? 'icon-check' : 'icon-copy'"
        class="size-16"
      ></i>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  code: string
}

const props = defineProps<Props>()

const isCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const onCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.code)
    isCopied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch {
    // 복사 실패 시 무시
  }
}
</script>

<style lang="scss" scoped>
.ui-code-block {
  position: relative;
}

.ui-code-block-pre {
  margin: 0;
  padding: 12px 16px;
  background: #1e1e2e;
  border-radius: $border-radius-base;
  max-height: 260px;
  overflow: auto;
  @include custom-scrollbar;

  code {
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    line-height: 1.6;
    color: #cdd6f4;
    white-space: pre;
  }
}

.ui-code-block-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #94a3b8;

  &:hover {
    color: #fff;
  }
}
</style>
