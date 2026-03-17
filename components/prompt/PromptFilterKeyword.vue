<template>
  <div class="prompt-filter-keyword">
    <!-- 타이틀 -->
    <div class="prompt-filter-keyword-title">
      {{ title }} <strong>({{ keywords.length }}개)</strong>
    </div>

    <!-- 카드 박스 -->
    <div class="prompt-filter-keyword-box">
      <!-- 입력 -->
      <div class="prompt-filter-keyword-input">
        <UiInput
          v-model="inputValue"
          :placeholder="placeholder"
          size="sm"
          @keyup.enter="onAdd"
        />
        <UiButton
          variant="primary-line"
          size="md"
          @click="onAdd"
        >
          추가
        </UiButton>
      </div>

      <!-- 태그 목록 -->
      <div
        v-if="keywords.length"
        class="prompt-filter-keyword-tags"
      >
        <span
          v-for="(item, index) in keywords"
          :key="item.wordId"
          class="prompt-filter-tag"
        >
          {{ item.word }}
          <button
            class="prompt-filter-tag-close"
            @click="onRemove(index)"
          >
            <i class="icon-close size-12" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { banWordItem } from '~/types/prompt'

interface Props {
  title: string
  keywords: banWordItem[]
  placeholder?: string
  wordType: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '단어를 입력하세요',
})

const emit = defineEmits<{
  'update:keywords': [keywords: banWordItem[]]
}>()

const inputValue = ref('')

const onAdd = () => {
  const value = inputValue.value.trim()
  if (!value) return
  if (props.keywords.some((item) => item.word === value)) return

  const newItem: banWordItem = {
    wordId: '',
    word: value,
    wordType: props.wordType,
    useYn: 'Y',
    createDt: '',
  }
  emit('update:keywords', [...props.keywords, newItem])
  inputValue.value = ''
}

const onRemove = (index: number) => {
  const updated = [...props.keywords]
  updated.splice(index, 1)
  emit('update:keywords', updated)
}
</script>
