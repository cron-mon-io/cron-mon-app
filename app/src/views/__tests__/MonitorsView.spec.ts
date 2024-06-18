import { describe, it, expect, vi } from 'vitest'
import { VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import MonitorsView from '@/views/MonitorsView.vue'

import { FakeMonitorRepository } from '@/utils/testing/fake-monitor-repo'
import { FakeVueCookies } from '@/utils/testing/fake-vue-cookies'

async function mountMonitorsView(): Promise<{
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
  const repo = new FakeMonitorRepository(TEST_MONITOR_DATA)
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
})
