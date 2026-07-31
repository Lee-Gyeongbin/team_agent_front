<template>
  <section
    class="chat-marketing-authoring-result"
    :style="themeStyle"
  >
    <header class="chat-marketing-authoring-result__header">
      <div class="chat-marketing-authoring-result__header-copy">
        <div class="chat-marketing-authoring-result__title-row">
          <span class="chat-marketing-authoring-result__status-icon">
            <i class="icon-check size-16" />
          </span>
          <div>
            <h3 class="chat-marketing-authoring-result__title">콘텐츠 생성 완료</h3>
            <p class="chat-marketing-authoring-result__subtitle">{{ result.summary }}</p>
          </div>
        </div>
      </div>
    </header>

    <div
      v-if="metaItems.length"
      class="chat-marketing-authoring-result__meta"
    >
      <div
        class="chat-marketing-authoring-result__meta-items"
        :class="{ 'is-collapsed': !isMetaOpen }"
      >
        <div
          v-for="item in metaItems"
          :key="item.label"
          class="chat-marketing-authoring-result__meta-chip"
          :title="`${item.label}: ${item.value}`"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <button
        type="button"
        class="chat-marketing-authoring-result__meta-toggle"
        :class="{ 'is-open': isMetaOpen }"
        :aria-expanded="isMetaOpen"
        :title="isMetaOpen ? '작성 조건 접기' : '작성 조건 펼치기'"
        @click="toggleMeta"
      >
        <i class="icon-chevron-down size-16" />
      </button>
    </div>

    <div class="chat-marketing-authoring-result__tabs">
      <button
        v-for="variant in result.variants"
        :key="variant.id"
        type="button"
        class="chat-marketing-authoring-result__tab"
        :class="{ 'is-active': variant.id === activeVariantId }"
        @click="selectVariant(variant.id)"
      >
        시안 {{ variant.id }} · {{ variant.label }}
        <em v-if="variant.recommended">추천</em>
      </button>
    </div>

    <div
      v-if="activeVariant"
      class="chat-marketing-authoring-result__draft"
    >
      <div class="chat-marketing-authoring-result__draft-toolbar">
        <p
          v-if="keyMessage"
          class="chat-marketing-authoring-result__draft-subject"
          :title="keyMessage"
        >
          주제 : {{ keyMessage }}
        </p>
        <div
          v-if="!isShare"
          class="chat-marketing-authoring-result__draft-actions"
        >
          <button
            type="button"
            @click="onCopy"
          >
            <i class="icon-copy size-16" />
            복사
          </button>
          <button
            type="button"
            title="생성된 문구를 직접 편집합니다"
            @click="toggleEdit"
          >
            <i class="icon-edit size-16" />
            {{ isEditing ? '수정 완료' : '내용 수정' }}
          </button>
        </div>
        <div
          v-else
          class="chat-marketing-authoring-result__draft-actions"
        >
          <button
            type="button"
            @click="onCopy"
          >
            <i class="icon-copy size-16" />
            복사
          </button>
        </div>
      </div>

      <UiTextarea
        v-if="isEditing"
        v-model="editDraft"
        :rows="10"
        :border="true"
        class="chat-marketing-authoring-result__editor"
      />
      <!-- eslint-disable vue/no-v-html -- escapeHtml 처리 후 해시태그/줄바꿈 태그만 주입 -->
      <div
        v-else
        class="chat-marketing-authoring-result__content"
        v-html="renderedContent"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>

    <footer
      v-if="!isShare"
      class="chat-marketing-authoring-result__footer"
    >
      <UiButton
        variant="line-secondary"
        size="md"
        title="새로운 콘텐츠 제작을 시작합니다"
        @click="emit('reopen')"
      >
        새로 만들기
      </UiButton>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
import type { MarketingAuthoringResult } from '~/types/chat'

const props = withDefaults(
  defineProps<{
    result: MarketingAuthoringResult
    isShare?: boolean
    themeColorHex?: string
  }>(),
  {
    isShare: false,
    themeColorHex: '',
  },
)

const emit = defineEmits<{
  reopen: []
}>()

const themeStyle = computed(() => ({
  '--marketing-authoring-color': props.themeColorHex || 'var(--color-primary)',
}))

const activeVariantId = ref(props.result.variants.find((item) => item.recommended)?.id ?? props.result.variants[0]?.id)
const isEditing = ref(false)
const editDraft = ref('')
const editedContents = ref<Record<number, string>>({})

watch(
  () => props.result.variants,
  (variants) => {
    const preferred = variants.find((item) => item.recommended)?.id ?? variants[0]?.id
    if (preferred && !variants.some((item) => item.id === activeVariantId.value)) {
      activeVariantId.value = preferred
    }
  },
  { deep: true },
)

const activeVariant = computed(() => props.result.variants.find((item) => item.id === activeVariantId.value) ?? null)

const activeContent = computed(() => {
  if (!activeVariant.value) return ''
  return editedContents.value[activeVariant.value.id] ?? activeVariant.value.content
})

const metaItems = computed(() => {
  const conditions = props.result.conditions
  return [
    { label: '콘텐츠 유형', value: conditions.contentType },
    { label: '작성 목적', value: conditions.purpose },
    { label: '대상 독자', value: conditions.audience },
    { label: '톤앤매너', value: conditions.tones },
    { label: '분량', value: conditions.length },
    { label: '채널', value: conditions.channel },
    { label: '추가 요청', value: conditions.additionalRequirements },
  ].filter((item): item is { label: string; value: string } => !!item.value)
})

/** 시안 툴바 좌측에 표기할 주제 (핵심 메시지) */
const keyMessage = computed(() => props.result.conditions.keyMessage?.trim() ?? '')

/** 작성 조건 요약 — 기본은 한 줄로 접어두고 토글로 전체 표시 */
const isMetaOpen = ref(false)
const toggleMeta = () => {
  isMetaOpen.value = !isMetaOpen.value
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderedContent = computed(() => {
  const escaped = escapeHtml(activeContent.value)
  return escaped
    .replace(/(^|\s)(#[\p{L}\p{N}\p{M}_]+)/gu, '$1<span class="is-hashtag">$2</span>')
    .replace(/\n{2,}/g, '<br /><br />')
    .replace(/\n/g, '<br />')
})

const selectVariant = (variantId: number) => {
  if (variantId === activeVariantId.value) return

  isEditing.value = false
  editDraft.value = ''
  activeVariantId.value = variantId
}

const toggleEdit = () => {
  if (!activeVariant.value) return
  if (isEditing.value) {
    editedContents.value = {
      ...editedContents.value,
      [activeVariant.value.id]: editDraft.value,
    }
    isEditing.value = false
    openToast({ message: '시안 수정 내용을 반영했습니다.' })
    return
  }
  editDraft.value = activeContent.value
  isEditing.value = true
}

const onCopy = async () => {
  try {
    await copyToClipboard(activeContent.value)
    openToast({ message: '시안을 클립보드에 복사했습니다.' })
  } catch {
    openToast({ message: '복사에 실패했습니다.', type: 'error' })
  }
}
</script>
