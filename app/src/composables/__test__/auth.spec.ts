import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import { useAuth } from '@/composables/auth'

interface MockRoute {
  name: string
}

const mocks = vi.hoisted(() => {
  return {
    Keycloak: vi.fn(),
    routerIsReady: vi.fn().mockResolvedValue(true),
    // Not actually a mock, but used to capture the beforeEach function.
    beforePush: (_to: MockRoute, _from: MockRoute) => {}
  }
})

vi.mock('keycloak-js', () => {
  return {
    default: mocks.Keycloak
  }
})

vi.mock('vue-router', () => ({
  useRouter: vi.fn().mockReturnValue({
    isReady: mocks.routerIsReady,
    // Set the beforeEach mock function.
    beforeEach: vi.fn().mockImplementation((fn) => (mocks.beforePush = fn))
  }),
  useRoute: vi.fn().mockReturnValue({
    name: '/protected'
  }),
  type: {
    RouteLocationNormalizedGeneric: {}
  }
}))

const TestComponent = defineComponent({
  props: {
    protectedRoutes: {
      type: Array<string>,
      required: true
    }
  },
  setup(props) {
    return {
      ...useAuth(props.protectedRoutes)
    }
  }
})

describe('useAuth composable when user not previously authenticated', () => {
  interface MockKeycloak {
    init: () => Promise<{ authenticated: boolean }>
    login: () => Promise<void>
    updateToken: () => Promise<boolean>
    authenticated: boolean
    tokenParsed: {
      given_name: string | null
      family_name: string | null
      email: string | null
    }
  }
  const mockKeycloak: MockKeycloak = {
    init: vi.fn().mockResolvedValue({ authenticated: false }),
    login: vi.fn().mockImplementation(async () => {
      mockKeycloak.authenticated = true
      mockKeycloak.tokenParsed = {
        given_name: 'Joe',
        family_name: 'Bloggs',
        email: 'joe@email.com'
      }
    }),
    updateToken: vi.fn().mockResolvedValue(true),
    authenticated: false,
    tokenParsed: {
      given_name: null,
      family_name: null,
      email: null
    }
  }
  afterEach(() => {
    mocks.Keycloak.mockRestore()
    ;(mockKeycloak.init as any).mockClear()
    ;(mockKeycloak.login as any).mockClear()
    mockKeycloak.authenticated = false
    mockKeycloak.tokenParsed = {
      given_name: null,
      family_name: null,
      email: null
    }
  })
  beforeEach(() => {
    mocks.Keycloak.mockReturnValue(mockKeycloak)
  })

  it('does not log in user when on unprotected route', async () => {
    vi.useFakeTimers()

    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes: ['/foo']
      }
    })
    await flushPromises()

    expect(mockKeycloak.init).toHaveBeenCalled()
    expect(mockKeycloak.login).not.toHaveBeenCalled()
    expect(wrapper.vm.user).toBeNull()

    // Shouldn't have a token at this point, and shouldn't have tried to refresh it.
    expect(wrapper.vm.getToken()).toBeUndefined()
    vi.advanceTimersByTime(30 * 60 * 1000)
    expect(wrapper.vm.getToken()).toBeUndefined()

    vi.useRealTimers()
  })

  it('logs in user when on protected route', async () => {
    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes: ['/protected']
      }
    })
    await flushPromises()

    expect(mockKeycloak.init).toHaveBeenCalled()
    expect(mockKeycloak.login).toHaveBeenCalled()
    expect(wrapper.vm.user).toEqual({
      firstName: 'Joe',
      lastName: 'Bloggs',
      email: 'joe@email.com'
    })
  })

  it('logs in user when navigating to protected route', async () => {
    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes: ['/foo']
      }
    })
    await flushPromises()

    expect(mockKeycloak.init).toHaveBeenCalled()
    expect(mockKeycloak.login).not.toHaveBeenCalled()
    expect(wrapper.vm.user).toBeNull()

    expect(mocks.beforePush).not.toBeNull()
    await mocks.beforePush({ name: '/foo' }, { name: '/protected' })

    await flushPromises()

    expect(wrapper.vm.user).toEqual({
      firstName: 'Joe',
      lastName: 'Bloggs',
      email: 'joe@email.com'
    })
    expect(mockKeycloak.login).toHaveBeenCalled()
  })

  it('handles login failure', async () => {
    mockKeycloak.login = vi.fn().mockRejectedValue(new Error('Login failed'))

    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes: ['/protected']
      }
    })
    await flushPromises()

    expect(mockKeycloak.init).toHaveBeenCalled()
    expect(mockKeycloak.login).toHaveBeenCalled()
    expect(wrapper.vm.user).toBeNull()
  })

  it('isReady when immediately ready', async () => {
    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes: ['/protected']
      }
    })
    await flushPromises()

    await wrapper.vm.isReady()
    // If we get here we're good.
  })

  it('isReady when not immediately ready', async () => {
    mocks.routerIsReady.withImplementation(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return true
      },
      async () => {
        vi.useFakeTimers()
        const wrapper = mount(TestComponent, {
          props: {
            protectedRoutes: ['/protected']
          }
        })
        await flushPromises()

        const prom = wrapper.vm.isReady()
        vi.advanceTimersByTime(200)
        await prom
        // If we get here we're good.

        vi.useRealTimers()
      }
    )
  })
})

