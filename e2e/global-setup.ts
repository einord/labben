import { rm, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Clean the test database before each test run to ensure fresh state.
 * This means the app starts in "setup mode" (no users).
 */
export default async function globalSetup() {
  const testDataDir = join(__dirname, '.data')
  await rm(testDataDir, { recursive: true, force: true })
  await mkdir(testDataDir, { recursive: true })
  await mkdir(join(__dirname, '.auth'), { recursive: true })
}
