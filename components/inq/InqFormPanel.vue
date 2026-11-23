<template>
  <UiDrawer
    :open="isOpen"
    :title="`문의사항 ${panelActionLabel}`"
    position="right"
    width="50%"
    persist-key="inq-form"
    @update:open="(value) => !value && $emit('close')"
  >
    <div class="com-setting-form inq-form-panel">
      <div class="inq-form-row">
        <div class="url-reg-field">
          <label class="url-reg-label">구분 <span class="required">*</span></label>
          <UiSelect
            :model-value="formData.catCd"
            :options="catOptions"
            placeholder="구분을 선택하세요"
            size="md"
            @update:model-value="(value) => onFieldChange('catCd', String(value ?? ''))"
          />
        </div>
        <div
          v-if="isAgentCat"
          class="url-reg-field"
        >
          <label class="url-reg-label">에이전트 <span class="required">*</span></label>
          <UiSelect
            :model-value="formData.agentId"
            :options="agentOptions"
            placeholder="에이전트를 선택하세요"
            size="md"
            @update:model-value="(value) => onFieldChange('agentId', String(value ?? ''))"
          />
        </div>
      </div>

      <div class="url-reg-field">
        <label class="url-reg-label">제목 <span class="required">*</span></label>
        <UiInput
          :model-value="formData.title"
          placeholder="제목을 입력하세요"
          size="md"
          :max-length="INQ_TITLE_MAX_LENGTH"
          @update:model-value="(value) => onFieldChange('title', String(value ?? ''))"
        />
      </div>

      <div class="url-reg-field">
        <UiCheckbox
          :model-value="formData.secretYn === 'Y'"
          label="비밀글로 등록하기 (작성자·관리자 권한자만 열람)"
          @update:model-value="(value) => onFieldChange('secretYn', value ? 'Y' : 'N')"
        />
      </div>

      <div class="url-reg-field inq-content-field">
        <label class="url-reg-label">내용 <span class="required">*</span></label>
        <!-- 툴바는 문의용(이미지 제외), 본문은 회의록 에디터 컴포넌트를 사용 (에디터 인스턴스는 아래에서 provide) -->
        <div class="meeting2-editor inq-rich-editor">
          <InqEditorToolbar />
          <div class="meeting2-editor-relative">
            <MeetingEditorBody />
          </div>
        </div>
      </div>

      <div class="url-reg-field inq-attach">
        <label class="url-reg-label">첨부파일</label>
        <UiFileUpload
          :model-value="files"
          :accept="INQ_FILE_ACCEPT"
          :allowed-extensions="INQ_FILE_EXTENSIONS"
          :max-size="INQ_FILE_MAX_SIZE"
          :attached-file-list="attachedFileItems"
          @update:model-value="(value) => $emit('update:files', value)"
          @remove-attached-file="(file) => $emit('remove-attached-file', file)"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="outline"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import { UiDrawer, UiInput, UiSelect, UiCheckbox, UiButton } from '@leechanyong/ispark-ui'
import { useEditor } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import InqEditorToolbar from '~/components/inq/InqEditorToolbar.vue'
import MeetingEditorBody from '~/components/meeting/MeetingEditorBody.vue'
import { TableShortcuts } from '~/composables/meeting/tableShortcuts'
import { FontSize } from '~/composables/meeting/fontSize'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'
import { useEditorSourceView } from '~/composables/com/useEditorSourceView'
import { INQ_FILE_ACCEPT, INQ_FILE_EXTENSIONS, INQ_FILE_MAX_SIZE, INQ_TITLE_MAX_LENGTH } from '~/types/inq'
import type { InqFormData } from '~/types/inq'
import type { FileItem } from '~/types/repository'

const props = defineProps<{
  isOpen: boolean
  formData: InqFormData
  catOptions: { label: string; value: string }[]
  agentOptions: { label: string; value: string }[]
  isAgentCat: boolean
  panelActionLabel: '등록' | '수정'
  /** 새로 첨부할 파일 */
  files: File[]
  /** 수정 중인 기존 첨부 */
  attachedFileItems: FileItem[]
}>()

const emit = defineEmits<{
  'update:formData': [payload: InqFormData]
  'update:files': [files: File[]]
  'remove-attached-file': [file: FileItem]
  save: [payload: InqFormData]
  close: []
}>()

const onFieldChange = <K extends keyof InqFormData>(key: K, value: InqFormData[K]) => {
  emit('update:formData', { ...props.formData, [key]: value })
}

// ── 내용 에디터(Tiptap) — 회의록 에디터(MeetingEditorPanel)와 같은 확장·툴바, HTML 문자열로 저장 (이미지는 첨부파일로) ──

/** 마지막으로 formData에 반영한 내용 — 부모가 되돌려준 같은 값으로 에디터를 다시 채우지 않기 위함 */
let lastHtml = props.formData.content

const editor = useEditor({
  content: props.formData.content,
  extensions: [
    StarterKit.configure({
      // StarterKit 내장 확장 설정으로 중복 등록(link/underline) 경고를 방지
      link: {
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    FontSize,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({ placeholder: '내용을 입력하세요' }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TableShortcuts,
  ],
  onUpdate: ({ editor: instance }) => {
    // 내용이 없으면 빈 값으로 전달 (필수값 검사용, 표만 있어도 내용으로 본다)
    lastHtml = instance.isEmpty ? '' : instance.getHTML()
    onFieldChange('content', lastHtml)
  },
  editorProps: {
    // 상세 화면과 같은 본문 스타일(.inq-rich) 적용
    attributes: { class: 'inq-rich', spellcheck: 'false' },
  },
})

// 툴바·본문(회의록 컴포넌트)에서 inject 하는 에디터 인스턴스와 HTML 소스 보기 상태
provide(meetingEditorKey, editor)
const sourceView = useEditorSourceView(editor)
provide(meetingSourceViewKey, sourceView)

// 수정할 문의를 바꾸거나 폼이 초기화되면 에디터 내용도 맞춘다
watch(
  () => props.formData.content,
  (value) => {
    if (!editor.value || value === lastHtml) return
    lastHtml = value
    sourceView.exitSourceView()
    editor.value.commands.setContent(value, { emitUpdate: false })
  },
)

// HTML 소스 보기 중에는 textarea 값을 그대로 formData에 전달 (저장 시 소스 편집 내용이 반영되도록)
watch(sourceView.sourceHtml, (html) => {
  if (!sourceView.isSourceView.value) return
  lastHtml = html.trim()
  onFieldChange('content', lastHtml)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const onSave = () => {
  const data = props.formData
  if (!data.catCd) {
    openToast({ message: '구분을 선택해주세요.', type: 'warning' })
    return
  }
  if (props.isAgentCat && !data.agentId) {
    openToast({ message: '에이전트를 선택해주세요.', type: 'warning' })
    return
  }
  if (!data.title.trim()) {
    openToast({ message: '제목을 입력해주세요.', type: 'warning' })
    return
  }
  if (!data.content.trim()) {
    openToast({ message: '내용을 입력해주세요.', type: 'warning' })
    return
  }
  emit('save', data)
}
</script>
