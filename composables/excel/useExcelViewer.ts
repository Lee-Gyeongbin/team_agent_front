import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import type { ExcelCell, ExcelCellStyle, ExcelImage, ExcelSheet } from '~/types/excel'

const DEFAULT_COL_WIDTH = 64
const DEFAULT_ROW_HEIGHT = 24
const CHAR_TO_PX = 7.5

/**
 * ARGB 문자열('FF44AACC')을 CSS hex('#44AACC')로 변환
 * theme 색상인 경우 null 반환
 */
function argbToHex(argb?: string): string | null {
  if (!argb || argb.length < 6) return null
  const hex = argb.length === 8 ? argb.slice(2) : argb
  return `#${hex}`
}

function extractColorValue(color?: Partial<ExcelJS.Color>): string | null {
  if (!color) return null
  if (color.argb) return argbToHex(color.argb)
  if ((color as Record<string, unknown>).theme !== undefined) {
    // theme 색상 — ExcelJS가 argb로 resolve 해주는 경우도 있음
    if (color.argb) return argbToHex(color.argb)
    return null
  }
  return null
}

function mapBorderStyle(style?: ExcelJS.BorderStyle): string {
  const map: Record<string, string> = {
    thin: '1px solid',
    medium: '2px solid',
    thick: '3px solid',
    dotted: '1px dotted',
    dashed: '1px dashed',
    double: '3px double',
    hair: '1px solid',
    dashDot: '1px dashed',
    dashDotDot: '1px dashed',
    slantDashDot: '1px dashed',
    mediumDashed: '2px dashed',
    mediumDashDot: '2px dashed',
    mediumDashDotDot: '2px dashed',
  }
  return map[style ?? ''] ?? ''
}

function convertBorder(border?: Partial<ExcelJS.Border>): string | undefined {
  if (!border?.style) return undefined
  const cssStyle = mapBorderStyle(border.style)
  if (!cssStyle) return undefined
  const color = extractColorValue(border.color) ?? '#000000'
  return `${cssStyle} ${color}`
}

function mapFill(fill?: ExcelJS.Fill): string | undefined {
  if (!fill) return undefined
  if (fill.type === 'pattern') {
    const patternFill = fill as ExcelJS.FillPattern
    if (patternFill.pattern === 'none') return undefined
    // solid 패턴일 때 fgColor 우선, 없으면 bgColor
    const color = extractColorValue(patternFill.fgColor) ?? extractColorValue(patternFill.bgColor)
    return color ?? undefined
  }
  return undefined
}

function mapFont(font?: Partial<ExcelJS.Font>): Partial<ExcelCellStyle> {
  if (!font) return {}
  const style: Partial<ExcelCellStyle> = {}

  const color = extractColorValue(font.color)
  if (color) style.color = color

  if (font.bold) style.fontWeight = 'bold'
  if (font.italic) style.fontStyle = 'italic'

  const decorations: string[] = []
  if (font.underline && font.underline !== 'none') decorations.push('underline')
  if (font.strike) decorations.push('line-through')
  if (decorations.length) style.textDecoration = decorations.join(' ')

  if (font.size) style.fontSize = `${font.size}pt`
  if (font.name) style.fontFamily = font.name

  return style
}

function mapAlignment(alignment?: Partial<ExcelJS.Alignment>): Partial<ExcelCellStyle> {
  if (!alignment) return {}
  const style: Partial<ExcelCellStyle> = {}

  if (alignment.horizontal) {
    const hMap: Record<string, string> = {
      left: 'left',
      center: 'center',
      right: 'right',
      justify: 'justify',
      centerContinuous: 'center',
      distributed: 'justify',
      fill: 'left',
    }
    style.textAlign = hMap[alignment.horizontal] ?? 'left'
  }

  if (alignment.vertical) {
    const vMap: Record<string, string> = {
      top: 'top',
      middle: 'middle',
      bottom: 'bottom',
      distributed: 'middle',
      justify: 'middle',
    }
    style.verticalAlign = vMap[alignment.vertical] ?? 'bottom'
  }

  if (alignment.wrapText) {
    style.whiteSpace = 'pre-wrap'
  }

  return style
}

