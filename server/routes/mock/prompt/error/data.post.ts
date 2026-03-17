export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    data: mockErrorMessageDb.getData(),
    message: '',
  }
})
