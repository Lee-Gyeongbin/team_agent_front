export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { datasetId, page = 1, pageSize = 5 } = body
  const result = mockDocDatasetHistoryDb.getList(datasetId, page, pageSize)
  return {
    result: 'SUCCESS',
    list: result.list,
    totalCount: result.totalCount,
    message: '',
  }
})
