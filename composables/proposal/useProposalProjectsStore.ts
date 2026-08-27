import type { PtProject, PtProjectListFilter } from '~/types/proposal'
import { useProposalApi } from '~/composables/proposal/useProposalApi'

const { fetchPtProjectList, fetchSavePtProject, fetchDeletePtProject } = useProposalApi()

const ptProjectList = ref<PtProject[]>([])
const isLoadingList = ref(false)

/** PT 제안서 목록 조회 */
const handleSelectPtProjectList = async (filter?: PtProjectListFilter) => {
  isLoadingList.value = true
  ptProjectList.value = []
  try {
    const res = await fetchPtProjectList(filter)
    ptProjectList.value = res?.list ?? []
  } catch {
    openToast({ message: 'PT 제안서 목록 조회 실패', type: 'error' })
    ptProjectList.value = []
  } finally {
    isLoadingList.value = false
  }
}

/**
 * PT 제안서 신규 생성
 * ProposalNewModal에서 받은 form 데이터를 백엔드 VO에 맞게 변환 후 저장
 * @returns 생성된 ptProjectId
 */
const handleSavePtProject = async (
  form: Pick<PtProject, 'projectNm' | 'orgNm' | 'targetTypeCd' | 'dueDt'> & {
    summary?: string
    projectOverview?: string
  },
): Promise<string> => {
  const payload: Partial<PtProject> = {
    projectNm: form.projectNm,
    orgNm: form.orgNm,
    projectOverview: form.projectOverview ?? form.summary,
    targetTypeCd: form.targetTypeCd,
    dueDt: form.dueDt || undefined,
  }
  const res = await fetchSavePtProject(payload)
  if (res.result !== 'OK') {
    throw new Error('PT 제안서 생성에 실패했습니다.')
  }
  return res.ptProjectId
}

/**
 * PT 제안서 삭제 (NCP 파일 포함 전체 삭제)
 * @param ptProjectIds 삭제할 프로젝트 ID 배열
 */
const handleDeletePtProjects = async (ptProjectIds: string[]): Promise<void> => {
  for (const ptProjectId of ptProjectIds) {
    const res = await fetchDeletePtProject(ptProjectId)
    if (res.result !== 'OK') {
      throw new Error(res.msg || `삭제 실패: ${ptProjectId}`)
    }
  }
  // 삭제 후 목록 갱신 (현재 필터 초기화)
  await handleSelectPtProjectList()
}

export const useProposalProjectsStore = () => {
  return {
    ptProjectList,
    isLoadingList,
    handleSelectPtProjectList,
    handleSavePtProject,
    handleDeletePtProjects,
  }
}
