export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 🔽 더미 — 삭제 성공 응답
  return {
    result: 'SUCCESS',
    data: { id: body.id },
    message: '',
  }
})
