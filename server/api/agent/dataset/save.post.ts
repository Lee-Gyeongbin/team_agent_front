export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 🔽 더미 데이터 — 백엔드 연결 시 제거
  return {
    result: 'SUCCESS',
    data: null,
    message: '',
  }
})
