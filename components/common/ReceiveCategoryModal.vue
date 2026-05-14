<template>
  <div class="receive-category-modal">
    <div class="receive-category-modal__body">
      <!-- 공유된 카드 프리뷰 (API 로딩 중에도 영역 고정) -->
      <div
        v-if="card || loading"
        class="ks-card-preview"
      >
        <div class="ks-card-preview__img-grp">
          <!-- 스피너: API 로딩 중이거나 base64 이미지 렌더 전 -->
          <div
            v-if="loading || !imgLoaded"
            class="ks-card-preview__img-spinner"
          />
          <img
            v-if="card"
            :src="resolveDataUrlImageSrc(card.thumbImg, defaultLibraryCardImg)"
            alt="카드 이미지"
            class="img"
            :class="{ 'is-hidden': !imgLoaded }"
            @load="imgLoaded = true"
          />
        </div>
        <template v-if="card">
          <div class="ks-card-preview__desc">
            <div class="ks-card-preview__top">
              <h3 class="ks-card-preview__title">{{ card.title }}</h3>
            </div>
            <div
              v-if="card.tags"
              class="ks-card-preview__tags"
            >
              <span
                v-for="tag in card.tags.split(',').filter(Boolean)"
                :key="tag"
                class="ks-card-preview__tag"
                >#{{ tag }}&nbsp;
              </span>
            </div>
          </div>
          <div class="ks-card-preview__meta">
            <p class="ks-card-preview__date">{{ formatDateTimeDisplay(card.createDt) }}</p>
            <div
              v-if="card.svcTy === 'S'"
              class="ks-card-preview__svc-data"
            >
              <i
                class="icon icon-data-line-small size-14 ks-card-preview__svc-data-icon"
                role="img"
                aria-label="데이터 분석"
              />
            </div>
          </div>
        </template>
      </div>

      <div
        v-if="knowledgeOptions.length === 0 && !loading"
        class="receive-category-modal__empty"
      >
        <p>등록된 카테고리가 없습니다.</p>
      </div>
      <div
        v-else
        class="form-row"
      >
        <label class="form-label">저장할 카테고리</label>
        <UiSelect
          v-model="selectedCategoryId"
          :options="knowledgeOptions"
          placeholder="카테고리를 선택하세요"
          size="md"
          :disabled="loading"
        />
      </div>
    </div>

    <div class="modal-dialog-footer">
      <UiButton
        class="btn-modal-dialog"
        variant="outline"
        size="xlg"
        @click="emit('close')"
      >
        취소
      </UiButton>
      <UiButton
        class="btn-modal-dialog"
        variant="primary"
        size="xlg"
        :disabled="!selectedCategoryId || loading"
        @click="onConfirm"
      >
        받기
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KnowledgeItem } from '~/types/chat'
import type { LibraryCard } from '~/types/library'
import type { SelectOption } from '~/components/ui/UiSelect.vue'
import defaultLibraryCardImg from '~/assets/images/test_images.png'
import { resolveDataUrlImageSrc } from '~/utils/global/imageUtil'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'

const props = defineProps<{
  card?: LibraryCard | null
  knowledgeList: KnowledgeItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [categoryId: string]
}>()

const selectedCategoryId = ref<string | number>('')
const imgLoaded = ref(false)

// 카드가 교체될 때 이미지 로딩 상태 초기화
watch(
  () => props.card?.cardId,
  () => {
    imgLoaded.value = false
  },
)

const knowledgeOptions = computed<SelectOption[]>(() => [
  { label: '선택', value: '' },
  ...props.knowledgeList.map((item) => ({
    label: item.categoryNm,
    value: item.categoryId,
  })),
])

watch(
  () => props.knowledgeList,
  () => {
    selectedCategoryId.value = ''
  },
)

const onConfirm = () => {
  const id = String(selectedCategoryId.value)
  if (!id) return
  emit('confirm', id)
  emit('close')
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

.receive-category-modal {
  padding: $spacing-md;
  width: 100%;
  align-self: stretch;
  min-width: 0;
}

.receive-category-modal__body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.receive-category-modal__empty {
  padding: $spacing-md;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.modal-dialog-footer {
  border-top: none;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  width: 100%;

  .form-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  :deep(.ui-select-wrap) {
    width: 100%;
    min-width: 0;
  }
}

// 카드 프리뷰
.ks-card-preview {
  width: 100%;
  padding: 12px 12px 7px;
  border-radius: $border-radius-lg;
  border: 1px solid #c6d2db;
  background: #fff;
  box-shadow: 4px 4px 4px 0 rgba(30, 50, 77, 0.08);

  &__img-grp {
    position: relative;
    width: 100%;
    height: 78px;
    background: #dce4e9;
    border-radius: 4px;
    overflow: hidden;

    .img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;

      &.is-hidden {
        visibility: hidden;
      }
    }
  }

  &__img-spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: '';
      width: 22px;
      height: 22px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: ks-img-spin 0.8s linear infinite;
    }
  }

  @keyframes ks-img-spin {
    to {
      transform: rotate(360deg);
    }
  }

  &__desc {
    margin-top: 8px;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    color: #33363d;
    font-size: 14px;
    font-weight: 700;
    line-height: 150%;
    @include ellipsis(1);
  }

  &__tags {
    display: flex;
    gap: 4px;
    margin-top: 4px;
    color: #aebccb;
    font-size: $font-size-sm;
    flex-wrap: wrap;
  }

  &__tag {
    display: inline;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 20px;
    margin-top: 5px;
  }

  &__date {
    flex-shrink: 0;
    color: #94a3b8;
    font-size: $font-size-sm;
    white-space: nowrap;
  }

  &__svc-data {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }

  &__svc-data-icon {
    flex-shrink: 0;
    color: #6f7a93;
  }
}
</style>
