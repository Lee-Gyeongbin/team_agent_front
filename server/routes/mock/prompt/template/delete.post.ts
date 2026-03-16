export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return {
    result: 'SUCCESS',
    data: mockTemplateDb.delete(body.id),
    message: '',
  }
})
