export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { result: 'SUCCESS', data: mockUrlDb.toggleStatus(body.id, body.active), message: '' }
})
