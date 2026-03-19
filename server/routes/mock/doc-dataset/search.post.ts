export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { datasetId, query, topK = 5 } = body
  const result = mockDocDatasetDb.search(datasetId, query, topK)
  return {
    result: 'SUCCESS',
    data: result,
    message: '',
  }
})
