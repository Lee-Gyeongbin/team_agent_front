import { useApi } from '~/composables/com/useApi'
import type { FileUploadResponse } from '~/types/file'
import type {
  PtProject,
  PtProjectListFilter,
  PtRequirement,
  PtEvalCriteria,
  PtRfpIssue,
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
  Stage2TocProgressData,
  Stage2TocDoneData,
  Stage2Summary,
  ProblemDefinition,
  WinTheme,
  TocMappingResult,
  TocMappingNode,
  SectionGenProgressData,
  SectionGenDoneData,
  SectionConfirmResult,
  SectionChatResult,
  CoverChatResult,
  SlideRenderProgressData,
  SlideRenderDoneData,
  SlideImageGenProgressData,
  SlideImageGenDoneData,
  PtFileUploadUrlRequest,
  PtFileSavePayload,
  PtFileSaveResponse,
  PtFileDownloadResponse,
  SlideImageViewResponse,
  PtExportVO,
  PtExportRequest,
  PtTemplate,
  PtTemplateRegenerateRequest,
} from '~/types/proposal'

/**
 * SSE EventSource에 공통 에러 리스너를 등록합니다.
 * 백엔드가 error 이벤트로 JSON `{ message }` 를 보내면 파싱하고,
 * 연결 자체 오류이면 기본 메시지를 사용합니다.
 */
