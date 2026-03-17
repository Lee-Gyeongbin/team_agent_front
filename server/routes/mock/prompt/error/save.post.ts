export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockErrorMessageDb.save(body),
    message: '',
  }
})
