export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    data: mockFilterDb.getData(),
    message: '',
  }
})