function buildCellStyle(cell: ExcelJS.Cell): ExcelCellStyle {
  const style: ExcelCellStyle = {}

  const bg = mapFill(cell.fill)
  if (bg) style.backgroundColor = bg

  Object.assign(style, mapFont(cell.font))
  Object.assign(style, mapAlignment(cell.alignment))

  const borders = cell.border
  if (borders) {
    const top = convertBorder(borders.top)
    const right = convertBorder(borders.right)
    const bottom = convertBorder(borders.bottom)
    const left = convertBorder(borders.left)
    if (top) style.borderTop = top
    if (right) style.borderRight = right
    if (bottom) style.borderBottom = bottom
    if (left) style.borderLeft = left
  }

  return style
}

function getCellDisplayValue(sheetJsSheet: XLSX.WorkSheet, row: number, col: number): string | number | boolean | null {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
  const sjCell = sheetJsSheet[cellAddress]
  if (!sjCell) return null

  // 포맷된 텍스트(w)가 있으면 우선 사용, 없으면 raw value(v)
  if (sjCell.w !== undefined) return sjCell.w
  if (sjCell.v !== undefined) return sjCell.v
  return null
}

/**
 * ExcelJS 워크시트에서 병합 셀 맵을 구축
 * key: "row,col" → { colspan, rowspan } 또는 'slave' 표시
 */
function buildMergeMap(worksheet: ExcelJS.Worksheet) {
  const mergeMap = new Map<string, { colspan: number; rowspan: number } | 'slave'>()

  // ExcelJS model의 merges 배열 사용
  const merges = (worksheet.model as unknown as { merges?: string[] }).merges ?? []
  for (const mergeRange of merges) {
    const decoded = XLSX.utils.decode_range(mergeRange)
    const startRow = decoded.s.r
    const startCol = decoded.s.c
    const endRow = decoded.e.r
    const endCol = decoded.e.c
    const rowspan = endRow - startRow + 1
    const colspan = endCol - startCol + 1

    mergeMap.set(`${startRow},${startCol}`, { colspan, rowspan })

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r === startRow && c === startCol) continue
        mergeMap.set(`${r},${c}`, 'slave')
      }
    }
  }

  return mergeMap
}

