import { useApi } from '~/composables/com/useApi'
import { useApi_multipart } from '~/composables/com/useApi_multipart'
import type {
  InsertOrgPayload,
  OrgItem,
  OrgExcelUploadResponse,
  OrgUserListResponse,
  UpdateOrgPayload,
  UpdateOrgSortOrderPayload,
} from '~/types/org-manage'
import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'
import { formatYyyyMmDdFromDate } from '~/utils/global/dateUtil'

/** 조직 목록 조회 */
export const useOrgManageApi = () => {
  const { get, post, getBlob } = useApi()

  const fetchOrgList = async (): Promise<OrgItem[]> => {
    const res = await get<{ list?: OrgItem[] }>('/orgmanage/selectOrgList.do')
    return res.list ?? []
  }

  const fetchSelectOrgUserList = async (orgId: string): Promise<OrgUserListResponse> => {
    return post<OrgUserListResponse>('/orgmanage/selectUserList.do', { orgId })
  }

  const fetchInsertOrg = async (payload: InsertOrgPayload): Promise<{ successYn?: boolean; returnMsg?: string }> => {
    return post<{ successYn?: boolean; returnMsg?: string }>('/orgmanage/insertOrg.do', payload)
  }

  const fetchUpdateOrg = async (payload: UpdateOrgPayload): Promise<{ successYn?: boolean; returnMsg?: string }> => {
    return post<{ successYn?: boolean; returnMsg?: string }>('/orgmanage/updateOrg.do', payload)
  }

  const fetchUpdateOrgOrder = async (
    payload: UpdateOrgSortOrderPayload,
  ): Promise<{ successYn?: boolean; returnMsg?: string }> => {
    return post<{ successYn?: boolean; returnMsg?: string }>('/orgmanage/updateOrgSortOrder.do', payload)
  }

  const fetchDeleteOrg = async (orgId: string): Promise<{ successYn?: boolean; returnMsg?: string }> => {
    return post<{ successYn?: boolean; returnMsg?: string }>('/orgmanage/deleteOrg.do', { orgId })
  }

  /** 조직도 엑셀 다운로드 */
  const fetchDownloadOrgExcel = async (): Promise<void> => {
    const blob = await getBlob('/orgmanage/downloadOrgExcel.do')
    const fileName = `${formatYyyyMmDdFromDate(new Date())}_조직도.xlsx`
    downloadBlobAsFile(blob, fileName)
  }

  /** 조직도 엑셀 업로드 */
  const fetchUploadOrgExcel = async (file: File): Promise<OrgExcelUploadResponse> => {
    const formData = new FormData()
    formData.append('uploadFile', file)
    return useApi_multipart<OrgExcelUploadResponse>('/orgmanage/uploadOrgExcel.do', {
      method: 'POST',
      body: formData,
    })
  }

  return {
    fetchOrgList,
    fetchSelectOrgUserList,
    fetchInsertOrg,
    fetchUpdateOrg,
    fetchUpdateOrgOrder,
    fetchDeleteOrg,
    fetchDownloadOrgExcel,
    fetchUploadOrgExcel,
  }
}
