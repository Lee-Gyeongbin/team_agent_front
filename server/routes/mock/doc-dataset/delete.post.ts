export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockDocDatasetDb.delete(body.id),
    message: '',
  }
})
