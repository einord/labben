/**
 * SSRF protection: validates that a URL is safe for server-side requests.
 * Blocks internal/private network addresses and non-HTTP protocols.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',
])

const BLOCKED_IPV6 = new Set([
  '[::1]',
  '[0:0:0:0:0:0:0:1]',
])

/**
 * Check if an IPv4 address falls within a private/reserved CIDR range.
 * Returns true if the address should be blocked.
 */
function isBlockedIPv4(hostname: string): boolean {
  const parts = hostname.split('.')
  if (parts.length !== 4) return false

  const octets = parts.map(Number)
  if (octets.some(o => isNaN(o) || o < 0 || o > 255)) return false

  const a = octets[0]!
  const b = octets[1]!

  // 127.0.0.0/8 — loopback
  if (a === 127) return true

  // 10.0.0.0/8 — private
  if (a === 10) return true

  // 172.16.0.0/12 — private (172.16.x.x – 172.31.x.x)
  if (a === 172 && b >= 16 && b <= 31) return true

  // 192.168.0.0/16 — private
  if (a === 192 && b === 168) return true

  // 169.254.0.0/16 — link-local / cloud metadata
  if (a === 169 && b === 254) return true

  // 0.0.0.0/8 — reserved
  if (a === 0) return true

  return false
}

/**
 * Validate that a URL is safe for server-side requests.
 * Blocks private/internal network addresses and non-HTTP protocols to prevent SSRF attacks.
 * Note: this validates the hostname string only — it does not resolve DNS, so a domain that
 * resolves to 127.0.0.1 would pass. Acceptable for a homelab app with trusted admin users.
 *
 * @throws Error if the URL is invalid, uses a blocked protocol, or targets a private/internal address
 */
export function validateExternalUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Invalid URL: ${url}`)
  }

  // Only allow HTTP(S)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Blocked protocol "${parsed.protocol}" — only http: and https: are allowed`)
  }

  const hostname = parsed.hostname.toLowerCase()

  // Check explicit blocklist
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error(`Blocked hostname "${hostname}" — internal/private addresses are not allowed`)
  }

  // Check IPv6 loopback (hostname includes brackets from URL parsing)
  if (BLOCKED_IPV6.has(hostname) || BLOCKED_IPV6.has(`[${hostname}]`)) {
    throw new Error(`Blocked hostname "${hostname}" — IPv6 loopback addresses are not allowed`)
  }

  // Check IPv4 private/reserved ranges
  if (isBlockedIPv4(hostname)) {
    throw new Error(`Blocked hostname "${hostname}" — private/internal IP addresses are not allowed`)
  }
}
