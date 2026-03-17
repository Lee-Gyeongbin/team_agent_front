export default defineEventHandler(async () => {
  return {
    result: 'SUCCESS',
    list: mockDocDatasetDb.getUrls(),
    totalCount: mockDocDatasetDb.getUrls().length,
    message: '',
  }
})
