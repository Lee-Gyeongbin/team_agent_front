export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return {
    result: 'SUCCESS',
    data: mockDatasetDb.sync(body.id),
    message: '동기화가 완료되었습니다.',
  }
})
