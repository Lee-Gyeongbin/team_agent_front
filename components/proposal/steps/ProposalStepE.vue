<template>
  <div class="pt-panel pt-template-gen-panel">
    <!-- 생성 전 초기 상태 -->
    <template v-if="!template">
      <h3 class="pt-panel-title">템플릿 생성</h3>
      <p class="pt-panel-desc">
        Step3에서 확정한 컬러와 스타일을 기반으로, AI가 슬라이드 헤더와 푸터 레이아웃을 생성합니다.
      </p>
      <div class="pt-template-gen-empty">
        <UiButton
          variant="primary"
          size="md"
          :disabled="isGenerating"
          @click="onGenerate"
        >
          {{ isGenerating ? '생성 중...' : '템플릿 생성 시작' }}
        </UiButton>
      </div>
    </template>

    <!-- 생성 완료 상태 -->
    <template v-else>
      <div class="pt-template-gen-layout">
        <!-- 좌측 패널: 현황 · 컬러 · 액션 -->
        <div class="pt-template-gen-left">
          <h3 class="pt-panel-title">템플릿 생성</h3>

          <!-- 생성 현황 pills -->
          <div class="pt-template-status-list">
            <div class="pt-template-status-item">
              <span class="pt-template-status-label">생성방식</span>
              <span class="pt-template-status-pill is-done">AI 생성</span>
            </div>
            <div class="pt-template-status-item">
              <span class="pt-template-status-label">헤더</span>
              <span
                :class="['pt-template-status-pill', headerStatus === 'done' ? 'is-done' : headerStatus === 'fail' ? 'is-fail' : 'is-wait']"
              >
                {{ headerStatus === 'done' ? '완료' : headerStatus === 'fail' ? '실패' : '대기' }}
              </span>
            </div>
            <div class="pt-template-status-item">
              <span class="pt-template-status-label">푸터</span>
              <span
                :class="['pt-template-status-pill', footerStatus === 'done' ? 'is-done' : footerStatus === 'fail' ? 'is-fail' : 'is-wait']"
              >
                {{ footerStatus === 'done' ? '완료' : footerStatus === 'fail' ? '실패' : '대기' }}
              </span>
            </div>
          </div>

          <!-- 적용 컬러 스와치 -->
          <div
            v-if="templateColors"
            class="pt-template-colors"
          >
            <div class="pt-settings-label">적용 컬러</div>
            <div class="pt-template-color-swatches">
              <div
                class="pt-template-swatch"
                :style="{ background: templateColors.baseColor }"
                :title="'기본색: ' + templateColors.baseColor"
              />
              <div
                class="pt-template-swatch"
                :style="{ background: templateColors.accentColor }"
                :title="'강조색: ' + templateColors.accentColor"
              />
            </div>
          </div>

          <!-- 액션 버튼들 -->
          <div class="pt-template-gen-actions">
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="isGenerating"
              @click="onRegenerate"
            >
              {{ isGenerating ? '재생성 중...' : '템플릿 재생성' }}
            </UiButton>

            <UiButton
              variant="primary"
              size="md"
              :disabled="template?.genStatusCd !== '003'"
              @click="emit('next')"
            >
              이 템플릿 확정 · 다음 진행
              <template #icon-right>
                <i class="icon-arrow-right size-14" />
              </template>
            </UiButton>
          </div>
        </div>

        <!-- 중앙 패널: 미리보기 / 슬롯 편집 탭 -->
        <div class="pt-template-gen-center">
          <!-- 탭 헤더 -->
          <div class="pt-template-tabs">
            <button
              :class="['pt-template-tab', { 'is-active': activeTab === 'preview' }]"
              @click="activeTab = 'preview'"
            >
              미리보기
            </button>
            <button
              :class="['pt-template-tab', { 'is-active': activeTab === 'slots' }]"
              @click="activeTab = 'slots'"
            >
              슬롯 편집
            </button>
          </div>

          <!-- 미리보기 탭 -->
          <div
            v-if="activeTab === 'preview'"
            class="pt-template-preview"
          >
            <!-- 헤더 미리보기 -->
            <div
              class="pt-template-preview-header"
              :style="headerPreviewStyle"
            >
              <template v-if="headerSlots.length > 0">
                <div
                  v-for="slot in headerSlots"
                  :key="slot.key"
                  class="pt-template-slot"
                  :style="slotStyle(slot)"
                >
                  <template v-if="slot.key === 'divider'">
                    <div
                      class="pt-template-divider"
                      :style="{ background: slot.bgColor || templateColors?.accentColor || '#E08A2C' }"
                    />
                  </template>
                  <span v-else>{{ resolveSlotText(slot) }}</span>
                </div>
              </template>
              <div
                v-else
                class="pt-template-preview-placeholder"
              >
                헤더 생성 중...
              </div>
            </div>

            <!-- 본문 영역 placeholder -->
            <div class="pt-template-preview-body">
              <div class="pt-template-body-placeholder">
                <i class="icon-image size-24" />
                <span>슬라이드 본문 영역 (소목차 생성 시 채워집니다)</span>
              </div>
            </div>

            <!-- 푸터 미리보기 -->
            <div
              class="pt-template-preview-footer"
              :style="footerPreviewStyle"
            >
              <template v-if="footerSlots.length > 0">
                <div
                  v-for="slot in footerSlots"
                  :key="slot.key"
                  class="pt-template-slot"
                  :style="slotStyle(slot)"
                >
                  <span>{{ resolveSlotText(slot) }}</span>
                </div>
              </template>
              <div
                v-else
                class="pt-template-preview-placeholder"
              >
                푸터 생성 중...
              </div>
            </div>
          </div>

          <!-- 슬롯 편집 탭 -->
          <div
            v-else
            class="pt-template-slots-view"
          >
            <div class="pt-template-slot-section">
              <div class="pt-settings-label">헤더 슬롯</div>
              <div
                v-if="headerSlots.length > 0"
                class="pt-template-slot-tags"
              >
                <span
                  v-for="slot in headerSlots"
                  :key="slot.key"
                  class="pt-slot-tag"
                >
                  <b>{{ slot.key }}</b>
                  <span
                    v-if="slot.placeholder"
                    class="pt-slot-tag-placeholder"
                  >{{ slot.placeholder }}</span>
                </span>
              </div>
              <UiEmpty
                v-else
                title="헤더 슬롯이 없습니다."
              />
            </div>
            <div class="pt-template-slot-section">
              <div class="pt-settings-label">푸터 슬롯</div>
              <div
                v-if="footerSlots.length > 0"
                class="pt-template-slot-tags"
              >
                <span
                  v-for="slot in footerSlots"
                  :key="slot.key"
                  class="pt-slot-tag"
                >
                  <b>{{ slot.key }}</b>
                  <span
                    v-if="slot.type"
                    class="pt-slot-tag-placeholder"
                  >{{ slot.type }}</span>
                </span>
              </div>
              <UiEmpty
                v-else
                title="푸터 슬롯이 없습니다."
              />
            </div>
          </div>
        </div>

        <!-- 우측 패널: 보완요청 채팅 -->
        <div class="pt-template-gen-right">
          <div class="pt-settings-label">보완 요청</div>
          <p class="pt-hint">헤더/푸터 레이아웃에 수정이 필요하면 요청해 주세요.</p>

          <!-- 채팅 메시지 목록 -->
          <div class="pt-template-chat-list">
            <div
              v-for="(msg, idx) in chatMessages"
              :key="idx"
              :class="['pt-template-chat-msg', msg.role === 'user' ? 'is-user' : 'is-ai']"
            >
              {{ msg.text }}
            </div>
            <UiEmpty
              v-if="chatMessages.length === 0"
              title="보완 요청을 입력하세요."
            />
          </div>

          <!-- 입력창 -->
          <div class="pt-template-chat-input">
            <UiTextarea
              v-model="chatInput"
              placeholder="예) 헤더의 챕터 배지를 더 크게 해주세요"
              :rows="3"
              :disabled="isRegenerating"
            />
            <UiButton
              variant="primary"
              size="sm"
              :disabled="!chatInput.trim() || isRegenerating"
              @click="onSendChat"
            >
              {{ isRegenerating ? '적용 중...' : '보완 요청' }}
            </UiButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'
