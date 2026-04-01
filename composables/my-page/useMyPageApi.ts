import type { UserItem } from '~/types/user-manage'

export const useMyPageApi = () => {
  // 🔽 더미 데이터 — 백엔드 연결 시 실제 마이페이지 조회 API로 교체
  const fetchMyPageInfo = async (): Promise<Partial<UserItem>> => {
    return Promise.resolve({
      userId: 'teamagent',
      userNm: '팀에이전트',
      email: 'teamagent@example.com',
      phone: '01012345678',
      orgId: '',
      acctStatusDesc: '정상',
      lastLoginDt: '2026-04-01 10:00:00',
      pwdChgDt: '2026-03-20 09:00:00',
    })
  }

  // 🔽 더미 로직 — 백엔드 연결 시 마이페이지 저장 API로 교체
  const saveMyPageInfo = async (_payload: Partial<UserItem>) => {
    return Promise.resolve(true)
  }

  // 🔽 더미 로직 — 백엔드 연결 시 비밀번호 변경 API로 교체
  const changeMyPagePassword = async (_payload: { userId: string; newPassword: string }) => {
    return Promise.resolve(true)
  }

  return {
    fetchMyPageInfo,
    saveMyPageInfo,
    changeMyPagePassword,
  }
}
