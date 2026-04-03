<template>
  <div class="card-grid-page m-center tmpl-page">
    <div class="card-grid-page-header tmpl-page-header">
      <div class="tmpl-page-header__left">
        <div class="tmpl-page-header__text">
          <p class="card-grid-page-title">문서 템플릿 관리</p>
          <p class="tmpl-page-desc">문서 만들기 에이전트에서 사용할 템플릿을 정의하고 관리합니다.</p>
        </div>
      </div>
      <UiButton
        variant="primary"
        size="md"
        @click="onAddTemplate"
      >
        <template #icon-left>
          <i class="icon-plus size-16" />
        </template>
        새 템플릿 추가
      </UiButton>
    </div>

    <TmplListSections
      :tmpl-list="tmplList"
      @edit-user-template="onEditUserTemplate"
    />

    <TmplFormPanel
      :is-open="isTmplFormOpen"
      :template="editingUserTemplate"
      @close="onCloseTmplForm"
      @save="onSaveUserTemplate"
    />

    <!-- JSON 매핑 안내 -->
    <section
      class="tmpl-guide"
      aria-label="JSON 키 항목명 매핑 안내"
    >
      <i
        class="icon icon-info size-20 tmpl-guide__icon"
        aria-hidden="true"
      />
      <div class="tmpl-guide__body">
        <h3 class="tmpl-guide__title">JSON 키 ↔ 항목명 매핑 안내</h3>
        <p class="tmpl-guide__text">
          프롬프트에 정의한 JSON 키는 LLM이 문서 항목을 채울 때 사용됩니다. 키는 영문 소문자와 밑줄(_) 조합을
          권장합니다.
        </p>
        <div class="tmpl-guide__code-wrap">
          <UiCodeBlock :code="mappingExampleCode" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import TmplFormPanel from '~/components/tmpl/TmplFormPanel.vue'
import TmplListSections from '~/components/tmpl/TmplListSections.vue'
import { useTmplStore } from '~/composables/tmpl/useTmplStore'
import type { TmplBaseInfo, TmplFormSavePayload } from '~/types/tmpl'

const { tmplList, handleSelectTmplList, handleSaveTmpl } = useTmplStore()

const mappingExampleCode = `{
  "title": "보고서 제목",
  "overview": "문서의 개요 및 배경",
  "date": "2025-01-01",
  "author": "작성자명",
  "content": "본문 내용",
  "conclusion": "결론 및 제안"
}`

const isTmplFormOpen = ref(false)
const editingUserTemplate = ref<TmplBaseInfo | null>(null)

const onAddTemplate = () => {
  editingUserTemplate.value = null
  isTmplFormOpen.value = true
}

const onEditUserTemplate = (t: TmplBaseInfo) => {
  editingUserTemplate.value = { ...t, fields: t.fields.map((r) => ({ ...r })) }
  isTmplFormOpen.value = true
}

const onCloseTmplForm = () => {
  isTmplFormOpen.value = false
  editingUserTemplate.value = null
}

const onSaveUserTemplate = (payload: TmplFormSavePayload) => {
  handleSaveTmpl(payload, { onSaved: onCloseTmplForm })
}

onMounted(() => {
  handleSelectTmplList()
})
</script>

<style lang="scss" scoped>
.tmpl-page {
  gap: $spacing-lg;
}

/* .card-grid-page-header 기본은 align-items: center — 설명 2줄일 때 버튼 상단 정렬 */
.tmpl-page-header {
  align-items: flex-start;
}

.tmpl-page-header__left {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  min-width: 0;
}

.tmpl-page-header__icon {
  flex-shrink: 0;
  color: var(--color-primary);
}

.tmpl-page-header__text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tmpl-page-desc {
  margin: 0;
  @include typo($body-medium);
  color: $color-text-muted;
  line-height: $line-height-base;
}

.tmpl-guide {
  display: flex;
  gap: $spacing-md;
  align-items: flex-start;
  padding: $spacing-md;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, $color-warning 45%, $color-border);
  background: color-mix(in srgb, $color-warning 12%, #fffbeb);
}

.tmpl-guide__icon {
  flex-shrink: 0;
  color: $color-warning;
  margin-top: 2px;
}

.tmpl-guide__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.tmpl-guide__title {
  margin: 0;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: color-mix(in srgb, $color-warning 55%, $color-text-heading);
}

.tmpl-guide__text {
  margin: 0;
  @include typo($body-small);
  color: $color-text-dark;
  line-height: $line-height-base;
}

.tmpl-guide__code-wrap {
  margin-top: 4px;

  /* UiCodeBlock 기본: 진한 배경 + 밝은 코드 텍스트. 연한 배경만 덮어쓰면 글자가 안 보임 */
  :deep(.ui-code-block) {
    border-radius: 12px;
    border: 1px solid $color-border;
  }
}
</style>
