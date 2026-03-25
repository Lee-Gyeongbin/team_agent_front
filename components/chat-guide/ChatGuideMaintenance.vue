<template>
  <div class="chat-guide-panel">
    <div class="chat-guide-section-header">
      <h3 class="chat-guide-section-title">점검 및 장애 안내</h3>
      <div class="chat-guide-setting-footer">
        <UiButton
          variant="primary"
          @click="handleConfirmSaveMaintenance"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          @click="handleConfirmResetMaintenance"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <div class="maint-body">
      <!-- ===== 긴급 공지 ===== -->
      <section
        class="maint-section"
        :class="{ 'is-emergency': emergencyRow.enblYn === 'Y' }"
      >
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">⚠️</span>
            <div>
              <h4 class="maint-section-title">긴급 공지</h4>
              <p class="maint-section-desc">즉시 표시되어야 하는 긴급 상황 안내</p>
            </div>
          </div>
          <UiToggle
            :model-value="emergencyRow.enblYn === 'Y'"
            @update:model-value="(v) => (emergencyRow.enblYn = toYn(v))"
          />
        </div>

        <template v-if="emergencyRow.enblYn === 'Y'">
          <div class="maint-alert-banner">⚠️ 긴급 공지가 활성화되면 사용자가 챗봇에 접속할 때 가장 먼저 표시됩니다</div>

          <div class="maint-field">
            <label class="maint-label">공지 제목</label>
            <UiInput
              v-model="emergencyRow.title"
              placeholder="예: 긴급 점검 안내"
              size="sm"
            />
          </div>

          <div class="maint-field">
            <label class="maint-label">공지 내용</label>
            <UiTextarea
              v-model="emergencyRow.content"
              :rows="4"
              border
              placeholder="긴급 공지 내용을 입력하세요"
            />
          </div>

          <div class="maint-field-row">
            <div class="maint-field">
              <label class="maint-label">표시 시작</label>
              <UiDatePicker
                v-model="emergencyStartDt"
                type="datetime"
              />
            </div>
            <div class="maint-field">
              <label class="maint-label">표시 종료</label>
              <UiDatePicker
                v-model="emergencyEndDt"
                type="datetime"
              />
            </div>
          </div>
        </template>
      </section>

      <!-- ===== 정기 점검 안내 ===== -->
      <section class="maint-section">
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">🔧</span>
            <div>
              <h4 class="maint-section-title">정기 점검 안내</h4>
              <p class="maint-section-desc">예정된 시스템 점검 사전 안내</p>
            </div>
          </div>
          <UiToggle
            :model-value="scheduledRow.enblYn === 'Y'"
            @update:model-value="(v) => (scheduledRow.enblYn = toYn(v))"
          />
        </div>

        <template v-if="scheduledRow.enblYn === 'Y'">
          <div class="maint-field">
            <label class="maint-label">점검 일시</label>
            <div class="maint-field-row">
              <UiDatePicker
                v-model="scheduledStartDt"
                type="datetime"
              />
              <UiDatePicker
                v-model="scheduledEndDt"
                type="datetime"
              />
            </div>
          </div>

          <div class="maint-field">
            <label class="maint-label">안내 메시지</label>
            <UiTextarea
              v-model="scheduledRow.content"
              :rows="4"
              border
            />
          </div>

          <div class="maint-field">
            <label class="maint-label">사전 안내 기간</label>
            <UiSelect
              v-model="scheduledRow.advanceNoticeCd"
              :options="advanceNoticeOptions"
              size="sm"
            />
          </div>
        </template>
      </section>

      <!-- ===== 장애 발생 안내 ===== -->
      <section class="maint-section">
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">🚨</span>
            <div>
              <h4 class="maint-section-title">장애 발생 안내</h4>
              <p class="maint-section-desc">예상치 못한 장애 발생 시 표시</p>
            </div>
          </div>
          <UiToggle v-model="incidentSectionOn" />
        </div>

        <template v-if="incidentSectionOn">
          <div class="maint-field">
            <label class="maint-label">장애 유형별 메시지</label>
          </div>

          <div
            v-for="slot in CHAT_GUIDE_MAINTENANCE_INCIDENT_UI_SLOTS"
            :key="slot.guideKey"
            class="maint-incident-item"
          >
            <h5 class="maint-incident-item-title">
              <span>{{ slot.icon }}</span>
              {{ slot.label }}
            </h5>
            <UiTextarea
              v-model="rowByGuideKey(slot.guideKey).content"
              :rows="3"
              border
            />
          </div>
        </template>
      </section>

      <!-- ===== 서비스 복구 안내 ===== -->
      <section class="maint-section">
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">✅</span>
            <div>
              <h4 class="maint-section-title">서비스 복구 안내</h4>
              <p class="maint-section-desc">점검/장애 종료 후 정상화 안내</p>
            </div>
          </div>
          <UiToggle
            :model-value="recoveryRow.enblYn === 'Y'"
            @update:model-value="(v) => (recoveryRow.enblYn = toYn(v))"
          />
        </div>

        <template v-if="recoveryRow.enblYn === 'Y'">
          <div class="maint-field">
            <label class="maint-label">복구 완료 메시지</label>
            <UiTextarea
              v-model="recoveryRow.content"
              :rows="4"
              border
            />
          </div>

          <UiCheckbox
            :model-value="recoveryRow.autoDsplYn === 'Y'"
            label="복구 완료 후 자동으로 표시 (24시간)"
            @update:model-value="(v) => (recoveryRow.autoDsplYn = v ? 'Y' : 'N')"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { CodeItem } from '~/types/codes'
