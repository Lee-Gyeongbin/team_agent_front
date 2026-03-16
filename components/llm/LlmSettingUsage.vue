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
            @update:model-value="onUpdate('inputCost', $event)"
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
            @update:model-value="onUpdate('outputCost', $event)"
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
            @update:model-value="onUpdate('dayReqLmt', $event)"
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
            @update:model-value="onUpdate('rpmLimit', $event)"
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
            @update:model-value="onUpdate('tpmLimit', $event)"
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
            @update:model-value="onUpdate('dayCostLmt', $event)"
          />
        </div>
      </div>

      <!-- 사용자 그룹별 접근 제어 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">사용자 그룹별 접근 제어</label>
        <div class="com-setting-checkbox-group">
          <UiCheckbox
            :model-value="getAccessByRole('admin')"
            label="관리자"
            @update:model-value="onUpdateAccess('admin', $event)"
          />
          <UiCheckbox
            :model-value="getAccessByRole('premium')"
            label="프리미엄 사용자"
            @update:model-value="onUpdateAccess('premium', $event)"
          />
          <UiCheckbox
            :model-value="getAccessByRole('general')"
            label="일반 사용자"
            @update:model-value="onUpdateAccess('general', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LlmAccessControl } from '~/types/llm'

interface UsageForm {
  inputCost: number
  outputCost: number
  dayReqLmt: number
  rpmLimit: number
  tpmLimit: number
  dayCostLmt: number
  accessControlList: LlmAccessControl[]
}

interface Props {
  modelValue: UsageForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: UsageForm]
}>()

const isCollapsed = ref(true)

const getAccessByRole = (roleId: string) => {
  return props.modelValue.accessControlList.find((a) => a.roleId === roleId)?.allowedYn ?? false
}

const onUpdateAccess = (roleId: string, allowedYn: boolean) => {
  const list = [...props.modelValue.accessControlList]
  const idx = list.findIndex((a) => a.roleId === roleId)
  if (idx > -1) {
    list[idx] = { ...list[idx], allowedYn }
  } else {
    list.push({ modelId: props.modelValue.accessControlList[0]?.modelId ?? '', roleId, allowedYn })
  }
  emit('update:modelValue', { ...props.modelValue, accessControlList: list })
}

const onUpdate = (key: keyof Omit<UsageForm, 'accessControlList'>, value: number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
