<template>
  <UiModal
    :is-open="isOpen"
    title="면담 요청"
    position="center"
    max-width="420px"
    custom-class="mtlcare-request-modal-dialog"
    @close="onClose"
  >
    <div class="mtlcare-request-form">
      <p class="mtlcare-request-lead">진단 결과를 확인할 면담 요청 대상을 선택하고 면담을 요청하세요.</p>

      <div class="form-row">
        <label class="form-label">
          <span class="is-required">*</span>
          면담 요청 대상
        </label>

        <div
          ref="targetFieldRef"
          class="mtlcare-target-field"
        >
          <div class="mtlcare-target-field__body">
            <template v-if="selectedManager">
              <div class="mtlcare-target-field__avatar">
                <img
                  v-if="selectedManager.profileImgUrl"
                  :src="selectedManager.profileImgUrl"
                  :alt="selectedManager.userNm"
                />
                <i
                  v-else
                  class="icon icon-user size-16"
                />
              </div>
              <div class="mtlcare-target-field__info">
                <span class="mtlcare-target-field__name">{{ selectedManager.userNm }}</span>
                <span
                  v-if="selectedManager.email"
                  class="mtlcare-target-field__email"
                >
                  {{ selectedManager.email }}
                </span>
              </div>
              <button
                type="button"
                class="mtlcare-target-field__clear"
                title="선택 해제"
                @click="onClearManager"
              >
                <i class="icon icon-close-gray size-16" />
              </button>
            </template>
            <span
              v-else
              class="mtlcare-target-field__placeholder"
            >
              면담 요청 대상을 선택해주세요
            </span>
          </div>

          <UiButton
            ref="managerSelectBtnRef"
            variant="outline"
            size="sm"
            class="mtlcare-target-field__action"
            @click="onOpenManagerSelect"
          >
            {{ selectedManager ? '변경' : '선택' }}
          </UiButton>
        </div>
      </div>

      <div class="form-row">
        <label
          class="form-label"
          for="mtlcare-request-comment"
        >
          요청 메시지
          <span class="form-label-optional">(선택)</span>
        </label>
        <UiTextarea
          id="mtlcare-request-comment"
          v-model="comment"
          placeholder="면담 요청 대상에게 요청할 메시지를 입력해주세요."
          :rows="4"
          :max-length="500"
          size="md"
          border
        />
      </div>
    </div>

    <template #footer>
      <div class="mtlcare-request-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="xlg"
          @click="onClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          :loading="requesting"
          @click="onSubmit"
        >
          면담 요청
        </UiButton>
      </div>
    </template>
  </UiModal>

  <UserSelectModal
    v-if="isOpen"
    :is-open="isManagerSelectOpen"
    title="면담 요청 대상 선택"
    confirm-text="선택"
    single-select
    @close="onCloseManagerSelect"
    @confirm="onConfirmManager"
  />
</template>

<script setup lang="ts">
import { useUserSelectStore } from '~/composables/com/useUserSelectStore'
import { useMtlcareStore } from '~/composables/mtlcare/useMtlcareStore'
import type { OrgUserItem } from '~/types/org-manage'

interface Props {
  isOpen: boolean
  resultId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  requested: []
}>()

const {
  selectedUsers,
  handleFetchOrgList,
  addSelectedUser,
  clearSelectedUsers,
  selectedOrgId,
  orgUserList,
  orgTree,
} = useUserSelectStore()
const { handleRequestReport } = useMtlcareStore()

const selectedManager = ref<OrgUserItem | null>(null)
const isManagerSelectOpen = ref(false)
const comment = ref('')
const requesting = ref(false)
const targetFieldRef = ref<HTMLElement | null>(null)
const managerSelectBtnRef = ref<{ $el?: HTMLElement } | null>(null)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      selectedManager.value = null
      comment.value = ''
      isManagerSelectOpen.value = false
      return
    }
    isManagerSelectOpen.value = false
  },
)

const resetManagerSelectState = () => {
  clearSelectedUsers()
  selectedOrgId.value = null
  orgUserList.value = []
  orgTree.value = []
}

const onOpenManagerSelect = async () => {
  resetManagerSelectState()
  isManagerSelectOpen.value = true
  await handleFetchOrgList()
  if (selectedManager.value) {
    addSelectedUser(selectedManager.value)
  }
}

const onCloseManagerSelect = () => {
  isManagerSelectOpen.value = false
}

const onConfirmManager = (users: OrgUserItem[]) => {
  selectedManager.value = users[0] ?? selectedUsers.value[0] ?? null
  isManagerSelectOpen.value = false
}

const onClearManager = () => {
  selectedManager.value = null
}

const onClose = () => {
  if (requesting.value) return
  emit('close')
}

const focusManagerSelect = () => {
  targetFieldRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const el = managerSelectBtnRef.value?.$el as HTMLButtonElement | undefined
  el?.focus()
}

const onSubmit = async () => {
  if (!props.resultId) {
    openToast({ message: '진단 결과 정보를 찾을 수 없습니다.', type: 'warning' })
    return
  }
  if (!selectedManager.value) {
    openToast({ message: '면담 요청 대상을 선택해주세요.', type: 'warning' })
    focusManagerSelect()
    return
  }

  requesting.value = true
  try {
    const res = await handleRequestReport(props.resultId, selectedManager.value.userId, comment.value.trim())
    if (res.successYn) {
      openToast({ message: '면담 요청이 완료되었습니다.', type: 'success' })
      emit('requested')
      emit('close')
    } else {
      openToast({ message: res.returnMsg || '면담 요청에 실패했습니다.', type: 'error' })
    }
  } finally {
    requesting.value = false
  }
}
</script>

<style lang="scss" scoped>
.mtlcare-request-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
  min-width: 0;
}

.mtlcare-request-lead {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.5;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  width: 100%;

  .form-label {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  .is-required {
    color: #f24a2d;
  }

  .form-label-optional {
    margin-left: 2px;
    font-weight: $font-weight-normal;
    color: $color-text-muted;
  }

  :deep(.ui-textarea) {
    width: 100%;
    min-width: 0;
  }
}

.mtlcare-target-field {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  height: 52px;
  padding: 0 6px 0 10px;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-base;
  background: #fff;
  box-sizing: border-box;

  &__body {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__avatar {
    @include flex-center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: $border-radius-full;
    background: #f1f6fe;
    color: #5e87d7;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    line-height: 1.2;
  }

  &__name {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
    @include ellipsis(1);
  }

  &__email {
    font-size: $font-size-sm;
    color: $color-text-muted;
    @include ellipsis(1);
  }

  &__placeholder {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: #aebccb;
    @include ellipsis(1);
  }

  &__clear {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: $border-radius-sm;
    transition: background $transition-fast;

    &:hover {
      background: $color-background;
    }
  }

  &__action {
    flex-shrink: 0;
    min-width: 52px;
  }
}

.mtlcare-request-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $spacing-sm;
  width: 100%;
  flex-shrink: 0;
}
</style>
