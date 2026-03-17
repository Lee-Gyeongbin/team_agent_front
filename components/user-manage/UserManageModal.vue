<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    position="center"
    max-width="600px"
    @close="onClose"
  >
    <table
      v-if="!isEditMode || form.userId"
      class="user-modal__table"
    >
      <tbody>
        <tr class="user-modal__row-double">
          <th scope="row">아이디<span class="user-modal__required">*</span></th>
          <td>
            <UiInput
              v-model="form.userId"
              placeholder="아이디를 입력하세요."
              size="sm"
              :disabled="isEditMode"
            />
          </td>
          <th scope="row">성명<span class="user-modal__required">*</span></th>
          <td>
            <UiInput
              v-model="form.userNm"
              placeholder="성명을 입력하세요."
              size="sm"
            />
          </td>
        </tr>
        <tr class="user-modal__row-double">
          <th scope="row">조직</th>
          <td>
            <UiSelect
              v-model="form.orgId"
              :options="orgOptions"
              placeholder="조직 선택"
              size="sm"
            />
          </td>
          <th scope="row">계정 상태</th>
          <td>
            <UiInput
              :model-value="form.acctStatusDesc"
              size="sm"
              disabled
            />
          </td>
        </tr>
        <tr>
          <th scope="row">이메일<span class="user-modal__required">*</span></th>
          <td colspan="3">
            <UiInput
              v-model="form.email"
              placeholder="이메일을 입력하세요."
              size="sm"
            />
          </td>
        </tr>
        <tr>
          <th scope="row">전화번호<span class="user-modal__required">*</span></th>
          <td colspan="3">
            <UiInput
              v-model="phoneDisplay"
              placeholder="'-' 없이 숫자만 입력하세요."
              size="sm"
            />
          </td>
        </tr>
        <tr>
          <th scope="row">마지막 로그인 일시</th>
          <td colspan="3">
            <UiInput
              :model-value="form.lastLoginDt"
              size="sm"
              disabled
            />
          </td>
        </tr>
        <tr>
          <th scope="row">비밀번호 변경 일시</th>
          <td colspan="3">
            <UiInput
              :model-value="form.pwdChgDt"
              size="sm"
              disabled
            />
          </td>
        </tr>
      </tbody>
    </table>
    <p
      v-else
      class="user-modal__empty"
    >
      선택된 사용자 정보가 없습니다.
    </p>

    <template #footer>
      <div class="modal-dialog-footer">
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
          :disabled="!checkSave"
          @click="onConfirm"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { UserItem } from '~/types/user-manage'
import { useUserManageStore } from '~/composables/user-manage/useUserManageStore'
import { useOrgManageStore } from '~/composables/org-manage/useOrgManageStore'
import { checkEmail, checkPhone, isEmpty } from '~/utils/global/validationUtil'

interface Props {
  isOpen: boolean
  title?: string
  user?: UserItem | null
}

const props = withDefaults(defineProps<Props>(), {
  title: '사용자',
  user: null,
})

const emit = defineEmits<{
  close: []
  confirm: [payload: Partial<UserItem>]
}>()

const { formatPhone, toPhoneDigits } = useUserManageStore()
const { orgOptions } = useOrgManageStore()
const isEditMode = computed(() => !!props.user?.userId)

/** 모달 내 편집용 로컬 폼 */
const form = ref<Partial<UserItem>>(props.user ? { ...props.user } : {})

/** 모달 내 전화번호 표시용 */
const phoneDisplay = computed({
  get: () => formatPhone(form.value.phone ?? ''),
  set: (value: string) => {
    const digits = toPhoneDigits(value)
    form.value.phone = digits
  },
})

/** 사용자 ID(3자 이상), 사용자명, 이메일이 모두 있고, 값이 모두 유효할 때만 수정 가능 */
const checkSave = computed(() => {
  const userId = String(form.value.userId ?? '')
  const userNm = String(form.value.userNm ?? '')
  const email = String(form.value.email ?? '')
  const phone = String(form.value.phone ?? '')

  if (isEmpty(userId) || isEmpty(userNm) || isEmpty(email)) return false

  const userIdTrimmed = userId.trim()
  const emailTrimmed = email.trim()
  const phoneTrimmed = phone.trim()

  if (userIdTrimmed.length < 3) return false
  if (!checkEmail(emailTrimmed)) return false
  if (!checkPhone(phoneTrimmed)) return false

  return true
})

const onClose = () => {
  emit('close')
}

const onConfirm = async () => {
  emit('confirm', form.value)
}
</script>

<style lang="scss" scoped>
.user-modal__table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 8px 0;
    font-size: $font-size-sm;
    text-align: left;
    border-bottom: 1px solid $color-border;
  }

  th {
    width: 100px;
    color: $color-text-secondary;
    font-weight: 500;
  }

  .user-modal__required {
    color: $color-error;
    margin-left: 2px;
  }

  td {
    color: $color-text-primary;
  }

  .user-modal__row-double > td:first-of-type {
    padding-right: $spacing-lg;
  }

  :deep(.ui-input-wrap),
  :deep(.ui-select-wrap) {
    width: 100%;
  }
}

.user-modal__empty {
  font-size: $font-size-sm;
  color: $color-text-secondary;
}
</style>
