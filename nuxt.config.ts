// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: false },

  modules: ['@nuxt/eslint'],

  css: ['~/assets/scss/main.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "~/assets/scss/_variables.scss" as *;
            @use "~/assets/scss/_mixins.scss" as *;
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
