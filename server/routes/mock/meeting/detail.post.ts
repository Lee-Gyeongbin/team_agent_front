export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return {
    result: 'SUCCESS',
    data: mockMeetingDb.getDetail(body.id),
    message: '',
  }
})
