<template>
  <section
    class="marketing-image-maker"
    :style="themeStyle"
  >
    <nav
      class="marketing-image-maker__stepper"
      aria-label="작성 단계"
    >
      <button
        v-for="(step, index) in detailSteps"
        :key="step.key"
        type="button"
        class="marketing-image-maker__stepper-item"
        :class="{
          'is-active': currentStep === index,
          'is-complete': isStepFilled(index) && currentStep !== index,
        }"
        :disabled="!canNavigateToStep(index)"
        @click="onSelectStep(index)"
      >
        <span class="marketing-image-maker__stepper-num">
          {{ index + 1 }}
        </span>
        <strong>{{ step.title }}</strong>
      </button>
    </nav>

    <div
      ref="bodyRef"
      class="marketing-image-maker__body"
    >
      <div class="marketing-image-maker__heading">
        <h3>{{ currentDetailStep.question }}</h3>
        <p v-if="currentDetailStep.description">{{ currentDetailStep.description }}</p>
      </div>

      <!-- 콘텐츠 유형 · 게시 채널 · 생성할 결과 -->
      <template v-if="currentDetailStep.key === 'setup'">
        <div class="marketing-image-maker__type-grid">
          <button
            v-for="option in contentTypeOptions"
            :key="option.value"
            type="button"
            :class="{ 'is-selected': form.contentType === option.value }"
            @click="selectContentType(option.value)"
          >
            <i :class="[resolveOptionIcon(option.value, 'content'), 'size-20']" />
            <span class="marketing-image-maker__type-copy">
              <strong>{{ option.label }}</strong>
              <small v-if="option.description">{{ option.description }}</small>
            </span>
          </button>
        </div>

        <div
          v-if="channelOptions.length"
          class="marketing-image-maker__field"
        >
          <label><i>*</i> 게시 채널</label>
          <div class="marketing-image-maker__channel-grid">
            <button
              v-for="option in channelOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': form.channel === option.value }"
              @click="form.channel = option.value"
            >
              <i :class="[resolveOptionIcon(option.value, 'channel'), 'size-16']" />
              <strong>{{ option.label }}</strong>
            </button>
          </div>
          <UiInput
            v-if="form.channel === 'OTHER'"
            v-model="form.customChannel"
            placeholder="게시 채널을 직접 입력해 주세요."
            size="sm"
          />
        </div>

        <div
          ref="outputsFieldRef"
          class="marketing-image-maker__field"
        >
          <label><i>*</i> 생성할 결과</label>
          <div class="marketing-image-maker__channel-grid">
            <button
              type="button"
              :class="{ 'is-selected': hasText }"
              @click="toggleOutput('TEXT')"
            >
              <i class="icon-document-edit size-16" />
              <strong>글</strong>
            </button>
            <button
              type="button"
              :class="{ 'is-selected': hasImage }"
              @click="toggleOutput('IMAGE')"
            >
              <i class="icon-image size-16" />
              <strong>그림</strong>
            </button>
          </div>
        </div>

        <div
          v-if="setupSelectionTags.length"
          class="marketing-image-maker__selection-panel"
        >
          <div class="marketing-image-maker__selected-tags">
            <span class="marketing-image-maker__selected-label">선택된 내용</span>
            <div class="marketing-image-maker__tags">
              <button
                v-for="item in setupSelectionTags"
                :key="item.key"
                type="button"
                class="marketing-image-maker__tag"
                @click="item.clear()"
              >
                {{ item.label }}
                <i class="icon-close size-12" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 목적 -->
      <template v-else-if="currentDetailStep.key === 'purpose'">
        <template v-if="hasText && purposeOptions.length">
          <div class="marketing-image-maker__mood-grid marketing-image-maker__mood-grid--cols-5">
            <button
              v-for="option in purposeOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': form.purpose === option.value }"
              @click="selectPurpose(option.value)"
            >
              <i :class="[resolveOptionIcon(option.value, 'purpose'), 'size-24']" />
              <strong>{{ option.label }}</strong>
              <small v-if="option.description">{{ option.description }}</small>
            </button>
          </div>
          <UiInput
            v-if="form.purpose === 'OTHER'"
            v-model="form.customPurpose"
            placeholder="작성 목적을 직접 입력해 주세요."
            size="sm"
          />
        </template>
        <div
          v-else
          class="marketing-image-maker__field"
        >
          <label><i>*</i> 제작 목적</label>
          <UiInput
            v-model="form.purpose"
            placeholder="예: 신상품 출시 홍보"
            size="sm"
          />
        </div>

        <div
          ref="promotionFieldRef"
          class="marketing-image-maker__field"
        >
          <label><i>*</i> 홍보할 상품·서비스</label>
          <div class="marketing-image-maker__promo-row">
            <div class="marketing-image-maker__promo-main">
              <UiTextarea
                v-model="form.promotionInformation"
                class="marketing-image-maker__promo-input"
                placeholder="상품·서비스명, 주요 특징, 가격·혜택, 차별점, 프로모션 정보를 입력해 주세요."
                :rows="12"
                :max-length="2000"
                border
              />
            </div>
            <aside class="marketing-image-maker__input-tip">
              <strong>입력 팁</strong>
              <ul>
                <li
                  v-for="tip in promotionInputTips"
                  :key="tip"
                >
                  {{ tip }}
                </li>
              </ul>
            </aside>
          </div>
        </div>

        <div class="marketing-image-maker__field">
          <label>참고 자료</label>
          <button
            type="button"
            class="marketing-image-maker__reference-attach"
            @click="isReferenceModalOpen = true"
          >
            <i class="icon-document size-16" />
            {{ form.referenceFiles.length ? '참고자료 다시 선택하기' : '참고자료 첨부하기' }}
            <em v-if="form.referenceFiles.length">{{ form.referenceFiles.length }}</em>
          </button>
          <ul
            v-if="form.referenceFiles.length"
            class="marketing-image-maker__reference-list"
          >
            <li
              v-for="(file, index) in form.referenceFiles"
              :key="`${file.name}-${index}`"
            >
              <i class="icon-document size-14" />
              <span :title="file.name">{{ file.name }}</span>
              <button
                type="button"
                title="첨부 제거"
                @click="removeReferenceFile(index)"
              >
                <i class="icon-close size-12" />
              </button>
            </li>
          </ul>
          <p class="marketing-image-maker__reference-hint">문서·이미지 최대 5개 (각 20MB 이하)</p>
        </div>
      </template>

      <!-- 타겟 고객 · 핵심 메시지 -->
      <template v-else-if="currentDetailStep.key === 'audienceMessage'">
        <div class="marketing-image-maker__field">
          <label><i>*</i> 타겟 고객</label>
          <div class="marketing-image-maker__mood-grid marketing-image-maker__mood-grid--cols-5">
            <button
              v-for="option in audienceOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': form.audience === option.value }"
              @click="selectAudience(option.value)"
            >
              <i :class="[resolveOptionIcon(option.value, 'audience'), 'size-24']" />
              <strong>{{ option.label }}</strong>
              <small v-if="option.description">{{ option.description }}</small>
            </button>
          </div>
          <UiInput
            v-if="form.audience === 'OTHER'"
            v-model="form.customAudience"
            placeholder="예: 20~30대 직장인"
            size="sm"
          />
        </div>

        <div class="marketing-image-maker__field">
          <label><i>*</i> 핵심 메시지</label>
          <UiTextarea
            v-model="form.keyMessage"
            placeholder="콘텐츠에서 가장 강조하고 싶은 메시지를 입력해 주세요."
            :rows="4"
            :max-length="300"
            border
          />
        </div>

        <div
          v-if="hasText"
          class="marketing-image-maker__field"
        >
          <label><i>*</i> 유도할 행동 (CTA)</label>
          <div class="marketing-image-maker__channel-grid">
            <button
              v-for="cta in ctaPresets"
              :key="cta"
              type="button"
              :class="{ 'is-selected': !isCustomCta && form.customCallToAction === cta }"
              @click="selectCtaPreset(cta)"
            >
              <strong>{{ cta }}</strong>
            </button>
            <button
              type="button"
              :class="{ 'is-selected': isCustomCta }"
              @click="selectCtaCustom"
            >
              <strong>직접 작성</strong>
            </button>
          </div>
          <UiInput
            v-if="isCustomCta"
            v-model="form.customCallToAction"
            placeholder="유도할 행동을 직접 입력해 주세요."
            :max-length="50"
            size="sm"
          />
        </div>

        <div
          v-if="audienceMessageSelectionTags.length"
          class="marketing-image-maker__selection-panel"
        >
          <div class="marketing-image-maker__selected-tags">
            <span class="marketing-image-maker__selected-label">선택된 내용</span>
            <div class="marketing-image-maker__tags">
              <button
                v-for="item in audienceMessageSelectionTags"
                :key="item.key"
                type="button"
                class="marketing-image-maker__tag"
                @click="item.clear()"
              >
                {{ item.label }}
                <i class="icon-close size-12" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 톤 · 분량 · 구성 (TEXT 포함 시) -->
      <template v-else-if="currentDetailStep.key === 'textToneLength'">
        <div class="marketing-image-maker__field">
          <label
            ><i>*</i> 톤앤매너 <small>(최대 {{ MAX_TONES }}개)</small></label
          >
          <div class="marketing-image-maker__channel-grid marketing-image-maker__channel-grid--cols-3">
            <button
              v-for="tone in toneOptions"
              :key="tone.value"
              type="button"
              :class="{ 'is-selected': form.tones.includes(tone.value) }"
              @click="toggleTone(tone.value)"
            >
              <strong>{{ tone.label }}</strong>
            </button>
            <button
              v-if="!toneOptions.some((tone) => tone.value === 'OTHER')"
              type="button"
              :class="{ 'is-selected': form.tones.includes('OTHER') }"
              @click="toggleTone('OTHER')"
            >
              <strong>직접 작성</strong>
            </button>
          </div>
          <UiInput
            v-if="form.tones.includes('OTHER')"
            v-model="form.customTone"
            placeholder="원하는 톤앤매너를 입력해 주세요."
            size="sm"
          />
        </div>

        <div class="marketing-image-maker__field">
          <label><i>*</i> 분량</label>
          <div
            class="marketing-image-maker__channel-grid marketing-image-maker__channel-grid--wrap marketing-image-maker__channel-grid--with-desc"
          >
            <button
              v-for="length in lengthOptions"
              :key="length.value"
              type="button"
              :class="{ 'is-selected': form.length === length.value }"
              @click="selectLength(length.value)"
            >
              <strong>{{ length.label }}</strong>
              <small v-if="length.description">{{ length.description }}</small>
            </button>
          </div>
          <UiInput
            v-if="form.length === 'CUSTOM'"
            v-model="form.customLength"
            placeholder="예: 1,000자"
            size="sm"
          />
        </div>

        <div class="marketing-image-maker__field">
          <label><i>*</i> 콘텐츠 출력 구성</label>
          <div class="marketing-image-maker__output-options">
            <UiCheckbox
              v-for="option in workflow.outputSections"
              :key="option.value"
              :model-value="form.outputSections.includes(option.value)"
              @update:model-value="toggleOutputSection(option.value, $event)"
            >
              {{ option.label }}
            </UiCheckbox>
            <UiCheckbox
              :model-value="form.includeHashtags === 'Y'"
              @update:model-value="form.includeHashtags = $event ? 'Y' : 'N'"
            >
              해시태그 포함
            </UiCheckbox>
            <UiCheckbox
              :model-value="form.allowEmoji === 'Y'"
              @update:model-value="form.allowEmoji = $event ? 'Y' : 'N'"
            >
              이모지 허용
            </UiCheckbox>
          </div>
        </div>

        <div
          v-if="textToneLengthSelectionTags.length"
          class="marketing-image-maker__selection-panel"
        >
          <div class="marketing-image-maker__selected-tags">
            <span class="marketing-image-maker__selected-label">선택된 내용</span>
            <div class="marketing-image-maker__tags">
              <button
                v-for="item in textToneLengthSelectionTags"
                :key="item.key"
                type="button"
                class="marketing-image-maker__tag"
                @click="item.clear()"
              >
                {{ item.label }}
                <i class="icon-close size-12" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 비율·분위기·스타일 (IMAGE 포함 시) — 사용처는 setup 유형·채널에서 파생 -->
      <template v-else-if="currentDetailStep.key === 'imageStyle'">
        <div
          ref="aspectRatioFieldRef"
          class="marketing-image-maker__field"
        >
          <label><i>*</i> 화면 비율</label>
          <div class="marketing-image-maker__ratio-panel">
            <div
              class="marketing-image-maker__ratio-section"
              :class="{
                'is-selected': isPresetAspectRatioMode,
                'is-disabled': !isPresetAspectRatioMode && !!aspectRatioMode,
              }"
              @click="onActivatePresetAspectRatio"
            >
              <div class="marketing-image-maker__ratio-section-head">
                <label
                  class="marketing-image-maker__ratio-radio"
                  @click.stop
                >
                  <input
                    type="radio"
                    name="marketing-unified-aspect-ratio-mode"
                    value="preset"
                    :checked="isPresetAspectRatioMode"
                    @change="onActivatePresetAspectRatio"
                  />
                  <span />
                </label>
                <strong>빠른선택</strong>
              </div>
              <div class="marketing-image-maker__ratio-chips">
                <button
                  v-for="ratio in aspectRatioPresets"
                  :key="ratio"
                  type="button"
                  :class="{ 'is-selected': aspectRatioMode === 'preset' && form.aspectRatio === ratio }"
                  :disabled="!isPresetAspectRatioMode && !!aspectRatioMode"
                  @click.stop="onSelectAspectRatioPreset(ratio)"
                >
                  <strong>{{ ratio }}</strong>
                  <em
                    v-if="recommendedAspectRatio === ratio"
                    class="marketing-image-maker__recommend-badge"
                  >
                    추천
                  </em>
                </button>
              </div>
            </div>

            <div
              class="marketing-image-maker__ratio-section"
              :class="{
                'is-selected': isCustomAspectRatioMode,
                'is-disabled': !isCustomAspectRatioMode && !!aspectRatioMode,
              }"
              @click="onActivateCustomAspectRatio"
            >
              <div class="marketing-image-maker__ratio-section-head">
                <label
                  class="marketing-image-maker__ratio-radio"
                  @click.stop
                >
                  <input
                    type="radio"
                    name="marketing-unified-aspect-ratio-mode"
                    value="custom"
                    :checked="isCustomAspectRatioMode"
                    @change="onActivateCustomAspectRatio"
                  />
                  <span />
                </label>
                <strong>직접선택</strong>
              </div>
              <div class="marketing-image-maker__ratio-custom">
                <div class="marketing-image-maker__ratio-part">
                  <span>가로</span>
                  <UiInput
                    ref="customAspectWidthInputRef"
                    v-model="customAspectWidth"
                    placeholder="3"
                    size="sm"
                    number-only
                    :disabled="!isCustomAspectRatioMode"
                    @click.stop
                    @update:model-value="onCustomAspectRatioChange"
                  />
                </div>
                <span class="marketing-image-maker__ratio-sep">:</span>
                <div class="marketing-image-maker__ratio-part">
                  <span>세로</span>
                  <UiInput
                    ref="customAspectHeightInputRef"
                    v-model="customAspectHeight"
                    placeholder="2"
                    size="sm"
                    number-only
                    :disabled="!isCustomAspectRatioMode"
                    @click.stop
                    @update:model-value="onCustomAspectRatioChange"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="marketing-image-maker__field">
          <label>
            <i>*</i> 이미지 분위기 <small>(최대 {{ MAX_ATMOSPHERES }}개 선택 가능)</small>
          </label>
          <div class="marketing-image-maker__channel-grid marketing-image-maker__channel-grid--cols-4">
            <button
              v-for="option in atmosphereOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': selectedAtmospheres.includes(option.value) }"
              @click="toggleAtmosphere(option.value)"
            >
              <strong>{{ option.label }}</strong>
            </button>
          </div>
        </div>

        <div class="marketing-image-maker__field">
          <label><i>*</i> 이미지 스타일</label>
          <div class="marketing-image-maker__channel-grid marketing-image-maker__channel-grid--cols-3">
            <button
              v-for="option in imageTypeOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': form.imageType === option.value }"
              @click="form.imageType = option.value"
            >
              <strong>{{ option.label }}</strong>
            </button>
          </div>
        </div>

        <div class="marketing-image-maker__field-row">
          <div class="marketing-image-maker__field">
            <label>브랜드 컬러 <small>(선택)</small></label>
            <UiInput
              v-model="form.brandColors"
              placeholder="예: #7346E8, 흰색"
              size="sm"
            />
          </div>

          <div class="marketing-image-maker__field">
            <label>이미지 내 문구 <small>(선택)</small></label>
            <UiInput
              v-model="form.imageText"
              placeholder="비워두면 문구 없이 생성"
              size="sm"
            />
          </div>
        </div>

        <div
          v-if="imageStyleSelectionTags.length"
          class="marketing-image-maker__selection-panel"
        >
          <div class="marketing-image-maker__selected-tags">
            <span class="marketing-image-maker__selected-label">선택된 내용</span>
            <div class="marketing-image-maker__tags">
              <button
                v-for="item in imageStyleSelectionTags"
                :key="item.key"
                type="button"
                class="marketing-image-maker__tag"
                @click="item.clear()"
              >
                {{ item.label }}
                <i class="icon-close size-12" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 최종 확인 -->
      <template v-else>
        <MarketingConfirmSummary
          :items="confirmSummaryItems"
          :is-edit-mode="isSummaryEditMode"
          @edit="onEditSummary"
          @jump="onJumpToSummaryStep"
        />

        <div
          ref="variantCountFieldRef"
          class="marketing-image-maker__generate-settings"
        >
          <div class="marketing-image-maker__generate-settings-head">
            <label><i>*</i> 시안 개수</label>
          </div>
          <div class="marketing-image-maker__variant-count">
            <button
              v-for="count in variantCountOptions"
              :key="count"
              type="button"
              :class="{ 'is-selected': form.variantCount === count }"
              @click="form.variantCount = count"
            >
              {{ count }}
            </button>
          </div>
        </div>

        <div class="marketing-image-maker__field marketing-image-maker__confirm-extra">
          <label>추가 요청사항 <small>(선택)</small></label>
          <UiTextarea
            v-model="form.additionalRequirements"
            class="marketing-image-maker__confirm-textarea"
            placeholder="반드시 포함할 내용, 제외할 표현, 참고할 문체 등을 입력해 주세요."
            :rows="3"
            :max-length="500"
            border
          />
        </div>
      </template>
    </div>

    <footer class="marketing-image-maker__footer">
      <UiButton
        variant="line-secondary"
        size="sm"
        @click="onDetailPrev"
      >
        <template #icon-left>
          <i class="icon-arrow-right size-16 marketing-image-maker__prev-arrow" />
        </template>
        이전
      </UiButton>
      <UiButton
        variant="primary"
        size="sm"
        @click="onDetailNext"
      >
        {{ isLastStep ? agentSubmitLabel : '다음' }}
        <template #icon-right>
          <i :class="[isLastStep ? 'icon-sparkle' : 'icon-arrow-right', 'size-16']" />
        </template>
      </UiButton>
    </footer>

    <UiModal
      :is-open="isReferenceModalOpen"
      title="참고 자료 첨부"
      position="center"
      max-width="720px"
      custom-class="marketing-reference-upload-modal"
      @close="isReferenceModalOpen = false"
    >
      <UiFileUpload
        v-model="form.referenceFiles"
        :max-files="5"
        :max-size-mb="20"
        :accept="referenceAccept"
        :allowed-extensions="referenceAllowedExtensions"
        hint="문서·이미지 파일을 최대 5개까지 첨부할 수 있습니다."
      />
      <template #footer>
        <div class="modal-dialog-footer">
          <UiButton
            class="btn-modal-dialog"
            variant="primary"
            size="md"
            @click="isReferenceModalOpen = false"
          >
            확인
          </UiButton>
        </div>
      </template>
    </UiModal>
  </section>
