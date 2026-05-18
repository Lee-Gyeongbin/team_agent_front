<script setup lang="ts">
import type { AbnormalMeeting } from '~/types/meeting'
import { useMeetingApi } from '~/composables/meeting/useMeetingApi'

// ─── Props / Emits ─────────────────────────────────────────────────────────
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'recover', payload: { meetingId: number }): void
}>()

// ─── 상태 ──────────────────────────────────────────────────────────────────
const abnormalList = ref<AbnormalMeeting[]>([])
const isLoading = ref(false)

const { fetchAbnormalMeetingList } = useMeetingApi()

// ─── 비정상종료 목록 조회 ───────────────────────────────────────────────────
const loadAbnormalList = async () => {
  isLoading.value = true
  try {
    const res = await fetchAbnormalMeetingList()
    abnormalList.value = res.list ?? []
    // 비정상종료 회의가 있으면 팝업 표시
    if (abnormalList.value.length > 0) {
      emit('update:modelValue', true)
    }
  } catch (e) {
    console.warn('[MeetingRecoverModal] 비정상종료 목록 조회 실패:', e)
  } finally {
    isLoading.value = false
  }
}

// ─── 복구 처리 — 상세 페이지로 이동 후 복구 버튼 표시 ─────────────────────
const handleRecover = (meeting: AbnormalMeeting) => {
  emit('recover', { meetingId: meeting.meetingId })
  handleClose()
}

/** 팝업 닫기 */
const handleClose = () => {
  emit('update:modelValue', false)
}

/** 날짜 포맷 */
const formatDt = (dt: string | null | undefined) => {
  if (!dt) return '-'
  return dt.replace('T', ' ').substring(0, 16)
}

// ─── 초기 로드 ─────────────────────────────────────────────────────────────
onMounted(() => {
  loadAbnormalList()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="recover-modal-overlay"
        @click.self="handleClose"
      >
        <div class="recover-modal">
          <div class="recover-modal__header">
            <h3 class="recover-modal__title">비정상 종료된 회의 복구</h3>
            <button
              class="recover-modal__close"
              type="button"
              aria-label="닫기"
              @click="handleClose"
            >
              <i class="icon-close size-20" />
            </button>
          </div>

          <div class="recover-modal__body">
            <p class="recover-modal__desc">
              이전 회의가 비정상 종료되었습니다.<br />
              백업된 녹음 파일을 복구하여 회의록을 생성할 수 있습니다.
            </p>

            <div
              v-if="isLoading"
              class="recover-modal__loading"
            >
              <i class="icon-loading size-24" />
              <span>목록을 불러오는 중...</span>
            </div>

            <UiEmpty
              v-else-if="abnormalList.length === 0"
              title="복구할 회의가 없습니다."
            />

            <ul
              v-else
              class="recover-modal__list"
            >
              <li
                v-for="item in abnormalList"
                :key="item.meetingId"
                class="recover-modal__item"
              >
                <div class="recover-modal__item-info">
                  <span class="recover-modal__item-title">{{ item.meetingTitle }}</span>
                  <span class="recover-modal__item-date">{{ formatDt(item.startDt) }}</span>
                </div>
                <button
                  class="recover-modal__item-btn"
                  type="button"
                  @click="handleRecover(item)"
                >
                  <span>복구하기</span>
                </button>
              </li>
            </ul>
          </div>

          <div class="recover-modal__footer">
            <button
              class="recover-modal__cancel-btn"
              type="button"
              @click="handleClose"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.recover-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-modal;
}

.recover-modal {
  background: #fff;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  width: 480px;
  max-width: calc(100vw - 32px);
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-lg;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    @include typo($body-large-bold);
    color: $color-text-heading;
    margin: 0;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    color: $color-text-muted;
    padding: 4px;
    border-radius: $border-radius-sm;

    &:hover {
      color: $color-text-primary;
    }
  }

  &__body {
    padding: $spacing-lg;
    overflow-y: auto;
    flex: 1;
  }

  &__desc {
    @include typo($body-small);
    color: $color-text-muted;
    margin: 0 0 $spacing-md;
    line-height: 1.6;
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    color: $color-text-muted;
    @include typo($body-small);
    padding: $spacing-md 0;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    padding: $spacing-md;
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
    background: $color-surface;

    &-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    &-title {
      @include typo($body-small-bold);
      color: $color-text-primary;
      @include ellipsis(1);
    }

    &-date {
      @include typo($body-xsmall);
      color: $color-text-muted;
    }

    &-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px $spacing-md;
      border: none;
      border-radius: $border-radius-base;
      background: var(--color-primary);
      color: #fff;
      @include typo($body-small-bold);
      cursor: pointer;
      white-space: nowrap;
      transition: opacity $transition-fast;

      &:hover:not(:disabled) {
        opacity: 0.85;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: $spacing-md $spacing-lg;
    border-top: 1px solid $color-border;
  }

  &__cancel-btn {
    padding: 8px $spacing-lg;
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
    background: #fff;
    color: $color-text-muted;
    @include typo($body-small);
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-surface;
    }
  }
}

// 모달 트랜지션
.modal-enter-active,
.modal-leave-active {
  transition: opacity $transition-base;

  .recover-modal {
    transition: transform $transition-base;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .recover-modal {
    transform: scale(0.95);
  }
}
</style>
