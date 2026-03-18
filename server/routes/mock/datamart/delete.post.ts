export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockDatamartDb.delete(body.datamartId),
    message: '',
  }
})
