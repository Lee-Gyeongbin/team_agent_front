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

    <!-- 내장 템플릿 -->
    <section
      class="tmpl-section"
      aria-labelledby="tmpl-builtin-heading"
    >
      <div class="tmpl-section__head">
        <h2
          id="tmpl-builtin-heading"
          class="tmpl-section__title"
        >
          내장 템플릿
        </h2>
        <UiTag
          variant="default"
          size="sm"
          label="시스템 제공 · 편집 불가"
        />
      </div>
      <div class="tmpl-card-stack">
        <article
          v-for="item in builtinTemplates"
          :key="item.id"
          class="card-grid-card tmpl-builtin-card"
        >
          <div class="tmpl-builtin-card__head">
            <h3 class="tmpl-builtin-card__name">{{ item.name }}</h3>
            <div class="tmpl-builtin-card__tags">
              <UiTag
                variant="primary"
                size="sm"
                :label="item.typeLabel"
              />
              <UiTag
                variant="default"
                size="sm"
                label="내장"
              />
            </div>
          </div>
          <p class="tmpl-builtin-card__desc">{{ item.description }}</p>
          <p
            v-if="item.note"
            class="tmpl-builtin-card__note"
          >
            {{ item.note }}
          </p>
          <div
            v-if="item.fieldMaps?.length"
            class="tmpl-builtin-card__maps"
          >
            <span
              v-for="row in item.fieldMaps"
              :key="row.key"
              class="tmpl-map-chip"
            >
              <code class="tmpl-map-chip__key">{{ row.key }}</code>
              <span class="tmpl-map-chip__arrow">→</span>
              <span class="tmpl-map-chip__label">{{ row.label }}</span>
            </span>
          </div>
          <div class="tmpl-prompt-box">
            <p class="tmpl-prompt-box__label">프롬프트 (요약)</p>
            <p class="tmpl-prompt-box__text">{{ item.promptSummary }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- 사용자 템플릿 (로컬 상태 — API 연동 시 store로 교체) -->
    <section
      v-if="userTemplates.length > 0"
      class="tmpl-section"
      aria-labelledby="tmpl-user-heading"
    >
      <div class="tmpl-section__head">
        <h2
          id="tmpl-user-heading"
          class="tmpl-section__title"
        >
          사용자 템플릿
        </h2>
        <UiBadge
          variant="manual-ai"
          size="sm"
        >
          {{ userTemplates.length }}개
        </UiBadge>
      </div>
      <div class="tmpl-card-stack">
        <article
          v-for="t in userTemplates"
          :key="t.templateId"
          class="card-grid-card tmpl-user-card"
        >
          <div class="tmpl-user-card__head">
            <h3 class="tmpl-user-card__name">{{ t.templateName }}</h3>
            <div class="tmpl-user-card__actions">
              <UiTag
                variant="primary"
                size="sm"
                :label="t.docType === 'TEMPLATE' ? '템플릿형' : '자유형식'"
              />
              <UiButton
                variant="ghost"
                size="sm"
                @click="onEditUserTemplate(t)"
              >
                <template #icon-left>
                  <i class="icon-edit size-16" />
                </template>
                수정
              </UiButton>
            </div>
          </div>
          <p
            v-if="t.description"
            class="tmpl-user-card__desc"
          >
            {{ t.description }}
          </p>
        </article>
      </div>
    </section>

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
import { openToast } from '~/composables/useToast'
import type { DocumentTemplateUser, TmplFormSavePayload } from '~/types/tmpl'

interface BuiltinFieldMap {
  key: string
  label: string
}

interface BuiltinTemplateItem {
  id: string
  name: string
  typeLabel: string
  description: string
  note?: string
  fieldMaps?: BuiltinFieldMap[]
  promptSummary: string
}

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const builtinTemplates = ref<BuiltinTemplateItem[]>([
  {
    id: 'builtin-report',
    name: '보고서',
    typeLabel: '템플릿형',
    description: '제목, 개요, 본문, 결론 등 고정된 섹션으로 구성된 보고서 형식입니다. 각 항목은 JSON 키와 매핑됩니다.',
    fieldMaps: [
      { key: 'title', label: '제목' },
      { key: 'overview', label: '개요 (여러줄)' },
      { key: 'date', label: '작성일자' },
      { key: 'author', label: '작성자' },
      { key: 'content', label: '본문내용 (여러줄)' },
      { key: 'conclusion', label: '결론 (여러줄)' },
    ],
    promptSummary:
      '다음 JSON 키에 맞춰 정식 보고서를 작성하세요. overview, content, conclusion은 여러 문단으로 작성할 수 있습니다.',
  },
  {
    id: 'builtin-draft',
    name: '기안서',
    typeLabel: '자유형식',
    description: '항목 구조를 고정하지 않고, LLM이 문맥에 맞게 항목을 구성하는 기안·제안 문서 형식입니다.',
    note: '실제 항목 목록은 입력 내용에 따라 생성됩니다.',
    promptSummary: '기안서 형식으로 필요한 항목을 스스로 구성하고, 각 항목에 제목과 내용을 채워 작성하세요.',
  },
])

const mappingExampleCode = `{
  "title": "보고서 제목",
  "overview": "문서의 개요 및 배경",
  "date": "2025-01-01",
  "author": "작성자명",
  "content": "본문 내용",
  "conclusion": "결론 및 제안"
}`

/** 신규 템플릿 ID (충돌 적은 접두사 + UUID) */
const genTemplateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `tmpl_${crypto.randomUUID()}`
    : `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

// 🔽 사용자 템플릿 — 백엔드 연결 시 API로 교체
const userTemplates = ref<DocumentTemplateUser[]>([])

const isTmplFormOpen = ref(false)
const editingUserTemplate = ref<DocumentTemplateUser | null>(null)

const onAddTemplate = () => {
  editingUserTemplate.value = null
  isTmplFormOpen.value = true
}

const onEditUserTemplate = (t: DocumentTemplateUser) => {
  editingUserTemplate.value = { ...t, fieldRows: t.fieldRows.map((r) => ({ ...r })) }
  isTmplFormOpen.value = true
}

const onCloseTmplForm = () => {
  isTmplFormOpen.value = false
  editingUserTemplate.value = null
}

const onSaveUserTemplate = (payload: TmplFormSavePayload) => {
  const entity: DocumentTemplateUser = {
    templateId: payload.templateId ?? genTemplateId(),
    templateName: payload.templateName,
    docType: payload.docType,
    description: payload.description,
    fieldRows: payload.fieldRows.map((r) => ({ ...r })),
    promptTemplate: payload.promptTemplate,
  }

  if (payload.templateId) {
    const idx = userTemplates.value.findIndex((u) => u.templateId === payload.templateId)
    if (idx !== -1) {
      userTemplates.value[idx] = entity
    }
  } else {
    userTemplates.value.push(entity)
  }

  openToast({ message: '저장되었습니다.', type: 'success' })
  onCloseTmplForm()
}
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

.tmpl-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tmpl-section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-sm;
}

.tmpl-section__title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  color: $color-text-heading-sub;
}

.tmpl-card-stack {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.tmpl-user-card {
  gap: $spacing-sm;
}

.tmpl-user-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
}

.tmpl-user-card__name {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-heading-sub;
}

.tmpl-user-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tmpl-user-card__desc {
  margin: 0;
  @include typo($body-medium);
  color: $color-text-muted;
  line-height: $line-height-base;
}

.tmpl-builtin-card {
  gap: $spacing-md;
}

.tmpl-builtin-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
}

.tmpl-builtin-card__name {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  color: $color-text-heading-sub;
}

.tmpl-builtin-card__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.tmpl-builtin-card__desc {
  margin: 0;
  @include typo($body-medium);
  color: $color-text-primary;
  line-height: $line-height-base;
}

.tmpl-builtin-card__note {
  margin: 0;
  @include typo($body-small);
  color: $color-text-muted;
  line-height: $line-height-base;
}

.tmpl-builtin-card__maps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tmpl-map-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: $border-radius-sm;
  background: $color-surface;
  border: 1px solid $color-border-light;
  @include typo($body-xsmall);
}

.tmpl-map-chip__key {
  margin: 0;
  padding: 0;
  font-family: $font-family-mono;
  font-size: inherit;
  font-weight: $font-weight-semibold;
  color: var(--color-primary);
  background: none;
  border: none;
}

.tmpl-map-chip__arrow {
  color: $color-text-disabled;
}

.tmpl-map-chip__label {
  color: $color-text-heading-sub;
}

.tmpl-prompt-box {
  padding: $spacing-md;
  border-radius: 12px;
  background: $color-background;
  border: 1px solid $color-border-light;
}

.tmpl-prompt-box__label {
  margin: 0 0 8px;
  @include typo($body-small-bold);
  color: $color-text-dark;
}

.tmpl-prompt-box__text {
  margin: 0;
  @include typo($body-small);
  color: $color-text-secondary;
  line-height: $line-height-relaxed;
  white-space: pre-wrap;
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
