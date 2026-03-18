export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockDatamartDb.getList(),
    message: '',
  }
})
