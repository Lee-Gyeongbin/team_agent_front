export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  mockLlmDb.updateOrder(body)

  return {
    result: 'SUCCESS',
    data: null,
    message: '',
  }
})
