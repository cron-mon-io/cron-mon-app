import { afterAll, afterEach, beforeAll, describe, vi, it, expect } from 'vitest'
import { VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createRouter, createWebHistory, type Router } from 'vue-router'

import App from '@/App.vue'
import routes from '@/router/routes'

import { FakeLocalStorage } from '@/utils/testing/fake-localstorage'
import { FakeVueCookies } from '@/utils/testing/fake-vue-cookies'
import { FakeClipboard } from '@/utils/testing/fake-clipboard'
import { setupTestAPI } from '@/utils/testing/test-api'

async function mountApp(): Promise<{ wrapper: VueWrapper; router: Router }> {
  const vuetify = createVuetify({ components, directives })
  const router = createRouter({
    history: createWebHistory(),
    routes: routes
  })
  router.push('/')
  await router.isReady()

  const fakeCookies = new FakeVueCookies()
  const wrapper = mount(App, {
    global: {
      plugins: [vuetify, router],
      provide: {
        $localStorage: new FakeLocalStorage(),
        $clipboard: new FakeClipboard(),
        $cookies: fakeCookies
      },
      mocks: {
        $cookies: fakeCookies
      },
      stubs: {
        highlightjs: true,

        // Couldn't stub scalar's ApiReference component for some reason so we're just stubbing the entire view.
        ApiView: { template: '<div class="fake-api-view">API docs</div>' }
      }
    }
  })
  await flushPromises()
  return { wrapper, router }
}

const mocks = vi.hoisted(() => {
  return {
    useAuth: vi.fn()
  }
})

vi.mock('@/composables/auth', () => ({
  useAuth: mocks.useAuth
}))

describe('The App', () => {
  beforeAll(() => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      openAccountManagement: vi.fn(),
      logout: vi.fn(() => Promise.resolve),
      getToken: vi.fn(() => undefined),
      isReady: vi.fn(() => Promise.resolve)
    })
  })

  afterAll(() => {
    mocks.useAuth.mockRestore()
  })

  it('renders home page as expected', async () => {
    const { wrapper } = await mountApp()

    // We should have a navigation drawer (1st item should be the CronMon logo, followed by 9 items)
    const navDrawerItems = wrapper.find('.v-navigation-drawer').findAll('.v-list-item')
    expect(navDrawerItems).toHaveLength(10)
    expect(navDrawerItems[0].find('img').attributes('src')).toBe('/src/assets/logo.svg')
    expect(navDrawerItems.slice(1, 10).map((item) => item.text())).toEqual([
      'Home',
      'Monitoring',
      'Monitors',
      'API Keys',
      'Docs',
      'Setup',
      'Integration',
      'API',
      'Hosting'
    ])

    // We should have a toolbar with an elipsis button and a theme picker in it.
    const toolbar = wrapper.find('.v-toolbar')
    const icons = toolbar.findAll('.v-btn')
    expect(icons).toHaveLength(2)
    expect(icons[0].find('.v-icon').classes()).toContain('mdi-chevron-left')
    expect(icons[1].find('.v-icon').classes()).toContain('mdi-white-balance-sunny')

    // We should have a footer with a link to the GitHub repo.
    const footer = wrapper.find('.v-footer')
    expect(footer.find('a').attributes('href')).toBe('https://github.com/cron-mon-io')

    // We should have a home page with a welcome message.
    const content = wrapper.find('.v-main > .v-card')
    expect(content.find('.v-card-title').text()).toBe('Welcome to CronMon BETA')
    expect(content.find('.v-card-text').text()).toMatch(
      /^CronMon is a simple, flexible monitoring tool that allows you to monitor your cron jobs/
    )
  })

  it('hides navdrawer when clicking on elipsis button', async () => {
    const { wrapper } = await mountApp()

    // Before clicking the elipsis button, the navigation drawer should be open.
    const navDrawer = wrapper.find('.v-navigation-drawer')
    let navDrawerClasses = navDrawer.classes()
    expect(navDrawerClasses).toContain('v-navigation-drawer--active')
    expect(navDrawerClasses).not.toContain('v-navigation-drawer--rail')

    const railButton = wrapper.find('.v-toolbar').findAll('.v-btn')[0]
    await railButton.trigger('click')
    await flushPromises() // Give time for the drawer to close.

    // After clicking the elipsis button, the navigation drawer should be closed.
    navDrawerClasses = navDrawer.classes()
    expect(navDrawerClasses).toContain('v-navigation-drawer--active')
    expect(navDrawerClasses).toContain('v-navigation-drawer--rail')

    // The navigation drawer should now have a smaller logo but the same number of items.
    const navDrawerItems = navDrawer.findAll('.v-list-item')
    expect(navDrawerItems).toHaveLength(10)
    expect(navDrawerItems[0].find('img').attributes('src')).toBe('/src/assets/icon.svg')
  })

  it('renders 404 page as expected', async () => {
    const { wrapper, router } = await mountApp()

    // Navigate to a non-existent page.
    await router.push('/non-existent-page')

    const content = wrapper.find('.v-main > .v-empty-state')
    expect(content.find('.v-empty-state__media > .v-icon').classes()).toContain(
      'mdi-robot-confused-outline'
    )
    expect(content.find('.v-empty-state__headline').text()).toBe('404')
    expect(content.find('.v-empty-state__title').text()).toBe('Page not found')
    expect(content.find('.v-empty-state__text').text()).toBe(
      'The page you were looking for does not exist'
    )
  })

  it('navigates through docs as expected', async () => {
    const { wrapper, router } = await mountApp()

    const getTitle = () => wrapper.find('.v-main > .v-card > .v-card-title').text()

    // Navigate to the docs/setup page.
    await router.push('/docs/setup')
    expect(getTitle()).toBe('Setup')

    // Navigate to the docs/integration page.
    await router.push('/docs/integration')
    expect(getTitle()).toBe('Integration')

    // Navigate to the docs/api page. Couldn't stub scalar's ApiReference component for some reason
    // so we're just stubbing the entire view.
    await router.push('/docs/api')
    expect(wrapper.find('.v-main > .fake-api-view').text()).toBe('API docs')

    // Navigate to the docs/hosting page.
    await router.push('/docs/hosting')
    expect(getTitle()).toBe('Hosting')
  })
})

