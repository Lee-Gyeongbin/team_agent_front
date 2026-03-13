<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    position="center"
    max-width="600px"
    @close="onClose"
  >
    <div class="user-modal__body">
      <div
        v-if="modalErrorMessage"
        class="user-modal__error"
      >
        <p class="user-modal__error-message">{{ modalErrorMessage }}</p>
      </div>
      <template v-if="form.userId">
        <table class="user-modal__table">
          <tbody>
            <tr class="user-modal__row-double">
              <th scope="row">아이디<span class="user-modal__required">*</span></th>
              <td>
                <UiInput
                  v-model="form.userId"
                  size="sm"
                  disabled
                />
              </td>
              <th scope="row">성명<span class="user-modal__required">*</span></th>
              <td>
                <UiInput
                  v-model="form.userNm"
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
                  :model-value="getAcctStatusName(form.acctStatusCd)"
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
                  size="sm"
                />
              </td>
            </tr>
            <tr>
              <th scope="row">전화번호<span class="user-modal__required">*</span></th>
              <td colspan="3">
                <UiInput
                  v-model="phoneDisplay"
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
      </template>
      <p
        v-else
        class="user-modal__empty"
      >
        선택된 사용자 정보가 없습니다.
      </p>
    </div>

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
          variant="dark"
          size="xlg"
          :disabled="!checkSave"
          @click="onConfirm"
        >
          수정
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { SelectOption } from '~/components/ui/UiSelect.vue'
import type { UserItem } from '~/types/user-manage'
import { useUserManageStore } from '~/composables/user-manage/useUserManageStore'
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

const { getAcctStatusName, formatPhone, toPhoneDigits } = useUserManageStore()

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const orgOptions = ref<SelectOption[]>([
  { label: '조직 1', value: 'ORG001' },
  { label: '조직 2', value: 'ORG002' },
  { label: '조직 3', value: 'ORG003' },
])

/** 모달 내 편집용 로컬 폼 (user 변경 시 동기화) */
const form = ref<Partial<UserItem>>({})

/** 모달 내 API/유효성 오류 메시지 */
const modalErrorMessage = ref('')

/** 모달 내 전화번호 표시용 */
const phoneDisplay = computed({
  get: () => formatPhone(form.value.phone ?? ''),
  set: (value: string) => {
    const digits = toPhoneDigits(value)
    form.value.phone = digits
  },
})

watch(
  () => props.user,
  (user) => {
    form.value = user ? { ...user } : {}
    modalErrorMessage.value = ''
  },
  { immediate: true },
)

/** 입력 값 변경 시 에러 메시지 클리어 */
watch(
  () => [form.value.userNm, form.value.email, form.value.phone],
  () => {
    modalErrorMessage.value = ''
  },
)

/** 사용자 ID, 사용자명, 이메일이 모두 있고, 값이 모두 유효할 때만 저장(수정) 가능 */
const checkSave = computed(() => {
  const userId = String(form.value.userId ?? '')
  const userNm = String(form.value.userNm ?? '')
  const email = String(form.value.email ?? '')
  const phone = String(form.value.phone ?? '')

  if (isEmpty(userId) || isEmpty(userNm) || isEmpty(email)) return false

  const emailTrimmed = email.trim()
  const phoneTrimmed = phone.trim()

  if (!checkEmail(emailTrimmed)) return false
  if (!checkPhone(phoneTrimmed)) return false

  return true
})

const onClose = () => {
  modalErrorMessage.value = ''
  emit('close')
}

const onConfirm = async () => {
  modalErrorMessage.value = ''
  emit('confirm', form.value)
}
</script>

<style lang="scss" scoped>
.user-modal__body {
  padding: $spacing-md 0;
}

.user-modal__content {
  display: flex;
  gap: $spacing-lg;
}

.user-modal__col {
  flex: 1;
}

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

.user-modal__error {
  margin-bottom: $spacing-md;
  padding: $spacing-md;
  background: rgba($color-error, 0.06);
  border-radius: $border-radius-base;

  &-message {
    font-size: $font-size-sm;
    color: $color-error;
  }
}
</style>
