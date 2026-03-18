export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    data: mockDatamartDb.getSummary(),
    message: '',
  }
})
