import type { BadgeVariant } from '@leechanyong/ispark-ui'
import { useRealtimeTranscription } from '~/composables/meeting/useRealtimeTranscription'
import { useSpeechRecognition } from '~/composables/meeting/useSpeechRecognition'

/**
 * 실시간 STT 현재 모드
 * - off: 녹음 전 / connecting: 연결 중 / openai: OpenAI Realtime 연결됨
 * - reconnecting: OpenAI 재연결 중 / webspeech: 브라우저 음성 인식(Web Speech)으로 전환됨
 * - none: 자막 사용 불가 (녹음은 계속)
 */
export type SttMode = 'off' | 'connecting' | 'openai' | 'reconnecting' | 'webspeech' | 'none'

export const useSttMode = () => {
  const { isRecording, connectionStatus } = useRealtimeTranscription()
  const { isRecording: isSpeechRecording } = useSpeechRecognition()

  const sttMode = computed<SttMode>(() => {
    if (!isRecording.value) return connectionStatus.value === 'connecting' ? 'connecting' : 'off'
    if (isSpeechRecording.value) return 'webspeech'
    if (connectionStatus.value === 'connected') return 'openai'
    if (connectionStatus.value === 'reconnecting') return 'reconnecting'
    if (connectionStatus.value === 'connecting') return 'connecting'
    return 'none'
  })

  /** 모드별 배지 라벨/색 — 에러처럼 보이지 않게 현재 인식 방식만 표시 */
  const sttBadge = computed(() => STT_MODE_BADGE[sttMode.value])

  return { sttMode, sttBadge }
}

const STT_MODE_BADGE: Record<SttMode, { label: string; variant: BadgeVariant }> = {
  off: { label: 'OFF', variant: 'default' },
  connecting: { label: '연결 중', variant: 'warning' },
  openai: { label: 'OpenAI', variant: 'success' },
  reconnecting: { label: '재연결 중', variant: 'warning' },
  webspeech: { label: '브라우저 음성 인식', variant: 'info' },
  none: { label: '자막 없음', variant: 'default' },
}
