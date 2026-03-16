export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  mockDatasetDb.updateOrder(body)
  return {
    result: 'SUCCESS',
    data: null,
    message: '',
  }
})
