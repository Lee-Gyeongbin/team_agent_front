export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockDocDatasetDb.toggleActive(body.id),
    message: '',
  }
})
