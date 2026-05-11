export interface ActionResponse {
  successYn: boolean
  returnMsg?: string
}

/** 알림 테이블 구조 */
export interface Notify {
  notifyId: number
  userId: string
  sendUserId: string
  sendUserNm?: string
  notifyTyCd: string
  title: string
  content: string
  refId?: string
  readYn: 'Y' | 'N'
  readDt?: string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt?: string
}