function attachSseErrorListener(es: EventSource, onError?: (msg: string) => void) {
  es.addEventListener('error', (e) => {
    try {
      const me = e as MessageEvent
      onError?.(me.data ? (JSON.parse(me.data) as { message: string }).message : 'SSE 연결 오류가 발생했습니다.')
    } catch {
      onError?.('SSE 연결 오류가 발생했습니다.')
    } finally {
      es.close()
    }
  })
}

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

  /** PT 파일 다운로드용 presigned URL 조회 */
  const fetchDownloadPtFile = async (ptFileId: string): Promise<PtFileDownloadResponse> => {
    return post<PtFileDownloadResponse>('/ai/proposal/downloadPtFile.do', { ptFileId })
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

  const fetchInsertRequirement = async (vo: Partial<PtRequirement> & { ptProjectId: string; reqContent: string }) =>
    post<{ result: string; data: PtRequirement }>('/ai/proposal/insertRequirement.do', vo)

  const fetchDeleteRequirement = async (requirementId: string) =>
    post<{ result: string }>(`/ai/proposal/deleteRequirement.do?requirementId=${encodeURIComponent(requirementId)}`, {})

  const fetchInsertEvalCriteria = async (vo: Partial<PtEvalCriteria> & { ptProjectId: string; evalItemNm: string }) =>
    post<{ result: string; data: PtEvalCriteria }>('/ai/proposal/insertEvalCriteria.do', vo)

  const fetchDeleteEvalCriteria = async (evalCriteriaId: string) =>
    post<{ result: string }>(
      `/ai/proposal/deleteEvalCriteria.do?evalCriteriaId=${encodeURIComponent(evalCriteriaId)}`,
      {},
    )

  const fetchInsertRfpIssue = async (vo: Partial<PtRfpIssue> & { ptProjectId: string; issueContent: string }) =>
    post<{ result: string; data: PtRfpIssue }>('/ai/proposal/insertRfpIssue.do', vo)

  const fetchUpdateRfpIssue = async (vo: Partial<PtRfpIssue> & { issueId: string }) =>
    post<{ result: string }>('/ai/proposal/updateRfpIssue.do', vo)

  const fetchDeleteRfpIssue = async (issueId: string) =>
    post<{ result: string }>(`/ai/proposal/deleteRfpIssue.do?issueId=${encodeURIComponent(issueId)}`, {})

  // ── Stage2 전략검토 ─────────────────────────────────────────────────────

  const fetchSelectStage2Summary = async (ptProjectId: string) =>
    get<{ result: string; data: Stage2Summary }>(
      `/ai/proposal/selectStage2Summary.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )

  const fetchSelectStage2ProblemDefinitions = async (ptProjectId: string) =>
    get<{ result: string; data: ProblemDefinition[] }>(
      `/ai/proposal/selectStage2ProblemDefinitions.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )

  const fetchSelectStage2WinThemes = async (ptProjectId: string) =>
    get<{ result: string; data: WinTheme[] }>(
      `/ai/proposal/selectStage2WinThemes.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )

  const fetchSelectStage2TocMapping = async (ptProjectId: string) =>
    get<{ result: string; data: TocMappingResult }>(
      `/ai/proposal/selectStage2TocMapping.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )

  const fetchRegenerateStage2ProblemDefinitions = async (vo: {
    ptProjectId: string
    modelId: string
    agentId: string
    userFeedback?: string
    totalSlideBudget?: number
  }) => post<{ result: string; data: ProblemDefinition[] }>('/ai/proposal/regenerateStage2ProblemDefinitions.do', vo)

  const fetchRefineStage2ProblemDefinition = async (vo: {
    ptProjectId: string
    problemId: string
    userFeedback: string
    modelId: string
    agentId: string
  }) => post<{ result: string; data: ProblemDefinition }>('/ai/proposal/refineStage2ProblemDefinition.do', vo)

  const fetchRegenerateStage2WinThemes = async (vo: {
    ptProjectId: string
    modelId: string
    agentId: string
    userFeedback?: string
  }) => post<{ result: string; data: WinTheme[]; errorCd?: string }>('/ai/proposal/regenerateStage2WinThemes.do', vo)

  const fetchRegenerateStage2Mapping = async (vo: {
    ptProjectId: string
    modelId: string
    agentId: string
    totalSlideBudget?: number
  }) => post<{ result: string; data: TocMappingResult }>('/ai/proposal/regenerateStage2Mapping.do', vo)

  const fetchResetStage2Status = async (ptProjectId: string) =>
    post<{ result: string }>(`/ai/proposal/resetStage2Status.do?ptProjectId=${encodeURIComponent(ptProjectId)}`, {})

  const fetchUpdateStage2ProblemDefinition = async (
    vo: Partial<ProblemDefinition> & { ptProjectId: string; problemId: string },
  ) => post<{ result: string; data: ProblemDefinition }>('/ai/proposal/updateStage2ProblemDefinition.do', vo)

  const fetchInsertStage2ProblemDefinition = async (vo: Partial<ProblemDefinition> & { ptProjectId: string }) =>
    post<{ result: string; data: ProblemDefinition }>('/ai/proposal/insertStage2ProblemDefinition.do', vo)

  const fetchDeleteStage2ProblemDefinition = async (ptProjectId: string, problemId: string) =>
    post<{ result: string }>(
      `/ai/proposal/deleteStage2ProblemDefinition.do?ptProjectId=${encodeURIComponent(ptProjectId)}&problemId=${encodeURIComponent(problemId)}`,
      {},
    )

  const fetchUpdateStage2WinTheme = async (vo: Partial<WinTheme> & { ptProjectId: string; winThemeId: string }) =>
    post<{ result: string; data: WinTheme }>('/ai/proposal/updateStage2WinTheme.do', vo)

  const fetchInsertStage2WinTheme = async (vo: Partial<WinTheme> & { ptProjectId: string }) =>
    post<{ result: string; data: WinTheme }>('/ai/proposal/insertStage2WinTheme.do', vo)

  const fetchDeleteStage2WinTheme = async (ptProjectId: string, winThemeId: string) =>
    post<{ result: string }>(
      `/ai/proposal/deleteStage2WinTheme.do?ptProjectId=${encodeURIComponent(ptProjectId)}&winThemeId=${encodeURIComponent(winThemeId)}`,
      {},
    )

  const fetchUpdateStage2TocMapping = async (
    ptProjectId: string,
    vo: { tocId: string; coveredReqIds: string[]; linkedEvalCriteriaId: string | null },
  ) =>
    post<{ result: string; data: TocMappingNode }>(
      `/ai/proposal/updateStage2TocMapping.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
      vo,
    )

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

    attachSseErrorListener(es, callbacks.onError)

    return es
  }

  // ── Step E: 본문 생성 ────────────────────────────────────────────────────────

  /**
   * E-0: Stage2 전략분석 SSE 스트림
   * Step E 최초 진입 시 자동 호출. 이미 실행됐으면 skip 이벤트로 즉시 완료.
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
    attachSseErrorListener(es, callbacks.onError)

    return es
  }

  /**
   * D-0T: Stage2 세부목차 생성 SSE 스트림
   *
   * @param ptProjectId      프로젝트 ID
   * @param modelId          LLM 모델 ID
   * @param agentId          에이전트 ID
   * @param totalSlideBudget 목표 슬라이드 수 (기본 20)
   */
  const streamAnalyzeStage2Toc = (
    ptProjectId: string,
    modelId: string,
    agentId: string,
    callbacks: {
      onProgress?: (data: Stage2TocProgressData) => void
      onDone?: (data: Stage2TocDoneData) => void
      onError?: (message: string) => void
    },
    totalSlideBudget = 20,
  ): EventSource => {
    const params = new URLSearchParams({ ptProjectId, modelId, agentId, totalSlideBudget: String(totalSlideBudget) })
    const es = new EventSource(`/api/ai/proposal/streamAnalyzeStage2Toc.do?${params.toString()}`)

    es.addEventListener('progress', (e) => {
      try {
        callbacks.onProgress?.(JSON.parse((e as MessageEvent).data) as Stage2TocProgressData)
      } catch {
        /* ignore */
      }
    })
    es.addEventListener('done', (e) => {
      try {
        callbacks.onDone?.(JSON.parse((e as MessageEvent).data) as Stage2TocDoneData)
      } catch {
        /* ignore */
      } finally {
        es.close()
      }
    })
    attachSseErrorListener(es, callbacks.onError)

    return es
  }

  /**
   * E-1: 소목차 슬라이드 생성 SSE 스트림 (Stage3 + Stage3.5)
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
    attachSseErrorListener(es, callbacks.onError)

    return es
  }

  /**
   * E-1: 소목차 슬라이드 목록 조회 (SLIDE_NO 순)
   * 캐러셀/썸네일 스트립 표시용.
   */
  const fetchSelectSectionSlides = async (tocId: string): Promise<{ result: string; list: PtSlide[] }> => {
    return get<{ result: string; list: PtSlide[] }>(
      `/ai/proposal/selectSectionSlides.do?tocId=${encodeURIComponent(tocId)}`,
    )
  }

  /**
   * E-3: 소목차 보완요청 채팅
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
   * D: 표지 이미지 보완요청 채팅
   * chatSection.do 와 동일 패턴 — 메시지 + modelId/agentId 로 표지 재생성.
   */
  const fetchChatCover = async (
    ptProjectId: string,
    agentId: string,
    message: string,
  ): Promise<{ result: string; data: CoverChatResult; msg?: string }> => {
    return post<{ result: string; data: CoverChatResult; msg?: string }>('/ai/proposal/chatCover.do', {
      ptProjectId,
      agentId,
      message,
    })
  }

  /**
   * E-5: 소목차 이미지 렌더링 SSE (confirmSection 완료 후 구독)
   * 슬라이드별 progress 이벤트 → done 이벤트 순서로 수신.
   */
  const streamRenderSectionImages = (
    ptProjectId: string,
    tocId: string,
    callbacks: {
      onProgress?: (data: SlideRenderProgressData) => void
      onDone?: (data: SlideRenderDoneData) => void
      onError?: (message: string) => void
    },
  ): EventSource => {
    const params = new URLSearchParams({ ptProjectId, tocId })
    const es = new EventSource(`/api/ai/proposal/streamRenderSectionImages.do?${params.toString()}`)

    es.addEventListener('progress', (e) => {
      try {
        callbacks.onProgress?.(JSON.parse((e as MessageEvent).data) as SlideRenderProgressData)
      } catch {
        /* ignore */
      }
    })
    es.addEventListener('done', (e) => {
      try {
        callbacks.onDone?.(JSON.parse((e as MessageEvent).data) as SlideRenderDoneData)
      } catch {
        /* ignore */
      } finally {
        es.close()
      }
    })
    attachSseErrorListener(es, callbacks.onError)

    return es
  }

  /**
   * 슬라이드 단건 인포그래픽 이미지 생성 SSE (버튼 클릭 시 호출)
   * connected → progress(llm) → progress(parse) → progress(image_gen) → done
   *
   * @param slideId 생성 대상 슬라이드 ID
   * @param modelId LLM 모델 ID
   * @param agentId 에이전트 ID
   */
  const streamGenerateSlideImage = (
    slideId: string,
    modelId: string,
    agentId: string,
    callbacks: {
      onProgress?: (data: SlideImageGenProgressData) => void
      onDone?: (data: SlideImageGenDoneData) => void
      onError?: (message: string) => void
    },
  ): EventSource => {
    const params = new URLSearchParams({ slideId, modelId, agentId })
    const es = new EventSource(`/api/ai/proposal/streamGenerateSlideImage.do?${params.toString()}`)

    es.addEventListener('progress', (e) => {
      try {
        callbacks.onProgress?.(JSON.parse((e as MessageEvent).data) as SlideImageGenProgressData)
      } catch {
        /* ignore */
      }
    })
    es.addEventListener('done', (e) => {
      try {
        callbacks.onDone?.(JSON.parse((e as MessageEvent).data) as SlideImageGenDoneData)
      } catch {
        /* ignore */
      } finally {
        es.close()
      }
    })
    attachSseErrorListener(es, callbacks.onError)

    return es
  }

  /**
   * E-4: 소목차 확인 → 다음 소목차 전환
   * 미완료 슬라이드 있으면 confirm 거부.
   * done=true 시 출력 단계(Step F)로 이동.
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

  /** 최대 단계 번호 업데이트 (Step B·D처럼 별도 저장 API 없는 단계의 다음 버튼용) */
  const fetchUpdateMaxStepNo = async (ptProjectId: string, maxStepNo: number): Promise<{ result: string }> => {
    return post<{ result: string }>('/ai/proposal/updateMaxStepNo.do', { ptProjectId, maxStepNo })
  }

  /** 슬라이드 인포그래픽 이미지 presigned URL 조회 */
  const fetchViewSlideImage = async (slideId: string): Promise<SlideImageViewResponse> => {
    return post<SlideImageViewResponse>('/ai/proposal/viewSlideImage.do', { slideId })
  }

  /** 표지 배경 이미지 presigned URL 조회 (미리보기용) */
  const fetchViewPtCoverImage = async (ptProjectId: string): Promise<SlideImageViewResponse> => {
    const params = new URLSearchParams({ ptProjectId })
    return post<SlideImageViewResponse>(`/ai/proposal/viewPtCoverImage.do?${params.toString()}`, {})
  }

  // ── Step F: 출력 ────────────────────────────────────────────────────────────

  /** F — 출력 시작 (PPTX / PDF). 캐시 재사용 판단 후 신규 빌드 또는 즉시 반환. */
  const fetchStartExport = async (
    req: PtExportRequest,
  ): Promise<{ result: string; data: PtExportVO; msg?: string }> => {
    return post<{ result: string; data: PtExportVO; msg?: string }>('/ai/proposal/startExport.do', req)
  }

  /** F — 출력 상태 조회 (폴링용). 완료(004)/캐시재사용(003) 시 downloadUrl 포함. */
  const fetchSelectExportStatus = async (
    exportId: string,
  ): Promise<{ result: string; data: PtExportVO; msg?: string }> => {
    return get<{ result: string; data: PtExportVO; msg?: string }>(
      `/ai/proposal/selectExportStatus.do?exportId=${encodeURIComponent(exportId)}`,
    )
  }

  // ── Step D: 템플릿 생성 ────────────────────────────────────────────────────

  /** D — 템플릿 단건 조회 (PT_PROJECT_ID 기준) */
  const fetchSelectPtTemplate = async (
    ptProjectId: string,
  ): Promise<{ result: string; data: PtTemplate | null; msg?: string }> => {
    return get<{ result: string; data: PtTemplate | null; msg?: string }>(
      `/ai/proposal/selectPtTemplate.do?ptProjectId=${encodeURIComponent(ptProjectId)}`,
    )
  }

  /** D — 템플릿 생성 (최초 / 전체 재생성) */
  const fetchGeneratePtTemplate = async (
    ptProjectId: string,
    modelId: string,
    agentId: string,
  ): Promise<{ result: string; data: PtTemplate; msg?: string }> => {
    const params = new URLSearchParams({ ptProjectId, modelId, agentId })
    return post<{ result: string; data: PtTemplate; msg?: string }>(
      `/ai/proposal/generatePtTemplate.do?${params.toString()}`,
      {},
    )
  }

  /** D — 템플릿 직접 저장 (드래그 편집 확정) */
  const fetchUpdatePtTemplate = async (
    ptProjectId: string,
    headerComponentsJson: string,
    footerComponentsJson: string,
    colorJson: string,
    modifyUserId: string,
  ): Promise<{ result: string; msg?: string }> => {
    return post<{ result: string; msg?: string }>('/ai/proposal/updatePtTemplate.do', {
      ptProjectId,
      headerComponentsJson,
      footerComponentsJson,
      colorJson,
      genStatusCd: '003',
      modifyUserId,
    })
  }

  /** D — 템플릿 재생성 (보완요청 반영) */
  const fetchRegeneratePtTemplate = async (
    ptProjectId: string,
    refineInstruction: string,
    modelId: string,
    agentId: string,
  ): Promise<{ result: string; data: PtTemplate; msg?: string }> => {
    const params = new URLSearchParams({ modelId, agentId })
    return post<{ result: string; data: PtTemplate; msg?: string }>(
      `/ai/proposal/regeneratePtTemplate.do?${params.toString()}`,
      { ptProjectId, refineInstruction },
    )
  }

  /** D — 표지 이미지 생성 / 재생성 */
  const fetchGeneratePtCoverImage = async (
    ptProjectId: string,
    agentId: string,
  ): Promise<{ result: string; data: PtTemplate; msg?: string }> => {
    const params = new URLSearchParams({ ptProjectId, agentId })
    return post<{ result: string; data: PtTemplate; msg?: string }>(
      `/ai/proposal/generatePtCoverImage.do?${params.toString()}`,
      {},
    )
  }

  return {
    fetchCreatePtFileUploadUrl,
    fetchSavePtFile,
    fetchDownloadPtFile,
    fetchSelectPtProject,
    fetchPtProjectList,
    fetchSavePtProject,
    fetchUpdateProjectTemplate,
    fetchSelectProjectSettings,
    fetchUpdateProjectSettings,
    fetchUpdateProjectTargetType,
    fetchSelectPtRfpFile,
    fetchSelectTocList,
    fetchInsertTocItem,
    fetchUpdateTocItem,
    fetchDeleteTocItem,
    fetchReorderTocItems,
    fetchUpdateMaxStepNo,
    fetchSelectStage1Result,
    fetchUpdateRequirement,
    fetchUpdateEvalCriteria,
    fetchInsertRequirement,
    fetchDeleteRequirement,
    fetchInsertEvalCriteria,
    fetchDeleteEvalCriteria,
    fetchInsertRfpIssue,
    fetchUpdateRfpIssue,
    fetchDeleteRfpIssue,
    streamExtractStage1,
    // Stage2 전략검토
    fetchSelectStage2Summary,
    fetchSelectStage2ProblemDefinitions,
    fetchSelectStage2WinThemes,
    fetchSelectStage2TocMapping,
    fetchRegenerateStage2ProblemDefinitions,
    fetchRefineStage2ProblemDefinition,
    fetchRegenerateStage2WinThemes,
    fetchRegenerateStage2Mapping,
    fetchResetStage2Status,
    fetchUpdateStage2ProblemDefinition,
    fetchInsertStage2ProblemDefinition,
    fetchDeleteStage2ProblemDefinition,
    fetchUpdateStage2WinTheme,
    fetchInsertStage2WinTheme,
    fetchDeleteStage2WinTheme,
    fetchUpdateStage2TocMapping,
    // Step E (본문 생성)
    streamAnalyzeStage2,
    streamAnalyzeStage2Toc,
    streamGenerateSection,
    fetchSelectSectionSlides,
    fetchChatSection,
    streamRenderSectionImages,
    streamGenerateSlideImage,
    fetchConfirmSection,
    fetchViewSlideImage,
    fetchViewPtCoverImage,
    fetchStartExport,
    fetchSelectExportStatus,
    // Step D (템플릿 생성)
    fetchSelectPtTemplate,
    fetchGeneratePtTemplate,
    fetchRegeneratePtTemplate,
    fetchUpdatePtTemplate,
    fetchGeneratePtCoverImage,
    fetchChatCover,
  }
}
