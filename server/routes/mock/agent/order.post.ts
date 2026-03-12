export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 🔽 더미 — 순서 저장 성공 응답
  return {
    result: 'SUCCESS',
    data: null,
    message: '',
  }
})
