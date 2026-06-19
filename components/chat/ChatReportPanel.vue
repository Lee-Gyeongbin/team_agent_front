<template>
  <div
    class="chat-report-panel"
    :class="{ 'is-open': open, 'is-fullscreen': isFullscreen }"
  >
    <div class="chat-report-header">
      <span class="chat-report-title">리포트</span>
      <div class="chat-report-header-actions">
        <div class="chat-report-download-grp">
          <button
            class="chat-report-download-btn is-docx"
            type="button"
            title="DOCX 다운로드"
            @click="onDownloadDocx"
          >
            <span
              class="chat-report-download-btn-icon"
              aria-hidden="true"
            >
              <i class="icon-file-doc size-16" />
            </span>
            <span class="chat-report-download-btn-label">DOCX</span>
          </button>
          <button
            class="chat-report-download-btn is-pdf"
            type="button"
            title="PDF 다운로드"
            @click="onDownloadPdf"
          >
            <span
              class="chat-report-download-btn-icon"
              aria-hidden="true"
            >
              <i class="icon-file-pdf size-16" />
            </span>
            <span class="chat-report-download-btn-label">PDF</span>
          </button>
          <button
            class="chat-report-download-btn is-archive"
            type="button"
            title="내 문서보관함 저장"
            @click="onSaveToMyDocs"
          >
            <span
              class="chat-report-download-btn-icon"
              aria-hidden="true"
            >
              <i class="icon-archive size-16" />
            </span>
            <span class="chat-report-download-btn-label">내 문서</span>
          </button>
        </div>

        <button
          class="btn btn-icon"
          type="button"
          :title="isFullscreen ? '축소' : '전체화면'"
          @click="toggleFullscreen"
        >
          <i
            :class="isFullscreen ? 'icon-collapse' : 'icon-expand'"
            class="size-20"
          />
        </button>
        <button
          class="btn btn-icon"
          type="button"
          title="닫기"
          @click="onClose"
        >
          <i class="icon-close size-16" />
        </button>
      </div>
    </div>
    <div class="chat-report-content">
      <LibraryReportEditor
        v-if="normalizedHtml"
        :key="editorKey"
        v-model:html="editorHtml"
        :tmpl-html="normalizedHtml"
      />
      <UiEmpty
        v-else
        title="리포트 데이터가 없습니다."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import LibraryReportEditor from '~/components/library/LibraryReportEditor.vue'
import { downloadReportAsDocx, downloadReportAsPdf } from '~/utils/chat/reportExportUtil'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { useMyDocStore } from '~/composables/my-documents/useMyDocStore'

const { getMessagesForVisualization } = useChatMessages()
const { handleSaveReport } = useMyDocStore()

// 출처 링크는 native target="_blank"로 처리한다.
// - 웹 출처(http): 해당 페이지 새 탭
// - 사내 문서: /api/repository/viewDocRedirect.do?docFileId=XXX → 백엔드 302 리다이렉트로 파일 열림

interface Props {
  open: boolean
  messageId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:fullscreen': [value: boolean]
}>()

const isFullscreen = ref(false)

/** 에디터와 양방향 바인딩되는 현재 HTML (편집 반영) */
const editorHtml = ref('')
/** messageId가 바뀔 때 에디터를 새로 마운트하기 위한 키 */
const editorKey = ref(0)
/** 내 문서 저장 시 originHtml로 사용할 최초 리포트 HTML */
const originReportHtml = ref('')

const reportMessage = computed(() => {
  const id = props.messageId
  if (!id) return null
  const source = getMessagesForVisualization()
  return (
    source.find((m) => m.logId === id && m.reportHtml) ??
    source.find((m) => m.logId === id && m.type === 'answer') ??
    source.find((m) => m.logId === id) ??
    null
  )
})

const reportHtml = computed(() => reportMessage.value?.reportHtml ?? '')

/** REPORT_HTML이 순수 HTML이 아닌 경우(JSON, 마크다운 코드블록 등) HTML로 변환 */
const normalizedHtml = computed(() => {
  const raw = reportHtml.value
  if (!raw) return ''

  // <div>```json ... ```</div> 패턴 → 내부 JSON 추출
  const stripped = raw.replace(/<\/?div>/gi, '').trim()
  const codeBlockMatch = stripped.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  if (codeBlockMatch) {
    const jsonStr = codeBlockMatch[1].trim()
    try {
      const obj = JSON.parse(jsonStr)
      return jsonToReportHtml(obj)
    } catch {
      return `<pre>${esc(jsonStr)}</pre>`
    }
  }

  // 순수 JSON 문자열인 경우
  if (stripped.startsWith('{') && stripped.endsWith('}')) {
    try {
      const obj = JSON.parse(stripped)
      return jsonToReportHtml(obj)
    } catch {
      // JSON 아님 — 원본 반환
    }
  }

  // 템플릿 렌더링된 HTML — 셀 안에 남은 JSON 문자열을 정리
  return cleanJsonInHtml(raw)
})

