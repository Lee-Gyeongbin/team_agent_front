export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { result: 'SUCCESS', data: mockCategoryDb.save(body), message: '' }
})