import type { PtTemplate } from '~/types/proposal'

const props = defineProps<{
  ptProjectId: string
  modelId: string
  agentId: string
}>()

const emit = defineEmits<{
  next: []
}>()

const { fetchSelectPtTemplate, fetchGeneratePtTemplate, fetchRegeneratePtTemplate } = useProposalApi()

// ── 상태 ───────────────────────────────────────────────────────────────────────

const template = ref<PtTemplate | null>(null)
const activeTab = ref<'preview' | 'slots'>('preview')
const isGenerating = ref(false)
const isRegenerating = ref(false)
const chatInput = ref('')
const chatMessages = ref<{ role: 'user' | 'ai'; text: string }[]>([])

// ── 파생 상태 ─────────────────────────────────────────────────────────────────

interface TemplateSlot {
  key: string
  placeholder?: string
  type?: string
  x?: number
  y?: number
  width?: number
  height?: number
  fontSize?: number
  fontWeight?: string
  color?: string
  bgColor?: string
  align?: string
  borderRadius?: number
}

interface TemplateJson {
  slots: TemplateSlot[]
  height?: number
}

interface ColorJson {
  baseColor: string
  accentColor: string
}

const headerJson = computed<TemplateJson | null>(() => {
  if (!template.value?.headerComponentsJson) return null
  try { return JSON.parse(template.value.headerComponentsJson) } catch { return null }
})

const footerJson = computed<TemplateJson | null>(() => {
  if (!template.value?.footerComponentsJson) return null
  try { return JSON.parse(template.value.footerComponentsJson) } catch { return null }
})