// messageId가 바뀌면 에디터를 재마운트하여 새 content 반영
watch(
  () => props.messageId,
  () => {
    editorKey.value += 1
    originReportHtml.value = ''
  },
)

// 리포트 최초 HTML — 내 문서 저장 originHtml용
watch(
  () => [props.messageId, normalizedHtml.value] as const,
  ([id, html]) => {
    if (id && html) {
      originReportHtml.value = html
    }
  },
)

// ============================================
// JSON → HTML 변환 (템플릿 렌더링 실패 시 fallback)
// ============================================

/**
 * HTML 테이블 내부의 JSON 문자열을 처리한다.
 * 1) 테이블 헤더 수와 JSON 객체 키 수가 맞으면 → 각 셀에 분배
 * 2) 맞지 않으면 → 읽기 좋은 텍스트로 변환
 */
const cleanJsonInHtml = (html: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = doc.querySelectorAll('table')

  tables.forEach((table) => {
    const headers = Array.from(table.querySelectorAll('th')).map((th) => th.textContent?.trim() ?? '')
    if (headers.length === 0) return

    const headerKeyMap = buildHeaderKeyMap(headers)
    const rows = table.querySelectorAll('tbody tr')

    rows.forEach((tr) => {
      const cells = tr.querySelectorAll('td')
      if (cells.length === 0) return

      const firstCell = cells[0]
      const text = firstCell.textContent?.trim() ?? ''
      if (!text.startsWith('{') || !text.endsWith('}')) return

      try {
        const obj = JSON.parse(text) as Record<string, unknown>
        if (cells.length === headers.length) {
          distributeJsonToCells(obj, cells, headers, headerKeyMap)
        } else {
          firstCell.innerHTML = flattenJsonToText(obj)
        }
      } catch {
        // JSON 아님 — 그대로 유지
      }
    })
  })

  return doc.body.innerHTML
}

/** 테이블 헤더 텍스트 → JSON 키 매핑 */
const buildHeaderKeyMap = (headers: string[]): Map<string, string[]> => {
  const map = new Map<string, string[]>()
  const aliases: Record<string, string[]> = {
    경쟁사: ['name', '이름', '기업', '회사'],
    강점: ['strengths', '강점', 'strength'],
    약점: ['weaknesses', '약점', 'weakness'],
    시장점유율: ['market_share', '점유율', 'share'],
    '강점 (S)': ['strengths'],
    '약점 (W)': ['weaknesses'],
    '기회 (O)': ['opportunities'],
    '위협 (T)': ['threats'],
  }
  headers.forEach((h) => {
    map.set(h, aliases[h] ?? [h.toLowerCase()])
  })
  return map
}

/** JSON 객체의 값을 헤더 순서에 맞게 각 셀에 분배 */
const distributeJsonToCells = (
  obj: Record<string, unknown>,
  cells: NodeListOf<Element>,
  headers: string[],
  headerKeyMap: Map<string, string[]>,
) => {
  headers.forEach((header, idx) => {
    const cell = cells[idx]
    if (!cell) return

    const candidates = headerKeyMap.get(header) ?? [header.toLowerCase()]
    let val: unknown = undefined
    for (const key of candidates) {
      if (obj[key] !== undefined) {
        val = obj[key]
        break
      }
    }

    cell.innerHTML = val === undefined ? '' : flattenJsonToText(val)
  })
}

/** JSON 값을 읽기 좋은 HTML 텍스트로 변환 */
const flattenJsonToText = (obj: unknown): string => {
  if (typeof obj === 'string') return obj
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
  if (Array.isArray(obj)) {
    return obj.map((v) => `• ${flattenJsonToText(v)}`).join('<br/>')
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj as Record<string, unknown>)
      .map(([k, v]) => {
        const val = Array.isArray(v) ? v.map((i) => `• ${flattenJsonToText(i)}`).join('<br/>') : flattenJsonToText(v)
        return `<strong>${k}</strong>: ${val}`
      })
      .join('<br/>')
  }
  return String(obj)
}

