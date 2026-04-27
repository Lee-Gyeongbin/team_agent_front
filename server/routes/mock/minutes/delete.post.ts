export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return {
    result: 'SUCCESS',
    data: mockMeetingDb.delete(body.id),
    message: '',
  }
})
