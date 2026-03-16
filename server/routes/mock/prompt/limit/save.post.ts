export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockLimitDb.save(body),
    message: '',
  }
})
