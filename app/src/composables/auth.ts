import Keycloak from 'keycloak-js'
import { ref, type Ref, type ComputedRef, onMounted, computed } from 'vue'
import { useRouter, useRoute, type RouteLocationNormalizedGeneric } from 'vue-router'

export interface AuthenticatedUser {
  firstName: string
  lastName: string
  email: string
}

export interface Auth {
  isAuthenticated: Readonly<ComputedRef<boolean | undefined>>
  user: Readonly<Ref<AuthenticatedUser | null>>
  openAccountManagement: () => void
  logout: () => Promise<void>
  getToken: () => string | undefined
  isReady: () => Promise<void>
}

// TODO: Write tests for this.
export function useAuth(protectedRoutes: string[]): Auth {
  const keycloak = new Keycloak({
    url: 'http://127.0.0.1:8080',
    realm: 'cron-mon-io',
    clientId: 'cron-mon'
  })

  let ready = false
  const router = useRouter()
  const route = useRoute()
  const user = ref<{
    firstName: string
    lastName: string
    email: string
  } | null>(null)

  setInterval(async () => {
    if (!keycloak.authenticated) {
      return
    }

    try {
      const refreshed = await keycloak.updateToken(30)
      if (refreshed) {
        console.log('Token refreshed')
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
    }
  }, 60000)

  onMounted(async () => {
    await keycloak.init({ redirectUri: window.location.href })

    console.log(`User authenticated: ${keycloak.authenticated}`)

    setupUser()

    await router.isReady()
    await loginIfRequired(route)

    router.beforeEach(async (to, _from) => await loginIfRequired(to))
    ready = true
  })

  async function loginIfRequired(route: RouteLocationNormalizedGeneric): Promise<void> {
    if (keycloak.authenticated || !protectedRoutes.includes(route.name as string)) {
      return
    }

    try {
      await keycloak.login({
        redirectUri: window.location.origin + route.fullPath
      })
    } catch (error) {
      console.error('Failed to login:', error)
    }

    setupUser()
  }

  function setupUser(): void {
    user.value = keycloak.authenticated
      ? {
          firstName: keycloak.tokenParsed?.given_name,
          lastName: keycloak.tokenParsed?.family_name,
          email: keycloak.tokenParsed?.email
        }
      : null
  }

  return {
    isAuthenticated: computed(() => keycloak.authenticated),
    user,
    openAccountManagement() {
      keycloak.accountManagement()
    },
    async logout(): Promise<void> {
      user.value = null
      keycloak.authenticated = false
      const redirectUri = protectedRoutes.includes(route.name as string)
        ? window.location.origin
        : window.location.href
      await keycloak.logout({ redirectUri: redirectUri })
    },
    getToken() {
      return keycloak.token
    },
    async isReady() {
      return new Promise<void>((resolve) => {
        if (ready) {
          resolve()
        } else {
          const interval = setInterval(() => {
            if (ready) {
              clearInterval(interval)
              resolve()
            }
          }, 100)
        }
      })
    }
  }
}
