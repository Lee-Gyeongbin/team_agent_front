export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return {
    result: 'SUCCESS',
    list: mockMeetingDb.saveSpeakers(body.meetingId, body.speakers),
    message: '',
  }
})
