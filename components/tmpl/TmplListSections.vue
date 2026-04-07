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
        label="시스템 제공"
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
        class="card-grid-card tmpl-list-card--clickable"
        :class="sec.type === 'builtin' ? 'tmpl-builtin-card' : 'tmpl-user-card'"
        role="button"
        tabindex="0"
        :aria-label="`${item.tmplNm} 템플릿 수정`"
        @click="onEditTemplate(item)"
        @keydown.enter.prevent="onEditTemplate(item)"
        @keydown.space.prevent="onEditTemplate(item)"
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
  editTemplate: [t: TmplBaseInfo]
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

const onEditTemplate = (t: TmplBaseInfo) => {
  emit('editTemplate', t)
}
</script>
