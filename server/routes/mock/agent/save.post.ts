// 서버 API 핸들러 (요청이 오면 실행되는 함수)
export default defineEventHandler(async (event) => {
  // 프론트에서 보낸 데이터 꺼내기
  const body = await readBody(event)
  // body = { name: '지식검색', type: 'RAG', ... }

  return {
    result: 'SUCCESS',
    data: {
      id: body.id || `agent-${Date.now()}`, // id 있으면 그대로(수정), 없으면 새로 생성(추가)
      ...body, // 보낸 데이터 전부 펼치기
      updatedAt: '2026-03-12', // 날짜 덮어쓰기
    },
    message: '',
  }
})