</template>

<script setup lang="ts">
import type { MarketingAuthoringAgentConfig, MarketingAuthoringOption } from '~/types/agent'
import type {
  MarketingAuthoringSubmitPayload,
  MarketingOutputKind,
  MarketingUnifiedFormPayload,
} from '~/types/marketing'
import { useMarketingWizardSteps } from '~/composables/marketing/useMarketingWizardSteps'
import {
  MARKETING_CTA_PRESETS,
  MARKETING_IMAGE_ATMOSPHERES,
  MARKETING_IMAGE_SNS_DEFAULT_ASPECT_RATIO,
  MARKETING_IMAGE_SNS_PLATFORMS,
  MARKETING_IMAGE_TYPES,
  MARKETING_PROMOTION_INPUT_TIPS,
} from '~/utils/agent/marketingAuthoringConfigUtil'
import {
  applyConfirmSummaryLayout,
  buildMarketingWizardSteps,
  clampMarketingAuthoringVariantCount,
  createEmptyMarketingUnifiedPayload,
  focusMarketingField,
  formatMarketingSelectionTag,
  getMarketingAuthoringWorkflow,
  hasMarketingOutput,
  MARKETING_AUTHORING_VARIANT_COUNT_MAX,
  MARKETING_FORM_MESSAGES,
  resolveMarketingAgentThemeStyle,
  resolveMarketingImageUsageFromSetup,
  type MarketingConfirmSummaryItem,
  type MarketingWizardStepKey,
} from '~/utils/marketing/marketingUtil'
import { openToast } from '~/composables/useToast'