const templateColors = computed<ColorJson | null>(() => {
  if (!template.value?.colorJson) return null
  try { return JSON.parse(template.value.colorJson) } catch { return null }
})

const headerSlots = computed<TemplateSlot[]>(() => headerJson.value?.slots ?? [])
const footerSlots = computed<TemplateSlot[]>(() => footerJson.value?.slots ?? [])

const headerStatus = computed(() => {
  if (!template.value) return 'wait'
  if (template.value.genStatusCd === '003' && template.value.headerComponentsJson) return 'done'
  if (template.value.genStatusCd === '004') return 'fail'
  return 'wait'
})

const footerStatus = computed(() => {
  if (!template.value) return 'wait'
  if (template.value.genStatusCd === '003' && template.value.footerComponentsJson) return 'done'
  if (template.value.genStatusCd === '004') return 'fail'
  return 'wait'
})

const headerPreviewStyle = computed(() => ({
  height: headerJson.value?.height ? `${headerJson.value.height}px` : '64px',
  position: 'relative' as const,
  background: '#fff',
  borderBottom: `2px solid ${templateColors.value?.accentColor || '#E08A2C'}`,
}))

const footerPreviewStyle = computed(() => ({
  height: footerJson.value?.height ? `${footerJson.value.height}px` : '28px',
  position: 'relative' as const,
  background: '#f8f9fa',
  borderTop: '1px solid #e0e0e0',
}))

// ── 슬롯 텍스트 바인딩 (예시 값으로 치환) ─────────────────────────────────────

const EXAMPLE_VALUES: Record<string, string> = {
  '{chapter_no}': 'Ⅱ',
  '{project_nm}': '스마트 공공서비스 구축 사업',
  '{chapter_title}': '기술 제안',
  '{breadcrumb}': '1. 사업이해도',
  '{page_number}': 'Ⅱ-1',
  '{org_nm}': '○○청',
  '{submitter_nm}': '(주)제안사',
}

const resolveSlotText = (slot: TemplateSlot): string => {
  if (!slot.placeholder) return slot.key
  return EXAMPLE_VALUES[slot.placeholder] ?? slot.placeholder
}

const slotStyle = (slot: TemplateSlot) => ({
  position: 'absolute' as const,
  left: slot.x ? `${slot.x}px` : 'auto',
  top: slot.y ? `${slot.y}px` : 'auto',
  width: slot.width ? `${slot.width}px` : 'auto',
  height: slot.height ? `${slot.height}px` : 'auto',
  fontSize: slot.fontSize ? `${slot.fontSize}px` : '10px',
  fontWeight: slot.fontWeight ?? 'normal',
  color: slot.color ?? '#333',
  background: slot.bgColor,
  borderRadius: slot.borderRadius ? `${slot.borderRadius}px` : undefined,
  textAlign: (slot.align as 'left' | 'center' | 'right') ?? 'left',
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  whiteSpace: 'nowrap' as const,
})

// ── API 호출 ──────────────────────────────────────────────────────────────────

const onGenerate = async () => {
  isGenerating.value = true
  try {
    const res = await fetchGeneratePtTemplate(props.ptProjectId, props.modelId, props.agentId)
    if (res.result === 'OK') {
      template.value = res.data
    } else {
      openToast({ message: res.msg ?? '템플릿 생성에 실패했습니다.', type: 'error' })
    }
  } catch {
    openToast({ message: '템플릿 생성 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isGenerating.value = false
  }
}

const onRegenerate = async () => {
  isGenerating.value = true
  try {
    const res = await fetchRegeneratePtTemplate(props.ptProjectId, '', props.modelId, props.agentId)
    if (res.result === 'OK') {
      template.value = res.data
    } else {
      openToast({ message: res.msg ?? '재생성에 실패했습니다.', type: 'error' })
    }
  } catch {
    openToast({ message: '재생성 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isGenerating.value = false
  }
}

const onSendChat = async () => {
  const msg = chatInput.value.trim()
  if (!msg) return
  chatMessages.value.push({ role: 'user', text: msg })
  chatInput.value = ''
  isRegenerating.value = true
  try {
    const res = await fetchRegeneratePtTemplate(props.ptProjectId, msg, props.modelId, props.agentId)
    if (res.result === 'OK') {
      template.value = res.data
      chatMessages.value.push({ role: 'ai', text: '요청하신 내용을 반영해 템플릿을 업데이트했습니다.' })
    } else {
      chatMessages.value.push({ role: 'ai', text: res.msg ?? '보완 요청 처리에 실패했습니다.' })
    }
  } catch {
    chatMessages.value.push({ role: 'ai', text: '오류가 발생했습니다. 다시 시도해 주세요.' })
  } finally {
    isRegenerating.value = false
  }
}

// ── 초기 로드 ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const res = await fetchSelectPtTemplate(props.ptProjectId)
    if (res.result === 'OK' && res.data) {
      template.value = res.data
    }
  } catch {
    // 없으면 null 유지 (초기 상태)
  }
})
</script>
