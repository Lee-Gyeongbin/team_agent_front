export type NoticeItem = {
  noticeId: number
  title: string
  writer: string
  createDt: string
  status: string
}

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const rawNoticeDummyData: Omit<NoticeItem, 'noticeId'>[] = [
  { title: '서비스 점검 안내 1', writer: '관리자', createDt: '2026-03-01 09:00', status: '게시' },
  { title: '신규 기능 배포 공지 2', writer: '운영팀', createDt: '2026-03-01 14:30', status: '게시' },
  { title: '이용약관 개정 안내 3', writer: '관리자', createDt: '2026-03-02 10:00', status: '임시저장' },
  { title: '보안 정책 업데이트 4', writer: '보안팀', createDt: '2026-03-02 16:20', status: '게시' },
  { title: '정기 점검 일정 공유 5', writer: '운영팀', createDt: '2026-03-03 09:40', status: '게시' },
  { title: '서비스 점검 안내 6', writer: '관리자', createDt: '2026-03-03 15:10', status: '게시' },
  { title: '신규 기능 배포 공지 7', writer: '개발팀', createDt: '2026-03-04 10:30', status: '임시저장' },
  { title: '이용약관 개정 안내 8', writer: '관리자', createDt: '2026-03-04 17:00', status: '게시' },
  { title: '보안 정책 업데이트 9', writer: '보안팀', createDt: '2026-03-05 09:10', status: '게시' },
  { title: '정기 점검 일정 공유 10', writer: '운영팀', createDt: '2026-03-05 13:50', status: '게시' },
  { title: '서비스 점검 안내 11', writer: '관리자', createDt: '2026-03-06 10:15', status: '임시저장' },
  { title: '신규 기능 배포 공지 12', writer: '개발팀', createDt: '2026-03-06 15:25', status: '게시' },
  { title: '이용약관 개정 안내 13', writer: '관리자', createDt: '2026-03-07 09:45', status: '게시' },
  { title: '보안 정책 업데이트 14', writer: '보안팀', createDt: '2026-03-07 14:05', status: '게시' },
  { title: '정기 점검 일정 공유 15', writer: '운영팀', createDt: '2026-03-08 10:40', status: '임시저장' },
  { title: '서비스 점검 안내 16', writer: '관리자', createDt: '2026-03-08 16:55', status: '게시' },
  { title: '신규 기능 배포 공지 17', writer: '개발팀', createDt: '2026-03-09 09:20', status: '게시' },
  { title: '이용약관 개정 안내 18', writer: '관리자', createDt: '2026-03-09 13:35', status: '게시' },
  { title: '보안 정책 업데이트 19', writer: '보안팀', createDt: '2026-03-10 10:05', status: '임시저장' },
  { title: '정기 점검 일정 공유 20', writer: '운영팀', createDt: '2026-03-10 15:45', status: '게시' },
  { title: '서비스 점검 안내 21', writer: '관리자', createDt: '2026-03-11 09:30', status: '게시' },
  { title: '신규 기능 배포 공지 22', writer: '개발팀', createDt: '2026-03-11 14:10', status: '게시' },
  { title: '이용약관 개정 안내 23', writer: '관리자', createDt: '2026-03-12 10:35', status: '임시저장' },
  { title: '보안 정책 업데이트 24', writer: '보안팀', createDt: '2026-03-12 16:15', status: '게시' },
  { title: '정기 점검 일정 공유 25', writer: '운영팀', createDt: '2026-03-13 09:55', status: '게시' },
  { title: '서비스 점검 안내 26', writer: '관리자', createDt: '2026-03-13 13:25', status: '게시' },
  { title: '신규 기능 배포 공지 27', writer: '개발팀', createDt: '2026-03-14 10:50', status: '임시저장' },
  { title: '이용약관 개정 안내 28', writer: '관리자', createDt: '2026-03-14 17:20', status: '게시' },
  { title: '보안 정책 업데이트 29', writer: '보안팀', createDt: '2026-03-15 09:15', status: '게시' },
  { title: '정기 점검 일정 공유 30', writer: '운영팀', createDt: '2026-03-15 14:45', status: '게시' },
  { title: '서비스 점검 안내 31', writer: '관리자', createDt: '2026-03-16 10:25', status: '임시저장' },
  { title: '신규 기능 배포 공지 32', writer: '개발팀', createDt: '2026-03-16 15:05', status: '게시' },
  { title: '이용약관 개정 안내 33', writer: '관리자', createDt: '2026-03-17 09:35', status: '게시' },
  { title: '보안 정책 업데이트 34', writer: '보안팀', createDt: '2026-03-17 13:55', status: '게시' },
  { title: '정기 점검 일정 공유 35', writer: '운영팀', createDt: '2026-03-18 10:20', status: '임시저장' },
  { title: '서비스 점검 안내 36', writer: '관리자', createDt: '2026-03-18 16:35', status: '게시' },
  { title: '신규 기능 배포 공지 37', writer: '개발팀', createDt: '2026-03-19 09:25', status: '게시' },
  { title: '이용약관 개정 안내 38', writer: '관리자', createDt: '2026-03-19 14:00', status: '게시' },
  { title: '보안 정책 업데이트 39', writer: '보안팀', createDt: '2026-03-20 10:10', status: '임시저장' },
  { title: '정기 점검 일정 공유 40', writer: '운영팀', createDt: '2026-03-20 15:30', status: '게시' },
  { title: '서비스 점검 안내 41', writer: '관리자', createDt: '2026-03-21 09:05', status: '게시' },
  { title: '신규 기능 배포 공지 42', writer: '개발팀', createDt: '2026-03-21 13:40', status: '게시' },
  { title: '이용약관 개정 안내 43', writer: '관리자', createDt: '2026-03-22 10:55', status: '임시저장' },
  { title: '보안 정책 업데이트 44', writer: '보안팀', createDt: '2026-03-22 17:10', status: '게시' },
  { title: '정기 점검 일정 공유 45', writer: '운영팀', createDt: '2026-03-23 09:50', status: '게시' },
  { title: '서비스 점검 안내 46', writer: '관리자', createDt: '2026-03-23 14:20', status: '게시' },
  { title: '신규 기능 배포 공지 47', writer: '개발팀', createDt: '2026-03-24 10:45', status: '임시저장' },
  { title: '이용약관 개정 안내 48', writer: '관리자', createDt: '2026-03-24 16:40', status: '게시' },
  { title: '보안 정책 업데이트 49', writer: '보안팀', createDt: '2026-03-25 09:35', status: '게시' },
  { title: '정기 점검 일정 공유 50', writer: '운영팀', createDt: '2026-03-25 15:55', status: '게시' },
]

export const noticeDummyData: NoticeItem[] = rawNoticeDummyData.map((data, index) => ({
  noticeId: index + 1,
  ...data,
}))
