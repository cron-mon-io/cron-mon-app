import { describe, it, expect, vi, type Mock } from 'vitest'
import { VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import AlertsView from '../AlertsView.vue'
import { type AlertConfig } from '@/types/alert-config'
import { type AlertConfigRepoInterface } from '@/repos/alert-config-repo'

import { FakeVueCookies } from '@/utils/testing/fake-vue-cookies'

function getTestAlertConfigData(): AlertConfig[] {
  return [
    {
      alert_config_id: '547810d4-a636-4c1b-83e6-3e641391c84e',
      name: 'Alert Config 1',
      active: true,
      on_late: true,
      on_error: false,
      monitors: [
        {
          monitor_id: '9fcbdeee-416e-427d-8fef-614c4bc52b4a',
          name: 'Monitor 1'
        }
      ],
      type: {
        Slack: {
          token: 'fake-slack',
          channel: '#fake-channel'
        }
      }
    },
    {
      alert_config_id: 'fd940a34-684c-4c15-b914-ca7180aa5c8b',
      name: 'Alert Config 2',
      active: true,
      on_late: false,
      on_error: true,
      monitors: [
        {
          monitor_id: '9fcbdeee-416e-427d-8fef-614c4bc52b4a',
          name: 'Monitor 1'
        }
      ],
      type: {
        Slack: {
          token: 'fake-slack',
          channel: '#fake-channel'
        }
      }
    }
  ]
}

async function mountAlertsView(errors: string[] = []): Promise<{
  wrapper: VueWrapper
  cookies: FakeVueCookies
  repo: AlertConfigRepoInterface
}> {
  const vuetify = createVuetify({ components, directives })

  const testAlertConfigData = getTestAlertConfigData()
  const repo = {
    getAlertConfigs: vi.fn().mockImplementation((_) => {
      if (errors.length > 0) {
        return Promise.reject(new Error(errors.shift() as string))
      }
      return Promise.resolve(testAlertConfigData)
    }),
    getAlertConfig: vi.fn(),
    addAlertConfig: vi.fn(),
    updateAlertConfig: vi.fn(),
    deleteAlertConfig: vi.fn()
  }

  const cookies = new FakeVueCookies()
  const wrapper = mount(AlertsView, {
    global: {
      plugins: [vuetify],
      provide: {
        $getAlertConfigRepo: () => repo,
        $cookies: cookies
      },
      mocks: {
        $cookies: cookies
      }
    }
  })

  await flushPromises()

  return { wrapper, cookies, repo }
}

describe('AlertsView view', () => {
  vi.mock('vue-router', () => ({
    useRoute: vi.fn(),
    useRouter: vi.fn(() => ({
      push: () => {}
    }))
  }))

  it('renders as expected', async () => {
    const { wrapper } = await mountAlertsView()

    // Should have a button for creating new alerts.
    const button = wrapper.find('.v-btn')
    expect(button.text()).toBe('Setup New Alert')

    // Should have a list of alert configs.
    const monitors = wrapper
      .find('.v-card')
      .findAll('.v-card')
      .map((card) => card.find('.v-card-title').text())
    expect(monitors).toEqual(['Alert Config 1', 'Alert Config 2'])
  })

  it('detects new alert configs when they are added externally', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountAlertsView()

    const numAlertConfigs = wrapper.find('.v-card').findAll('.v-card').length

    // Add new alert config 'externally'
    const testAlertConfigs = getTestAlertConfigData()
    testAlertConfigs.push({
      alert_config_id: '5469ab0d-a32b-4a37-8b6b-db1ee479b95f',
      name: 'New alert config added externally',
      active: true,
      on_late: true,
      on_error: true,
      monitors: [],
      type: {
        Slack: {
          token: 'fake-slack-bot-token',
          channel: '#fake-channel'
        }
      }
    })
    ;(repo.getAlertConfigs as Mock).mockResolvedValue(testAlertConfigs)

    // Let the AlertsView component detect the new alert config.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // We should have one more alert config than we started with.
    const alertConfigs = wrapper.find('.v-card').findAll('.v-card')
    expect(alertConfigs).toHaveLength(numAlertConfigs + 1)
    const newAlertConfig = alertConfigs[alertConfigs.length - 1]
    expect(newAlertConfig.find('.v-card-title').text()).toBe('New alert config added externally')

    vi.useRealTimers()
  })

  it('stops syncing when the component is unmounted', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountAlertsView()

    const spy = vi.spyOn(repo, 'getAlertConfigs')

    // Let the AlertsView component sync.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure the sync happened. This is a sanity check to ensure the spy is
    // working and the test isn't evergreen.
    expect(spy.mock.calls).toHaveLength(1)

    // Unmount the component then allow enough time for another sync to happen.
    await wrapper.unmount()
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure no more syncs happened.
    expect(spy.mock.calls).toHaveLength(1)

    vi.useRealTimers()
  })
})

describe('AlertsView listing monitors with errors', () => {
  it('does not show an error alert when the alert config repository has no errors', async () => {
    const { wrapper } = await mountAlertsView()
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
  })

  it('shows an error alert when the alert config repository has errors', async () => {
    const { wrapper } = await mountAlertsView(['Test error message'])
    const alert = wrapper.find('.v-alert').find('.api-alert-content')
    expect(alert.find('span').text()).toBe('Test error message')
    // The alert should have a Retry button.
    expect(alert.find('.v-btn').text()).toBe('Retry')
    // Adding new alert configs should be disabled whilst we're in a state of error.
    const button = wrapper.findAll('.v-btn').find((button) => button.text() === 'Setup New Alert')
    expect(button?.attributes('disabled')).toBeDefined()
  })

  it('clears the error alert when the retry button is clicked', async () => {
    const { wrapper } = await mountAlertsView(['Test error message'])
    const alert = wrapper.find('.v-alert')
    await alert.find('.v-btn').trigger('click')
    await flushPromises()
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
  })

  it('automatically clears the alert when next sync is successful', async () => {
    vi.useFakeTimers()
    const { wrapper } = await mountAlertsView(['Test error message'])
    // Ensure the alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeTruthy()
    // Let the AlertsView component sync again.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()
    // Ensure the alert is gone.
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
    vi.useRealTimers()
  })

  it('shows alert when error happens after successful sync', async () => {
    vi.useFakeTimers()
    const { wrapper, repo } = await mountAlertsView()

    // Let the AlertsView component sync.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure no alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()

    // Add an error to the repo.
    ;(repo.getAlertConfigs as Mock).mockRejectedValue(new Error('Test error message'))

    // Let the AlertsView component sync again.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure the alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeTruthy()
    vi.useRealTimers()
  })
})
