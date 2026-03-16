<template>
  <div class="prompt-system-setting">
    <div class="prompt-box-header">
      <div class="prompt-box-title">
        <span class="prompt-box-name">시스템 프롬프트 설정</span>
        <span class="prompt-box-sub">부서별, 역할별로 다른 시스템 프롬프트를 설정할 수 있습니다.</span>
      </div>
      <UiButton
        variant="secondary"
        size="sm"
        @click="onNewPrompt"
      >
        <template #icon-left>
          <i class="icon-plus size-16" />
        </template>
        새 프롬프트
      </UiButton>
    </div>

    <div class="prompt-system-setting-body">
      <!-- 상세 설정 타이틀 -->
      <div class="com-setting-section-title is-inline">상세 설정</div>

      <!-- 프롬프트 유형 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">프롬프트 유형</label>
        <UiSelect
          :model-value="form.name"
          :options="typeOptions"
          size="sm"
          placeholder="프롬프트 유형 선택"
          @update:model-value="onUpdateForm('name', $event)"
        />
      </div>

      <!-- 시스템 프롬프트 -->
      <div class="com-setting-field-row is-top">
        <label class="com-setting-label">시스템 프롬프트</label>
        <UiTextarea
          :model-value="form.content"
          placeholder="시스템 프롬프트를 입력하세요"
          :rows="6"
          size="sm"
          :border="true"
          :auto-resize="true"
          :max-rows="12"
          @update:model-value="onUpdateForm('content', $event)"
        />
      </div>

      <!-- Temperature / Top P -->
      <div class="com-setting-row">
        <div class="com-setting-field-col">
          <div class="com-setting-field-row">
            <label class="com-setting-label">Temperature (창의성)</label>
            <UiInput
                  :model-value="form.temperature"
                  type="number"
                  size="sm"
                  desc="0: 일관적, 2: 창의적"
                  @update:model-value="onUpdateForm('temperature', $event)"
                />
          </div>
        </div>

        <div class="com-setting-field-col">
          <div class="com-setting-field-row">
            <label class="com-setting-label">Top P (샘플링)</label>
            <UiInput
                  :model-value="form.topP"
                  type="number"
                  size="sm"
                  desc="0.1~1.0 사이 값"
                  @update:model-value="onUpdateForm('topP', $event)"
                />
          </div>
        </div>
      </div>

      <!-- 적용 대상 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">적용 대상</label>
        <div class="com-setting-checkbox-group">
          <UiCheckbox
            v-for="target in targetOptions"
            :key="target.value"
            :model-value="form.targets.includes(target.value)"
            :label="target.label"
            @update:model-value="onToggleTarget(target.value, $event)"
          />
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="prompt-system-setting-footer">
      <UiButton
        variant="primary-line"
        size="md"
        @click="$emit('test')"
      >
        테스트
      </UiButton>
      <UiButton
        variant="primary"
        size="md"
        @click="$emit('save', form)"
      >
        저장
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SystemPrompt } from '~/types/prompt'

interface Props {
  modelValue: Partial<SystemPrompt>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: Partial<SystemPrompt>]
  save: [form: Partial<SystemPrompt>]
  test: []
}>()

const form = computed(() => props.modelValue)

// 유형 옵션
const typeOptions = [
  { label: '기본 프롬프트 (전체 공통)', value: '기본 프롬프트 (전체 공통)' },
  { label: 'RAG 전용 프롬프트', value: 'RAG 전용 프롬프트' },
  { label: 'SQL 전용 프롬프트', value: 'SQL 전용 프롬프트' },
]

// 적용 대상 옵션
const targetOptions = [
  { label: 'LLM 질의', value: 'LLM' },
  { label: '매뉴얼 질의 (RAG)', value: 'RAG' },
  { label: '데이터 질의 (TextToSQL)', value: 'TextToSQL' },
]

const onUpdateForm = (key: string, value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const onToggleTarget = (target: string, checked: boolean) => {
  const current = [...(props.modelValue.targets ?? [])]
  if (checked) {
    current.push(target)
  } else {
    const idx = current.indexOf(target)
    if (idx > -1) current.splice(idx, 1)
  }
  emit('update:modelValue', { ...props.modelValue, targets: current })
}

const onNewPrompt = () => {
  emit('update:modelValue', {
    name: '',
    content: '',
    temperature: 0.7,
    topP: 0.9,
    targets: [],
    isActive: false,
  })
}
</script>