import type { ChatGuideMaintenanceItem } from '~/types/chat-guide'
import { CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS, CHAT_GUIDE_MAINTENANCE_INCIDENT_UI_SLOTS } from '~/types/chat-guide'
import { computed, onMounted, ref, type ComputedRef } from 'vue'
import { apiStringFromDateValue, dateValueFromApiString } from '~/utils/global/dateUtil'
import { toYn, useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const { localMaintenanceList, handleSelectMaintenance, handleConfirmSaveMaintenance, handleConfirmResetMaintenance } =
  useChatGuideStore()

/** 정기 점검 — 사전 안내 기간 (공통코드) */
const advanceNoticeOptions = ref<{ label: string; value: string }[]>([])
const initAdvanceNoticeOptions = async () => {
  const codes = await getCodes('GI000002')
  advanceNoticeOptions.value = codes.map((item: CodeItem) => ({
    label: item.codeNm,
    value: item.codeId,
  }))
}

const rowByGuideKey = (guideKey: string): ChatGuideMaintenanceItem => {
  const r = localMaintenanceList.value.find((x) => x.guideKey === guideKey)
  if (!r) {
    throw new Error(`점검/장애 guideKey 행이 없습니다: ${guideKey}`)
  }
  return r
}

const emergencyRow = computed(() => rowByGuideKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.emergency))
const scheduledRow = computed(() => rowByGuideKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.scheduled))
const recoveryRow = computed(() => rowByGuideKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.recovery))

/** 점검 행의 startDt/endDt ↔ DatePicker 값 동기화 */
const maintenanceDateComputed = (row: ComputedRef<ChatGuideMaintenanceItem>, field: 'startDt' | 'endDt') =>
  computed({
    get: () => dateValueFromApiString(row.value[field]),
    set: (v: DateValue | undefined) => {
      row.value[field] = apiStringFromDateValue(v)
    },
  })

const emergencyStartDt = maintenanceDateComputed(emergencyRow, 'startDt')
const emergencyEndDt = maintenanceDateComputed(emergencyRow, 'endDt')
const scheduledStartDt = maintenanceDateComputed(scheduledRow, 'startDt')
const scheduledEndDt = maintenanceDateComputed(scheduledRow, 'endDt')

/** 장애 섹션 토글 — 세 장애 행 enblYn 동기화 */
const incidentSectionOn = computed({
  get: () => rowByGuideKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentSystem).enblYn === 'Y',
  set: (v) => {
    const yn = toYn(v)
    for (const slot of CHAT_GUIDE_MAINTENANCE_INCIDENT_UI_SLOTS) {
      rowByGuideKey(slot.guideKey).enblYn = yn
    }
  },
})

onMounted(async () => {
  await initAdvanceNoticeOptions()
  await handleSelectMaintenance()
})
</script>
