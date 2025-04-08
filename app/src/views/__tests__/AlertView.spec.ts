import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
// import { useRouter } from 'vue-router'

import AlertView from '@/views/AlertView.vue'

import { FakeAlertConfigRepo } from '@/utils/testing/fake-alert-config-repo'
import { FakeVueCookies } from '@/utils/testing/fake-vue-cookies'

async function mountAlertView(
  confirm: boolean = true,
  errors: string[] = []
): Promise<{
  wrapper: VueWrapper
  repo: FakeAlertConfigRepo
}> {
  // The ConfirmationDialog component has its own tests, so we just want to
  // stub it here so we can test how we interact wit it.
  const FakeConfirmationDialog = defineComponent({
    props: {
      dialogActive: {
        type: Boolean,
        required: true
      }
    },
    emits: ['dialog-complete'],
    methods: {
      finish() {
        this.$emit('dialog-complete', confirm)
      }
    },
    template: `
      <div class="fake-confirmation-dialog">
        <div v-if="dialogActive" class="content">
          Test dialog
          <button @click="finish" />
        </div>
      </div>`
  })

  const TEST_ALERT_CONFIG_DATA = {
    alert_config_id: '547810d4-a636-4c1b-83e6-3e641391c84e',
    name: 'Alert Config 1',
    active: true,
    on_late: true,
    on_error: false,
    monitors: [
      {
        monitor_id: '9fcbdeee-416e-427d-8fef-614c4bc52b4a',
        name: 'Monitor 1'
      },
      {
        monitor_id: '706033aa-651f-4554-8b36-f292db8971c8',
        name: 'Monitor 2'
      }
    ],
    type: {
      Slack: {
        token: 'fake-slack',
        channel: '#fake-channel'
      }
    }
  }

  const fakeCookies = new FakeVueCookies()
  const repo = new FakeAlertConfigRepo([TEST_ALERT_CONFIG_DATA], errors)
  const wrapper = mount(AlertView, {
    global: {
      plugins: [createVuetify({ components, directives })],
      provide: {
        $getAlertConfigRepo: () => repo,
        $getAlertConfigService: () => vi.fn(),
        $cookies: fakeCookies
      },
      mocks: {
        $cookies: fakeCookies
      },
      stubs: {
        // We don't want to test the dialog itself as it has its own tests, just that it is opened.
        ConfirmationDialog: FakeConfirmationDialog
      }
    }
  })

  await flushPromises()
  return { wrapper, repo }
}

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

