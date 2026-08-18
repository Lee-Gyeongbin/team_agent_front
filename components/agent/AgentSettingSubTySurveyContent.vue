<template>
  <div class="survey-categories-block">
    <p class="com-setting-hint survey-categories-block__desc">
      채팅 설문 화면에 표시되는 영역·문항입니다. 역문항은 각 문항 옆에서 체크하며, 저장 시 문항 번호와 자동
      동기화됩니다.
    </p>

    <div class="survey-categories">
      <div class="survey-categories__head">
        <span class="com-setting-label">영역 · 문항</span>
        <UiButton
          variant="line-secondary"
          size="xs"
          @click="onAddCategory"
        >
          영역 추가
        </UiButton>
      </div>

      <p
        v-if="!modelValue.categories.length"
        class="com-setting-hint"
      >
        영역을 추가한 뒤 문항을 입력하세요.
      </p>

      <div
        v-for="(cat, catIdx) in modelValue.categories"
        :key="`cat-${cat.no}-${catIdx}`"
        class="survey-category-card"
      >
        <div class="survey-category-card__head">
          <span class="survey-category-card__no">영역 {{ cat.no }}</span>
          <button
            type="button"
            class="survey-icon-btn"
            title="영역 삭제"
            @click="onRemoveCategory(catIdx)"
          >
            <i class="icon-trashcan size-14" />
          </button>
        </div>
        <div class="survey-category-card__fields">
          <UiInput
            :model-value="cat.title"
            size="sm"
            placeholder="영역명 (한글)"
            @update:model-value="onCategoryUpdate(catIdx, 'title', String($event ?? ''))"
          />
          <UiInput
            :model-value="cat.key"
            size="sm"
            placeholder="key (영문, 예: jobDemand)"
            @update:model-value="onCategoryUpdate(catIdx, 'key', String($event ?? ''))"
          />
          <UiInput
            :model-value="cat.titleEn"
            size="sm"
            placeholder="영역명 (영문)"
            @update:model-value="onCategoryUpdate(catIdx, 'titleEn', String($event ?? ''))"
          />
          <UiInput
            :model-value="cat.elevatedLabel"
            size="sm"
            placeholder="초과 표시 라벨 (예: 직무요구 과부하)"
            :desc="'기준 초과 시 스트레스 유형 섹션에 표시되는 라벨'"
            @update:model-value="onCategoryUpdate(catIdx, 'elevatedLabel', String($event ?? ''))"
          />
        </div>
        <div class="survey-category-card__questions">
          <div class="survey-category-card__questions-head">
            <span>문항</span>
            <UiButton
              variant="line-secondary"
              size="xs"
              @click="onAddQuestion(catIdx)"
            >
              문항 추가
            </UiButton>
          </div>
          <div
            v-for="(q, qIdx) in cat.questions"
            :key="`q-${cat.no}-${q.no}`"
            class="survey-question-row"
          >
            <span class="survey-question-row__no">Q{{ q.no }}</span>
            <UiInput
              :model-value="q.text"
              size="sm"
              placeholder="문항 내용"
              class="survey-question-row__text"
              @update:model-value="onQuestionUpdate(catIdx, qIdx, String($event ?? ''))"
            />
            <UiCheckbox
              :model-value="!!q.isReverse"
              label="역문항"
              class="survey-question-row__reverse"
              @update:model-value="onQuestionReverseChange(catIdx, qIdx, $event)"
            />
            <button
              type="button"
              class="survey-icon-btn"
              title="문항 삭제"
              @click="onRemoveQuestion(catIdx, qIdx)"
            >
              <i class="icon-trashcan size-14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiCheckbox } from '@leechanyong/ispark-ui'
import type { SurveyCategoryForm } from '~/types/agentSurveyConfig'
import type { SurveyConfigForm } from '~/utils/agent/surveyConfigUtil'

const props = defineProps<{
  modelValue: SurveyConfigForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SurveyConfigForm]
}>()

const emitForm = (next: SurveyConfigForm) => emit('update:modelValue', next)

const nextCategoryNo = () => {
  const nums = props.modelValue.categories.map((c) => c.no)
  return nums.length ? Math.max(...nums) + 1 : 1
}

const onAddCategory = () => {
  const no = nextCategoryNo()
  const categories: SurveyCategoryForm[] = [
    ...props.modelValue.categories,
    { no, key: `category${no}`, title: '', titleEn: '', elevatedLabel: '', questions: [] },
  ]
  emitForm({ ...props.modelValue, categories })
}

const onRemoveCategory = (catIdx: number) => {
  emitForm({
    ...props.modelValue,
    categories: props.modelValue.categories.filter((_, i) => i !== catIdx),
  })
}

const onCategoryUpdate = (catIdx: number, key: keyof SurveyCategoryForm, value: string) => {
  const categories = props.modelValue.categories.map((c, i) => (i === catIdx ? { ...c, [key]: value } : c))
  emitForm({ ...props.modelValue, categories })
}

const nextQuestionNo = (categories: SurveyCategoryForm[]) => {
  let max = 0
  for (const cat of categories) {
    for (const q of cat.questions) max = Math.max(max, q.no)
  }
  return max + 1
}

const onAddQuestion = (catIdx: number) => {
  const categories = props.modelValue.categories.map((c, i) => {
    if (i !== catIdx) return c
    const no = nextQuestionNo(props.modelValue.categories)
    return { ...c, questions: [...c.questions, { no, text: '', isReverse: false }] }
  })
  emitForm({ ...props.modelValue, categories })
}

const onQuestionUpdate = (catIdx: number, qIdx: number, text: string) => {
  const categories = props.modelValue.categories.map((c, i) => {
    if (i !== catIdx) return c
    const questions = c.questions.map((q, j) => (j === qIdx ? { ...q, text } : q))
    return { ...c, questions }
  })
  emitForm({ ...props.modelValue, categories })
}

const onQuestionReverseChange = (catIdx: number, qIdx: number, isReverse: boolean) => {
  const categories = props.modelValue.categories.map((c, i) => {
    if (i !== catIdx) return c
    const questions = c.questions.map((q, j) => (j === qIdx ? { ...q, isReverse } : q))
    return { ...c, questions }
  })
  emitForm({ ...props.modelValue, categories })
}

const onRemoveQuestion = (catIdx: number, qIdx: number) => {
  const categories = props.modelValue.categories.map((c, i) => {
    if (i !== catIdx) return c
    return { ...c, questions: c.questions.filter((_, j) => j !== qIdx) }
  })
  emitForm({ ...props.modelValue, categories })
}
</script>

<style lang="scss" scoped>
.survey-categories-block {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__desc {
    margin: 0;
  }
}

.survey-categories {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: calc(var(--label-width, 100px) + 12px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    .com-setting-label {
      width: auto;
      text-align: left;
    }
  }
}

.survey-category-card {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: $border-radius-base;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__no {
    font-size: 13px;
    font-weight: 600;
    color: $color-text-dark;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__questions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px dashed #dce4e9;
  }

  &__questions-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: $color-text-muted;
  }
}

.survey-question-row {
  display: flex;
  align-items: center;
  gap: 8px;

  &__no {
    flex-shrink: 0;
    width: 32px;
    font-size: 12px;
    color: $color-text-muted;
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__reverse {
    flex-shrink: 0;

    :deep(.ui-checkbox-label) {
      font-size: 12px;
      white-space: nowrap;
    }
  }
}

.survey-icon-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: $border-radius-base;
  background: transparent;
  color: $color-text-muted;
  cursor: pointer;

  &:hover {
    background: #eef2f6;
    color: $color-text-dark;
  }
}
</style>
