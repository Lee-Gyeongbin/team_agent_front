export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    data: mockDocDatasetDb.getSummary(),
    message: '',
  }
})