const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 래퍼 키(리서치리포트, 리서치_리포트 등) 안의 실제 데이터 추출 */
const unwrapRoot = (obj: Record<string, unknown>): Record<string, unknown> => {
  const keys = Object.keys(obj)
  if (keys.length === 1) {
    const val = obj[keys[0]]
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return val as Record<string, unknown>
    }
  }
  return obj
}

/** 제목 후보 키에서 값 추출 */
const extractTitle = (obj: Record<string, unknown>): string => {
  for (const key of ['title', '제목', '주제']) {
    if (typeof obj[key] === 'string') return obj[key] as string
  }
  return '리포트'
}

/** JSON 객체를 리서치 리포트 HTML로 변환 */
const jsonToReportHtml = (rawObj: Record<string, unknown>): string => {
  const obj = unwrapRoot(rawObj)
  const parts: string[] = []
  const title = extractTitle(obj)
  parts.push(`<h1 style="text-align:center; margin-bottom:24px;">${esc(title)}</h1>`)

  const skipKeys = new Set(['title', '제목', '주제', 'date', '작성일', '날짜'])
  let sectionNo = 1
  for (const [key, val] of Object.entries(obj)) {
    if (skipKeys.has(key) || val === undefined || val === null) continue
    const label = key.replace(/^[\d]+\.\s*/, '')
    parts.push(`<h2>${sectionNo}. ${esc(label)}</h2>`)
    parts.push(renderValue(val, 3))
    sectionNo++
  }

  return parts.join('\n')
}

/** 값을 HTML로 재귀 렌더링 — depth로 heading 레벨 제어 */
const renderValue = (val: unknown, headingLevel = 3): string => {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return `<p>${esc(val)}</p>`
  if (typeof val === 'number' || typeof val === 'boolean') return `<p>${esc(String(val))}</p>`

  if (Array.isArray(val)) {
    // 배열 원소가 객체이면 테이블로 렌더링
    if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null && !Array.isArray(val[0])) {
      return renderObjectArrayAsTable(val as Record<string, unknown>[])
    }
    return '<ul>' + val.map((v) => `<li>${esc(String(v))}</li>`).join('') + '</ul>'
  }

  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>)
    const parts: string[] = []
    const hTag = headingLevel <= 6 ? `h${headingLevel}` : 'strong'

    for (const [k, v] of entries) {
      if (v === null || v === undefined) continue
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        parts.push(`<p><strong>${esc(k)}</strong>: ${esc(String(v))}</p>`)
      } else if (Array.isArray(v)) {
        parts.push(`<${hTag}>${esc(k)}</${hTag}>`)
        parts.push(renderValue(v, headingLevel + 1))
      } else if (typeof v === 'object') {
        parts.push(`<${hTag}>${esc(k)}</${hTag}>`)
        parts.push(renderValue(v, headingLevel + 1))
      }
    }
    return parts.join('\n')
  }

  return `<p>${esc(String(val))}</p>`
}

/** 객체 배열을 HTML 테이블로 렌더링 */
const renderObjectArrayAsTable = (arr: Record<string, unknown>[]): string => {
  const allKeys = [...new Set(arr.flatMap((row) => Object.keys(row)))]
  const headerRow = allKeys.map((k) => `<th>${esc(k)}</th>`).join('')
  const bodyRows = arr.map((row) => {
    const cells = allKeys.map((k) => {
      const v = row[k]
      const cellVal = Array.isArray(v) ? v.join(', ') : String(v ?? '')
      return `<td>${esc(cellVal)}</td>`
    })
    return `<tr>${cells.join('')}</tr>`
  })
  return `<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows.join('')}</tbody></table>`
}

// ============================================
// 패널 액션
// ============================================

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('update:fullscreen', isFullscreen.value)
}

const onClose = () => {
  isFullscreen.value = false
  emit('update:open', false)
  emit('update:fullscreen', false)
}

const onDownloadDocx = async () => {
  const html = editorHtml.value || normalizedHtml.value
  if (!html) return
  await downloadReportAsDocx(html, '리포트')
}

const onDownloadPdf = async () => {
  const html = editorHtml.value || normalizedHtml.value
  if (!html) return
  await downloadReportAsPdf(html, '리포트')
}

const onSaveToMyDocs = async () => {
  const docHtml = editorHtml.value || normalizedHtml.value
  const originHtml = originReportHtml.value || normalizedHtml.value
  const msg = reportMessage.value

  await handleSaveReport({
    docNm: '',
    docHtml,
    originHtml,
    svcTy: msg?.svcTy,
    rContent: msg?.rContent,
    agentId: msg?.agentId?.trim() || null,
  })
}
</script>
