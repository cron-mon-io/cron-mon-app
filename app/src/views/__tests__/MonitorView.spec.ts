import { describe, it, expect, vi, type Mock } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { useRouter } from 'vue-router'

import MonitorView from '@/views/MonitorView.vue'

import { FakeMonitorRepository } from '@/utils/testing/fake-monitor-repo'
import { FakeVueCookies } from '@/utils/testing/fake-vue-cookies'
import { FakeClipboard } from '@/utils/testing/fake-clipboard'

async function mountMonitorView(confirm: boolean = true): Promise<{
  wrapper: VueWrapper
  clipboard: FakeClipboard
  repo: FakeMonitorRepository
}> {
  // The MonitorView component uses an async setup, so we need to wrap it in a
  // Suspense component to test it.
  const TestComponent = defineComponent({
    components: { MonitorView },
    template: '<Suspense><MonitorView/></Suspense>'
  })

  // The JobInfo component has its own tests, so we just want to stub it here so
  // we can test how we interact wit it.
  const FakeJobInfo = defineComponent({
    template: '<div class="fake-job-info">{{ job.job_id }}</div>',
    props: {
      job: Object
    }
  })

  // The SetupMonitorDialog component has its own tests, so we just want to
  // stub it here so we can test how we interact wit it.
  const FakeSetupMonitorDialog = defineComponent({
    template: '<div>Test dialog</div>',
    emits: ['dialog-complete'],
    props: ['dialogActive'],
    watch: {
      dialogActive(active: boolean) {
        if (active) {
          this.$emit('dialog-complete', {
            name: 'Monitor 1 with a new name',
            expected_duration: 1001,
            grace_duration: 101
          })
        }
      }
    }
  })

  // The ConfirmationDialog component has its own tests, so we just want to
  // stub it here so we can test how we interact wit it.
  const FakeConfirmationDialog = defineComponent({
    template: '<div>Test dialog</div>',
    emits: ['dialog-complete'],
    props: ['dialogActive'],
    watch: {
      dialogActive(active: boolean) {
        if (active) {
          this.$emit('dialog-complete', confirm)
        }
      }
    }
  })

  const TEST_MONITOR_DATA = {
    monitor_id: '547810d4-a636-4c1b-83e6-3e641391c84e',
    name: 'Monitor 1',
    expected_duration: 1000,
    grace_duration: 100,
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

  const fakeCookies = new FakeVueCookies()
  const clipboard = new FakeClipboard()
  const repo = new FakeMonitorRepository([TEST_MONITOR_DATA])
  const wrapper = mount(TestComponent, {
    global: {
      plugins: [createVuetify({ components, directives })],
      provide: {
        $monitorRepo: repo,
        $cookies: fakeCookies,
        $clipboard: clipboard
      },
      mocks: {
        $cookies: fakeCookies
      },
      stubs: {
        // We don't want to test the dialog itself as it has its own tests, just that it is opened.
        JobInfo: FakeJobInfo,
        SetupMonitorDialog: FakeSetupMonitorDialog,
        ConfirmationDialog: FakeConfirmationDialog
      }
    }
  })

  await flushPromises()
  return { wrapper, clipboard, repo }
}

describe('MonitorsView view', () => {
  vi.mock('vue-router', () => ({
    useRoute: vi.fn(() => ({
      params: {
        id: '547810d4-a636-4c1b-83e6-3e641391c84e'
      }
    })),
    useRouter: vi.fn(() => ({
      push: () => {}
    }))
  }))

  it('renders as expected', async () => {
    const { wrapper, clipboard } = await mountMonitorView()

    // We already test this in the MonitorSummary tests, so we just want to a quick sanity check here.
    expect(wrapper.find('.v-card-title').text()).toBe('Monitor 1')

    // We should have a chip that contains the monitor ID.
    const copyChip = wrapper.find('.v-chip')
    expect(copyChip.text()).toBe('Monitor ID: 547810d4-a636-4c1b-83e6-3e641391c84e')

    // Clicking it should copy the monitor ID.
    await copyChip.trigger('click')
    expect(await clipboard.readText()).toBe('547810d4-a636-4c1b-83e6-3e641391c84e')

    // We should have buttons for editting and deleting the monitor.
    const buttons = wrapper.findAll('.v-btn')
    expect(buttons[0].text()).toBe('Edit Monitor')
    expect(buttons[1].text()).toBe('Delete Monitor')

    // We should have a list of jobs.
    const jobs = wrapper.findAll('.fake-job-info').map((job) => job.text())
    expect(jobs).toEqual([
      '8990f2db-44e9-4a53-9f04-f2d0d39914e1',
      '706033aa-651f-4554-8b36-f292db8971c8'
    ])
  })

  it('deteched new jobs', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountMonitorView()

    const numJobs = wrapper.findAll('.fake-job-info').length

    // Add a new job to the monitor.
    repo.addJob('547810d4-a636-4c1b-83e6-3e641391c84e', {
      job_id: 'f7d2f35b-5f0a-4ce6-878a-4b29b11f7574',
      start_time: '2021-09-01T12:00:00Z',
      end_time: null,
      in_progress: true,
      duration: null,
      late: false,
      succeeded: null,
      output: null
    })

    // Let the MonitorView component detect the new job.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    const jobs = wrapper.findAll('.fake-job-info')
    expect(jobs).toHaveLength(numJobs + 1)
    const newJob = jobs[jobs.length - 1]
    expect(newJob.text()).toBe('f7d2f35b-5f0a-4ce6-878a-4b29b11f7574')

    vi.useRealTimers()
  })

  it('edits monitors as expected', async () => {
    const { wrapper } = await mountMonitorView()

    // Clicking the Edit button will trigger our test dialog, which will imediately
    // complete with new Monitor info.
    const addButton = wrapper.findAll('.v-btn')[0]
    await addButton.trigger('click')

    // Let the MonitorView component add the new monitor.
    await flushPromises()

    // The monitor should have been updated.
    expect(wrapper.find('.v-card-title').text()).toBe('Monitor 1 with a new name')
  })

  it('deletes monitors as expected', async () => {
    const push = vi.fn()
    const mockUseRouter = useRouter as Mock // We've mocked this above.
    mockUseRouter.mockImplementationOnce(() => ({
      push
    }))

    const { wrapper, repo } = await mountMonitorView()

    // Clicking the Delete button will trigger our test dialog, which will imediately
    // complete with new Monitor info.
    const addButton = wrapper.findAll('.v-btn')[1]
    await addButton.trigger('click')

    // Let the MonitorView component delete the monitor.
    await flushPromises()

    // The monitor should have been deleted.
    const monitor = await repo.getMonitor('547810d4-a636-4c1b-83e6-3e641391c84e')
    expect(monitor).toBeUndefined()

    // We should have been redirected to the Monitors view.
    expect(push).toHaveBeenCalledWith('/monitors')
  })

  it('does not delete monitors when delete is aborted', async () => {
    const push = vi.fn()
    const mockUseRouter = useRouter as Mock // We've mocked this above.
    mockUseRouter.mockImplementationOnce(() => ({
      push
    }))

    const { wrapper, repo } = await mountMonitorView(false)

    // Clicking the Delete button will trigger our test dialog, which will imediately
    // complete with new Monitor info.
    const addButton = wrapper.findAll('.v-btn')[1]
    await addButton.trigger('click')

    // Let the MonitorView component delete the monitor.
    await flushPromises()

    // The monitor should not have been deleted.
    const monitor = await repo.getMonitor('547810d4-a636-4c1b-83e6-3e641391c84e')
    expect(monitor).toBeDefined()

    // We should not have been redirected to the Monitors view.
    expect(push).not.toHaveBeenCalled()
  })

  it('stops syncing when the component is unmounted', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountMonitorView()

    const spy = vi.spyOn(repo, 'getMonitor')

    // Let the MonitorView component sync.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Ensure the sync happened. This is a sanity check to ensure the spy is
    // working and the test isn't evergreen.
    expect(spy.mock.calls).toHaveLength(1)

    // Unmount the component then allow enough time for another sync to happen.
    await wrapper.unmount()
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Ensure no more syncs happened.
    expect(spy.mock.calls).toHaveLength(1)

    vi.useRealTimers()
  })
})
