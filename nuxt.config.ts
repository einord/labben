// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  devServer: {
    port: 3005,
  },

  css: [
    '~/assets/css/reset.css',
    '~/assets/css/variables.css',
    '~/assets/css/themes/standard.css',
    '~/assets/css/themes/ocean.css',
    '~/assets/css/themes/forest.css',
    '~/assets/css/themes/sunset.css',
    '~/assets/css/themes/neon.css',
    '~/assets/css/themes/contrast.css',
    '~/assets/css/animations.css',
  ],

  modules: ['@nuxt/icon', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'sv', name: 'Svenska', file: 'sv.json' },
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'labben-locale',
      fallbackLocale: 'en',
    },
  },

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  icon: {
    mode: 'css',
  },

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
    externals: {
      inline: [],
      external: ['dockerode', 'better-sqlite3', '@simplewebauthn/server', 'node-cron'],
    },
  },
})
