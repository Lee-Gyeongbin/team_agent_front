import { useApi } from '~/composables/com/useApi'
import { useApi_multipart } from '~/composables/com/useApi_multipart'
import type {
  RoleExcelKind,
  RoleExcelUploadResponse,
  RoleItem,
  RoleMenuItem,
  RoleUserItem,
  SaveRolePayload,
} from '~/types/role-manage'
import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'
import { formatYyyyMmDdFromDate } from '~/utils/global/dateUtil'

/** 성공 여부(successYn)가 false면 returnMsg로 Error를 던진다 */
const assertSuccess = <T extends { successYn?: boolean; returnMsg?: string }>(res: T, fallbackMsg: string): T => {
  if (res?.successYn === false) {
    throw new Error(String(res.returnMsg ?? fallbackMsg))
  }
  return res
}

const EXCEL_API: Record<RoleExcelKind, { download: string; upload: string; fileName: string }> = {
  role: {
    download: '/rolemanage/downloadRoleExcel.do',
    upload: '/rolemanage/uploadRoleExcel.do',
    fileName: '권한그룹목록',
  },
  user: {
    download: '/rolemanage/downloadRoleUserExcel.do',
    upload: '/rolemanage/uploadRoleUserExcel.do',
    fileName: '사용자권한목록',
  },
}

export const useRoleManageApi = () => {
  const { get, post, getBlob } = useApi()

  /** 권한 그룹 목록 조회 */
  const fetchRoleList = async (): Promise<RoleItem[]> => {
    const res = assertSuccess(
      await get<{ successYn?: boolean; returnMsg?: string; list?: RoleItem[] }>('/rolemanage/selectRoleList.do'),
      '권한 그룹 목록 조회에 실패했습니다.',
    )
    return res.list ?? []
  }

  /** 권한 그룹 단건 + 메뉴별 권한 조회 (roleId가 비어 있으면 신규 등록용 빈 권한) */
  const fetchRole = async (roleId: string): Promise<{ data: RoleItem | null; menuList: RoleMenuItem[] }> => {
    const res = assertSuccess(
      await post<{ successYn?: boolean; returnMsg?: string; data?: RoleItem | null; menuList?: RoleMenuItem[] }>(
        '/rolemanage/selectRole.do',
        { roleId },
      ),
      '권한 그룹 조회에 실패했습니다.',
    )
    return { data: res.data ?? null, menuList: res.menuList ?? [] }
  }

  /** 권한 그룹 저장 (등록/수정 + 메뉴별 권한) — 저장된 roleId 반환 */
  const fetchSaveRole = async (payload: SaveRolePayload): Promise<string> => {
    const res = assertSuccess(
      await post<{ successYn?: boolean; returnMsg?: string; roleId?: string }>('/rolemanage/saveRole.do', payload),
      '권한 그룹 저장에 실패했습니다.',
    )
    return String(res.roleId ?? payload.roleId)
  }

  /** 권한 그룹 삭제 */
  const fetchDeleteRole = async (roleId: string): Promise<void> => {
    assertSuccess(
      await post<{ successYn?: boolean; returnMsg?: string }>('/rolemanage/deleteRole.do', { roleId }),
      '권한 그룹 삭제에 실패했습니다.',
    )
  }

  /** 권한 그룹 사용자 목록 조회 */
  const fetchRoleUserList = async (roleId: string): Promise<RoleUserItem[]> => {
    const res = assertSuccess(
      await post<{ successYn?: boolean; returnMsg?: string; list?: RoleUserItem[] }>(
        '/rolemanage/selectRoleUserList.do',
        { roleId },
      ),
      '권한 그룹 사용자 조회에 실패했습니다.',
    )
    return res.list ?? []
  }

  /** 조직(하위 조직 포함) 사용자 목록 조회 — 사용 중인 사용자만 */
  const fetchOrgUserList = async (orgId: string, nameKeyword = ''): Promise<RoleUserItem[]> => {
    const res = assertSuccess(
      await post<{ successYn?: boolean; returnMsg?: string; list?: RoleUserItem[] }>(
        '/rolemanage/selectOrgUserList.do',
        { orgId, nameKeyword },
      ),
      '직원 목록 조회에 실패했습니다.',
    )
    return res.list ?? []
  }

  /** 권한 그룹 사용자 저장 */
  const fetchSaveRoleUser = async (roleId: string, userIdList: string[]): Promise<void> => {
    assertSuccess(
      await post<{ successYn?: boolean; returnMsg?: string }>('/rolemanage/saveRoleUser.do', { roleId, userIdList }),
      '권한 그룹 사용자 저장에 실패했습니다.',
    )
  }

  /** 엑셀 다운로드 (권한 그룹 / 사용자별 권한) */
  const fetchDownloadExcel = async (kind: RoleExcelKind): Promise<void> => {
    const { download, fileName } = EXCEL_API[kind]
    const blob = await getBlob(download)
    downloadBlobAsFile(blob, `${formatYyyyMmDdFromDate(new Date())}_${fileName}.xlsx`)
  }

  /** 엑셀 업로드 (권한 그룹 / 사용자별 권한) */
  const fetchUploadExcel = async (kind: RoleExcelKind, file: File): Promise<RoleExcelUploadResponse> => {
    const formData = new FormData()
    formData.append('uploadFile', file)
    return useApi_multipart<RoleExcelUploadResponse>(EXCEL_API[kind].upload, { method: 'POST', body: formData })
  }

  return {
    fetchRoleList,
    fetchRole,
    fetchSaveRole,
    fetchDeleteRole,
    fetchRoleUserList,
    fetchOrgUserList,
    fetchSaveRoleUser,
    fetchDownloadExcel,
    fetchUploadExcel,
  }
}
