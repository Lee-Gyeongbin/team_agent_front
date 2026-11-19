/** 파일 크기 표시 (목업과 동일: 1MB 이상은 MB, 미만은 KB) */
export const formatIdeaFileSize = (bytes: number): string =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`
