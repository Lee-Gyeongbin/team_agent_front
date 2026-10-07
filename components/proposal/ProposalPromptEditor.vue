<template>
  <div
    class="prompt-editor"
    :style="{ '--prompt-font-size': `${fontSize}px` }"
  >
    <div class="prompt-editor-toolbar">
      <div
        class="prompt-editor-modes"
        aria-label="프롬프트 표시 방식"
      >
        <UiButton
          :variant="mode === 'read' ? 'primary' : 'ghost'"
          size="sm"
          :aria-pressed="mode === 'read'"
          @click="mode = 'read'"
          >읽기</UiButton
        >
        <UiButton
          :variant="mode === 'edit' ? 'primary' : 'ghost'"
          size="sm"
          :aria-pressed="mode === 'edit'"
          @click="mode = 'edit'"
          >수정</UiButton
        >
      </div>
      <span class="prompt-editor-hint">{{
        mode === 'read' ? '수정 탭에서 원문을 편집할 수 있습니다.' : '원문을 수정하고 하단에서 저장하세요.'
      }}</span>
      <label class="prompt-editor-font"
        >글자 크기
        <select
          v-model.number="fontSize"
          aria-label="프롬프트 글자 크기"
        >
          <option :value="14">14</option>
          <option :value="16">16</option>
          <option :value="18">18</option>
          <option :value="20">20</option>
        </select></label
      >
    </div>
    <div
      v-if="mode === 'read'"
      class="prompt-reading-layout"
    >
      <nav
        v-if="readingSections.length > 1"
        class="prompt-reading-nav"
        aria-label="프롬프트 구역 이동"
      >
        <strong>내용 바로가기</strong>
        <button
          type="button"
          @click="previewRef?.scrollTo({ top: 0 })"
        >
          처음 · 기본 지침
        </button>
        <button
          v-for="(section, index) in readingSections"
          :key="index"
          type="button"
          class="prompt-section-link"
          @click="jumpToSection(index)"
        >
          <span
            v-if="section.number"
            class="prompt-section-number"
            >{{ section.number }}</span
          >
          <span class="prompt-section-label">{{ section.label }}</span>
        </button>
      </nav>
      <div
        ref="previewRef"
        class="prompt-editor-preview"
        tabindex="0"
        aria-label="프롬프트 읽기"
      >
        <article
          v-if="modelValue"
          v-html="previewHtml"
        />
        <p
          v-else
          class="prompt-editor-hint"
        >
          프롬프트 내용이 없습니다.
        </p>
      </div>
    </div>
    <div
      v-else
      class="prompt-editor-edit-scroll"
    >
      <UiTextarea
        v-model="content"
        class="prompt-editor-input"
        :auto-resize="false"
        :resizable="true"
        :disabled="disabled"
        :rows="18"
        border
        aria-label="프롬프트 원문 수정"
      />
    </div>
    <div class="prompt-editor-count">{{ modelValue.length.toLocaleString() }}자</div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiTextarea } from '@leechanyong/ispark-ui'