describe('AlertView view', () => {
  it('renders as expected', async () => {
    const { wrapper } = await mountAlertView()

    // We already test this in the AlertConfigBrief tests, so we just want to a quick sanity check here.
    expect(wrapper.find('.v-card-title').text()).toBe('Alert Config 1')

    // We should have an 'Edit Alert' button after the 3 chips under the title. Note we have to go through
    // the card twice to get to the button. This is because the AlertConfigBrief component renders a
    // v-card, which is then wrapped in another v-card by the AlertView component.
    // console.log(wrapper.find('.v-card').html())
    const editButton = wrapper.find('.v-card').find('.v-card-text').find('.v-btn')
    expect(editButton.text()).toBe('Edit Alert')

    const buttons = wrapper.find('.v-card').find('[data-test="footer-buttons"]').findAll('.v-btn')
    expect(buttons.map((button) => button.text())).toEqual(['Test Alert', 'Delete Alert'])

    // We should have a table of monitors using this alert.
    const monitors = wrapper.find('.v-table').findAll('tbody tr')
    expect(monitors).toHaveLength(2)
    expect(monitors[0].find('td').text()).toBe('Monitor 1')
    expect(monitors[1].find('td').text()).toBe('Monitor 2')

    // TODO - Ensure we have view and unlike buttons for each row.
  })

  //   it('detects new jobs', async () => {
  //     vi.useFakeTimers()

  //     const { wrapper, repo } = await mountMonitorView()

  //     const numJobs = wrapper.findAll('.fake-job-info').length

  //     // Add a new job to the monitor.
  //     repo.addJob('547810d4-a636-4c1b-83e6-3e641391c84e', {
  //       job_id: 'f7d2f35b-5f0a-4ce6-878a-4b29b11f7574',
  //       start_time: '2021-09-01T12:00:00Z',
  //       end_time: null,
  //       in_progress: true,
  //       duration: null,
  //       late: false,
  //       succeeded: null,
  //       output: null
  //     })

  //     // Let the MonitorView component detect the new job.
  //     vi.advanceTimersByTime(1 * 60 * 1000)
  //     await flushPromises()

  //     const jobs = wrapper.findAll('.fake-job-info')
  //     expect(jobs).toHaveLength(numJobs + 1)
  //     const newJob = jobs[jobs.length - 1]
  //     expect(newJob.text()).toBe('f7d2f35b-5f0a-4ce6-878a-4b29b11f7574')

  //     vi.useRealTimers()
  //   })

  //   it('edits monitors as expected', async () => {
  //     const { wrapper } = await mountMonitorView()

  //     // Dialog should not be open.
  //     const dialog = wrapper.find('.fake-setup-monitor-dialog')
  //     expect(dialog.find('.content').exists()).toBeFalsy()

  //     // Clicking the Edit button will trigger our test dialog.
  //     const addButton = wrapper.findAll('.v-btn')[0]
  //     await addButton.trigger('click')
  //     await flushPromises()

  //     // The dialog should now be open and should contain the ID of our monitor.
  //     const dialogContent = dialog.find('.content')
  //     expect(dialogContent.exists()).toBeTruthy()
  //     expect(dialogContent.find('p').text()).toBe('547810d4-a636-4c1b-83e6-3e641391c84e')

  //     // Clicking the dialog's button will close the dialog, at which point the
  //     // MonitorView component will update the monitor.
  //     await dialogContent.find('button').trigger('click')
  //     await flushPromises()

  //     expect(dialog.find('.content').exists()).toBeFalsy()

  //     // The monitor should have been updated.
  //     expect(wrapper.find('.v-card-title').text()).toBe('Monitor 1 with a new name')
  //   })

  //   it('deletes monitors as expected', async () => {
  //     const push = vi.fn()
  //     const mockUseRouter = useRouter as Mock // We've mocked this above.
  //     mockUseRouter.mockImplementationOnce(() => ({
  //       push
  //     }))

  //     const { wrapper, repo } = await mountMonitorView()

  //     // Dialog should not be open.
  //     const dialog = wrapper.find('.fake-confirmation-dialog')
  //     expect(dialog.find('.content').exists()).toBeFalsy()

  //     // Clicking the Delete button will trigger our test dialog.
  //     const deleteButton = wrapper.findAll('.v-btn')[1]
  //     await deleteButton.trigger('click')
  //     await flushPromises()

  //     // The dialog should now be open and should contain the ID of our monitor.
  //     const dialogContent = dialog.find('.content')
  //     expect(dialogContent.exists()).toBeTruthy()

  //     // Clicking the dialog's button will close the dialog, at which point the
  //     // MonitorView component should delete the monitor.
  //     await dialogContent.find('button').trigger('click')
  //     await flushPromises()

  //     expect(dialog.find('.content').exists()).toBeFalsy()

  //     // The monitor should have been deleted.
  //     await expect(
  //       async () => await repo.getMonitor('547810d4-a636-4c1b-83e6-3e641391c84e')
  //     ).rejects.toThrowError("Failed to find monitor with id '547810d4-a636-4c1b-83e6-3e641391c84e'")

  //     // We should have been redirected to the Monitors view.
  //     expect(push).toHaveBeenCalledWith('/monitors')
  //   })

  //   it('does not delete monitors when delete is aborted', async () => {
  //     const push = vi.fn()
  //     const mockUseRouter = useRouter as Mock // We've mocked this above.
  //     mockUseRouter.mockImplementationOnce(() => ({
  //       push
  //     }))

  //     const { wrapper, repo } = await mountMonitorView(false)

  //     // Clicking the Delete button will trigger our test dialog, which will imediately
  //     // complete with new Monitor info.
  //     const addButton = wrapper.findAll('.v-btn')[1]
  //     await addButton.trigger('click')

  //     // Let the MonitorView component delete the monitor.
  //     await flushPromises()

  //     // The monitor should not have been deleted.
  //     const monitor = await repo.getMonitor('547810d4-a636-4c1b-83e6-3e641391c84e')
  //     expect(monitor).toBeDefined()

  //     // We should not have been redirected to the Monitors view.
  //     expect(push).not.toHaveBeenCalled()
  //   })

  //   it('stops syncing when the component is unmounted', async () => {
  //     vi.useFakeTimers()

  //     const { wrapper, repo } = await mountMonitorView()

  //     const spy = vi.spyOn(repo, 'getMonitor')

  //     // Let the MonitorView component sync.
  //     vi.advanceTimersByTime(1 * 60 * 1000)
  //     await flushPromises()

  //     // Ensure the sync happened. This is a sanity check to ensure the spy is
  //     // working and the test isn't evergreen.
  //     expect(spy.mock.calls).toHaveLength(1)

  //     // Unmount the component then allow enough time for another sync to happen.
  //     await wrapper.unmount()
  //     vi.advanceTimersByTime(1 * 60 * 1000)
  //     await flushPromises()

  //     // Ensure no more syncs happened.
  //     expect(spy.mock.calls).toHaveLength(1)

  //     vi.useRealTimers()
  //   })
})

