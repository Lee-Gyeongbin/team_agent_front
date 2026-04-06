<template>
  <section class="my-page-sub-tab">
    <div class="my-page-sub-tab__scroll">
      <table class="my-page-table">
        <tbody>
          <tr class="my-page-row-double">
            <th scope="row">아이디<span class="my-page-required">*</span></th>
            <td>
              <template v-if="isEditMode">
                <UiInput
                  v-model="form.userId"
                  size="sm"
                  disabled
                />
              </template>
              <template v-else>
                <span class="my-page-field-text">{{ form.userId || '-' }}</span>
              </template>
            </td>
            <th scope="row">성명<span class="my-page-required">*</span></th>
            <td>
              <template v-if="isEditMode">
                <UiInput
                  v-model="form.userNm"
                  placeholder="성명을 입력하세요."
                  size="sm"
                />
              </template>
              <template v-else>
                <span class="my-page-field-text">{{ form.userNm || '-' }}</span>
              </template>
            </td>
          </tr>
          <tr class="my-page-row-double">
            <th scope="row">조직</th>
            <td>
              <template v-if="isEditMode">
                <UiSelect
                  v-model="form.orgId"
                  :options="orgOptions"
                  placeholder="조직 선택"
                  size="sm"
                />
              </template>
              <template v-else>
                <span class="my-page-field-text">{{ currentOrgLabel || '-' }}</span>
              </template>
            </td>
            <th scope="row">계정 상태</th>
            <td>
              <span
                v-if="acctStatusLabel"
                class="my-page-status"
                :class="acctStatusClass"
              >
                {{ acctStatusLabel }}
              </span>
              <span
                v-else
                class="my-page-field-text"
              >
                -
              </span>
            </td>
          </tr>
          <tr>
            <th scope="row">이메일<span class="my-page-required">*</span></th>
            <td colspan="3">
              <template v-if="isEditMode">
                <UiInput
                  v-model="form.email"
                  placeholder="이메일을 입력하세요."
                  size="sm"
                />
              </template>
              <template v-else>
                <span class="my-page-field-text">{{ form.email || '-' }}</span>
              </template>
            </td>
          </tr>
          <tr>
            <th scope="row">전화번호<span class="my-page-required">*</span></th>
            <td colspan="3">
              <template v-if="isEditMode">
                <UiInput
                  v-model="phoneDisplay"
                  placeholder="'-' 없이 숫자만 입력하세요."
                  size="sm"
                />
              </template>
              <template v-else>
                <span class="my-page-field-text">{{ phoneDisplay || '-' }}</span>
              </template>
            </td>
          </tr>
          <tr>
            <th scope="row">마지막 로그인 일시</th>
            <td colspan="3">
              <template v-if="isEditMode">
                <UiInput
                  :model-value="form.lastLoginDt || ''"
                  size="sm"
                  disabled
                />
              </template>
              <template v-else>
                <span class="my-page-field-text">{{ form.lastLoginDt || '-' }}</span>
              </template>
            </td>
          </tr>
          <tr class="my-page-info__row--pwd-last">
            <th scope="row">비밀번호 변경 일시</th>
            <td colspan="3">
              <template v-if="isEditMode">
                <UiInput
                  :model-value="form.pwdChgDt || ''"
                  size="sm"
                  disabled
                />
              </template>
              <template v-else>
                <span class="my-page-field-text">{{ form.pwdChgDt || '-' }}</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="my-page-actions">
      <template v-if="isEditMode">
        <UiButton
          variant="primary"
          size="md"
          :disabled="!checkSave"
          @click="handleSaveMyPage"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="handleCancelEdit"
        >
          취소
        </UiButton>
      </template>
      <template v-else>
        <UiButton
          variant="primary"
          size="md"
          @click="handleStartEdit"
        >
          정보 수정
        </UiButton>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatPhone, toPhoneDigits } from '~/utils/global/numberUtil'

const {
  form,
  orgOptions,
  currentOrgLabel,
  isEditMode,
  checkSave,
  handleStartEdit,
  handleCancelEdit,
  handleSaveMyPage,
} = useMyPageStore()

const phoneDisplay = computed({
  get: () => formatPhone(form.value.phone ?? ''),
  set: (value: string) => {
    const digits = toPhoneDigits(value)
    form.value.phone = digits
  },
})

const acctStatusLabel = computed(() => form.value.acctStatusDesc?.trim() || '')

const acctStatusClass = computed(() => {
  const label = acctStatusLabel.value
  if (label === '잠금') return 'is-lock'
  if (label === '비활성') return 'is-inactive'
  return 'is-active'
})
</script>
