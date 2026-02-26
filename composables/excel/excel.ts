import type { HealthResponse, HealthState } from '~/types/excel'
const { get } = useApi()
export const useHealthCheck = (): HealthState => {
  
  const healthData = ref<string>('')
  const healthLoading = ref(true)
  const healthError = ref('')

  onMounted(async () => {
    try {
      const data = await get<HealthResponse | string>('/health.do')
      healthData.value =
        typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    } catch (e) {
      healthError.value = e instanceof Error ? e.message : '연결에 실패했습니다'
    } finally {
      healthLoading.value = false
    }
  })

  return { healthData, healthLoading, healthError }
}