const props = withDefaults(
  defineProps<{
    config: MarketingAuthoringAgentConfig
    themeColorHex?: string
  }>(),
  {
    themeColorHex: '',
  },
)

const emit = defineEmits<{
  submit: [payload: MarketingAuthoringSubmitPayload]
  close: []
}>()

const REQUIRED_FIELD_MESSAGE = '필수 항목을 모두 입력해 주세요.'
const MAX_TONES = 2
const MAX_ATMOSPHERES = 2

/** 에이전트 설정의 「기본」체크(defaultOutputSections) → 채팅 최초 선택값 */
const resolveDefaultCheckedOutputSections = (config: MarketingAuthoringAgentConfig) => {
  const wf = getMarketingAuthoringWorkflow(config)
  const allowed = new Set(wf.outputSections.map((item) => item.value))
  return wf.defaultOutputSections.filter((value) => allowed.has(value))
}

const form = reactive<MarketingUnifiedFormPayload>({
  ...createEmptyMarketingUnifiedPayload(),
  outputSections: resolveDefaultCheckedOutputSections(props.config),
})

const bodyRef = ref<HTMLElement | null>(null)
const outputsFieldRef = ref<HTMLElement | null>(null)
const promotionFieldRef = ref<HTMLElement | null>(null)
const aspectRatioFieldRef = ref<HTMLElement | null>(null)
const variantCountFieldRef = ref<HTMLElement | null>(null)
const customAspectWidthInputRef = ref<{ focus: () => void } | null>(null)
const customAspectHeightInputRef = ref<{ focus: () => void } | null>(null)
const isReferenceModalOpen = ref(false)
const isCustomCta = ref(false)

