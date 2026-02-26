// Nuxt가 자동 생성한 ESLint 기본 설정을 가져옴
import withNuxt from './.nuxt/eslint.config.mjs'
// Prettier 규칙을 ESLint에서 실행 (충돌 방지 + 포맷 검사)
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

export default withNuxt(eslintPluginPrettier, {
  rules: {
    // --- Vue ---
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/no-v-html': 'warn',
    // --- TypeScript ---
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // --- General ---
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
  },
})
