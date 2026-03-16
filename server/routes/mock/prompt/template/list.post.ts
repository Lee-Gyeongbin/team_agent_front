export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockTemplateDb.getList(),
    message: '',
  }
})
