export interface ExcelCellStyle {
  backgroundColor?: string
  color?: string
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  fontStyle?: string
  textDecoration?: string
  textAlign?: string
  verticalAlign?: string
  whiteSpace?: string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string
}

export interface ExcelCell {
  value: string | number | boolean | null
  style: ExcelCellStyle
  colspan?: number
  rowspan?: number
  isMergedSlave?: boolean
}

export interface ExcelImage {
  src: string
  row: number
  col: number
  width: number
  height: number
}

export interface ExcelSheet {
  name: string
  data: ExcelCell[][]
  images: ExcelImage[]
  colWidths: number[]
  rowHeights: number[]
}
