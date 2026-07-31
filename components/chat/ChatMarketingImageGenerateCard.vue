<template>
  <section
    class="marketing-image-maker"
    :style="themeStyle"
  >
    <header class="marketing-image-maker__header">
      <div>
        <h3>마케팅 이미지 제작</h3>
        <p>용도와 브랜드 정보를 입력하면 채널에 맞는 이미지를 생성합니다.</p>
      </div>
    </header>

    <div class="marketing-image-maker__body">
      <div class="marketing-image-maker__field">
        <label><i>*</i> 이미지 유형</label>
        <div class="marketing-image-maker__option-grid">
          <button
            v-for="option in imageTypeOptions"
            :key="option.value"
            type="button"
            :class="{ 'is-selected': form.imageType === option.value }"
            @click="form.imageType = option.value"
          >
            <strong>{{ option.label }}</strong>
            <small>{{ option.description }}</small>
          </button>
        </div>
      </div>

      <div class="marketing-image-maker__row">
        <div class="marketing-image-maker__field">
          <label><i>*</i> 제작 목적</label>
          <UiInput
            v-model="form.purpose"
            placeholder="예: 신상품 출시 홍보"
            size="sm"
          />
        </div>
        <div class="marketing-image-maker__field">
          <label><i>*</i> 대상 고객</label>
          <UiInput
            v-model="form.audience"
            placeholder="예: 20~30대 직장인"
            size="sm"
          />
        </div>
      </div>

      <div class="marketing-image-maker__row">
        <div
          ref="visualStyleFieldRef"
          class="marketing-image-maker__field"
        >
          <label><i>*</i> 비주얼 스타일</label>
          <UiSelect
            v-model="form.visualStyle"
            :options="visualStyleOptions"
            placeholder="스타일을 선택하세요"
            size="sm"
            @update:model-value="onVisualStyleChange"
          />
          <UiInput
            v-if="form.visualStyle === 'OTHER'"
            ref="customVisualStyleInputRef"
            v-model="form.customVisualStyle"
            placeholder="원하는 비주얼 스타일을 직접 입력해 주세요."
            size="sm"
          />
        </div>
        <div
          ref="aspectRatioFieldRef"
          class="marketing-image-maker__field"
        >
          <label><i>*</i> 화면 비율</label>
          <UiSelect
            v-model="form.aspectRatio"
            :options="aspectRatioOptions"
            placeholder="비율을 선택하세요"
            size="sm"
            @update:model-value="onAspectRatioChange"
          />
          <UiInput
            v-if="form.aspectRatio === 'OTHER'"
            ref="customAspectRatioInputRef"
            v-model="form.customAspectRatio"
            placeholder="예: 3:2 가로형"
            size="sm"
          />
        </div>
      </div>

      <div class="marketing-image-maker__field">
        <label><i>*</i> 홍보할 상품·서비스</label>
        <UiTextarea
          v-model="form.productInformation"
          placeholder="상품명, 주요 특징, 혜택과 차별점을 입력해 주세요."
          :rows="4"
          :max-length="1000"
          border
        />
      </div>

      <div class="marketing-image-maker__field">
        <label><i>*</i> 핵심 메시지</label>
        <UiTextarea
          v-model="form.coreMessage"
          placeholder="이미지에서 가장 강조할 메시지를 입력해 주세요."
          :rows="3"
          :max-length="300"
          border
        />
      </div>

      <div class="marketing-image-maker__row">
        <div class="marketing-image-maker__field">
          <label>이미지 내 문구</label>
          <UiInput
            v-model="form.imageText"
            placeholder="비워두면 문구 없이 생성"
            size="sm"
          />
        </div>
        <div class="marketing-image-maker__field">
          <label>브랜드 컬러</label>
          <UiInput
            v-model="form.brandColors"
            placeholder="예: #7346E8, 흰색"
            size="sm"
          />
        </div>
      </div>

      <div class="marketing-image-maker__field">
        <label>참고 이미지 <small>(선택)</small></label>
        <UiFileUpload
          v-model="form.referenceFiles"
          accept=".png,.jpg,.jpeg,.webp"
          :allowed-extensions="['png', 'jpg', 'jpeg', 'webp']"
          :max-files="3"
          multiple
          hint="PNG, JPG, JPEG, WEBP 참고 이미지를 최대 3개까지 첨부할 수 있습니다."
        />
      </div>

      <div class="marketing-image-maker__field">
        <label>추가 요청사항 <small>(선택)</small></label>
        <UiTextarea
          v-model="form.additionalRequirements"
          placeholder="구도, 배경, 포함하거나 제외할 요소를 입력해 주세요."
          :rows="3"
          :max-length="500"
          border
        />
      </div>
    </div>

    <footer class="marketing-image-maker__footer">
      <UiButton
        variant="line-secondary"
        size="sm"
        @click="emit('back')"
      >
        이전
      </UiButton>
      <UiButton
        variant="secondary"
        size="sm"
        @click="onSubmit"
      >
        이미지 생성
      </UiButton>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import { MARKETING_IMAGE_TYPES } from '~/utils/agent/marketingAuthoringConfigUtil'
