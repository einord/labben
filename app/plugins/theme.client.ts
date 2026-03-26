export default defineNuxtPlugin(() => {
  try {
    const stored = localStorage.getItem('labben-theme')
    if (stored) {
      const config = JSON.parse(stored) as { palette?: string; mode?: string }
      const palette = config.palette ?? 'standard'
      const mode = config.mode ?? 'dark'
      const variant = mode === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : mode
      document.documentElement.setAttribute('data-theme', `${palette}-${variant}`)
    } else {
      document.documentElement.setAttribute('data-theme', 'standard-dark')
    }
  } catch {
    document.documentElement.setAttribute('data-theme', 'standard-dark')
  }
})
