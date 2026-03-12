export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockAgentDb.getList(),
    message: '',
  }
})
