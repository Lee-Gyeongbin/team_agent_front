import { useApi } from '~/composables/com/useApi'
import type { FileUploadResponse } from '~/types/file'
import type {
  PtProject,
  PtProjectListFilter,
  PtRequirement,
  PtEvalCriteria,
  PtTocItem,
  PtTargetTypeCd,
  ProjectSettingsData,
  ProjectSettingsSaveRequest,
  Stage1Result,
  Stage1DoneData,
  Stage1ProgressData,
  Stage1ErrorData,
  PtSlide,
  Stage2ProgressData,
  Stage2DoneData,
  SectionGenProgressData,
  SectionGenDoneData,
  SectionConfirmResult,
  SectionChatResult,
  PtFileUploadUrlRequest,
  PtFileSavePayload,
  PtFileSaveResponse,
} from '~/types/proposal'

/** parentTocId 빈 문자열 → null (대목차) 정규화 */
const normalizeParentTocId = (parentTocId: string | null | undefined): string | null => {
  const trimmed = parentTocId?.trim()
  return trimmed ? trimmed : null
}

/** 백엔드 TocVO → 프론트 PtTocItem 매핑 헬퍼 (source는 호출부에서 지정) */
const mapTocVO = (
  vo: {
    tocId: string
    ptProjectId: string
    parentTocId: string | null
    sectionNm: string
    sortOrd: number
  },
  source: PtTocItem['source'] = 'rfp',
): PtTocItem => ({
  tocId: vo.tocId,
  ptProjectId: vo.ptProjectId,
  parentId: normalizeParentTocId(vo.parentTocId),
  title: vo.sectionNm ?? '',
  order: vo.sortOrd ?? 0,
  source,
})

