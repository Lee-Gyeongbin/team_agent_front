export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockTemplateDb.save(body),
    message: '',
  }
})
