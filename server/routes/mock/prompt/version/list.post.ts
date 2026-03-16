export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockVersionDb.getList(),
    stats: mockVersionDb.getStats(),
    message: '',
  }
})