// describe('MonitorView listing monitor and its jobs with errors', () => {
//   it('does not show an error alert when the monitor repository has no errors', async () => {
//     const { wrapper } = await mountMonitorView()

//     expect(wrapper.find('.v-alert').exists()).toBeFalsy()
//   })

//   it('shows an error alert when the monitor repository has errors', async () => {
//     const { wrapper } = await mountMonitorView(true, ['Test error message'])

//     const alert = wrapper.find('.v-alert').find('.api-alert-content')
//     expect(alert.find('span').text()).toBe('Test error message')

//     // The alert should have a Retry button.
//     expect(alert.find('.v-btn').text()).toBe('Retry')
//   })

//   it('clears the error alert when the retry button is clicked', async () => {
//     const { wrapper } = await mountMonitorView(true, ['Test error message'])

//     const alert = wrapper.find('.v-alert')
//     await alert.find('.v-btn').trigger('click')

//     await flushPromises()

//     expect(wrapper.find('.v-alert').exists()).toBeFalsy()
//   })

//   it('automatically clears the alert when next sync is successful', async () => {
//     vi.useFakeTimers()

//     const { wrapper } = await mountMonitorView(true, ['Test error message'])

//     // Ensure the alert is visible.
//     expect(wrapper.find('.v-alert').exists()).toBeTruthy()

//     // Let the MonitorView component sync again.
//     vi.advanceTimersByTime(1 * 60 * 1000)
//     await flushPromises()

//     // Ensure the alert is gone.
//     expect(wrapper.find('.v-alert').exists()).toBeFalsy()

//     vi.useRealTimers()
//   })

//   it('shows alert when error happens after successful sync', async () => {
//     vi.useFakeTimers()

//     const { wrapper, repo } = await mountMonitorView()

//     // Let the MonitorView component sync.
//     vi.advanceTimersByTime(1 * 60 * 1000)
//     await flushPromises()

//     // Ensure no alert is visible.
//     expect(wrapper.find('.v-alert').exists()).toBeFalsy()

//     // Add an error to the repo.
//     repo.addError('Test error message')

//     // Let the MonitorView component sync again.
//     vi.advanceTimersByTime(1 * 60 * 1000)
//     await flushPromises()

//     // Ensure the alert is visible.
//     expect(wrapper.find('.v-alert').exists()).toBeTruthy()

//     // editing and deleting monitors should be disabled whilst we're in a state of error.
//     const buttons = wrapper.findAll('.v-btn')
//     const editButton = buttons.find((button) => button.text() === 'Edit Monitor')
//     const deleteButton = buttons.find((button) => button.text() === 'Delete Monitor')
//     expect(editButton?.attributes('disabled')).toBeDefined()
//     expect(deleteButton?.attributes('disabled')).toBeDefined()

//     vi.useRealTimers()
//   })

//   it('shows alert when the monitor is deleted externally', async () => {
//     vi.useFakeTimers()

//     const { wrapper, repo } = await mountMonitorView()

//     // Let the MonitorView component sync.
//     vi.advanceTimersByTime(1 * 60 * 1000)
//     await flushPromises()

//     // Ensure no alert is visible.
//     expect(wrapper.find('.v-alert').exists()).toBeFalsy()

//     // Delete the monitor outside of the component.
//     await repo.deleteMonitor(await repo.getMonitor('547810d4-a636-4c1b-83e6-3e641391c84e'))

//     // Let the MonitorView component sync again.
//     vi.advanceTimersByTime(1 * 60 * 1000)
//     await flushPromises()

//     // Ensure the alert is visible.
//     expect(wrapper.find('.v-alert').exists()).toBeTruthy()

//     // editing and deleting monitors should be disabled whilst we're in a state of error.
//     const buttons = wrapper.findAll('.v-btn')
//     const editButton = buttons.find((button) => button.text() === 'Edit Monitor')
//     const deleteButton = buttons.find((button) => button.text() === 'Delete Monitor')
//     expect(editButton?.attributes('disabled')).toBeDefined()
//     expect(deleteButton?.attributes('disabled')).toBeDefined()

//     vi.useRealTimers()
//   })
// })

