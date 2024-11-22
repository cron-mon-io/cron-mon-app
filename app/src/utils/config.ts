export type AuthConfig = {
  url: string
  realm: string
  client: string
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const response = await fetch('/auth-config')
  if (!response.ok) {
    throw new Error('Failed to fetch auth config')
  }

  const config = await response.json()
  validateAuthConfig(config)
  return config
}

function validateAuthConfig(config: any): void {
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