describe('useAuth composable when user is previously authenticated', () => {
  const mockKeycloak = {
    init: vi.fn().mockResolvedValue({ authenticated: true }),
    login: vi.fn(),
    logout: vi.fn(),
    updateToken: vi.fn().mockImplementation(async () => {
      mockKeycloak.token += 'bar'
      return true
    }),
    accountManagement: vi.fn(),
    authenticated: true,
    token: 'foo-token',
    tokenParsed: {
      given_name: 'Joe',
      family_name: 'Bloggs',
      email: 'joe@email.com'
    }
  }

  afterEach(() => {
    mockKeycloak.init.mockClear()
    mockKeycloak.login.mockClear()
    mockKeycloak.logout.mockClear()
    mockKeycloak.accountManagement.mockClear()
    mockKeycloak.updateToken.mockClear()

    mocks.routerIsReady.mockClear()
    mocks.Keycloak.mockRestore()
  })
  beforeEach(() => {
    vi.stubGlobal('location', {
      href: 'http://cron-mon.io/protected',
      origin: 'http://cron-mon.io',
      assign: vi.fn()
    })

    mocks.Keycloak.mockReturnValue(mockKeycloak)
  })

  it('authenticates user without making them login again', async () => {
    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes: ['/protected']
      }
    })

    expect(wrapper.vm.user).toBeNull()

    await flushPromises()

    expect(wrapper.vm.user).toEqual({
      firstName: 'Joe',
      lastName: 'Bloggs',
      email: 'joe@email.com'
    })
    expect(mockKeycloak.init).toHaveBeenCalled()
    expect(mockKeycloak.login).not.toHaveBeenCalled()
  })

  it('refreshes token', async () => {
    vi.useFakeTimers()

    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes: ['/protected']
      }
    })
    await flushPromises()

    const initialToken = wrapper.vm.getToken()
    expect(initialToken).toBeDefined()

    vi.advanceTimersByTime(30 * 60 * 1000)

    expect(mockKeycloak.updateToken).toHaveBeenCalledWith(30)

    const newToken = wrapper.vm.getToken()
    expect(newToken).toBeDefined()
    expect(newToken).not.toEqual(initialToken)

    vi.useRealTimers
  })

  it('handles refresh token failure', () => {
    mockKeycloak.updateToken.withImplementation(
      async () => {
        throw new Error('Failed to refresh token')
      },
      async () => {
        vi.useFakeTimers()

        const wrapper = mount(TestComponent, {
          props: {
            protectedRoutes: ['/protected']
          }
        })
        await flushPromises()

        const initialToken = wrapper.vm.getToken()
        expect(initialToken).toBeDefined()

        vi.advanceTimersByTime(60 * 1000)

        expect(mockKeycloak.updateToken).toHaveBeenCalled()
        expect(mockKeycloak.updateToken).toHaveBeenCalledWith(30)

        // Should still be authenticated, but the token should be the same.
        expect(mockKeycloak.authenticated).toBe(true)
        const newToken = wrapper.vm.getToken()
        expect(newToken).toEqual(initialToken)

        vi.useRealTimers()
      }
    )
  })

  it.each([
    { protectedRoutes: ['/protected'], redirectUri: 'http://cron-mon.io' },
    { protectedRoutes: ['/foo'], redirectUri: 'http://cron-mon.io/protected' }
  ])('logs out user', async ({ protectedRoutes, redirectUri }) => {
    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes
      }
    })
    await flushPromises()

    await wrapper.vm.logout()

    expect(wrapper.vm.user).toBeNull()
    expect(wrapper.vm.isAuthenticated).toBe(false)
    expect(mockKeycloak.logout).toHaveBeenLastCalledWith({ redirectUri })
  })

  it('opens account management', async () => {
    const wrapper = mount(TestComponent, {
      props: {
        protectedRoutes: ['/protected']
      }
    })
    await flushPromises()

    await wrapper.vm.openAccountManagement()

    expect(mockKeycloak.accountManagement).toHaveBeenCalled()
  })
})
