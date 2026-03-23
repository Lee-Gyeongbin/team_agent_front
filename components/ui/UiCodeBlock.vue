<template>
  <div class="ui-code-block">
    <pre class="ui-code-block-pre"><code>{{ code }}</code></pre>
    <div class="ui-code-block-action">
      <button
        class="ui-code-block-copy"
        title="코드 복사"
        @click="onCopy"
        a
      >
        <i
          :class="isCopied ? 'icon-copy' : 'icon-copy'"
          class="size-16"
        ></i>
      </button>
    </div>
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
    await copyToClipboard(props.code)
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
  display: flex;
  flex-direction: row;
  gap: 10px;
  padding: 16px 16px 15px;
  background: #2d3139;
  border-radius: $border-radius-lg;
}

.ui-code-block-pre {
  flex: 1;
  min-width: 0;
  margin: 0;
  max-height: 260px;
  overflow: auto;
  @include custom-scrollbar;

  code {
    @include typo($body-small);
    color: #fff;
    white-space: pre;
  }
}

.ui-code-block-action {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.ui-code-block-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: $border-radius-lg;
  background: #4d5462;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  i {
    background-color: #ecf0f3;
  }

  &:hover,
  &:focus,
  &:focus-visible,
  &:active {
    outline: none;
    box-shadow: none;
    background: #5c6677;

    i {
      background-color: #fff;
    }
  }
}
</style>
