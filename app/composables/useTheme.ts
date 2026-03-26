export type ThemeMode = 'dark' | 'light' | 'auto'
export type ThemePalette = 'standard' | 'ocean' | 'forest' | 'sunset' | 'neon' | 'contrast'

export interface ThemeConfig {
  palette: ThemePalette
  mode: ThemeMode
}

export interface PaletteInfo {
  id: ThemePalette
  label: string
  description: string
}

const STORAGE_KEY = 'labben-theme'
const DEFAULT_CONFIG: ThemeConfig = { palette: 'standard', mode: 'dark' }

const PALETTES: PaletteInfo[] = [
  { id: 'standard', label: 'Standard', description: 'Varm amber och blågrå' },
  { id: 'ocean', label: 'Ocean', description: 'Djupt havsblått med cyan' },
  { id: 'forest', label: 'Forest', description: 'Skogsgrön med smaragd' },
  { id: 'sunset', label: 'Sunset', description: 'Varm lila med orange' },
  { id: 'neon', label: 'Neon', description: 'Svart med elektrisk neongrön' },
  { id: 'contrast', label: 'Kontrast', description: 'Hög kontrast för tillgänglighet' },
]

export function useTheme() {
  const config = useState<ThemeConfig>('theme-config', () => DEFAULT_CONFIG)
  const resolvedVariant = useState<'dark' | 'light'>('theme-resolved', () => 'dark')

  let mediaQuery: MediaQueryList | null = null

  /** Get the available palettes */
  function getPalettes(): PaletteInfo[] {
    return PALETTES
  }

  /** Resolve the actual variant (dark/light) based on mode and OS preference */
  function resolveVariant(mode: ThemeMode): 'dark' | 'light' {
    if (mode === 'auto') {
      if (import.meta.client) {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      }
      return 'dark'
    }
    return mode
  }

  /** Apply the current theme to the document */
  function applyTheme() {
    const variant = resolveVariant(config.value.mode)
    resolvedVariant.value = variant
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', `${config.value.palette}-${variant}`)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    }
  }

  /** Set the theme palette */
  function setPalette(palette: ThemePalette) {
    config.value = { ...config.value, palette }
    applyTheme()
  }

  /** Set the theme mode (dark/light/auto) */
  function setMode(mode: ThemeMode) {
    config.value = { ...config.value, mode }
    setupMediaListener()
    applyTheme()
  }

  /** Listen for OS theme changes when in auto mode */
  function setupMediaListener() {
    cleanupMediaListener()
    if (import.meta.client && config.value.mode === 'auto') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
      mediaQuery.addEventListener('change', applyTheme)
    }
  }

  /** Remove the OS theme change listener */
  function cleanupMediaListener() {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', applyTheme)
      mediaQuery = null
    }
  }

  /** Initialize theme from localStorage or default */
  function initTheme() {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as ThemeConfig
          if (parsed.palette && parsed.mode) {
            config.value = parsed
          }
        }
      } catch {
        // Invalid stored data — use defaults
      }
      setupMediaListener()
      applyTheme()
    }
  }

  onUnmounted(() => cleanupMediaListener())

  return { config, resolvedVariant, getPalettes, setPalette, setMode, initTheme }
}
