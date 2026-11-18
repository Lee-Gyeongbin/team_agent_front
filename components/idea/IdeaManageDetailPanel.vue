<template>
  <UiDrawer
    :open="isOpen"
    :title="idea?.title || '아이디어'"
    position="right"
    width="50%"
    show-resize
    show-fullscreen
    persist-key="idea-manage-detail"
    :confirm-before-close="false"
    @update:open="(v) => !v && $emit('close')"
  >
    <!-- 위 절반: 사용자 아이디어 내역 / 아래 절반: 진행상태·관리자 코멘트 -->
    <div
      v-if="idea"
      class="notice-detail-panel idea-detail-panel idea-manage-split"
    >
      <div class="idea-manage-pane idea-manage-pane-top">
        <p class="idea-manage-pane-title">사용자 아이디어 내역</p>
        <IdeaDetailContent
          :idea="idea"
          @like="$emit('like')"
          @download="(file) => $emit('download', file)"
        />
      </div>

      <div class="idea-manage-pane idea-manage-pane-bottom">
        <p class="idea-manage-pane-title">관리자 코멘트</p>
        <div class="com-setting-form idea-manage-form">
          <div class="url-reg-field">
            <label class="url-reg-label">진행상태</label>
            <UiSelect
              :model-value="formData.statusCd"
              :options="statusOptions"
              placeholder="선택"
              size="md"
              @update:model-value="(value) => onFieldChange('statusCd', String(value ?? ''))"
            />
          </div>
          <div class="url-reg-field idea-form-grow">
            <!-- 상세를 열 때마다(글이 바뀔 때마다) 새로 만들어 저장된 코멘트로 초기화 -->
            <IdeaRichEditor
              v-if="isOpen"
              :key="idea.ideaId"
              :model-value="formData.cmtContent"
              placeholder="관리자 코멘트 내용을 입력하세요"
              @update:model-value="(value) => onFieldChange('cmtContent', value)"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="danger-line"
          size="md"
          @click="$emit('delete')"
        >
          삭제
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="$emit('save')"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import { UiButton, UiDrawer, UiSelect } from '@leechanyong/ispark-ui'
import type { IdeaDetail, IdeaFile, IdeaManageFormData } from '~/types/idea'

interface Props {
  isOpen: boolean
  idea: IdeaDetail | null
  formData: IdeaManageFormData
  statusOptions: { label: string; value: string }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  like: []
  save: []
  delete: []
  download: [file: IdeaFile]
  updateFormData: [payload: IdeaManageFormData]
}>()

const onFieldChange = <K extends keyof IdeaManageFormData>(key: K, value: IdeaManageFormData[K]) => {
  emit('updateFormData', { ...props.formData, [key]: value })
}
</script>