const ctaPresets = MARKETING_CTA_PRESETS
const promotionInputTips = MARKETING_PROMOTION_INPUT_TIPS
const imageTypeOptions = MARKETING_IMAGE_TYPES
const atmosphereOptions = MARKETING_IMAGE_ATMOSPHERES
const aspectRatioPresets = ['1:1', '3:2', '4:3', '16:9', '9:16'] as const
const variantCountOptions = Array.from({ length: MARKETING_AUTHORING_VARIANT_COUNT_MAX }, (_, index) => index + 1)
const referenceAllowedExtensions = 'pdf,doc,docx,ppt,pptx,xls,xlsx,hwp,csv,txt,png,jpg,jpeg,webp'.split(',')
const referenceAccept = referenceAllowedExtensions.map((ext) => `.${ext}`).join(',')

const removeReferenceFile = (index: number) => {
  if (index < 0 || index >= form.referenceFiles.length) return
  form.referenceFiles = form.referenceFiles.filter((_, fileIndex) => fileIndex !== index)
}

const workflow = computed(() => getMarketingAuthoringWorkflow(props.config))
const themeStyle = computed(() => resolveMarketingAgentThemeStyle(props.themeColorHex))
const hasText = computed(() => hasMarketingOutput(form, 'TEXT'))
const hasImage = computed(() => hasMarketingOutput(form, 'IMAGE'))

const agentSubmitLabel = computed(() => String(props.config?.ui?.submitLabel ?? '').trim() || 'Agent로 콘텐츠 생성')

const applyRecommendedOutputSections = () => {
  form.outputSections = resolveDefaultCheckedOutputSections(props.config)
}

/** outputs 기준 동적 스텝 목록 (setup → purpose → audienceMessage → [textToneLength] → [imageStyle] → confirm) */
const detailSteps = computed(() => buildMarketingWizardSteps(form.outputs))

const {
  currentStep,
  maxReachedStep,
  isSummaryEditMode,
  isLastStep,
  canNavigateToStep,
  onEditSummary,
  onJumpToSummaryStep,
  onSelectStep,
  onDetailPrev,
  advanceAfterValidate,
} = useMarketingWizardSteps({
  stepCount: () => detailSteps.value.length,
  isStepFilled: (index) => isStepFilled(index),
  onPrevAtFirst: () => emit('close'),
  bodyRef,
})

const stepIndexOfKey = (key: MarketingWizardStepKey) => {
  const index = detailSteps.value.findIndex((step) => step.key === key)
  return index >= 0 ? index : 0
}

