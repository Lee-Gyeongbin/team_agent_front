export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockSystemPromptDb.getList(),
    message: '',
  }
})
