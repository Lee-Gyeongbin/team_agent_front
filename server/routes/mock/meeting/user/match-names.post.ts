export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return {
    result: 'SUCCESS',
    list: mockMeetingUserDb.matchByNames(body.names ?? []),
    message: '',
  }
})
