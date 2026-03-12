export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 🔽 더미 — 동기화 성공 응답
  return {
    result: 'SUCCESS',
    data: { id: body.id },
    message: '동기화가 완료되었습니다.',
  }
})
