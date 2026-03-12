export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockDatasetDb.getList(),
    message: '',
  }
})
