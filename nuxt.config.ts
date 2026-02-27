// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: false },

  modules: ['@nuxt/eslint'],

  imports: {
    dirs: ['composables/**'],
  },

  css: ['~/assets/styles/main.scss'],

  vite: {
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
    },
  },

  app: {
    head: {
      title: 'TeamAgent',
      meta: [{ name: 'description', content: 'AI Agent Management Platform' }],
    },
  },
})
