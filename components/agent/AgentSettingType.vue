<template>
  <div class="com-setting-section">
    <div class="com-setting-section-title">Agent 유형</div>

    <div class="com-setting-field-row">
      <label class="com-setting-label"><span class="is-required">*</span>테마 유형</label>
      <UiSelect
        :model-value="cncptTy"
        :options="cncptTyOptions"
        class="w-full"
        size="sm"
        placeholder="테마 유형을 선택하세요"
        @update:model-value="onCncptTyChange"
      />
    </div>
    <div class="com-setting-field-row">
      <label class="com-setting-label"><span class="is-required">*</span>기능 유형</label>
      <UiSelect
        :model-value="modelValue"
        :options="agentTypeOptions"
        class="w-full"
        size="sm"
        :disabled="!isEdit"
        @update:model-value="onChange"
      />
    </div>

    <div
      v-if="modelValue === 'C' || modelValue === 'M' || modelValue === 'D'"
      class="com-setting-field-row"
    >
      <label class="com-setting-label"><span class="is-required">*</span>세부 유형</label>
      <UiSelect
        :model-value="subTy"
        :options="subTyOptions"
        class="w-full"
        size="sm"
        placeholder="세부 유형을 선택하세요"
        @update:model-value="onSubTyChange"
      />
    </div>
    <p
      v-if="typeDescription"
      class="com-setting-desc"
    >
      *{{ typeDescription }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  cncptTy: string
  subTy: string
  isEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'update:cncptTy': [value: string]
  'update:subTy': [value: string]
  change: [value: string]
}>()

const cncptTyOptions = [
  { label: '선택', value: '' },
  { label: '워크', value: 'WORK' },
  { label: '지식관리', value: 'KM' },
  { label: '라이프', value: 'LIFE' },
  // TODO : 멘탈케어 탭 임시 비활성화
  // { label: '멘탈케어', value: 'MENTAL' },
]

const cSubTyOptions = [
  { label: '일반', value: '' },
  { label: '설문', value: 'SURVEY' },
  { label: '추천', value: 'RECOMMEND' },
  { label: '자동추천', value: 'AUTO_RECOMMEND' },
  { label: '큐레이션', value: 'CURATION' },
  { label: '기획서·PT', value: 'PLANNER' },
]

const mSubTyOptions = [
  { label: '일반', value: '' },
  { label: '리서처', value: 'RESEARCHER' },
]

const dSubTyOptions = [
  { label: '일반', value: '' },
  { label: '리스크진단', value: 'RISK' },
  { label: '제안서', value: 'PROPOSAL' },
]

const subTyOptions = computed(() => {
  if (props.modelValue === 'C') return cSubTyOptions
  if (props.modelValue === 'M') return mSubTyOptions
  if (props.modelValue === 'D') return dSubTyOptions
  return [{ label: '일반', value: '' }]
})

const codes = await getCodes('AT000001')
const agentTypeOptions = [{ label: '선택', value: '' }, ...codes.map((c) => ({ label: c.codeNm, value: c.codeId }))]

const typeDescriptions: Record<string, string> = {
  '001': '매뉴얼질의(RAG) Agent에서 사용할 데이터셋과 검색 옵션을 설정합니다.',
  '002': '데이터분석(TextToSQL) Agent에서 사용할 DB 연결과 쿼리 옵션을 설정합니다.',
}

const typeDescription = computed(() => typeDescriptions[props.modelValue] || '')

const onChange = (value: string | number) => {
  emit('update:modelValue', value)
  emit('change', String(value))
}

const onCncptTyChange = (value: string | number) => {
  emit('update:cncptTy', String(value ?? ''))
}

const onSubTyChange = (value: string | number) => {
  emit('update:subTy', String(value ?? ''))
}
</script>
