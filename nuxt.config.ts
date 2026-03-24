// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  css: [
    '~/assets/css/reset.css',
    '~/assets/css/variables.css',
    '~/assets/css/animations.css',
  ],

  modules: ['@nuxt/icon'],

  app: {
    head: {
      title: 'Labben',
      meta: [
        { name: 'description', content: 'Homelab management dashboard' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  nitro: {
    preset: 'node-server',
  },
})