const contentTypeOptions = computed(() => props.config.contentTypes ?? [])
const purposeOptions = computed(() => {
  const raw = workflow.value.purposes ?? []
  // 프리셋 최대 4개 + 직접 입력(OTHER) = 5칩
  const presets = raw.filter((item) => item.value !== 'OTHER').slice(0, 4)
  const otherFromConfig = raw.find((item) => item.value === 'OTHER')
  return [
    ...presets,
    {
      value: 'OTHER',
      label: otherFromConfig?.label?.trim() || '직접 입력',
      description: otherFromConfig?.description?.trim() || '작성 목적을 직접 입력합니다',
    },
  ]
})
const audienceOptions = computed(() => {
  const raw = workflow.value.audiences ?? []
  // 프리셋 최대 4개 + 직접 입력(OTHER) = 5칩
  const presets = raw.filter((item) => item.value !== 'OTHER').slice(0, 4)
  const otherFromConfig = raw.find((item) => item.value === 'OTHER')
  return [
    ...presets,
    {
      value: 'OTHER',
      label: otherFromConfig?.label?.trim() || '직접 입력',
      description: otherFromConfig?.description?.trim() || '타겟 고객을 직접 입력합니다',
    },
  ]
})
const toneOptions = computed(() => workflow.value.tones ?? [])
const lengthOptions = computed(() => workflow.value.lengths ?? [])
const channelOptions = computed(() => props.config.channelsByContentType?.[form.contentType] ?? [])

const currentDetailStep = computed(() => {
  const step = detailSteps.value[currentStep.value] ?? detailSteps.value[0]
  if (step.key !== 'setup') return step
  if (!form.contentType) return { ...step, description: '콘텐츠 유형을 먼저 정해 주세요.' }
  if (channelOptions.value.length && !form.channel) return { ...step, description: '게시 채널을 선택해 주세요.' }
  if (!form.outputs.length) return { ...step, description: '생성할 결과(글/그림)를 선택해 주세요.' }
  return { ...step, description: '선택한 내용으로 다음 단계로 진행할 수 있어요.' }
})

const optionLabel = (options: MarketingAuthoringOption[], value: string, customValue = '') => {
  if (value === 'OTHER') return customValue.trim()
  return options.find((item) => item.value === value)?.label ?? value
}

// ─── 아이콘 ──────────────────────────────────────────────────────────────────

const OPTION_ICON_BY_GROUP: Record<string, Record<string, string>> = {
  content: {
    AD_COPY: 'icon-edit',
    SNS: 'icon-sns',
    BLOG: 'icon-document-edit',
    EMAIL: 'icon-email',
    LANDING_PAGE: 'icon-globe',
    PRODUCT_DESCRIPTION: 'icon-sparkle',
  },
  channel: {
    AD_TITLE: 'icon-edit',
    BANNER_COPY: 'icon-edit',
    CAMPAIGN_SLOGAN: 'icon-edit',
    SEARCH_AD_COPY: 'icon-edit',
    INSTAGRAM: 'icon-sns',
    FACEBOOK: 'icon-sns',
    LINKEDIN: 'icon-sns',
    X: 'icon-sns',
    YOUTUBE_COMMUNITY: 'icon-sns',
    KAKAO_TALK: 'icon-sns',
    SMS: 'icon-sns',
    PROMOTION_EMAIL: 'icon-email',
    NEWSLETTER: 'icon-email',
    OWNED_BLOG: 'icon-document-edit',
    NAVER_BLOG: 'icon-document-edit',
    OTHER: 'icon-edit',
  },
  purpose: {
    OTHER: 'icon-edit',
  },
  audience: {
    GENERAL: 'icon-user',
    PROSPECT: 'icon-sparkle',
    CUSTOMER: 'icon-user',
    INDUSTRY: 'icon-document-edit',
    OTHER: 'icon-edit',
  },
}

const OPTION_ICON_FALLBACK: Record<string, string> = {
  content: 'icon-edit',
  channel: 'icon-globe',
  purpose: 'icon-sparkle',
  audience: 'icon-user',
}

const resolveOptionIcon = (value: string, group: keyof typeof OPTION_ICON_BY_GROUP) =>
  OPTION_ICON_BY_GROUP[group]?.[value] ?? OPTION_ICON_FALLBACK[group] ?? 'icon-sparkle'

// ─── 선택 요약 라벨 ──────────────────────────────────────────────────────────

const outputsSummaryLabel = computed(() => {
  const labels: string[] = []
  if (hasText.value) labels.push('글')
  if (hasImage.value) labels.push('그림')
  return labels.join(' + ') || '선택 안 함'
})

const purposeSummaryLabel = computed(() =>
  hasText.value && purposeOptions.value.length
    ? optionLabel(purposeOptions.value, form.purpose, form.customPurpose)
    : form.purpose.trim(),
)

const audienceSummaryLabel = computed(() => optionLabel(audienceOptions.value, form.audience, form.customAudience))

const selectedToneItems = computed(() =>
  form.tones
    .map((value) => {
      if (value === 'OTHER') return { value, label: form.customTone.trim() || '기타' }
      return toneOptions.value.find((item) => item.value === value)
    })
    .filter((item): item is { value: string; label: string } => !!item && !!item.label),
)
const selectedToneLabels = computed(() => selectedToneItems.value.map((item) => item.label))

const outputSectionsSummaryLabel = computed(() =>
  [
    ...form.outputSections.map(
      (value) => workflow.value.outputSections.find((item) => item.value === value)?.label ?? value,
    ),
    form.includeHashtags === 'Y' ? '해시태그 포함' : '',
    form.allowEmoji === 'Y' ? '이모지 허용' : '이모지 불가',
  ]
    .filter(Boolean)
    .join(' · '),
)

const IMAGE_USAGE_SHORT_LABEL: Record<string, string> = {
  BANNER: '배너 이미지',
  THUMBNAIL: '썸네일',
  PRODUCT_DETAIL: '상품 상세 이미지',
  SNS_VISUAL: 'SNS 이미지',
}

const displayImageUsage = computed(() => IMAGE_USAGE_SHORT_LABEL[form.imageUsage] ?? '')
const displaySnsPlatform = computed(() => {
  if (form.imageUsage !== 'SNS_VISUAL') return ''
  return MARKETING_IMAGE_SNS_PLATFORMS.find((item) => item.value === form.snsPlatform)?.label ?? ''
})
const imageUsageSummaryLabel = computed(() =>
  [displayImageUsage.value, displaySnsPlatform.value].filter(Boolean).join(' · '),
)
const displayImageType = computed(() => imageTypeOptions.find((item) => item.value === form.imageType)?.label ?? '')

const selectedAtmospheres = ref<string[]>([])
const selectedAtmosphereItems = computed(() =>
  selectedAtmospheres.value
    .map((value) => atmosphereOptions.find((item) => item.value === value))
    .filter((item): item is (typeof atmosphereOptions)[number] => !!item),
)
const selectedAtmosphereLabels = computed(() => selectedAtmosphereItems.value.map((item) => item.label))

const displayAspectRatio = computed(() => {
  if (aspectRatioMode.value === 'custom' && form.customAspectRatio) return form.customAspectRatio
  if (form.aspectRatio && form.aspectRatio !== 'OTHER') return form.aspectRatio
  return ''
})

