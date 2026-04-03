<template>
  <section
    v-for="sec in tmplSections"
    v-show="sec.items.length > 0"
    :key="sec.type"
    class="tmpl-section"
    :aria-labelledby="sec.headingId"
  >
    <div class="tmpl-section__head">
      <h2
        :id="sec.headingId"
        class="tmpl-section__title"
      >
        {{ sec.title }}
      </h2>
      <UiTag
        v-if="sec.type === 'builtin'"
        variant="default"
        size="sm"
        label="시스템 제공 · 편집 불가"
      />
      <UiBadge
        v-else
        variant="manual-ai"
        size="sm"
      >
        {{ sec.items.length }}개
      </UiBadge>
    </div>
    <div class="tmpl-card-stack">
      <article
        v-for="item in sec.items"
        :key="item.tmplId"
        class="card-grid-card"
        :class="sec.type === 'builtin' ? 'tmpl-builtin-card' : 'tmpl-user-card'"
      >
        <template v-if="sec.type === 'builtin'">
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
                label="내장"
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
          <div class="tmpl-prompt-box">
            <p class="tmpl-prompt-box__label">프롬프트 (요약)</p>
            <p class="tmpl-prompt-box__text">{{ item.llmPromptSmry }}</p>
          </div>
        </template>
        <template v-else>
          <div class="tmpl-user-card__head">
            <h3 class="tmpl-user-card__name">{{ item.tmplNm }}</h3>
            <div class="tmpl-user-card__actions">
              <UiTag
                variant="primary"
                size="sm"
                :label="item.tmplType === 'T' ? '템플릿형' : '자유형식'"
              />
              <UiButton
                variant="ghost"
                size="sm"
                @click="onEditUserTemplate(item)"
              >
                <template #icon-left>
                  <i class="icon-edit size-16" />
                </template>
                수정
              </UiButton>
            </div>
          </div>
          <p
            v-if="item.description"
            class="tmpl-user-card__desc"
          >
            {{ item.description }}
          </p>
        </template>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TmplBaseInfo } from '~/types/tmpl'

type TmplListSectionType = 'builtin' | 'user'

interface TmplListSectionRow {
  type: TmplListSectionType
  headingId: string
  title: string
  items: TmplBaseInfo[]
}

interface Props {
  tmplList: TmplBaseInfo[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  editUserTemplate: [t: TmplBaseInfo]
}>()

const isSysBuiltinTmpl = (sysTmplYn: string | undefined): boolean => sysTmplYn === 'Y'

const tmplSections = computed((): TmplListSectionRow[] => {
  const builtinItems = props.tmplList.filter((t) => isSysBuiltinTmpl(t.sysTmplYn))
  const userItems = props.tmplList.filter((t) => !isSysBuiltinTmpl(t.sysTmplYn))
  return [
    {
      type: 'builtin',
      headingId: 'tmpl-builtin-heading',
      title: '내장 템플릿',
      items: builtinItems,
    },
    {
      type: 'user',
      headingId: 'tmpl-user-heading',
      title: '사용자 템플릿',
      items: userItems,
    },
  ]
})

const onEditUserTemplate = (t: TmplBaseInfo) => {
  emit('editUserTemplate', t)
}
</script>

<style lang="scss" scoped>
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
</style>
