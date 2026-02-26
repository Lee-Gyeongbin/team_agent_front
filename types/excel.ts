import type { Ref } from 'vue'

export interface HealthResponse {
  status?: string
  message?: string
  [key: string]: unknown
}

export interface HealthState {
  healthData: Ref<string>
  healthLoading: Ref<boolean>
  healthError: Ref<string>
}