function extractImages(worksheet: ExcelJS.Worksheet, workbook: ExcelJS.Workbook): ExcelImage[] {
  const images: ExcelImage[] = []

  try {
    const wsImages = worksheet.getImages()
    for (const img of wsImages) {
      const imageId = Number(img.imageId)
      const imageData = workbook.getImage(imageId)
      if (!imageData) continue

      let src = ''
      if (imageData.buffer) {
        const base64 = bufferToBase64(imageData.buffer as ArrayBuffer)
        src = `data:image/${imageData.extension};base64,${base64}`
      } else if (imageData.base64) {
        src = `data:image/${imageData.extension};base64,${imageData.base64}`
      }

      if (!src) continue

      const range = img.range
      images.push({
        src,
        row: range.tl.nativeRow,
        col: range.tl.nativeCol,
        width: range.br ? Math.max((range.br.nativeCol - range.tl.nativeCol) * DEFAULT_COL_WIDTH, 50) : 100,
        height: range.br ? Math.max((range.br.nativeRow - range.tl.nativeRow) * DEFAULT_ROW_HEIGHT, 30) : 60,
      })
    }
  } catch {
    // 이미지 추출 실패 시 무시 (일부 Excel 파일 호환성 이슈)
  }

  return images
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function parseExcelFile(buffer: ArrayBuffer): Promise<ExcelSheet[]> {
  // SheetJS: 셀 값/포맷 파싱
  const sjWorkbook = XLSX.read(buffer, { type: 'array', cellStyles: true })

  // ExcelJS: 스타일/이미지/레이아웃 파싱
  const ejWorkbook = new ExcelJS.Workbook()
  await ejWorkbook.xlsx.load(buffer)

  const sheets: ExcelSheet[] = []

  ejWorkbook.eachSheet((ejSheet) => {
    const sjSheet = sjWorkbook.Sheets[ejSheet.name]
    if (!sjSheet) return

    // 시트 범위 계산 (SheetJS의 ref가 더 정확)
    const range = sjSheet['!ref'] ? XLSX.utils.decode_range(sjSheet['!ref']) : null
    if (!range) {
      sheets.push({
        name: ejSheet.name,
        data: [],
        images: [],
        colWidths: [],
        rowHeights: [],
      })
      return
    }

    const totalRows = range.e.r + 1
    const totalCols = range.e.c + 1

    // 병합 셀 맵 구축
    const mergeMap = buildMergeMap(ejSheet)

    // 열 너비 추출
    const colWidths: number[] = []
    for (let c = 0; c < totalCols; c++) {
      const col = ejSheet.getColumn(c + 1) // ExcelJS는 1-based
      const width = col.width ? Math.round(col.width * CHAR_TO_PX) : DEFAULT_COL_WIDTH
      colWidths.push(width)
    }

    // 행 높이 + 셀 데이터 추출
    const rowHeights: number[] = []
    const data: ExcelCell[][] = []

    for (let r = 0; r < totalRows; r++) {
      const ejRow = ejSheet.getRow(r + 1) // ExcelJS는 1-based
      rowHeights.push(ejRow.height ? Math.round(ejRow.height * 1.33) : DEFAULT_ROW_HEIGHT)

      const rowData: ExcelCell[] = []
      for (let c = 0; c < totalCols; c++) {
        const mergeInfo = mergeMap.get(`${r},${c}`)

        if (mergeInfo === 'slave') {
          rowData.push({
            value: null,
            style: {},
            isMergedSlave: true,
          })
          continue
        }

        const ejCell = ejSheet.getCell(r + 1, c + 1)
        const value = getCellDisplayValue(sjSheet, r, c)
        const style = buildCellStyle(ejCell)

        const cell: ExcelCell = { value, style }
        if (mergeInfo && mergeInfo !== 'slave') {
          cell.colspan = mergeInfo.colspan
          cell.rowspan = mergeInfo.rowspan
        }

        rowData.push(cell)
      }

      data.push(rowData)
    }

    // 이미지 추출
    const images = extractImages(ejSheet, ejWorkbook)

    sheets.push({
      name: ejSheet.name,
      data,
      images,
      colWidths,
      rowHeights,
    })
  })

  return sheets
}

export const useExcelViewer = () => {
  const sheets = ref<ExcelSheet[]>([])
  const activeSheetIndex = ref(0)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const fileName = ref('')

  const activeSheet = computed(() => sheets.value[activeSheetIndex.value] ?? null)

  const onFileUpload = async (file: File) => {
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    const validExtensions = ['.xlsx', '.xls']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      errorMessage.value = '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'
      return
    }

    isLoading.value = true
    errorMessage.value = ''
    sheets.value = []
    activeSheetIndex.value = 0

    try {
      const buffer = await file.arrayBuffer()
      sheets.value = await parseExcelFile(buffer)
      fileName.value = file.name

      if (sheets.value.length === 0) {
        errorMessage.value = '시트 데이터가 없습니다.'
      }
    } catch (e) {
      errorMessage.value = `파일을 읽는 중 오류가 발생했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`
    } finally {
      isLoading.value = false
    }
  }

  const onSelectSheet = (index: number) => {
    if (index >= 0 && index < sheets.value.length) {
      activeSheetIndex.value = index
    }
  }

  const onReset = () => {
    sheets.value = []
    activeSheetIndex.value = 0
    fileName.value = ''
    errorMessage.value = ''
  }

  return {
    sheets,
    activeSheetIndex,
    activeSheet,
    isLoading,
    errorMessage,
    fileName,
    onFileUpload,
    onSelectSheet,
    onReset,
  }
}
