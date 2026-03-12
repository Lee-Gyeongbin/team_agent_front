export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  mockAgentDb.updateOrder(body)

  return {
    result: 'SUCCESS',
    data: null,
    message: '',
  }
})
