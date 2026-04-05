const SENSITIVE_ENV_PATTERNS = /^[^=]*(PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|ACCESS_KEY|PRIVATE_KEY|CREDENTIALS|AUTH)=/i

/** Mask sensitive environment variable values while preserving the variable name */
export function maskSensitiveEnvVars(envVars: string[]): string[] {
  return envVars.map((entry) => {
    if (SENSITIVE_ENV_PATTERNS.test(entry)) {
      const eqIndex = entry.indexOf('=')
      if (eqIndex === -1) return entry
      return `${entry.slice(0, eqIndex)}=****`
    }
    return entry
  })
}
