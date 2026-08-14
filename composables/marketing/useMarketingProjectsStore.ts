import type { MarketingProject, MarketingProjectListFilter } from '~/types/marketing'
import { useMarketingApi } from '~/composables/marketing/useMarketingApi'

const { fetchMarketingProjectList, fetchSaveMarketingProject, fetchDeleteMarketingProject } = useMarketingApi()

const marketingProjectList = ref<MarketingProject[]>([])
const isLoadingList = ref(false)

/** 마케팅 프로젝트 목록 조회 */
const handleSelectMarketingProjectList = async (filter?: MarketingProjectListFilter) => {
  isLoadingList.value = true
  marketingProjectList.value = []
  try {
    const res = await fetchMarketingProjectList(filter)
    marketingProjectList.value = res?.list ?? []
  } catch {
    openToast({ message: '마케팅 프로젝트 목록 조회 실패', type: 'error' })
    marketingProjectList.value = []
  } finally {
    isLoadingList.value = false
  }
}

type MarketingProjectSaveForm = Pick<MarketingProject, 'projectNm' | 'orgNm' | 'dueDt'> & {
  marketingProjectId?: string
  summary?: string
  projectOverview?: string
  /** 완료/보류 등 수동 상태 변경 — 신규 생성 시엔 서버가 무시하고 항상 작성중으로 시작한다 */
  statusCd?: string
}

/**
 * 마케팅 프로젝트 신규/수정 저장
 * @returns marketingProjectId
 */
const handleSaveMarketingProject = async (form: MarketingProjectSaveForm): Promise<string> => {
  const payload: Partial<MarketingProject> = {
    ...(form.marketingProjectId ? { marketingProjectId: form.marketingProjectId } : {}),
    projectNm: form.projectNm,
    orgNm: form.orgNm,
    projectOverview: form.projectOverview ?? form.summary,
    dueDt: form.dueDt || undefined,
    ...(form.statusCd ? { statusCd: form.statusCd as MarketingProject['statusCd'] } : {}),
  }
  const res = await fetchSaveMarketingProject(payload)
  if (res.result !== 'OK') {
    throw new Error(
      form.marketingProjectId ? '마케팅 프로젝트 수정에 실패했습니다.' : '마케팅 프로젝트 생성에 실패했습니다.',
    )
  }
  return res.marketingProjectId
}

/** 마케팅 프로젝트 삭제 */
const handleDeleteMarketingProject = async (marketingProjectId: string) => {
  const res = await fetchDeleteMarketingProject(marketingProjectId)
  if (res.result !== 'OK') {
    throw new Error('마케팅 프로젝트 삭제에 실패했습니다.')
  }
  marketingProjectList.value = marketingProjectList.value.filter(
    (project) => project.marketingProjectId !== marketingProjectId,
  )
}

export const useMarketingProjectsStore = () => {
  return {
    marketingProjectList,
    isLoadingList,
    handleSelectMarketingProjectList,
    handleSaveMarketingProject,
    handleDeleteMarketingProject,
  }
}
