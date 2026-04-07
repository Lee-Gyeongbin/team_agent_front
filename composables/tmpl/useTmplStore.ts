import { useTmplApi } from '~/composables/tmpl/useTmplApi'
import type { TmplBaseInfo, TmplFormSavePayload } from '~/types/tmpl'

const { fetchTmplList, fetchSaveTmpl, fetchDeleteTmpl } = useTmplApi()

const tmplList = ref<TmplBaseInfo[]>([])

/** 사용자 템플릿 목록 조회 */
const handleSelectTmplList = async () => {
  try {
    const res = await fetchTmplList()
    tmplList.value = res.dataList ?? []
  } catch {
    openToast({ message: '템플릿 목록 조회 실패', type: 'error' })
  }
}

/** 템플릿 저장 */
const handleSaveTmpl = async (payload: TmplFormSavePayload, hooks?: { onSaved?: () => void }) => {
  openConfirm({
    message: '템플릿을 저장하시겠습니까?',
    onConfirm: async () => {
      try {
        openLoading({ message: '템플릿을 저장하는 중입니다...' })
        await fetchSaveTmpl(payload)
        await handleSelectTmplList()
        closeLoading()
        openToast({ message: '템플릿이 저장되었습니다.', type: 'success' })
        hooks?.onSaved?.()
      } catch {
        openAlert({ message: '템플릿 저장 실패' })
      }
    },
  })
}

/** 템플릿 삭제 */
const handleDeleteTmpl = async (tmplId: string) => {
  openConfirm({
    message: '템플릿을 삭제하시겠습니까?',
    onConfirm: async () => {
      try {
        await fetchDeleteTmpl(tmplId)
        await handleSelectTmplList()
        openAlert({ message: '템플릿이 삭제되었습니다.' })
      } catch {
        openAlert({ message: '템플릿 삭제 실패' })
      }
    },
  })
}

export const useTmplStore = () => {
  return {
    tmplList,
    handleSelectTmplList,
    handleSaveTmpl,
    handleDeleteTmpl,
  }
}
