// 테이블 컬럼 정의
export interface TableColumn {
  key: string // 데이터 객체의 키
  label: string // 헤더 텍스트
  width?: string // '320px', '150px' 등 (미지정 시 auto fill)
  align?: 'left' | 'center' | 'right' // 바디 셀 정렬 (기본 'center')
  headerAlign?: 'left' | 'center' | 'right' // 헤더 정렬 (기본 'center')
}
