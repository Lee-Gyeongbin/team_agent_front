import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'
import type { IdeaExcelItem } from '~/types/idea'

const IDEA_EXCEL_GUIDE = '※ 목록 조회 결과를 내려받은 파일입니다. 수정 후 업로드하는 용도가 아닌 참고용입니다.'
const IDEA_EXCEL_HEADERS = [
  '번호',
  '구분',
  '에이전트',
  '제목',
  '아이디어 내용',
  '작성자',
  '등록일',
  '추천수',
  '관리자 코멘트',
  '코멘트 일시',
  '진행상태',
]

const toExcelText = (value: string | null) => {
  const template = document.createElement('template')
  template.innerHTML = value ?? ''
  template.content.querySelectorAll('br').forEach((node) => node.replaceWith('\n'))
  template.content.querySelectorAll('p, li, h3, blockquote').forEach((node) => node.after('\n'))
  return (template.content.textContent ?? '').trim()
}

const ymd = () => {
  const now = new Date()
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
}

/**
 * 아이디어 목록 엑셀 다운로드 (백엔드 ExcelUtil과 같은 양식)
 * - 1행 안내문(병합·회색 이탤릭) / 2행 헤더(진한 파랑 배경·흰 굵은 글씨) / 테두리 / 헤더 고정
 * - 파일명: yyyyMMdd_아이디어목록.xlsx
 * 데이터는 /idea/manage/excelList.do(현재 조회 조건 전체)로 받아 브라우저에서 파일 생성
 */
export const downloadIdeaListExcel = async (ideaList: IdeaExcelItem[]): Promise<boolean> => {
  try {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('아이디어목록')
    const thin = { style: 'thin' as const, color: { argb: 'FF000000' } }
    const border = { top: thin, bottom: thin, left: thin, right: thin }

    sheet.addRow([IDEA_EXCEL_GUIDE])
    sheet.mergeCells(1, 1, 1, IDEA_EXCEL_HEADERS.length)
    const guideCell = sheet.getCell(1, 1)
    guideCell.font = { italic: true, color: { argb: 'FF7F7F7F' } }
    guideCell.alignment = { wrapText: true, vertical: 'middle' }
    sheet.getRow(1).height = 54

    const headerRow = sheet.addRow(IDEA_EXCEL_HEADERS)
    headerRow.height = 22
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = border
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
    })

    const columnWidths = IDEA_EXCEL_HEADERS.map((header) => Math.max(header.length * 2 + 8, 15.6))
    columnWidths[4] = 60
    columnWidths[8] = 45
    ideaList.forEach((idea) => {
      const comment = toExcelText(idea.cmtContent)
      sheet
        .addRow([
          idea.ideaId,
          idea.ideaTypeNm ?? '',
          idea.agentNm ?? '',
          idea.title,
          toExcelText(idea.content),
          idea.createNm ?? '',
          idea.createDt,
          idea.likeCnt,
          comment,
          comment ? (idea.cmtDt ?? '') : '',
          idea.statusNm ?? '',
        ])
        .eachCell({ includeEmpty: true }, (cell, column) => {
          cell.border = border
          if (column === 5 || column === 9) {
            cell.alignment = { wrapText: true, vertical: 'top' }
          } else {
            columnWidths[column - 1] = Math.max(
              columnWidths[column - 1],
              Math.min(String(cell.value ?? '').length * 1.6 + 8, 80),
            )
          }
        })
    })

    // 글자 수 기준 열 너비 (최소 15.6)
    columnWidths.forEach((width, idx) => {
      sheet.getColumn(idx + 1).width = width
    })
    sheet.views = [{ state: 'frozen', ySplit: 2 }]

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlobAsFile(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${ymd()}_아이디어목록.xlsx`,
    )
    return true
  } catch {
    return false
  }
}
