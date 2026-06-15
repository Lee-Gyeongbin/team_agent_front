import type { AgtSubAdditionalConfig, TranslateLanguageOption, TranslateToneOption } from '~/types/agent'

/** Agent 설정 UI — TRANSLATE ADDITIONAL_CONFIG 편집 필드 */
export interface TranslateConfigForm {
  introTitle: string
  introSubtitle: string
  textPlaceholder: string
  submitLabel: string
  languages: TranslateLanguageOption[]
  tones: TranslateToneOption[]
  fileEnabled: boolean
  fileAcceptExt: string[]
}

const DEFAULT_LANGUAGES: TranslateLanguageOption[] = [
  { label: '한국어', value: 'ko' },
  { label: '영어', value: 'en' },
  { label: '일본어', value: 'ja' },
  { label: '중국어(간체)', value: 'zh' },
]

const DEFAULT_TONES: TranslateToneOption[] = [
  { label: '비즈니스(격식)', value: 'business' },
  { label: '자연스럽게', value: 'natural' },
  { label: '직역', value: 'literal' },
]

const DEFAULT_ACCEPT_EXT = ['.docx', '.txt']

const cloneOptions = <T extends { label: string; value: string }>(options: T[]): T[] => options.map((o) => ({ ...o }))

/** 신규 TRANSLATE 에이전트 기본값 */
export const emptyTranslateConfigForm = (): TranslateConfigForm => ({
  introTitle: '번역',
  introSubtitle: '번역할 내용을 입력하거나 파일을 업로드해 주세요.',
  textPlaceholder: '번역할 텍스트를 입력하세요.',
  submitLabel: '번역하기',
  languages: cloneOptions(DEFAULT_LANGUAGES),
  tones: cloneOptions(DEFAULT_TONES),
  fileEnabled: true,
  fileAcceptExt: [...DEFAULT_ACCEPT_EXT],
})

const parseOptionList = <T extends { label: string; value: string }>(raw: unknown, fallback: T[]): T[] => {
  if (!Array.isArray(raw) || raw.length === 0) return cloneOptions(fallback)
  return raw.map((item) => {
    const row = item as Record<string, unknown>
    return {
      label: String(row.label ?? ''),
      value: String(row.value ?? ''),
    } as T
  })
}

const parseStringArray = (raw: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map(String).filter(Boolean)
}

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseTranslateAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): TranslateConfigForm => {
  if (!config || typeof config !== 'object') return emptyTranslateConfigForm()

  const ui = (config.ui ?? {}) as Record<string, unknown>
  const file = (config.file ?? {}) as Record<string, unknown>
  const empty = emptyTranslateConfigForm()

  return {
    introTitle: String(ui.introTitle ?? empty.introTitle),
    introSubtitle: String(ui.introSubtitle ?? empty.introSubtitle),
    textPlaceholder: String(ui.textPlaceholder ?? empty.textPlaceholder),
    submitLabel: String(ui.submitLabel ?? empty.submitLabel),
    languages: parseOptionList(config.languages, empty.languages),
    tones: parseOptionList(config.tones, empty.tones),
    fileEnabled: file.enabled !== false,
    fileAcceptExt: parseStringArray(file.acceptExt, empty.fileAcceptExt),
  }
}

/** 설정 폼 + 기존 JSON → 저장용 ADDITIONAL_CONFIG */
export const buildTranslateAdditionalConfig = (
  form: TranslateConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const base = {
    agentType: 'translate' as const,
    ui: {
      introTitle: form.introTitle.trim(),
      introSubtitle: form.introSubtitle.trim(),
      textPlaceholder: form.textPlaceholder.trim(),
      submitLabel: form.submitLabel.trim(),
    },
    languages: form.languages
      .filter((l) => l.value.trim() && l.label.trim())
      .map((l) => ({ label: l.label.trim(), value: l.value.trim() })),
    tones: form.tones
      .filter((t) => t.value.trim() && t.label.trim())
      .map((t) => ({ label: t.label.trim(), value: t.value.trim() })),
    file: {
      enabled: form.fileEnabled,
      acceptExt: form.fileAcceptExt.map((e) => e.trim()).filter(Boolean),
    },
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base } as AgtSubAdditionalConfig
  }

  return base
}