// ─── 선택된 내용 태그 ────────────────────────────────────────────────────────

type SelectionTag = { key: string; label: string; clear: () => void }

const clearContentTypeSelection = () => {
  form.contentType = ''
  form.channel = ''
  form.customChannel = ''
  applyRecommendedOutputSections()
  maxReachedStep.value = 0
}

const clearChannelSelection = () => {
  form.channel = ''
  form.customChannel = ''
}

const setupSelectionTags = computed(() => {
  const tags: SelectionTag[] = []
  if (form.contentType) {
    tags.push({
      key: 'contentType',
      label: formatMarketingSelectionTag('콘텐츠 유형', optionLabel(contentTypeOptions.value, form.contentType)),
      clear: clearContentTypeSelection,
    })
  }
  if (form.channel) {
    const channelLabel = optionLabel(channelOptions.value, form.channel, form.customChannel)
    if (channelLabel) {
      tags.push({
        key: 'channel',
        label: formatMarketingSelectionTag('사용 채널', channelLabel),
        clear: clearChannelSelection,
      })
    }
  }
  return tags
})

const audienceMessageSelectionTags = computed(() => {
  const tags: SelectionTag[] = []
  const audienceLabel = audienceSummaryLabel.value
  if (audienceLabel) {
    tags.push({
      key: 'audience',
      label: formatMarketingSelectionTag('타겟 고객', audienceLabel),
      clear: () => {
        form.audience = ''
        form.customAudience = ''
      },
    })
  }
  const cta = form.customCallToAction.trim()
  if (hasText.value && cta) {
    tags.push({
      key: 'cta',
      label: formatMarketingSelectionTag('유도할 행동', cta),
      clear: () => {
        form.customCallToAction = ''
        isCustomCta.value = false
      },
    })
  }
  return tags
})

const textToneLengthSelectionTags = computed(() => {
  const tags: SelectionTag[] = []
  selectedToneItems.value.forEach((item) => {
    tags.push({
      key: `tone-${item.value}`,
      label: formatMarketingSelectionTag('톤앤매너', item.label),
      clear: () => toggleTone(item.value),
    })
  })
  if (form.length) {
    const lengthLabel = optionLabel(lengthOptions.value, form.length, form.customLength)
    if (lengthLabel) {
      tags.push({
        key: 'length',
        label: formatMarketingSelectionTag('분량', lengthLabel),
        clear: () => {
          form.length = ''
          form.customLength = ''
        },
      })
    }
  }
  return tags
})

const imageStyleSelectionTags = computed(() => {
  const tags: SelectionTag[] = []
  if (displayAspectRatio.value) {
    tags.push({
      key: 'aspectRatio',
      label: formatMarketingSelectionTag('화면 비율', displayAspectRatio.value),
      clear: () => {
        aspectRatioMode.value = ''
        clearPresetAspectRatio()
        clearCustomAspectRatio()
      },
    })
  }
  selectedAtmosphereItems.value.forEach((item) => {
    tags.push({
      key: `atmosphere-${item.value}`,
      label: formatMarketingSelectionTag('이미지 분위기', item.label),
      clear: () => toggleAtmosphere(item.value),
    })
  })
  if (form.imageType) {
    tags.push({
      key: 'imageType',
      label: formatMarketingSelectionTag('이미지 스타일', displayImageType.value || form.imageType),
      clear: () => {
        form.imageType = ''
      },
    })
  }
  return tags
})

// ─── 최종 확인 요약 ──────────────────────────────────────────────────────────

const confirmSummaryItems = computed<MarketingConfirmSummaryItem[]>(() => {
  const items: MarketingConfirmSummaryItem[] = [
    {
      label: '콘텐츠 유형',
      value: optionLabel(contentTypeOptions.value, form.contentType),
      stepIndex: stepIndexOfKey('setup'),
    },
  ]

  if (channelOptions.value.length) {
    items.push({
      label: '사용 채널',
      value: optionLabel(channelOptions.value, form.channel, form.customChannel) || '선택 안 함',
      stepIndex: stepIndexOfKey('setup'),
    })
  }

  items.push({ label: '생성 결과', value: outputsSummaryLabel.value, stepIndex: stepIndexOfKey('setup') })
  items.push({ label: '목적', value: purposeSummaryLabel.value, stepIndex: stepIndexOfKey('purpose') })
  items.push({
    label: '참고 자료',
    value: form.referenceFiles.length ? `${form.referenceFiles.length}개 첨부` : '첨부 파일 없음',
    stepIndex: stepIndexOfKey('purpose'),
    fullWidth: true,
  })
  items.push({ label: '타겟 고객', value: audienceSummaryLabel.value, stepIndex: stepIndexOfKey('audienceMessage') })

  if (hasText.value) {
    items.push({
      label: '유도할 행동',
      value: form.customCallToAction.trim(),
      stepIndex: stepIndexOfKey('audienceMessage'),
    })
  }

  items.push({
    label: '핵심 메시지',
    value: form.keyMessage.trim(),
    stepIndex: stepIndexOfKey('audienceMessage'),
    fullWidth: true,
  })

  if (hasText.value) {
    items.push({
      label: '톤앤매너',
      value: selectedToneLabels.value.join(', '),
      stepIndex: stepIndexOfKey('textToneLength'),
    })
    items.push({
      label: '분량',
      value: optionLabel(lengthOptions.value, form.length, form.customLength),
      stepIndex: stepIndexOfKey('textToneLength'),
    })
    items.push({
      label: '출력 구성',
      value: outputSectionsSummaryLabel.value,
      stepIndex: stepIndexOfKey('textToneLength'),
      fullWidth: true,
    })
  }

  if (hasImage.value) {
    items.push({
      label: '이미지 사용처',
      value: imageUsageSummaryLabel.value,
      stepIndex: stepIndexOfKey('setup'),
    })
    items.push({
      label: '화면 비율',
      value: displayAspectRatio.value,
      stepIndex: stepIndexOfKey('imageStyle'),
    })
    items.push({
      label: '이미지 분위기',
      value: selectedAtmosphereLabels.value.join(', '),
      stepIndex: stepIndexOfKey('imageStyle'),
    })
    items.push({ label: '이미지 스타일', value: displayImageType.value, stepIndex: stepIndexOfKey('imageStyle') })
    if (form.brandColors.trim()) {
      items.push({ label: '브랜드 컬러', value: form.brandColors.trim(), stepIndex: stepIndexOfKey('imageStyle') })
    }
    if (form.imageText.trim()) {
      items.push({ label: '이미지 내 문구', value: form.imageText.trim(), stepIndex: stepIndexOfKey('imageStyle') })
    }
  }

  return applyConfirmSummaryLayout(
    items.filter((item) => item.label === '참고 자료' || item.label === '사용 채널' || !!item.value.trim()),
  )
})

