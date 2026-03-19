export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { list, total } = mockUrlDb.getList(body)
  return { result: 'SUCCESS', list, total, message: '' }
})
