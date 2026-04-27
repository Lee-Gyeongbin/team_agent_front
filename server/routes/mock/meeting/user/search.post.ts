export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return {
    result: 'SUCCESS',
    list: mockMeetingUserDb.search(body.keyword ?? ''),
    message: '',
  }
})
