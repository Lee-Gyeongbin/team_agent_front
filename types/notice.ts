import type { TableColumn } from '~/types/table'

/** 공지사항 테이블 컬럼 정의 */
export const noticeColumns: TableColumn[] = [
  { key: 'checkbox', label: '선택', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'noticeId', label: '순서', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'title', label: '제목', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'writer', label: '작성자', width: '140px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '160px', align: 'center', headerAlign: 'center' },
]
