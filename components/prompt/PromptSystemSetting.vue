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
          :model-value="form.promptTypeCd"
          :options="typeOptions"
          size="sm"
          placeholder="프롬프트 유형 선택"
          @update:model-value="onUpdateForm('promptTypeCd', $event)"
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
            :model-value="form.applyLlmYn === 'Y'"
            label="LLM 질의"
            @update:model-value="onToggleApply('applyLlmYn', $event)"
          />
          <UiCheckbox
            :model-value="form.applyRagYn === 'Y'"
            label="매뉴얼 질의 (RAG)"
            @update:model-value="onToggleApply('applyRagYn', $event)"
          />
          <UiCheckbox
            :model-value="form.applySqlYn === 'Y'"
            label="데이터 질의 (TextToSQL)"
            @update:model-value="onToggleApply('applySqlYn', $event)"
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
import type { CodeItem } from '~/types/codes'
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

const typeOptions = ref<{ label: string; value: string }[]>([])
const initTypeOptions = async () => {
  const codes = await getCodes('PR000001')
  typeOptions.value = codes.map((item: CodeItem) => ({
    label: item.codeNm,
    value: item.codeId,
  }))
}

onMounted(() => {
  initTypeOptions()
  onNewPrompt()
})

const onUpdateForm = (key: string, value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const onToggleApply = (key: 'applyLlmYn' | 'applyRagYn' | 'applySqlYn', checked: boolean) => {
  emit('update:modelValue', { ...props.modelValue, [key]: checked ? 'Y' : 'N' })
}

const onNewPrompt = () => {
  emit('update:modelValue', {
    promptTypeCd: '',
    content: '',
    temperature: 0,
    topP: 0,
    applyLlmYn: 'Y',
    applyRagYn: 'Y',
    applySqlYn: 'Y',
  })
}
</script>
