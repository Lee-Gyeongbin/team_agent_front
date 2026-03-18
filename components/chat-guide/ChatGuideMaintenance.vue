<template>
  <div class="chat-comment-greeting">
    <div class="chat-comment-section-header">
      <h3 class="chat-comment-section-title">점검 및 장애 안내</h3>
      <div class="chat-comment-setting-footer">
        <UiButton
          variant="primary"
          @click="onSave"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          @click="onReset"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <div class="maint-body">
      <!-- ===== 긴급 공지 ===== -->
      <section
        class="maint-section"
        :class="{ 'is-emergency': form.emergency.isEnabled }"
      >
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">⚠️</span>
            <div>
              <h4 class="maint-section-title">긴급 공지</h4>
              <p class="maint-section-desc">즉시 표시되어야 하는 긴급 상황 안내</p>
            </div>
          </div>
          <UiToggle v-model="form.emergency.isEnabled" />
        </div>

        <template v-if="form.emergency.isEnabled">
          <!-- 경고 배너 -->
          <div class="maint-alert-banner">⚠️ 긴급 공지가 활성화되면 사용자가 챗봇에 접속할 때 가장 먼저 표시됩니다</div>

          <div class="maint-field">
            <label class="maint-label">공지 제목</label>
            <UiInput
              v-model="form.emergency.title"
              placeholder="예: 긴급 점검 안내"
              size="sm"
            />
          </div>

          <div class="maint-field">
            <label class="maint-label">공지 내용</label>
            <UiTextarea
              v-model="form.emergency.message"
              :rows="4"
              border
              placeholder="긴급 공지 내용을 입력하세요"
            />
          </div>

          <div class="maint-field-row">
            <div class="maint-field">
              <label class="maint-label">표시 시작</label>
              <UiDatePicker
                v-model="form.emergency.startDate"
                type="datetime"
              />
            </div>
            <div class="maint-field">
              <label class="maint-label">표시 종료</label>
              <UiDatePicker
                v-model="form.emergency.endDate"
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
          <UiToggle v-model="form.scheduled.isEnabled" />
        </div>

        <template v-if="form.scheduled.isEnabled">
          <div class="maint-field">
            <label class="maint-label">점검 일시</label>
            <div class="maint-field-row">
              <UiDatePicker
                v-model="form.scheduled.startDate"
                type="datetime"
              />
              <UiDatePicker
                v-model="form.scheduled.endDate"
                type="datetime"
              />
            </div>
          </div>

          <div class="maint-field">
            <label class="maint-label">안내 메시지</label>
            <UiTextarea
              v-model="form.scheduled.message"
              :rows="4"
              border
            />
          </div>

          <div class="maint-field">
            <label class="maint-label">사전 안내 기간</label>
            <UiSelect
              v-model="form.scheduled.advanceNotice"
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
          <UiToggle v-model="form.incident.isEnabled" />
        </div>

        <template v-if="form.incident.isEnabled">
          <div class="maint-field">
            <label class="maint-label">장애 유형별 메시지</label>
          </div>

          <div
            v-for="item in form.incident.types"
            :key="item.key"
            class="maint-incident-item"
          >
            <h5 class="maint-incident-item-title">
              <span>{{ item.icon }}</span>
              {{ item.label }}
            </h5>
            <UiTextarea
              v-model="item.message"
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
          <UiToggle v-model="form.recovery.isEnabled" />
        </div>

        <template v-if="form.recovery.isEnabled">
          <div class="maint-field">
            <label class="maint-label">복구 완료 메시지</label>
            <UiTextarea
              v-model="form.recovery.message"
              :rows="4"
              border
            />
          </div>

          <UiCheckbox
            v-model="form.recovery.autoDisplay"
            label="복구 완료 후 자동으로 표시 (24시간)"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'
import type { ChatMaintenanceForm } from '~/types/chat-guide'

interface MaintenanceForm {
  emergency: {
    isEnabled: boolean
    title: string
    message: string
    startDate: DateValue | undefined
    endDate: DateValue | undefined
  }
  scheduled: {
    isEnabled: boolean
    startDate: DateValue | undefined
    endDate: DateValue | undefined
    message: string
    advanceNotice: string
  }
  incident: ChatMaintenanceForm['incident']
  recovery: ChatMaintenanceForm['recovery']
}

const {
  maintenanceForm,
  advanceNoticeOptions,
  handleSaveMaintenance: onSave,
  handleResetMaintenance: onReset,
} = useChatGuideStore()

const form = maintenanceForm as unknown as MaintenanceForm
</script>
