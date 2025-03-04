export type AuthConfig = {
  url: string
  realm: string
  client: string
}

export async function getAuthConfig(): Promise<AuthConfig> {
  // If we running in dev mode, there won't be an /auth-config endpoint.
  if (import.meta.env.MODE === 'development') {
    return {
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      client: import.meta.env.VITE_KEYCLOAK_CLIENT_ID
    }
  }

  const response = await fetch('/auth-config')
  if (!response.ok) {
    throw new Error('Failed to fetch auth config')
  }

  const config = await response.json()
  validateAuthConfig(config)
  return config
}

function validateAuthConfig(config: Record<string, unknown>): void {
  if (
    !(
      typeof config.url === 'string' &&
      typeof config.realm === 'string' &&
      typeof config.client === 'string'
    )
  ) {
    throw new Error('Invalid auth config')
  }
}
