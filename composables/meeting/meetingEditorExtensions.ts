import { StarterKit } from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { ResizableImage } from '~/composables/meeting/resizableImage'
import { TableShortcuts } from '~/composables/meeting/tableShortcuts'
import { FontSize } from '~/composables/meeting/fontSize'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'

export const meetingEditorExtensions = ({
  placeholder,
  allowImages = false,
  tableHeader = TableHeader,
  tableCell = TableCell,
}: {
  placeholder: string
  allowImages?: boolean
  tableHeader?: typeof TableHeader
  tableCell?: typeof TableCell
}) => [
  StarterKit.configure({
    // StarterKit 내장 확장 설정으로 중복 등록(link/underline) 경고를 방지
    link: {
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    },
  }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  // 템플릿(tmplHtml)의 data:image;base64 로고가 파싱 시 제거되지 않도록 허용
  ...(allowImages ? [ResizableImage.configure({ allowBase64: true })] : []),
  FontSize,
  Table.configure({ resizable: true }),
  TableRow,
  tableHeader,
  tableCell,
  Placeholder.configure({ placeholder }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  TableShortcuts,
]
