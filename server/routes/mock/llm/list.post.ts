export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockLlmDb.getList(),
    message: '',
  }
})
