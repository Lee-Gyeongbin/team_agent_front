import type { TableColumn } from '~/types/table'

export interface NoticeRow {
  noticeId: string
  title: string
  featuredYn: 'Y' | 'N'
  pinYn: 'Y' | 'N'
  useYn: 'Y' | 'N'
  crtrId: string
  createDt: string
  modifyDt: string
  viewCnt: number
}

export interface NoticeItem extends NoticeRow {
  content: string
}

export interface NoticeFormData {
  noticeId: string
  title: string
  content: string
  featuredYn: 'Y' | 'N' | null
  pinYn: 'Y' | 'N' | null
  useYn: 'Y' | 'N' | null
  crtrId: string
  createDt: string
  modifyDt: string
}

export interface NoticeDetailResponse {
  noticeId?: string
  title?: string
  content?: string
  featuredYn?: 'Y' | 'N' | null
  pinYn?: 'Y' | 'N' | null
  useYn?: 'Y' | 'N' | null
  crtrId?: string
  createDt?: string
  modifyDt?: string
  viewCnt?: number
}

/** 공지사항 테이블 컬럼 정의 */
export const noticeColumns: TableColumn[] = [
  { key: 'noticeId', label: '번호', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'title', label: '제목', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'crtrId', label: '작성자', width: '160px', align: 'center', headerAlign: 'center' },
  { key: 'viewCnt', label: '조회수', width: '88px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '168px', align: 'center', headerAlign: 'center' },
  { key: 'modifyDt', label: '수정일', width: '168px', align: 'center', headerAlign: 'center' },
]
