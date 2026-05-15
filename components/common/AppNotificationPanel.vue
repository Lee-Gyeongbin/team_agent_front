<template>
  <div
    ref="notificationWrapRef"
    class="notification-wrap"
  >
    <button
      class="header-btn notif-trigger-btn"
      :class="{ 'is-active': isNotificationOpen }"
      title="알림"
      @click="toggleNotification"
    >
      <i class="icon-notification size-20" />
      <span
        v-if="unreadCount > 0"
        class="notif-badge"
      />
    </button>

    <!-- 알림 패널 -->
    <div
      v-if="isNotificationOpen"
      class="notification-panel"
    >
      <div class="notif-panel-header">
        <span class="notif-panel-title">
          알림
          <em
            v-if="unreadCount > 0"
            class="notif-count"
            >{{ unreadCount }}</em
          >
        </span>
        <button
          class="notif-read-all-btn"
          @click="handleMarkAllRead"
        >
          모두 읽음
        </button>
      </div>

      <div
        v-if="notifyList.length > 0"
        class="notif-list"
      >
        <div
          v-for="item in notifyList"
          :key="item.notifyId"
          class="notif-item"
          :class="{ 'is-unread': item.readYn === 'N' }"
          @click="handleMarkRead(item.notifyId)"
        >
          <div
            class="notif-avatar"
            :style="{ backgroundColor: getAvatarColor(item.sendUserId) }"
          >
            {{ getInitials(item) }}
          </div>
          <div class="notif-body">
            <div class="notif-meta">
              <span class="notif-sender">{{ item.sendUserNm ?? item.sendUserId }}</span>
              <span class="notif-time">{{ item.createDt }}</span>
            </div>
            <div class="notif-title">{{ item.title }}</div>
            <p class="notif-message">{{ item.content }}</p>
            <!-- KS(지식 공유) 알림: 받기 버튼 -->
            <div
              v-if="item.notifyTyCd === 'KS'"
              class="notif-receive-wrap"
            >
              <button
                v-if="item.saveYn === 'N'"
                class="notif-receive-btn"
                @click.stop="onClickReceive(item)"
              >
                받기
              </button>
              <span
                v-else
                class="notif-receive-done"
                >공유완료</span
              >
            </div>
          </div>
          <button
            class="notif-dismiss-btn"
            title="닫기"
            @click.stop="handleDismissNotify(item.notifyId)"
          >
            <i class="icon-close size-12" />
          </button>
        </div>
      </div>

      <div
        v-else-if="notifyLoading"
        class="notif-empty"
      >
        알림을 불러오는 중입니다...
      </div>

      <div
        v-else
        class="notif-empty"
      >
        새로운 알림이 없습니다.
      </div>
    </div>
  </div>

  <!-- KS(지식 공유) 카테고리 선택 모달 -->
  <UiModal
    :is-open="isKsModalOpen"
    title="지식창고 카테고리 선택"
    position="center"
    max-width="420px"
    custom-class="modal-ks-receive"
    @close="handleCloseKsModal"
  >
    <ReceiveCategoryModal
      :card="ksCardDetail"
      :knowledge-list="ksKnowledgeList"
      :loading="ksModalLoading"
      @close="handleCloseKsModal"
      @confirm="onKsCategoryConfirm"
    />
  </UiModal>
</template>

<script setup lang="ts">
import type { Notify } from '~/types/global'
import ReceiveCategoryModal from '~/components/common/ReceiveCategoryModal.vue'

const {
  notifyList,
  notifyLoading,
  unreadCount,
  isNotificationOpen,
  getInitials,
  getAvatarColor,
  handleMarkRead,
  handleMarkAllRead,
  handleDismissNotify,
  isKsModalOpen,
  ksModalLoading,
  ksKnowledgeList,
  ksCardDetail,
  handleOpenKsModal,
  handleCloseKsModal,
  handleReceiveKnowledge,
} = useNotifyStore()

const notificationWrapRef = ref<HTMLElement | null>(null)

const toggleNotification = () => {
  isNotificationOpen.value = !isNotificationOpen.value
}

const onClickOutside = (e: MouseEvent) => {
  if (notificationWrapRef.value && !notificationWrapRef.value.contains(e.target as Node)) {
    isNotificationOpen.value = false
  }
}

/** KS 알림 받기 — 패널 닫고 카테고리 모달 오픈 */
const onClickReceive = (item: Notify) => {
  isNotificationOpen.value = false
  handleOpenKsModal(item)
}

/** 카테고리 선택 확인 — 선택한 카테고리로 지식 카드 복사 저장 */
const onKsCategoryConfirm = (categoryId: string) => {
  handleReceiveKnowledge(categoryId)
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;
@use '~/assets/styles/utils/mixins' as *;

.notification-wrap {
  position: relative;
}

.notif-trigger-btn {
  &.is-active {
    background-color: #e6e8ea;
    color: #58616a;
  }
}

.notif-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 6px;
  height: 6px;
  border-radius: $border-radius-full;
  background-color: $color-error;
  border: 1px solid #fff;
}

.notification-panel {
  position: absolute;
  top: calc(100% + #{$spacing-xs});
  right: 0;
  width: 320px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
  z-index: $z-dropdown;
  overflow: hidden;
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px $spacing-md;
  border-bottom: 1px solid $color-border-light;
}

.notif-panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $color-text-heading;
}

.notif-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: $border-radius-100;
  background-color: $color-error;
  font-size: 10px;
  font-weight: $font-weight-bold;
  font-style: normal;
  color: #fff;
  line-height: 1;
}

.notif-read-all-btn {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
}

.notif-list {
  max-height: 380px;
  overflow-y: auto;
  @include custom-scrollbar(4px);
}

.notif-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px $spacing-md;
  border-bottom: 1px solid $color-border-light;
  cursor: pointer;
  transition: background-color $transition-fast;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: $color-surface;

    .notif-dismiss-btn {
      opacity: 1;
    }
  }

  &.is-unread {
    background-color: rgba(var(--color-primary-rgb), 0.04);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: var(--color-primary);
      border-radius: 0 2px 2px 0;
    }
  }
}

.notif-avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: $border-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: #fff;
  margin-top: 1px;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-meta {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: 2px;
}

.notif-sender {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-heading;
}

.notif-time {
  font-size: 10px;
  color: $color-text-muted;
  flex-shrink: 0;
}

.notif-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-heading-sub;
  margin-bottom: 2px;
}

.notif-message {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  margin: 0;
  @include ellipsis(2);
}

.notif-receive-btn {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: $border-radius-sm;
  border: 1px solid var(--color-primary);
  background: none;
  color: var(--color-primary);
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition:
    background-color $transition-fast,
    color $transition-fast;

  &:hover {
    background-color: var(--color-primary);
    color: #fff;
  }
}

.notif-receive-wrap {
  margin-top: 6px;
  text-align: right;
}

.notif-receive-done {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: $border-radius-sm;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
}

.notif-dismiss-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: $border-radius-full;
  background: none;
  color: $color-text-muted;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity $transition-fast,
    background-color $transition-fast;
  margin-top: 1px;

  &:hover {
    background-color: #e6e8ea;
    color: $color-text-heading;
  }
}

.notif-empty {
  padding: 32px $spacing-md;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-muted;
}
</style>

<!-- KS 받기 모달: 다른 모달·사이드패널보다 최상위로 표시 -->
<style lang="scss">
@use '~/assets/styles/utils/variables' as *;

.modal-ks-receive {
  z-index: 460 !important;
}
</style>
