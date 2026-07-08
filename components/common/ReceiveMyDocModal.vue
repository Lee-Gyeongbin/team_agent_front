<template>
  <div class="receive-my-doc-modal">
    <div class="receive-my-doc-modal__body">
      <!-- 공유된 내 문서 카드 프리뷰 -->
      <div
        v-if="doc || loading"
        class="md-card-preview"
      >
        <div
          v-if="loading"
          class="md-card-preview__spinner"
        />
        <template v-else-if="doc">
          <div
            class="md-card-preview__doc"
            :class="{ 'is-default': !docAreaStyle }"
            :style="docAreaStyle"
          >
            <i class="icon icon-document size-48" />
          </div>
          <div class="md-card-preview__main">
            <h3 class="md-card-preview__title">{{ doc.docNm }}</h3>
            <div class="md-card-preview__footer">
              <p class="md-card-preview__date">
                {{ formatDateTimeDisplay(doc.modifyDt || doc.createDt) }}
              </p>
              <span class="md-card-preview__agent">
                <i :class="['icon', agentIconClass, 'size-14']" />
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="modal-dialog-footer">
      <UiButton
        class="btn-modal-dialog"
        variant="outline"
        size="lg"
        @click="emit('close')"
      >
        취소
      </UiButton>
      <UiButton
        class="btn-modal-dialog"
        variant="primary"
        size="lg"
        :disabled="!doc || loading"
        @click="onConfirm"
      >
        받기
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton } from '@leechanyong/ispark-ui'
import type { MyDoc } from '~/types/mydoc'
import { getMyDocAgentIconClass, getMyDocDocAreaStyle } from '~/utils/myDocuments/myDocDisplayUtil'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'

const props = defineProps<{
  doc?: MyDoc | null
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const docAreaStyle = computed(() => (props.doc ? getMyDocDocAreaStyle(props.doc) : undefined))
const agentIconClass = computed(() => (props.doc ? getMyDocAgentIconClass(props.doc) : 'icon-search'))

const onConfirm = () => {
  if (!props.doc || props.loading) return
  emit('confirm')
}
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

.receive-my-doc-modal {
  padding: $spacing-md;
  width: 100%;
  align-self: stretch;
  min-width: 0;
}

.receive-my-doc-modal__body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.modal-dialog-footer {
  border-top: none;
}

.md-card-preview {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-height: 96px;
  padding: 12px;
  border-radius: $border-radius-lg;
  border: 1px solid #c6d2db;
  background: #fff;
  box-shadow: 4px 4px 4px 0 rgba(30, 50, 77, 0.08);

  &__spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: '';
      width: 22px;
      height: 22px;
      border: 2px solid rgba(198, 210, 219, 0.4);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: md-preview-spin 0.8s linear infinite;
    }
  }

  @keyframes md-preview-spin {
    to {
      transform: rotate(360deg);
    }
  }

  &__doc {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 72px;
    border-radius: 6px;
    background: var(--card-icon-bg, #ecf0f3);
    color: var(--card-icon-color, #6f7a93);

    &.is-default {
      background: #ecf0f3;
      color: #6f7a93;
    }
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__title {
    flex: 1;
    min-width: 0;
    color: #33363d;
    font-size: 14px;
    font-weight: 700;
    line-height: 150%;
    @include ellipsis(2);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-top: auto;
    min-height: 28px;
  }

  &__date {
    flex-shrink: 0;
    color: #94a3b8;
    font-size: $font-size-sm;
    white-space: nowrap;
  }

  &__agent {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: $border-radius-lg;
    color: #6f7a93;
    background: #f4f7f9;
  }
}
</style>
