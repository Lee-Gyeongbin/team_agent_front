export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 🔽 더미 — 받은 값을 그대로 돌려줌
  return {
    result: 'SUCCESS',
    data: {
      id: body.id || `ds-${Date.now()}`,
      ...body,
      updatedAt: new Date().toISOString().slice(0, 10),
    },
    message: '',
  }
})
