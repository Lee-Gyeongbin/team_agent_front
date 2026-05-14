// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: false },

  modules: ['@nuxt/eslint'],

  imports: {
    dirs: ['composables/**', 'utils/global/**'],
  },

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/styles/main.scss'],

  vite: {
    // Vite가 클라이언트에서 import.meta.server → false 치환 후에도
    // manifest.js dead branch의 import("#app-manifest")를 분석하며 실패하는 경우 대비
    // (@nuxt/vite-builder의 clientAliases와 동일, nuxt/nuxt#30461·#33606)
    resolve: {
      alias: {
        '#app-manifest': 'mocked-exports/empty',
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/assets/styles/utils/variables" as *;
            @use "@/assets/styles/utils/mixins" as *;
          `,
        },
      },
    },
  },

  devServer: {
    port: 3001,
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        ws: true,
      },
      '/ta-storage': {
        target: 'https://kr.object.ncloudstorage.com/ta-storage',
        changeOrigin: true,
      },
    },
  },

  app: {
    head: {
      title: 'TeamAgent',
      meta: [{ name: 'description', content: 'AI Agent Management Platform' }],
    },
  },
})