// describe('MonitorView editing and deleting monitors with errors', () => {
//   it.each([
//     { iconClass: '.mdi-pencil', dialogClass: '.fake-setup-monitor-dialog' },
//     { iconClass: '.mdi-delete', dialogClass: '.fake-confirmation-dialog' }
//   ])(
//     'shows an error alert when the monitor cannot be editted/ deleted',
//     async ({ iconClass, dialogClass }) => {
//       const { wrapper, repo } = await mountMonitorView()

//       repo.addError('Test error message')

//       // Trigger an edit or deletion.
//       const button = wrapper.find(iconClass)
//       await button.trigger('click')
//       await flushPromises()
//       const dialogButton = wrapper.find(dialogClass).find('button')
//       await dialogButton.trigger('click')
//       await flushPromises()

//       const alert = wrapper.find('.v-alert')
//       expect(alert.find('.api-alert-content').find('span').text()).toBe('Test error message')

//       // The alert shouldn't have a Retry button, just a close button.
//       const alertButton = alert.find('.v-btn')
//       expect(alertButton.text()).not.toBe('Retry')
//       expect(alertButton.find('.mdi').classes()).toContain('mdi-close')

//       // Closing the alert should get rid of it, and nothing should be retried.
//       repo.addError('We should not see this error message')
//       await alertButton.trigger('click')
//       await flushPromises()
//       expect(wrapper.find('.v-alert').exists()).toBeFalsy()
//     }
//   )

//   it('shows multiple error alerts if monitor cannot be editted, deleted, or resynced', async () => {
//     const { wrapper, repo } = await mountMonitorView()

//     repo.addError('Failed to edit')

//     // Trigger an edit.
//     const editButton = wrapper.find('.mdi-pencil')
//     await editButton.trigger('click')
//     await flushPromises()
//     const editDialogButton = wrapper.find('.fake-setup-monitor-dialog').find('button')
//     await editDialogButton.trigger('click')
//     await flushPromises()

//     let alerts = wrapper
//       .findAll('.v-alert')
//       .map((alert) => alert.find('.api-alert-content').find('span').text())
//     expect(alerts).toHaveLength(1)
//     expect(alerts).toEqual(['Failed to edit'])

//     repo.addError('Failed to delete')

//     // Trigger a delete
//     const deleteButton = wrapper.find('.mdi-delete')
//     await deleteButton.trigger('click')
//     await flushPromises()
//     const deleteDialogButton = wrapper.find('.fake-confirmation-dialog').find('button')
//     await deleteDialogButton.trigger('click')
//     await flushPromises()

//     alerts = wrapper
//       .findAll('.v-alert')
//       .map((alert) => alert.find('.api-alert-content').find('span').text())
//     expect(alerts).toHaveLength(2)
//     expect(alerts).toEqual(['Failed to edit', 'Failed to delete'])
//   })

//   it('allows monitors to be editted after initial sync fails', async () => {
//     // Regression test for error where the edit monitor dialog was rendered as if creating a new
//     // monitor, rather than editing an existing one, if the first sync failed. This was caused by
//     // the `SetupMonitorDialog` component checking if the monitor provided to it is `null` to know
//     // whether to show the dialog for creating a new monitor or editing an existing one. This is
//     // fixed by using a `v-if="monitor !== null"` on the `SetupMonitorDialog` component, so that it
//     // doesn't get injected into the `MonitorView` until the monitor is available, meaning the dialog
//     // is guaranteed to get a monitor and not `null`.
//     vi.useFakeTimers()

//     const { wrapper } = await mountMonitorView(true, ['Test error message'])

//     // Since the first sync fails, the monitor should be `null` and we shouldn't
//     // have any dialog at all.
//     expect(wrapper.find('.fake-setup-monitor-dialog').exists()).toBeFalsy()

//     // Let the MonitorView component sync again - which will succeed this time.
//     vi.advanceTimersByTime(1 * 60 * 1000)
//     await flushPromises()

//     // Now that we've synced the monitor and it's no longer `null`, we shoud have the
//     // dialog container again.
//     const editDialog = wrapper.find('.fake-setup-monitor-dialog')
//     expect(editDialog.exists()).toBeTruthy()

//     // Open the edit dialog.
//     const button = wrapper.find('.mdi-pencil')
//     await button.trigger('click')
//     await flushPromises()

//     // The dialog should contain the monitor ID.
//     expect(wrapper.find('.fake-setup-monitor-dialog').find('p').text()).toBe(
//       '547810d4-a636-4c1b-83e6-3e641391c84e'
//     )

//     vi.useRealTimers()
//   })
// })