import { Marked } from 'marked'
import DOMPurify from 'dompurify'
import { formatPromptJsonExamples } from '~/utils/proposal/promptPreview'
const props = withDefaults(defineProps<{ modelValue?: string; disabled?: boolean }>(), {
  modelValue: '',
  disabled: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const mode = ref<'read' | 'edit'>('read')
const fontSize = ref(16)
const content = computed({ get: () => props.modelValue, set: (value: string) => emit('update:modelValue', value) })
// Isolate prompt rendering from the chat renderer's global Markdown settings.
const markdown = new Marked({ gfm: true, breaks: true })
const previewRef = ref<HTMLElement | null>(null)
const readingSections = computed(() => {
  if (!import.meta.client) return []
  const doc = new DOMParser().parseFromString(previewHtml.value, 'text/html')
  return Array.from(doc.querySelectorAll('h1,h2,h3')).map((heading) => {
    const text = heading.textContent ?? ''
    const match = text.match(/^(\d+(?:\.\d+)*[.)]?)\s+(.+)$/s)
    return { number: match?.[1] ?? '', label: match?.[2] ?? text }
  })
})
const jumpToSection = (index: number) => {
  const container = previewRef.value
  const heading = container?.querySelectorAll('h1,h2,h3')[index]
  if (!container || !heading) return
  container.scrollTo({
    top: container.scrollTop + heading.getBoundingClientRect().top - container.getBoundingClientRect().top - 16,
  })
}
const previewHtml = computed(() => {
  if (!import.meta.client) return ''
  // Literal HTML in a prompt must remain visible, never become active markup.
  const source = formatPromptJsonExamples(props.modelValue)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return DOMPurify.sanitize(markdown.parse(source, { async: false }) as string, { FORBID_TAGS: ['img', 'a'] })
})
</script>

<style lang="scss" scoped>
.prompt-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  border: 1px solid $color-border;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.prompt-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-bottom: 1px solid $color-border;
  background: #f8faff;
  flex-shrink: 0;
}
.prompt-editor-modes {
  display: flex;
  gap: 4px;
}
.prompt-editor-hint {
  font-size: 12px;
  color: $color-text-muted;
}
.prompt-editor-font {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  font-size: 12px;
  white-space: nowrap;
  select {
    border: 1px solid $color-border;
    border-radius: 5px;
    padding: 5px 8px;
    background: white;
    color: inherit;
  }
}
.prompt-editor-preview {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px 32px;
  font-size: var(--prompt-font-size);
  line-height: 1.85;
  color: $color-text-primary;
  overflow-wrap: anywhere;
  article {
    max-width: 1000px;
    margin: 0 auto;
  }
  :deep(h1),
  :deep(h2),
  :deep(h3) {
    font-weight: 700;
    line-height: 1.5;
    margin: 28px 0 14px;
    color: $color-text-heading;
  }
  :deep(h1) {
    font-size: 1.5em;
  }
  :deep(h2) {
    font-size: 1.25em;
    border-bottom: 1px solid $color-border;
    padding-bottom: 10px;
  }
  :deep(h3) {
    font-size: 1.1em;
  }
  :deep(p) {
    margin: 0 0 16px;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 26px;
    margin: 12px 0 20px;
  }
  :deep(li) {
    margin: 6px 0;
  }
  :deep(pre) {
    white-space: pre-wrap;
    tab-size: 2;
    padding: 16px;
    background: #f4f6fa;
    border-radius: 6px;
  }
  :deep(pre code) {
    display: block;
    padding: 0;
    background: transparent;
    white-space: pre-wrap;
    font-family: Consolas, 'Courier New', monospace;
    line-height: 1.6;
  }
  :deep(code) {
    font-size: 0.9em;
    background: #f0f3f8;
    border-radius: 3px;
    padding: 2px 4px;
  }
  :deep(blockquote) {
    padding: 12px 18px;
    margin: 16px 0;
    background: #eff5ff;
    border-left: 3px solid #7196f6;
  }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
  }
  :deep(td),
  :deep(th) {
    border: 1px solid $color-border;
    padding: 8px 12px;
  }
}
.prompt-editor-edit-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.prompt-editor-input {
  display: flex;
  flex-direction: column;
  :deep(.ui-textarea-wrap) {
    flex: none;
    position: relative;
  }
  :deep(textarea) {
    display: block;
    position: relative;
    width: 100%;
    height: clamp(240px, 50vh, 700px);
    min-height: 180px;
    resize: vertical;
    overflow-y: auto;
    padding: 24px;
    font-size: var(--prompt-font-size);
    line-height: 1.85;
    box-sizing: border-box;
    border: 0;
  }
}
.prompt-editor-count {
  flex-shrink: 0;
  padding: 6px 14px;
  text-align: right;
  font-size: 11px;
  color: $color-text-muted;
  border-top: 1px solid $color-border;
}
</style>

<style lang="scss" scoped>
.prompt-reading-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.prompt-reading-nav {
  button.prompt-section-link {
    display: block;
    text-align: left;
  }
  .prompt-section-number {
    margin-right: 4px;
    font-variant-numeric: tabular-nums;
  }
  .prompt-section-label {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  width: 200px;
  flex: 0 0 200px;
  overflow-y: auto;
  padding: 16px 12px;
  border-right: 1px solid $color-border;
  background: #f7f9fc;
  strong {
    display: block;
    font-size: 12px;
    margin: 0 8px 12px;
  }
  button {
    display: block;
    width: 100%;
    text-align: left;
    border: 0;
    border-radius: 6px;
    padding: 9px 8px;
    background: transparent;
    font-size: 12px;
    line-height: 1.5;
    color: $color-text-primary;
    cursor: pointer;
    &:hover,
    &:focus-visible {
      background: #e8efff;
      color: #315bda;
    }
  }
}
.prompt-editor-preview {
  min-width: 0;
  padding: 20px 26px;
  line-height: 1.65;
  color: #303b4d;
  article {
    max-width: 900px;
  }
  :deep(p) {
    margin-bottom: 12px;
  }
  :deep(h1),
  :deep(h2),
  :deep(h3) {
    background: #f0f5ff;
    border: 0;
    border-left: 3px solid #7196f6;
    padding: 10px 14px;
    border-radius: 0 5px 5px 0;
    margin: 24px 0 14px;
  }
  :deep(ul) {
    list-style: disc;
  }
  :deep(ol) {
    list-style: decimal;
  }
  :deep(li) {
    margin: 4px 0;
  }
  :deep(li::marker) {
    color: #6b82ae;
  }
}
@media (max-width: 760px) {
  .prompt-reading-nav {
    width: 150px;
    flex-basis: 150px;
  }
  .prompt-editor-preview {
    padding: 16px;
  }
}
</style>
