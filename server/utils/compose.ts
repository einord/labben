import { parse, stringify } from 'yaml'

interface ComposeFile {
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

/** Extract all service image names from a compose file string */
export function getServiceImages(content: string): string[] {
  const compose = parseCompose(content)
  if (!compose.services) return []
  return Object.values(compose.services)
    .map(service => service.image)
    .filter((image): image is string => typeof image === 'string')
}
