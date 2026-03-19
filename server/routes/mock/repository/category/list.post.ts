export default defineEventHandler(async () => {
  return { result: 'SUCCESS', list: mockCategoryDb.getTree(), message: '' }
})
