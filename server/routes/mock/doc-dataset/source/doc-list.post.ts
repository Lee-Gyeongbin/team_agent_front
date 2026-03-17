export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockDocDatasetDb.getDocFiles(),
    totalCount: mockDocDatasetDb.getDocFiles().length,
    message: '',
  }
})
