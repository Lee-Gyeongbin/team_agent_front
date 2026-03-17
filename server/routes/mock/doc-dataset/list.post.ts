export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockDocDatasetDb.getList(),
    message: '',
  }
})