describe('Interacting with Monitors', async () => {
  global.ResizeObserver = require('resize-observer-polyfill')
  const server = setupTestAPI('foo-token')

  const mockGetToken = vi.fn(() => 'foo-token')

  // Start server before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { firstName: 'Test User' },
      openAccountManagement: vi.fn(),
      logout: vi.fn(() => Promise.resolve),
      getToken: mockGetToken,
      isReady: vi.fn(() => Promise.resolve)
    })
  })

  // Close server after all tests
  afterAll(() => {
    server.close()
    mocks.useAuth.mockRestore()
  })

  // Reset handlers after each test `important for test isolation`
  afterEach(() => server.resetHandlers())

  it('navigates to specific monitors as expected', async () => {
    const { wrapper, router } = await mountApp()

    // Navigate to the monitors page.
    await router.push('/monitoring/monitors')
    await flushPromises()

    // Some auth assertions: ensure the toolbar displays the user's name and that we've called our getToken function.
    const toolbar = wrapper.find('.v-toolbar')
    expect(toolbar.text()).toBe('Hello, Test User')
    expect(mockGetToken).toHaveBeenCalledOnce()

    const firstMonitor = wrapper.find('.v-main').findAll('.v-card')[0]
    expect(firstMonitor.find('.v-card-title').text()).toBe('foo-backup.sh')

    // Navigate to the first monitor in the list.
    await router.push('/monitoring/monitors/cfe88463-5c04-4b43-b10f-1f508963cc5d')
    await flushPromises()

    const firstChip = wrapper.find('.v-main').findAll('.v-chip')[0]
    expect(firstChip.text()).toBe('Monitor ID: cfe88463-5c04-4b43-b10f-1f508963cc5d')
  })
})
