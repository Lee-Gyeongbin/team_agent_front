import { useApi } from '~/composables/com/useApi'
import { useApi_multipart } from '~/composables/com/useApi_multipart'
import type { ChatFileViewResponse } from '~/types/chat'
import type {
  IdeaComment,
  IdeaDetail,
  IdeaFormData,
  IdeaListResponse,
  IdeaResult,
  IdeaSearchParams,
} from '~/types/idea'

/** 아이디어 API (IdeaController /idea) */
export const useIdeaApi = () => {
  const { post } = useApi()

  /** 목록 (15건 페이징) */
  const fetchIdeaList = (params: IdeaSearchParams) => post<IdeaListResponse>('/idea/list.do', params)

  /** 상세 (첨부파일·내 추천 여부 포함) */
  const fetchIdeaDetail = (ideaId: string) => post<IdeaResult<IdeaDetail>>('/idea/detail.do', { ideaId })

  const fetchIdeaComments = (ideaId: string) =>
    post<IdeaResult<IdeaComment[]>>('/idea/comment/list.do', { ideaId })

  const saveIdeaComment = (
    ideaId: string,
    comment: Pick<IdeaComment, 'content'> & Partial<Pick<IdeaComment, 'commentId' | 'parentId'>>,
  ) => post<IdeaResult>('/idea/comment/save.do', { ideaId, ...comment, richText: true })

  const deleteIdeaComment = (ideaId: string, commentId: string) =>
    post<IdeaResult>('/idea/comment/delete.do', { ideaId, commentId })

  const fetchSaveIdea = ({ files, ...idea }: IdeaFormData) => {
    const newFiles = files.flatMap(({ file }) => (file ? [file] : []))
    if (!newFiles.length) return post<IdeaResult & { ideaId?: string }>('/idea/save.do', idea)

    const formData = new FormData()
    formData.append('idea', new Blob([JSON.stringify(idea)], { type: 'application/json' }))
    newFiles.forEach((file) => formData.append('files', file))
    return useApi_multipart<IdeaResult & { ideaId?: string }>('/idea/save.do', { method: 'POST', body: formData })
  }

  /** 삭제 (본인 글 + 코멘트 전) */
  const fetchDeleteIdea = (ideaId: string) => post<IdeaResult>('/idea/delete.do', { ideaId })

  /** 추천 / 추천 취소 */
  const fetchToggleIdeaLike = (ideaId: string) =>
    post<IdeaResult<Pick<IdeaDetail, 'ideaId' | 'likeCnt' | 'likedYn'>>>('/idea/like.do', { ideaId })

  const fetchIdeaFilePreview = (ideaFileId: string) =>
    post<ChatFileViewResponse>('/idea/filePreview.do', { ideaFileId })

  return {
    fetchIdeaList,
    fetchIdeaDetail,
    fetchIdeaComments,
    saveIdeaComment,
    deleteIdeaComment,
    fetchSaveIdea,
    fetchDeleteIdea,
    fetchToggleIdeaLike,
    fetchIdeaFilePreview,
  }
}