// ─── 액션 ────────────────────────────────────────────────────────────────────

const toggleOutput = (kind: MarketingOutputKind) => {
  form.outputs = form.outputs.includes(kind) ? form.outputs.filter((item) => item !== kind) : [...form.outputs, kind]
  maxReachedStep.value = 0
}

const selectAudience = (value: string) => {
  form.audience = value
  if (value !== 'OTHER') form.customAudience = ''
}

const selectPurpose = (value: string) => {
  form.purpose = value
  if (value !== 'OTHER') form.customPurpose = ''
}

const selectContentType = (value: string) => {
  form.contentType = value
  form.purpose = ''
  form.customPurpose = ''
  form.audience = ''
  form.customAudience = ''
  form.tones = []
  form.customTone = ''
  form.length = ''
  form.customLength = ''
  form.channel = ''
  form.customChannel = ''
  applyRecommendedOutputSections()
  maxReachedStep.value = 0
}

const selectCtaPreset = (cta: string) => {
  isCustomCta.value = false
  form.customCallToAction = cta
}

const selectCtaCustom = () => {
  isCustomCta.value = true
  if ((MARKETING_CTA_PRESETS as readonly string[]).includes(form.customCallToAction)) {
    form.customCallToAction = ''
  }
}

const toggleTone = (value: string) => {
  if (form.tones.includes(value)) {
    form.tones = form.tones.filter((tone) => tone !== value)
    if (value === 'OTHER') form.customTone = ''
    return
  }
  if (form.tones.length >= MAX_TONES) {
    openToast({ message: `톤앤매너는 최대 ${MAX_TONES}개까지 선택할 수 있습니다.`, type: 'warning' })
    return
  }
  form.tones = [...form.tones, value]
}

const selectLength = (value: string) => {
  form.length = value
  if (value !== 'CUSTOM') form.customLength = ''
}

const toggleOutputSection = (value: string, checked: boolean) => {
  form.outputSections = checked
    ? [...new Set([...form.outputSections, value])]
    : form.outputSections.filter((section) => section !== value)
}

const syncVisualStyle = () => {
  form.visualStyle = selectedAtmospheres.value.join(',')
}

const toggleAtmosphere = (value: string) => {
  const index = selectedAtmospheres.value.indexOf(value)
  if (index >= 0) {
    selectedAtmospheres.value.splice(index, 1)
    syncVisualStyle()
    return
  }
  if (selectedAtmospheres.value.length >= MAX_ATMOSPHERES) {
    openToast({ message: `이미지 분위기는 최대 ${MAX_ATMOSPHERES}개까지 선택할 수 있습니다.`, type: 'warning' })
    return
  }
  selectedAtmospheres.value.push(value)
  syncVisualStyle()
}

// ─── 화면 비율 ───────────────────────────────────────────────────────────────

const aspectRatioMode = ref<'preset' | 'custom' | ''>('')
const customAspectWidth = ref('')
const customAspectHeight = ref('')

const isPresetAspectRatioMode = computed(() => aspectRatioMode.value === 'preset')
const isCustomAspectRatioMode = computed(() => aspectRatioMode.value === 'custom')

const USAGE_DEFAULT_ASPECT_RATIO: Record<string, (typeof aspectRatioPresets)[number]> = {
  BANNER: '16:9',
  THUMBNAIL: '1:1',
  PRODUCT_DETAIL: '3:2',
}

const recommendedAspectRatio = computed(() => {
  if (form.imageUsage === 'SNS_VISUAL') {
    return form.snsPlatform ? (MARKETING_IMAGE_SNS_DEFAULT_ASPECT_RATIO[form.snsPlatform] ?? '') : ''
  }
  return USAGE_DEFAULT_ASPECT_RATIO[form.imageUsage] ?? ''
})

const clearCustomAspectRatio = () => {
  customAspectWidth.value = ''
  customAspectHeight.value = ''
  form.customAspectRatio = ''
}

const clearPresetAspectRatio = () => {
  form.aspectRatio = ''
}

const onSelectAspectRatioPreset = (ratio: string) => {
  aspectRatioMode.value = 'preset'
  form.aspectRatio = ratio
  clearCustomAspectRatio()
}

const onActivatePresetAspectRatio = () => {
  if (aspectRatioMode.value === 'preset') return
  aspectRatioMode.value = 'preset'
  clearCustomAspectRatio()
  clearPresetAspectRatio()
}

const syncCustomAspectRatio = () => {
  const width = customAspectWidth.value.trim()
  const height = customAspectHeight.value.trim()
  if (!width || !height || Number(width) <= 0 || Number(height) <= 0) {
    form.aspectRatio = ''
    form.customAspectRatio = ''
    return
  }
  form.aspectRatio = 'OTHER'
  form.customAspectRatio = `${width}:${height}`
}

const onActivateCustomAspectRatio = async () => {
  if (aspectRatioMode.value !== 'custom') {
    aspectRatioMode.value = 'custom'
    clearPresetAspectRatio()
    clearCustomAspectRatio()
  }
  await nextTick()
  customAspectWidthInputRef.value?.focus()
}

const onCustomAspectRatioChange = () => {
  if (aspectRatioMode.value !== 'custom') {
    aspectRatioMode.value = 'custom'
    clearPresetAspectRatio()
  }
  syncCustomAspectRatio()
}

const syncImageUsageFromSetup = () => {
  if (!hasImage.value || !form.contentType) {
    form.imageUsage = ''
    form.snsPlatform = ''
    return
  }
  const derived = resolveMarketingImageUsageFromSetup(form.contentType, form.channel)
  form.imageUsage = derived.imageUsage
  form.snsPlatform = derived.snsPlatform
}

watch(
  () => [form.outputs.join(','), form.contentType, form.channel] as const,
  () => {
    syncImageUsageFromSetup()
  },
)

const isAspectRatioFilled = () => {
  if (aspectRatioMode.value === 'preset') return !!form.aspectRatio
  if (aspectRatioMode.value === 'custom') {
    const width = customAspectWidth.value.trim()
    const height = customAspectHeight.value.trim()
    return !!width && Number(width) > 0 && !!height && Number(height) > 0
  }
  return false
}

