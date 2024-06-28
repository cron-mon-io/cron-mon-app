import { describe, it, expect, vi } from 'vitest'
import { VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import MonitorsView from '@/views/MonitorsView.vue'

import { FakeMonitorRepository } from '@/utils/testing/fake-monitor-repo'
import { FakeVueCookies } from '@/utils/testing/fake-vue-cookies'

async function mountMonitorsView(errors: string[] = []): Promise<{
  wrapper: VueWrapper
  cookies: FakeVueCookies
  repo: FakeMonitorRepository
}> {
  const vuetify = createVuetify({ components, directives })

  // The MonitorsView component uses an async setup, so we need to wrap it in a
  // Suspense component to test it.
  const TestComponent = defineComponent({
    components: { MonitorsView },
    template: '<Suspense><MonitorsView/></Suspense>'
  })

  const TestDialog = defineComponent({
    template: '<div>Test dialog</div>',
    emits: ['dialog-complete'],
    props: ['dialogActive'],
    watch: {
      dialogActive(active: boolean) {
        if (active) {
          this.$emit('dialog-complete', {
            name: 'New Monitor',
            expected_duration: 1000,
            grace_duration: 100
          })
        }
      }
    }
  })

  const TEST_MONITOR_DATA = [
    {
      monitor_id: '547810d4-a636-4c1b-83e6-3e641391c84e',
      name: 'Monitor 1',
      expected_duration: 1000,
      grace_duration: 100,
      jobs: [],
      last_finished_job: null,
      last_started_job: null
    },
    {
      monitor_id: 'fd940a34-684c-4c15-b914-ca7180aa5c8b',
      name: 'Monitor 2',
      expected_duration: 3600,
      grace_duration: 600,
      jobs: [
        {
          job_id: '8990f2db-44e9-4a53-9f04-f2d0d39914e1',
          start_time: '2024-06-15T12:00:00',
          end_time: null,
          duration: null,
          in_progress: true,
          late: false,
          succeeded: null,
          output: null
        },
        {
          job_id: '706033aa-651f-4554-8b36-f292db8971c8',
          start_time: '2024-06-14T12:00:00',
          end_time: '2024-06-14T13:02:00',
          duration: 3720,
          in_progress: false,
          late: true,
          succeeded: null,
          output: null
        }
      ],
      last_finished_job: {
        job_id: '706033aa-651f-4554-8b36-f292db8971c8',
        start_time: '2024-06-14T12:00:00',
        end_time: '2024-06-14T13:02:00',
        duration: 3720,
        in_progress: false,
        late: true,
        succeeded: null,
        output: null
      },
      last_started_job: {
        job_id: '8990f2db-44e9-4a53-9f04-f2d0d39914e1',
        start_time: '2024-06-15T12:00:00',
        end_time: null,
        duration: null,
        in_progress: true,
        late: false,
        succeeded: null,
        output: null
      }
    }
  ]

  const cookies = new FakeVueCookies()
  const repo = new FakeMonitorRepository(TEST_MONITOR_DATA, errors)
  const wrapper = mount(TestComponent, {
    global: {
      plugins: [vuetify],
      provide: {
        $monitorRepo: repo,
        $cookies: cookies
      },
      mocks: {
        $cookies: cookies
      },
      stubs: {
        // We don't want to test the dialog itself as it has its own tests, just that it is opened.
        SetupMonitorDialog: TestDialog
      }
    }
  })

  await flushPromises()

  return { wrapper, cookies, repo }
}

describe('MonitorsView view', () => {
  vi.mock('vue-router', () => ({
    useRoute: vi.fn(),
    useRouter: vi.fn(() => ({
      push: () => {}
    }))
  }))

  it('renders as expected', async () => {
    const { wrapper } = await mountMonitorsView()

    // Should have a button for creating new monitors.
    const button = wrapper.find('.v-btn')
    expect(button.text()).toBe('Add Monitor')

    // Should have a list of monitors.
    const monitors = wrapper.findAll('.v-card').map((card) => card.find('.v-card-title').text())
    expect(monitors).toEqual(['Monitor 1', 'Monitor 2'])
  })

  it('adds new monitors as expected', async () => {
    const { wrapper, cookies } = await mountMonitorsView()

    const numMonitors = wrapper.findAll('.v-card').length

    // Clicking the add button will trigger our test dialog, which will imediately complete with new Monitor info.
    const addButton = wrapper.find('.v-btn')
    await addButton.trigger('click')

    // Let the MonitorsView component add the new monitor.
    await flushPromises()

    // We should have one more monitor than we started with.
    const monitors = wrapper.findAll('.v-card')
    expect(monitors).toHaveLength(numMonitors + 1)

    // Ensure we have the new monitor in the list, with the 'new' flag
    const newMonitor = monitors[monitors.length - 1]
    expect(newMonitor.find('.v-card-title').text()).toBe('New Monitor')
    expect(newMonitor.find('.mdi-new-box')).toBeTruthy()
    expect(cookies.keys()).toHaveLength(1)
  })

  it('detects new monitors when they are added externally', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountMonitorsView()

    const numMonitors = wrapper.findAll('.v-card').length

    // Add new monitor 'externally'
    await repo.addMonitor({
      name: 'New Monitor added externally',
      expected_duration: 1000,
      grace_duration: 100
    })

    // Let the MonitorsView component detect the new monitor.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // We should have one more monitor than we started with.
    const monitors = wrapper.findAll('.v-card')
    expect(monitors).toHaveLength(numMonitors + 1)
    const newMonitor = monitors[monitors.length - 1]
    expect(newMonitor.find('.v-card-title').text()).toBe('New Monitor added externally')

    vi.useRealTimers()
  })

  it('stops syncing when the component is unmounted', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountMonitorsView()

    const spy = vi.spyOn(repo, 'getMonitorInfos')

    // Let the MonitorsView component sync.
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

describe('MonitorsView listing monitors with errors', () => {
  it('does not show an error alert when the monitor repository has no errors', async () => {
    const { wrapper } = await mountMonitorsView()

    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
  })

  it('shows an error alert when the monitor repository has errors', async () => {
    const { wrapper } = await mountMonitorsView(['Test error message'])

    const alert = wrapper.find('.v-alert').find('.api-alert-content')
    expect(alert.find('span').text()).toBe('Test error message')

    // The alert should have a Retry button.
    expect(alert.find('.v-btn').text()).toBe('Retry')

    // Adding new monitors should be disabled whilst we're in a state of error.
    const button = wrapper.findAll('.v-btn').filter((button) => button.text() === 'Add Monitor')[0]
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('clears the error alert when the retry button is clicked', async () => {
    const { wrapper } = await mountMonitorsView(['Test error message'])

    const alert = wrapper.find('.v-alert')
    await alert.find('.v-btn').trigger('click')

    await flushPromises()

    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
  })

  it('automatically clears the alert when next sync is successful', async () => {
    vi.useFakeTimers()

    const { wrapper } = await mountMonitorsView(['Test error message'])

    // Ensure the alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeTruthy()

    // Let the MonitorsView component sync again.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure the alert is gone.
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()

    vi.useRealTimers()
  })

  it('shows alert when error happens after successful sync', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountMonitorsView()

    // Let the MonitorsView component sync.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure no alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()

    // Add an error to the repo.
    repo.addError('Test error message')

    // Let the MonitorsView component sync again.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure the alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeTruthy()

    vi.useRealTimers()
  })
})

describe('MonitorsView adding new monitors with errors', () => {
  it('shows an error alert when the monitor repository has errors', async () => {
    const { wrapper, repo } = await mountMonitorsView()

    repo.addError('Failed to add new Monitor')

    const addButton = wrapper.find('.v-btn')
    await addButton.trigger('click')

    await flushPromises()

    const alert = wrapper.find('.v-alert')
    expect(alert.find('.api-alert-content').find('span').text()).toBe('Failed to add new Monitor')

    // The alert should have a close button.
    const closeButton = alert.find('.v-btn')
    expect(closeButton.find('.mdi').classes()).toContain('mdi-close')

    // Clicking the close button should clear the alert.
    await closeButton.trigger('click')
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
  })

  it('displays multiple alerts if following sync fails', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountMonitorsView()

    repo.addError('Failed to add new Monitor')
    repo.addError('Could not retrieve Monitors')

    const addButton = wrapper.find('.v-btn')
    await addButton.trigger('click')

    await flushPromises()

    // Ensure 1st alert is visible.
    let alerts = wrapper
      .findAll('.v-alert')
      .map((alert) => alert.find('.api-alert-content').find('span').text())
    expect(alerts).toEqual(['Failed to add new Monitor'])

    // Let the MonitorsView component sync again.
    vi.advanceTimersByTime(5 * 60 * 1000)
    await flushPromises()

    // Ensure the previous alert and the new alert are visible.
    alerts = wrapper
      .findAll('.v-alert')
      .map((alert) => alert.find('.api-alert-content').find('span').text())
    expect(alerts).toEqual(['Could not retrieve Monitors', 'Failed to add new Monitor'])

    vi.useRealTimers()
  })
})
