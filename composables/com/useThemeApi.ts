import type { ColorItem, IconItem } from '~/types/theme.ts'
import { useApi } from '~/composables/com/useApi'

const { get } = useApi()

export const useThemeApi = () => {
  /** 테마 옵션 조회 */
  const fetchThemeOptions = async (): Promise<{ iconList: IconItem[]; colorList: ColorItem[] }> => {
    return get<{ iconList: IconItem[]; colorList: ColorItem[] }>('/comThemeOptions.do')
  }

  return {
    fetchThemeOptions,
  }
}
