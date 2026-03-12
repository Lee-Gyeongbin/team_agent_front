export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return {
    result: 'SUCCESS',
    list: [
      {
        id: 'ds-1',
        name: '제품 매뉴얼 DB22',
        description: '전체 제품 매뉴얼과 사용자 가이드 문서',
        documentCount: 248,
        chunkCount: 12543,
        isConnected: true,
        updatedAt: '2026-02-29',
      },
      {
        id: 'ds-2',
        name: 'FAQ 데이터셋',
        description: '자주 묻는 질문과 답변 모음',
        documentCount: 89,
        chunkCount: 4521,
        isConnected: false,
        updatedAt: '2026-02-29',
      },
      {
        id: 'ds-3',
        name: '기술 문서 DB',
        description: '기술 사양서 및 개발 가이드 문서',
        documentCount: 156,
        chunkCount: 8743,
        isConnected: false,
        updatedAt: '2026-02-29',
      },
    ],
    message: '',
  }
})
