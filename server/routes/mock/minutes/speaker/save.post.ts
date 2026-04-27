export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return {
    result: 'SUCCESS',
    data: mockMeetingDb.saveSpeaker(body.meetingId, body.speaker),
    message: '',
  }
})