const validateAspectRatio = async () => {
  if (aspectRatioMode.value === 'custom') {
    syncCustomAspectRatio()
  }

  if (aspectRatioMode.value === 'preset') {
    if (!form.aspectRatio) {
      openToast({ message: '화면 비율을 선택해 주세요.', type: 'warning' })
      await focusMarketingField(aspectRatioFieldRef.value)
      return false
    }
    return true
  }

  if (aspectRatioMode.value === 'custom') {
    const width = customAspectWidth.value.trim()
    const height = customAspectHeight.value.trim()
    if (!width || Number(width) <= 0) {
      openToast({ message: '화면 비율의 가로 값을 입력해 주세요.', type: 'warning' })
      await focusMarketingField(aspectRatioFieldRef.value, customAspectWidthInputRef.value)
      return false
    }
    if (!height || Number(height) <= 0) {
      openToast({ message: '화면 비율의 세로 값을 입력해 주세요.', type: 'warning' })
      await focusMarketingField(aspectRatioFieldRef.value, customAspectHeightInputRef.value)
      return false
    }
    return true
  }

  openToast({ message: '화면 비율을 선택하거나 직접 입력해 주세요.', type: 'warning' })
  await focusMarketingField(aspectRatioFieldRef.value)
  return false
}

// ─── 유효성 검사 ─────────────────────────────────────────────────────────────

/** 스텝별 필수값 충족 여부 (토스트 없이) */
const isStepFilled = (stepIndex: number) => {
  const key = detailSteps.value[stepIndex]?.key
  if (key === 'setup') {
    if (!form.contentType) return false
    if (channelOptions.value.length && !form.channel) return false
    if (form.channel === 'OTHER' && !form.customChannel.trim()) return false
    return form.outputs.length > 0
  }
  if (key === 'purpose') {
    if (hasText.value && purposeOptions.value.length) {
      if (!form.purpose) return false
      if (form.purpose === 'OTHER' && !form.customPurpose.trim()) return false
    } else if (!form.purpose.trim()) {
      return false
    }
    if (!form.promotionInformation.trim()) return false
    if (form.referenceFiles.length > 5) return false
    return true
  }
  if (key === 'audienceMessage') {
    if (!form.audience) return false
    if (form.audience === 'OTHER' && !form.customAudience.trim()) return false
    if (!form.keyMessage.trim()) return false
    if (hasText.value && !form.customCallToAction.trim()) return false
    return true
  }
  if (key === 'textToneLength') {
    if (!form.tones.length || (form.tones.includes('OTHER') && !form.customTone.trim())) return false
    if (lengthOptions.value.length && !form.length) return false
    if (form.length === 'CUSTOM' && !form.customLength.trim()) return false
    if (workflow.value.outputSections.length && !form.outputSections.length) return false
    return true
  }
  if (key === 'imageStyle') {
    if (!isAspectRatioFilled()) return false
    if (!selectedAtmospheres.value.length) return false
    if (!form.imageType) return false
    return true
  }
  if (key === 'confirm') return form.variantCount >= 1
  return false
}

const validateCurrentStep = async () => {
  const key = currentDetailStep.value.key

  if (key === 'setup') {
    if (!form.contentType) {
      openToast({ message: '콘텐츠 유형을 선택해 주세요.', type: 'warning' })
      return false
    }
    if (channelOptions.value.length && !form.channel) {
      openToast({ message: '게시 채널을 선택해 주세요.', type: 'warning' })
      return false
    }
    if (form.channel === 'OTHER' && !form.customChannel.trim()) {
      openToast({ message: '게시 채널을 입력해 주세요.', type: 'warning' })
      return false
    }
    if (!form.outputs.length) {
      openToast({ message: '생성할 결과(글/그림)를 하나 이상 선택해 주세요.', type: 'warning' })
      await focusMarketingField(outputsFieldRef.value)
      return false
    }
    return true
  }

  if (key === 'purpose') {
    if (hasText.value && purposeOptions.value.length) {
      if (!form.purpose) {
        openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
        return false
      }
      if (form.purpose === 'OTHER' && !form.customPurpose.trim()) {
        openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
        return false
      }
    } else if (!form.purpose.trim()) {
      openToast({ message: '제작 목적을 입력해 주세요.', type: 'warning' })
      return false
    }
    if (!form.promotionInformation.trim()) {
      openToast({ message: MARKETING_FORM_MESSAGES.PROMOTION_REQUIRED, type: 'warning' })
      await focusMarketingField(promotionFieldRef.value)
      return false
    }
    if (form.referenceFiles.length > 5) {
      openToast({ message: MARKETING_FORM_MESSAGES.REFERENCE_FILE_MAX, type: 'warning' })
      return false
    }
    return true
  }

  if (key === 'audienceMessage') {
    if (!form.audience) {
      openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
      return false
    }
    if (form.audience === 'OTHER' && !form.customAudience.trim()) {
      openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
      return false
    }
    if (!form.keyMessage.trim()) {
      openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
      return false
    }
    if (hasText.value && !form.customCallToAction.trim()) {
      openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
      return false
    }
    return true
  }

  if (key === 'textToneLength') {
    if (!form.tones.length || (form.tones.includes('OTHER') && !form.customTone.trim())) {
      openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
      return false
    }
    if (lengthOptions.value.length && !form.length) {
      openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
      return false
    }
    if (form.length === 'CUSTOM' && !form.customLength.trim()) {
      openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
      return false
    }
    if (workflow.value.outputSections.length && !form.outputSections.length) {
      openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
      return false
    }
    return true
  }

  if (key === 'imageStyle') {
    if (!(await validateAspectRatio())) return false
    if (selectedAtmospheres.value.length === 0) {
      openToast({ message: '이미지 분위기를 선택해 주세요.', type: 'warning' })
      return false
    }
    if (!form.imageType) {
      openToast({ message: '이미지 스타일을 선택해 주세요.', type: 'warning' })
      return false
    }
    return true
  }

  if (key === 'confirm') {
    if (form.variantCount < 1) {
      openToast({ message: MARKETING_FORM_MESSAGES.VARIANT_COUNT_REQUIRED, type: 'warning' })
      await focusMarketingField(variantCountFieldRef.value)
      return false
    }
    return true
  }

  return true
}

const onSubmit = () => {
  syncImageUsageFromSetup()
  syncVisualStyle()
  form.variantCount = clampMarketingAuthoringVariantCount(form.variantCount)
  form.referenceMode = form.referenceFiles.length ? 'FILE' : ''
  form.referenceUrls = ['']
  emit('submit', {
    ...form,
    outputs: [...form.outputs],
    tones: [...form.tones],
    referenceFiles: [...form.referenceFiles],
    referenceUrls: [...form.referenceUrls],
    outputSections: [...form.outputSections],
  })
}

const onDetailNext = async () => {
  if (!(await validateCurrentStep())) return
  if (isLastStep.value) {
    onSubmit()
    return
  }
  await advanceAfterValidate()
}
</script>
