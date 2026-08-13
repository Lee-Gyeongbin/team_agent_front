import { copyToClipboard } from '~/utils/global/clipboardUtil'

/** AI 초안 텍스트에서 '제목:' 행을 제외한 본문만 추출 */
export const extractDraftBody = (draft: string): string => {
  const lines = draft.split('\n')
  let startIdx = 0
  if (lines[0]?.startsWith('제목:')) {
    startIdx = 1
    while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++
  }
  return lines.slice(startIdx).join('\n').trim()
}

/** 초안 본문을 클립보드에 복사 (실패 시 무시) */
export const copyDraftBodyToClipboard = async (draft: string) => {
  try {
    await copyToClipboard(extractDraftBody(draft))
  } catch {
    // 클립보드 실패 시 무시 (안내 문구가 이미 표시되어 있음)
  }
}
