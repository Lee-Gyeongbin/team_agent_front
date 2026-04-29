import { Image } from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ResizableImageView from '~/components/meeting/ResizableImageView.vue'

/**
 * Tiptap 3.x — 리사이즈 가능한 이미지 확장
 * - 기본 Image extension에 `width` attribute 추가
 * - VueNodeViewRenderer로 ResizableImageView 컴포넌트를 노드 뷰로 사용
 * - HTML 출력은 `<img style="width: ...">` 형태로 직렬화
 */
export const ResizableImage = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const html = el as HTMLElement
          return html.style?.width || html.getAttribute('width') || null
        },
        renderHTML: (attrs) => {
          const w = attrs.width as string | null
          if (!w) return {}
          return { style: `width: ${w}` }
        },
      },
      textAlign: {
        default: 'left',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-align') || 'left',
        renderHTML: (attrs) => (attrs.textAlign ? { 'data-align': attrs.textAlign } : {}),
      },
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(ResizableImageView)
  },
})
