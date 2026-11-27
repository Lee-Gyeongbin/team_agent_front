import { ref } from 'vue'
import { useUserSelectApi } from '~/composables/com/useUserSelectApi'
import type { OrgItem, OrgUserItem } from '~/types/org-manage'

/** userId 정규화 — 백엔드가 null 을 "" 로 내려주므로 || 로 처리 */
const toUserId = (user: Pick<OrgUserItem, 'userId'>): string => String(user.userId || '').trim()

/** 이름순 정렬 (원본 API 는 생성일 역순) */
const sortByName = (users: OrgUserItem[]): OrgUserItem[] =>
  [...users].sort((a, b) => String(a.userNm || '').localeCompare(String(b.userNm || ''), 'ko'))

/** userId 기준 중복 제거 (빈 userId 제외) */
const dedupeUsers = (users: OrgUserItem[]): OrgUserItem[] => {
  const seen = new Set<string>()
  return users.filter((user) => {
    const userId = toUserId(user)
    if (!userId || seen.has(userId)) return false
    seen.add(userId)
    return true
  })
}

/**
 * 공통 사용자 조회(OrgUserPicker) 데이터 상태.
 * useUserSelectStore 와 달리 상태를 호출마다 새로 만든다 — 본창과 모달에 동시에 띄워도 선택 조직·목록이 섞이지 않는다.
 * null = 아직 조회 안 함, [] = 조회했고 0건.
 */
export const useOrgUserPicker = () => {
  const { fetchOrgList, fetchOrgUserList } = useUserSelectApi()

  /** 조직별 사용자 캐시 (이 인스턴스 안에서만) */
  const usersByOrgCache = new Map<string, OrgUserItem[]>()
  /** 하위 조직 계산·전체 검색용 조직 목록 */
  let orgListCache: OrgItem[] | null = null

  const selectedOrgId = ref<string | null>(null)
  const orgUsers = ref<OrgUserItem[] | null>(null)
  const isOrgUserLoading = ref(false)
  const orgUserErrorMessage = ref('')

  const allUsers = ref<OrgUserItem[] | null>(null)
  const isAllUserLoading = ref(false)
  const allUserErrorMessage = ref('')

  /** 조직 선택이 빠르게 바뀔 때 늦게 도착한 이전 응답을 버리기 위한 순번 */
  let orgRequestSeq = 0

  const loadOrgList = async (): Promise<OrgItem[]> => {
    if (!orgListCache) orgListCache = await fetchOrgList()
    return orgListCache
  }

  /** 여러 조직 사용자를 캐시 우선으로 조회 — 일부 실패는 건너뛰고, 전부 실패하면 에러 */
  const loadUsersOfOrgs = async (orgIds: string[]): Promise<OrgUserItem[]> => {
    const targetIds = orgIds.filter((orgId) => !usersByOrgCache.has(orgId))
    const results = await Promise.allSettled(targetIds.map((orgId) => fetchOrgUserList(orgId)))

    let failCount = 0
    results.forEach((result, index) => {
      const orgId = targetIds[index]
      if (!orgId) return
      if (result.status === 'fulfilled') usersByOrgCache.set(orgId, result.value)
      else failCount += 1
    })
    if (targetIds.length > 0 && failCount === targetIds.length) {
      throw new Error('직원 목록 조회에 실패했습니다.')
    }

    return sortByName(dedupeUsers(orgIds.flatMap((orgId) => usersByOrgCache.get(orgId) || [])))
  }

  /** orgId 와 그 하위 조직 전체 id */
  const collectSubOrgIds = (orgList: OrgItem[], rootOrgId: string): string[] => {
    const childrenByParent = new Map<string, string[]>()
    orgList.forEach((org) => {
      const parentId = String(org.parentOrgId || '')
      if (!parentId) return
      childrenByParent.set(parentId, [...(childrenByParent.get(parentId) || []), org.orgId])
    })

    const result: string[] = []
    const visited = new Set<string>()
    const walk = (orgId: string): void => {
      if (visited.has(orgId)) return
      visited.add(orgId)
      result.push(orgId)
      ;(childrenByParent.get(orgId) || []).forEach(walk)
    }
    walk(rootOrgId)
    return result
  }

  /** 조직 선택 → 소속 직원 조회 (includeSubOrg 면 하위 조직 직원 포함) */
  const handleSelectOrg = async (orgId: string, includeSubOrg = false): Promise<void> => {
    const requestSeq = ++orgRequestSeq
    selectedOrgId.value = orgId
    orgUserErrorMessage.value = ''
    isOrgUserLoading.value = true
    try {
      const orgIds = includeSubOrg ? collectSubOrgIds(await loadOrgList(), orgId) : [orgId]
      const users = await loadUsersOfOrgs(orgIds)
      if (requestSeq !== orgRequestSeq) return
      orgUsers.value = users
    } catch (error) {
      if (requestSeq !== orgRequestSeq) return
      orgUsers.value = null
      orgUserErrorMessage.value = error instanceof Error ? error.message : '직원 목록 조회에 실패했습니다.'
    } finally {
      if (requestSeq === orgRequestSeq) isOrgUserLoading.value = false
    }
  }

  /** 전체 직원 조회 (전체 검색용) — 한 번 불러오면 재사용 */
  const handleLoadAllUsers = async (): Promise<void> => {
    if (allUsers.value || isAllUserLoading.value) return
    allUserErrorMessage.value = ''
    isAllUserLoading.value = true
    try {
      const orgList = await loadOrgList()
      allUsers.value = await loadUsersOfOrgs(orgList.map((org) => org.orgId).filter(Boolean))
    } catch (error) {
      allUsers.value = null
      allUserErrorMessage.value = error instanceof Error ? error.message : '직원 목록 조회에 실패했습니다.'
    } finally {
      isAllUserLoading.value = false
    }
  }

  return {
    selectedOrgId,
    orgUsers,
    isOrgUserLoading,
    orgUserErrorMessage,
    allUsers,
    isAllUserLoading,
    allUserErrorMessage,
    handleSelectOrg,
    handleLoadAllUsers,
  }
}
