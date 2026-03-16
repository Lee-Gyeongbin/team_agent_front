export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    data: mockLimitDb.getData(),
    message: '',
  }
})