import type { MarketingImageFormPayload } from '~/types/chat'

const props = withDefaults(
  defineProps<{
    themeColorHex?: string
  }>(),
  {
    themeColorHex: '',
  },
)

const emit = defineEmits<{
  back: []
  submit: [payload: MarketingImageFormPayload]
}>()

const imageTypeOptions = MARKETING_IMAGE_TYPES
const visualStyleOptions = [
  { label: '선택', value: '' },
  { label: '미니멀·클린', value: '미니멀하고 정돈된 스타일' },
  { label: '프리미엄', value: '고급스럽고 세련된 스타일' },
  { label: '밝고 친근한', value: '밝고 친근하며 생동감 있는 스타일' },
  { label: '전문적', value: '신뢰감을 주는 전문적인 스타일' },
  { label: '감성적', value: '감성적이고 분위기 있는 스타일' },
  { label: '기타 직접 입력', value: 'OTHER' },
]
const aspectRatioOptions = [
  { label: '선택', value: '' },
  { label: '정사각형 (1:1)', value: '1:1 정사각형' },
  { label: '가로형 (16:9)', value: '16:9 가로형' },
  { label: '세로형 (4:5)', value: '4:5 세로형' },
  { label: '스토리 (9:16)', value: '9:16 세로형' },
  { label: '기타 직접 입력', value: 'OTHER' },
]

const form = reactive<MarketingImageFormPayload>({
  imageType: '',
  purpose: '',
  audience: '',
  visualStyle: '',
  customVisualStyle: '',
  aspectRatio: '',
  customAspectRatio: '',
  imageText: '',
  coreMessage: '',
  productInformation: '',
  brandColors: '',
  additionalRequirements: '',
  referenceFiles: [],
})

const visualStyleFieldRef = ref<HTMLElement | null>(null)
const aspectRatioFieldRef = ref<HTMLElement | null>(null)
const customVisualStyleInputRef = ref<{ focus: () => void } | null>(null)
const customAspectRatioInputRef = ref<{ focus: () => void } | null>(null)

const themeStyle = computed(() => ({
  '--marketing-image-color': props.themeColorHex || '#7346e8',
}))

const focusField = async (fieldEl: HTMLElement | null, input?: { focus: () => void } | null) => {
  fieldEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await nextTick()
  input?.focus()
}

const onVisualStyleChange = (value: string | number) => {
  if (String(value) !== 'OTHER') form.customVisualStyle = ''
}

const onAspectRatioChange = (value: string | number) => {
  if (String(value) !== 'OTHER') form.customAspectRatio = ''
}

const onSubmit = async () => {
  if (
    !form.imageType ||
    !form.purpose.trim() ||
    !form.audience.trim() ||
    !form.visualStyle ||
    !form.aspectRatio ||
    !form.productInformation.trim() ||
    !form.coreMessage.trim()
  ) {
    openToast({ message: '이미지 제작의 필수 항목을 모두 입력해 주세요.', type: 'warning' })
    return
  }

  if (form.visualStyle === 'OTHER' && !form.customVisualStyle.trim()) {
    openToast({ message: '비주얼 스타일을 직접 입력해 주세요.', type: 'warning' })
    await focusField(visualStyleFieldRef.value, customVisualStyleInputRef.value)
    return
  }

  if (form.aspectRatio === 'OTHER' && !form.customAspectRatio.trim()) {
    openToast({ message: '화면 비율을 직접 입력해 주세요.', type: 'warning' })
    await focusField(aspectRatioFieldRef.value, customAspectRatioInputRef.value)
    return
  }

  emit('submit', {
    ...form,
    referenceFiles: [...form.referenceFiles],
  })
}
</script>
