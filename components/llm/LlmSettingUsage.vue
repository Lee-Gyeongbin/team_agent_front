<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
    style="--label-width: 140px"
  >
    <div
      class="com-setting-section-header"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="com-setting-section-title">사용량 제한</span>
      <span class="com-setting-section-arrow">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 10l4-4 4 4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <div class="com-setting-section-body">
      <!-- 입력 비용 / 출력 비용 -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">입력 비용 ($/1M 토큰)</label>
          <UiInput
            :model-value="modelValue.inputCost"
            type="number"
            size="sm"
            @update:model-value="onUpdate('inputCost', Number($event))"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">출력 비용 ($/1M 토큰)</label>
          <UiInput
            :model-value="modelValue.outputCost"
            type="number"
            size="sm"
            @update:model-value="onUpdate('outputCost', Number($event))"
          />
        </div>
      </div>

      <!-- 일일 요청 제한 / 분당 요청 제한 -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">일일 요청 제한</label>
          <UiInput
            :model-value="modelValue.dayReqLmt"
            type="number"
            size="sm"
            @update:model-value="onUpdate('dayReqLmt', Number($event))"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">분당 요청 제한 (RPM)</label>
          <UiInput
            :model-value="modelValue.rpmLimit"
            type="number"
            size="sm"
            @update:model-value="onUpdate('rpmLimit', Number($event))"
          />
        </div>
      </div>

      <!-- 분당 토큰 제한 / 일일 비용 제한 -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">분당 토큰 제한 (TPM)</label>
          <UiInput
            :model-value="modelValue.tpmLimit"
            type="number"
            size="sm"
            @update:model-value="onUpdate('tpmLimit', Number($event))"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">일일 비용 제한 ($)</label>
          <UiInput
            :model-value="modelValue.dayCostLmt"
            type="number"
            size="sm"
            @update:model-value="onUpdate('dayCostLmt', Number($event))"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ROLE_MAP: Record<string, string> = { admin: 'ROLE_ADMIN', premium: 'ROLE_PREMIUM', general: 'ROLE_USER' }

interface UsageForm {
  inputCost: number
  outputCost: number
  dayReqLmt: number
  rpmLimit: number
  tpmLimit: number
  dayCostLmt: number
  roleIdArr: string
}

interface Props {
  modelValue: UsageForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: UsageForm]
}>()

const isCollapsed = ref(true)

const parseRoleIdArr = (s: string) =>
  (s || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)

const getAccessByRole = (roleId: string) => parseRoleIdArr(props.modelValue.roleIdArr).includes(ROLE_MAP[roleId])

const onUpdateAccess = (roleId: string, allowedYn: boolean) => {
  const apiRole = ROLE_MAP[roleId]
  const arr = parseRoleIdArr(props.modelValue.roleIdArr)
  const idx = arr.indexOf(apiRole)
  if (allowedYn && idx === -1) arr.push(apiRole)
  else if (!allowedYn && idx > -1) arr.splice(idx, 1)
  emit('update:modelValue', { ...props.modelValue, roleIdArr: arr.join(',') })
}

const onUpdate = (key: keyof Omit<UsageForm, 'accessControlList'>, value: number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
