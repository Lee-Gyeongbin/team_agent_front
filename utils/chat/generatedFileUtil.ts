import type { ChatGeneratedFile } from '~/types/chat'
import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'

const GENERATED_FILE_DOWNLOAD_FAIL_MSG = '파일을 다운로드할 수 없습니다.'

/**
 * 생성 파일 JSON({"files":[{filename, mime_type, download_url, expires_at}]})을 화면용 목록으로 변환한다.
 * 스트리밍(answer_file 누적)과 이력(DB 저장분)에서 같이 쓴다.
 * malformed JSON은 조용히 무시(undefined 반환)해서 답변 렌더를 방해하지 않는다.
 */
export const parseGeneratedFiles = (raw: string | undefined): ChatGeneratedFile[] | undefined => {
  if (typeof raw !== 'string' || raw.trim().length === 0) return undefined
  try {
    const parsed = JSON.parse(raw) as {
      files?: { filename?: string; download_url?: string; expires_at?: string }[]
    }
    if (!Array.isArray(parsed.files)) return undefined
    return parsed.files
      .map((it) => {
        const fileName = String(it?.filename ?? '').trim()
        if (fileName.length === 0) return undefined
        const downloadUrl = String(it?.download_url ?? '').trim()
        const expiresAt = String(it?.expires_at ?? '').trim()
        return {
          fileName,
          ...(downloadUrl.length > 0 ? { downloadUrl } : {}),
          ...(expiresAt.length > 0 ? { expiresAt } : {}),
        }
      })
      .filter((it): it is NonNullable<typeof it> => it !== undefined)
  } catch {
    return undefined
  }
}

/**
 * 다운로드 만료 여부.
 * 다운로드 경로가 없는 항목(이 기능 적용 전에 저장된 이력 등)은 항상 만료로 본다.
 * expires_at을 해석하지 못하면 만료로 단정하지 않고 서버(410) 판단에 맡긴다.
 * 호출 시점의 현재 시각으로 판정하며 별도 타이머는 두지 않는다 (화면이 다시 그려질 때 반영).
 */
export const isGeneratedFileExpired = (file: ChatGeneratedFile): boolean => {
  if (!file.downloadUrl) return true
  const expiresMs = Date.parse(file.expiresAt ?? '')
  return Number.isNaN(expiresMs) ? false : Date.now() >= expiresMs
}

/** 확장자 표시용 — 확장자가 없으면 FILE */
export const getGeneratedFileExt = (fileName: string): string => {
  const dotIdx = fileName.lastIndexOf('.')
  return dotIdx > -1 && dotIdx < fileName.length - 1 ? fileName.slice(dotIdx + 1).toUpperCase() : 'FILE'
}

/** 확장자를 뗀 파일명 — 확장자가 없거나 점으로 시작하는 이름은 그대로 */
export const getGeneratedFileBaseName = (fileName: string): string => {
  const dotIdx = fileName.lastIndexOf('.')
  return dotIdx > 0 && dotIdx < fileName.length - 1 ? fileName.slice(0, dotIdx) : fileName
}

/** 파일 종류별 아이콘 색상 변형 클래스 — 엑셀 green, pdf/ppt red, docx/txt blue, 그 외 기본색 */
export const getGeneratedFileColorClass = (fileName: string): string => {
  const ext = getGeneratedFileExt(fileName).toLowerCase()
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'type-green'
  if (ext === 'pdf' || ext === 'ppt' || ext === 'pptx') return 'type-red'
  if (ext === 'doc' || ext === 'docx' || ext === 'txt') return 'type-blue'
  return ''
}

/** 파일 종류별 UiIcon 이름 (lucide) */
export const getGeneratedFileIconName = (fileName: string): string => {
  const ext = getGeneratedFileExt(fileName).toLowerCase()
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'file-spreadsheet'
  if (ext === 'ppt' || ext === 'pptx') return 'presentation'
  if (ext === 'doc' || ext === 'docx') return 'file-type'
  if (ext === 'pdf' || ext === 'txt' || ext === 'md') return 'file-text'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'file-image'
  if (ext === 'zip') return 'file-archive'
  return 'file'
}

/** 행 보조 문구 — 만료 전 "HH:mm까지 다운로드 가능", 만료 후 "다운로드 시간이 지났습니다" */
export const getGeneratedFileMeta = (file: ChatGeneratedFile): string => {
  if (isGeneratedFileExpired(file)) return '다운로드 시간이 지났습니다'
  const expiresMs = Date.parse(file.expiresAt ?? '')
  if (Number.isNaN(expiresMs)) return ''
  const expiresDate = new Date(expiresMs)
  const hh = String(expiresDate.getHours()).padStart(2, '0')
  const mm = String(expiresDate.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}까지 다운로드 가능`
}

/**
 * 생성 파일을 백엔드 경유로 내려받는다.
 * 만료 등 실패 시 파일 대신 JSON({successYn:false, returnMsg})이 내려오므로 returnMsg로 Error를 던진다.
 */
export const downloadGeneratedFile = async (file: ChatGeneratedFile): Promise<void> => {
  if (!file.downloadUrl) throw new Error(GENERATED_FILE_DOWNLOAD_FAIL_MSG)
  const { postBlob } = useApi()
  const blob = await postBlob('/ai/chatbot/downloadGeneratedFile.do', { downloadUrl: file.downloadUrl })
  if (blob.type.includes('application/json')) {
    const result = JSON.parse(await blob.text()) as { returnMsg?: string }
    throw new Error(result.returnMsg || GENERATED_FILE_DOWNLOAD_FAIL_MSG)
  }
  downloadBlobAsFile(blob, file.fileName)
}
