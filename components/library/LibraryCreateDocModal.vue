<template>
  <UiModal
    :is-open="isOpen"
    title="문서 만들기"
    max-width="720px"
    custom-class="doc-dataset-create-modal library-create-doc-modal"
    show-fullscreen
    @close="emit('close')"
  >
    <div class="doc-dataset-create-form com-setting-form">
      <p class="doc-dataset-subsection-desc library-create-doc-lead">지식창고 내용을 기반으로 문서를 자동 생성합니다</p>

      <p class="library-create-doc-label">문서 유형을 선택하세요</p>

      <ul
        class="tmpl-card-stack library-create-doc-stack"
        role="listbox"
        :aria-activedescendant="selectedId ? `doc-type-${selectedId}` : undefined"
      >
        <li
          v-for="item in tmplList"
          :id="`doc-type-${item.tmplId}`"
          :key="item.tmplId"
          role="option"
          :aria-selected="selectedId === item.tmplId"
          class="card-grid-card tmpl-builtin-card library-create-doc-select-card"
          :class="{ 'is-selected': selectedId === item.tmplId }"
          tabindex="0"
          @click="onSelectType(item.tmplId)"
          @keydown.enter.prevent="onSelectType(item.tmplId)"
          @keydown.space.prevent="onSelectType(item.tmplId)"
        >
          <div class="tmpl-builtin-card__head">
            <h3 class="tmpl-builtin-card__name">{{ item.tmplNm }}</h3>
            <div class="tmpl-builtin-card__tags">
              <UiTag
                variant="primary"
                size="sm"
                :label="item.tmplType === 'T' ? '템플릿형' : '자유형식'"
              />
              <UiTag
                variant="default"
                size="sm"
                :label="isSysBuiltinTmpl(item.sysTmplYn) ? '내장' : '사용자'"
              />
            </div>
          </div>
          <p class="tmpl-builtin-card__desc">{{ item.description }}</p>
          <div
            v-if="(item.fields?.length ?? 0) > 0"
            class="tmpl-builtin-card__maps"
          >
            <span
              v-for="row in item.fields ?? []"
              :key="row.fieldId"
              class="tmpl-map-chip"
            >
              <code class="tmpl-map-chip__key">{{ row.jsonKey }}</code>
              <span class="tmpl-map-chip__arrow">→</span>
              <span class="tmpl-map-chip__label">{{ row.fieldNm }}</span>
            </span>
          </div>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="doc-dataset-create-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="emit('close')"
        >
          취소
        </UiButton>
        <div class="doc-dataset-create-footer-right">
          <UiButton
            variant="primary-line"
            size="md"
            @click="onOpenTmplPage"
          >
            템플릿 관리 (설정)
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            :disabled="!selectedId || !props.cardId"
            @click="onGenerate"
          >
            <template #icon-left>
              <i class="icon icon-sparkle size-16"></i>
            </template>
            문서 생성하기
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { TmplBaseInfo } from '~/types/tmpl'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    tmplList?: TmplBaseInfo[]
    /** 문서 생성 대상 카드 (상세 모달에서 전달) */
    cardId?: string
  }>(),
  {
    tmplList: () => [],
    cardId: '',
  },
)

const emit = defineEmits<{
  close: []
  generate: [payload: { cardId: string; tmplId: string }]
}>()

const router = useRouter()

/** 템플릿 관리 페이지 — 새 창 */
const onOpenTmplPage = () => {
  const href = router.resolve({ path: '/tmpl' }).href
  window.open(href, '_blank', 'noopener,noreferrer')
}

const selectedId = ref<string | null>(null)
const isSysBuiltinTmpl = (sysTmplYn: string | undefined): boolean => sysTmplYn === 'Y'

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.tmplList.length) {
      selectedId.value = props.tmplList[0]!.tmplId
    }
  },
  { immediate: true },
)

const onSelectType = (tmplId: string) => {
  selectedId.value = tmplId
}

const onGenerate = () => {
  if (!selectedId.value || !props.cardId) return
  emit('generate', { cardId: props.cardId, tmplId: selectedId.value })
}
</script>
