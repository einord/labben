import { parse, stringify } from 'yaml'

/** Error thrown when compose YAML content fails validation. */
export class ComposeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ComposeValidationError'
  }
}

interface ComposeFile {
  /** Optional explicit project name */
  name?: string
  services?: Record<string, { image?: string; [key: string]: unknown }>
  networks?: Record<string, unknown>
  volumes?: Record<string, unknown>
  [key: string]: unknown
}

/** Parse a docker-compose.yml string into a typed object */
export function parseCompose(content: string): ComposeFile {
  return (parse(content) as ComposeFile) ?? {}
}

/** Serialize a compose object back to YAML */
export function stringifyCompose(data: ComposeFile): string {
  return stringify(data, { lineWidth: 0 })
}

/** Validate that content is valid YAML for a docker-compose file. Throws ComposeValidationError if invalid. */
export function validateComposeYaml(content: string): void {
  try {
    const result = parse(content)
    if (result === null || typeof result !== 'object' || Array.isArray(result)) {
      throw new ComposeValidationError('Compose file must be a YAML mapping (object), not a scalar or list')
    }
  } catch (err) {
    if (err instanceof ComposeValidationError) {
      throw err
    }
    const message = err instanceof Error ? err.message : String(err)
    throw new ComposeValidationError(`Invalid YAML syntax: ${message}`)
  }
}

/** Extract all service image names from a compose file string */
export function getServiceImages(content: string): string[] {
  const compose = parseCompose(content)
  if (!compose.services) return []
  return Object.values(compose.services)
    .map(service => service.image)
    .filter((image): image is string => typeof image === 'string')
}