export const useProposalApi = () => {
  const { get, post } = useApi()

  /** PT 파일 업로드 presigned URL 발급 (NCP PUT 전) */
  const fetchCreatePtFileUploadUrl = async (meta: PtFileUploadUrlRequest): Promise<FileUploadResponse> => {
    return post<FileUploadResponse>('/ai/proposal/savePtFileUploadUrl.do', meta)
  }

  /** PT 파일 메타 저장 (NCP 업로드 완료 후 TB_PT_FILE INSERT) */
  const fetchSavePtFile = async (payload: PtFileSavePayload): Promise<PtFileSaveResponse> => {
    return post<PtFileSaveResponse>('/ai/proposal/savePtFile.do', payload)
  }

  /** PT 프로젝트 단건 조회 (상세 페이지 진입 시) */
  const fetchSelectPtProject = async (ptProjectId: string): Promise<{ result: string; data: PtProject }> => {
    return get<{ result: string; data: PtProject }>(
      `/ai/proposal/selectPtProject.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )
  }

  /** PT 제안서 목록 조회 */
  const fetchPtProjectList = async (filter?: PtProjectListFilter): Promise<{ list: PtProject[] }> => {
    let url = '/ai/proposal/selectPtProjectList.do'
    if (filter) {
      const nonEmpty = Object.fromEntries(Object.entries(filter).filter(([, v]) => v !== '' && v != null))
      const qs = new URLSearchParams(nonEmpty as Record<string, string>).toString()
      if (qs) url += '?' + qs
    }
    return get<{ list: PtProject[] }>(url)
  }

  /** PT 제안서 저장 (신규/수정) */
  const fetchSavePtProject = async (data: Partial<PtProject>): Promise<{ result: string; ptProjectId: string }> => {
    return post<{ result: string; ptProjectId: string }>('/ai/proposal/savePtProject.do', data)
  }

  /**
   * Step A: 템플릿 설정 저장
   * PROJECT_CONFIG_JSON.template 키만 merge update (기존 settings 유지)
   *
   * @param data.mode          'fix'=보완(기존 템플릿 활용) | 'new'=생성
   * @param data.templateFileId TB_PT_FILE.PT_FILE_ID (fix 모드 필수, new 모드 선택)
   * @param data.docSize        'a4' | '169' | '43'
   */
  const fetchUpdateProjectTemplate = async (data: {
    ptProjectId: string
    mode: 'fix' | 'new'
    templateFileId?: string
    docSize: 'a4' | '169' | '43'
  }): Promise<{ result: string; msg?: string }> => {
    return post<{ result: string; msg?: string }>('/ai/proposal/updateProjectTemplate.do', data)
  }

  // ── Step C: 제안 설정 ────────────────────────────────────────────────────────

  /**
   * Step C: 제안 설정 조회
   * PROJECT_CONFIG_JSON.settings + TARGET_TYPE_CD + 파일 메타데이터 반환.
   * 설정이 없으면 기본값으로 응답.
   */
  const fetchSelectProjectSettings = async (
    ptProjectId: string,
  ): Promise<{ result: string; data: ProjectSettingsData; msg?: string }> => {
    return get<{ result: string; data: ProjectSettingsData; msg?: string }>(
      `/ai/proposal/selectProjectSettings.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )
  }

  /**
   * Step C: 제안 설정 저장
   * PROJECT_CONFIG_JSON.settings 만 merge update (template 보존).
   */
  const fetchUpdateProjectSettings = async (
    data: ProjectSettingsSaveRequest,
  ): Promise<{ result: string; msg?: string }> => {
    return post<{ result: string; msg?: string }>('/ai/proposal/updateProjectSettings.do', data)
  }

  /**
   * Step C: 제안 대상(공공/민간) 즉시 변경
   * TB_PT_PROJECT.TARGET_TYPE_CD 직접 UPDATE.
   */
  const fetchUpdateProjectTargetType = async (
    ptProjectId: string,
    targetTypeCd: PtTargetTypeCd,
  ): Promise<{ result: string; msg?: string }> => {
    return post<{ result: string; msg?: string }>('/ai/proposal/updateProjectTargetType.do', {
      ptProjectId,
      targetTypeCd,
    })
  }

  // ── Step B: TOC(목차) ────────────────────────────────────────────────────────

  /**
   * Step B: mandatedToc 기반 목차 자동추출 (LLM 없음)
   * @returns list — 추출된 PtTocItem 목록 (빈 배열이면 RFP에 명시 없음), msg — 안내 메시지
   */
  const fetchAutoExtractToc = async (
    ptProjectId: string,
  ): Promise<{ result: string; list: PtTocItem[]; msg?: string }> => {
    const params = new URLSearchParams({ ptProjectId })
    const raw = await post<{ result: string; list: Record<string, unknown>[]; msg?: string }>(
      `/ai/proposal/autoExtractToc.do?${params.toString()}`,
      {},
    )
    return {
      result: raw.result,
      list: (raw.list ?? []).map((vo) => mapTocVO(vo as Parameters<typeof mapTocVO>[0], 'rfp')),
      msg: raw.msg,
    }
  }

  /** Step B: TOC 목록 조회 (flat, SORT_ORD 기준) */
  const fetchSelectTocList = async (ptProjectId: string): Promise<{ result: string; list: PtTocItem[] }> => {
    const raw = await get<{ result: string; list: Record<string, unknown>[] }>(
      `/ai/proposal/selectTocList.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )
    return {
      result: raw.result,
      list: (raw.list ?? []).map((vo) => mapTocVO(vo as Parameters<typeof mapTocVO>[0], 'rfp')),
    }
  }

  /**
   * Step B: TOC 항목 단건 추가
   * @param data.parentTocId null=대목차, tocId=소목차
   */
  const fetchInsertTocItem = async (data: {
    ptProjectId: string
    parentTocId?: string | null
    sectionNm: string
    sortOrd?: number
  }): Promise<{ result: string; data: PtTocItem; msg?: string }> => {
    const raw = await post<{ result: string; data: Record<string, unknown>; msg?: string }>(
      '/ai/proposal/insertTocItem.do',
      data,
    )
    return {
      result: raw.result,
      data: mapTocVO(raw.data as Parameters<typeof mapTocVO>[0], 'user'),
      msg: raw.msg,
    }
  }

  /** Step B: TOC 항목 제목 수정 */
  const fetchUpdateTocItem = async (tocId: string, sectionNm: string): Promise<{ result: string }> => {
    return post<{ result: string }>('/ai/proposal/updateTocItem.do', { tocId, sectionNm })
  }

  /** Step B: TOC 항목 삭제 (소목차 연쇄 삭제 포함) */
  const fetchDeleteTocItem = async (tocId: string): Promise<{ result: string }> => {
    const params = new URLSearchParams({ tocId })
    return post<{ result: string }>(`/ai/proposal/deleteTocItem.do?${params.toString()}`, {})
  }

  /**
   * Step B: TOC 순서 일괄 변경
   * @param items 새 순서대로 정렬된 PtTocItem 배열 (인덱스가 sortOrd가 됨)
   */
  const fetchReorderTocItems = async (ptProjectId: string, items: PtTocItem[]): Promise<{ result: string }> => {
    return post<{ result: string }>('/ai/proposal/reorderTocItems.do', {
      ptProjectId,
      items: items.map((item, idx) => ({ tocId: item.tocId, sortOrd: idx })),
    })
  }

  /**
   * 프로젝트 용도별 파일 단건 조회 (최근 등록 기준, 없으면 data=null)
   * @param filePurposeCd 001=RFP원문(기본값), 003=템플릿 등
   */
  const fetchSelectPtRfpFile = async (
    ptProjectId: string,
    filePurposeCd = '001',
  ): Promise<{ result: string; data: { ptFileId: string; fileName: string } | null }> => {
    const params = new URLSearchParams({ ptProjectId, filePurposeCd })
    return get<{ result: string; data: { ptFileId: string; fileName: string } | null }>(
      `/ai/proposal/selectPtRfpFile.do?${params.toString()}`,
    )
  }

  /** Stage1 결과 조회 */
  const fetchSelectStage1Result = async (ptProjectId: string): Promise<{ result: string; data: Stage1Result }> => {
    return get<{ result: string; data: Stage1Result }>(
      `/ai/proposal/selectStage1Result.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )
  }

  /** 요구사항 단건 수동 수정 */
  const fetchUpdateRequirement = async (
    vo: Partial<PtRequirement> & { requirementId: string },
  ): Promise<{ result: string }> => {
    return post<{ result: string }>('/ai/proposal/updateRequirement.do', vo)
  }

  /** 평가기준 단건 수동 수정 */
  const fetchUpdateEvalCriteria = async (
    vo: Partial<PtEvalCriteria> & { evalCriteriaId: string },
  ): Promise<{ result: string }> => {
    return post<{ result: string }>('/ai/proposal/updateEvalCriteria.do', vo)
  }

  /**
   * Stage1 추출 — SSE 스트림
   * connected → progress... → done/error 이벤트 순서로 수신
   *
   * @param ptProjectId 프로젝트 ID
   * @param modelId     LLM 모델 ID
   * @param agentId     에이전트 ID
   * @param callbacks   이벤트별 콜백
   * @returns EventSource (필요 시 직접 close 호출)
   */
  const streamExtractStage1 = (
    ptProjectId: string,
    modelId: string,
    agentId: string,
    callbacks: {
      onProgress?: (data: Stage1ProgressData) => void
      onWarn?: (message: string) => void
      onDone?: (data: Stage1DoneData) => void
      onError?: (message: string) => void
    },
  ): EventSource => {
    const params = new URLSearchParams({ ptProjectId, modelId, agentId })
    const es = new EventSource(`/api/ai/proposal/streamExtractStage1.do?${params.toString()}`)

    es.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data) as Stage1ProgressData
        callbacks.onProgress?.(data)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('warn', (e) => {
      try {
        const data = JSON.parse(e.data) as Stage1ErrorData
        callbacks.onWarn?.(data.message)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('done', (e) => {
      try {
        const data = JSON.parse(e.data) as Stage1DoneData
        callbacks.onDone?.(data)
      } catch {
        /* ignore */
      } finally {
        es.close()
      }
    })

    es.addEventListener('error', (e) => {
      try {
        // MessageEvent인 경우 data 파싱, 그 외 연결 오류
        const me = e as MessageEvent
        if (me.data) {
          const data = JSON.parse(me.data) as Stage1ErrorData
          callbacks.onError?.(data.message)
        } else {
          callbacks.onError?.('SSE 연결 오류가 발생했습니다.')
        }
      } catch {
        callbacks.onError?.('SSE 연결 오류가 발생했습니다.')
      } finally {
        es.close()
      }
    })

    return es
  }

  // ── Step D: 본문 생성 ────────────────────────────────────────────────────────

  /**
   * D-0: Stage2 전략분석 SSE 스트림
   * Step D 최초 진입 시 자동 호출. 이미 실행됐으면 skip 이벤트로 즉시 완료.
   *
   * @param ptProjectId      프로젝트 ID
   * @param modelId          LLM 모델 ID
   * @param agentId          에이전트 ID
   * @param totalSlideBudget 목표 슬라이드 수 (기본 20)
   */
  const streamAnalyzeStage2 = (
    ptProjectId: string,
    modelId: string,
    agentId: string,
    callbacks: {
      onProgress?: (data: Stage2ProgressData) => void
      onDone?: (data: Stage2DoneData) => void
      onError?: (message: string) => void
    },
    totalSlideBudget = 20,
  ): EventSource => {
    const params = new URLSearchParams({ ptProjectId, modelId, agentId, totalSlideBudget: String(totalSlideBudget) })
    const es = new EventSource(`/api/ai/proposal/streamAnalyzeStage2.do?${params.toString()}`)

    es.addEventListener('progress', (e) => {
      try {
        callbacks.onProgress?.(JSON.parse((e as MessageEvent).data) as Stage2ProgressData)
      } catch {
        /* ignore */
      }
    })
    es.addEventListener('done', (e) => {
      try {
        callbacks.onDone?.(JSON.parse((e as MessageEvent).data) as Stage2DoneData)
      } catch {
        /* ignore */
      } finally {
        es.close()
      }
    })
    es.addEventListener('error', (e) => {
      try {
        const me = e as MessageEvent
        callbacks.onError?.(me.data ? (JSON.parse(me.data) as { message: string }).message : 'SSE 연결 오류')
      } catch {
        callbacks.onError?.('SSE 연결 오류')
      } finally {
        es.close()
      }
    })

    return es
  }

  /**
   * D-1: 소목차 슬라이드 생성 SSE 스트림 (Stage3 + Stage3.5)
   * 이미 슬라이드가 있으면 삭제 후 재생성.
   *
   * @param ptProjectId 프로젝트 ID
   * @param tocId       소목차 TOC_ID
   * @param modelId     LLM 모델 ID
   * @param agentId     에이전트 ID
   */
  const streamGenerateSection = (
    ptProjectId: string,
    tocId: string,
    modelId: string,
    agentId: string,
    callbacks: {
      onProgress?: (data: SectionGenProgressData) => void
      onDone?: (data: SectionGenDoneData) => void
      onError?: (message: string) => void
    },
  ): EventSource => {
    const params = new URLSearchParams({ ptProjectId, tocId, modelId, agentId })
    const es = new EventSource(`/api/ai/proposal/streamGenerateSection.do?${params.toString()}`)

    es.addEventListener('progress', (e) => {
      try {
        callbacks.onProgress?.(JSON.parse((e as MessageEvent).data) as SectionGenProgressData)
      } catch {
        /* ignore */
      }
    })
    es.addEventListener('done', (e) => {
      try {
        callbacks.onDone?.(JSON.parse((e as MessageEvent).data) as SectionGenDoneData)
      } catch {
        /* ignore */
      } finally {
        es.close()
      }
    })
    es.addEventListener('error', (e) => {
      try {
        const me = e as MessageEvent
        callbacks.onError?.(me.data ? (JSON.parse(me.data) as { message: string }).message : 'SSE 연결 오류')
      } catch {
        callbacks.onError?.('SSE 연결 오류')
      } finally {
        es.close()
      }
    })

    return es
  }

  /**
   * D-1: 소목차 슬라이드 목록 조회 (SLIDE_NO 순)
   * 캐러셀/썸네일 스트립 표시용.
   */
  const fetchSelectSectionSlides = async (tocId: string): Promise<{ result: string; list: PtSlide[] }> => {
    return get<{ result: string; list: PtSlide[] }>(
      `/ai/proposal/selectSectionSlides.do?tocId=${encodeURIComponent(tocId)}`,
    )
  }

  /**
   * D-3: 소목차 보완요청 채팅
   * 특정 슬라이드 지목 시 해당 슬라이드만 재생성, 지목 없으면 소목차 전체 재생성.
   */
  const fetchChatSection = async (
    ptProjectId: string,
    tocId: string,
    message: string,
    modelId: string,
    agentId: string,
  ): Promise<{ result: string; data: SectionChatResult; msg?: string }> => {
    return post<{ result: string; data: SectionChatResult; msg?: string }>('/ai/proposal/chatSection.do', {
      ptProjectId,
      tocId,
      message,
      modelId,
      agentId,
    })
  }

  /**
   * D-4: 소목차 확인 → 다음 소목차 전환
   * 미완료 슬라이드 있으면 confirm 거부.
   * done=true 시 Step E로 이동.
   */
  const fetchConfirmSection = async (
    ptProjectId: string,
    tocId: string,
  ): Promise<{ result: string; data: SectionConfirmResult; msg?: string }> => {
    const params = new URLSearchParams({ ptProjectId, tocId })
    return post<{ result: string; data: SectionConfirmResult; msg?: string }>(
      `/ai/proposal/confirmSection.do?${params.toString()}`,
      {},
    )
  }

  return {
    fetchCreatePtFileUploadUrl,
    fetchSavePtFile,
    fetchSelectPtProject,
    fetchPtProjectList,
    fetchSavePtProject,
    fetchUpdateProjectTemplate,
    fetchSelectProjectSettings,
    fetchUpdateProjectSettings,
    fetchUpdateProjectTargetType,
    fetchSelectPtRfpFile,
    fetchAutoExtractToc,
    fetchSelectTocList,
    fetchInsertTocItem,
    fetchUpdateTocItem,
    fetchDeleteTocItem,
    fetchReorderTocItems,
    fetchSelectStage1Result,
    fetchUpdateRequirement,
    fetchUpdateEvalCriteria,
    streamExtractStage1,
    // Step D
    streamAnalyzeStage2,
    streamGenerateSection,
    fetchSelectSectionSlides,
    fetchChatSection,
    fetchConfirmSection,
  }
}
