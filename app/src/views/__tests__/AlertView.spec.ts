import { describe, it, expect, vi, type Mock } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { useRouter } from 'vue-router'

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
    const editButton = wrapper.find('.v-card').find('.v-card-text').find('.v-btn')
    expect(editButton.text()).toBe('Edit Alert')

    const buttons = wrapper.find('.v-card').find('[data-test="footer-buttons"]').findAll('.v-btn')
    expect(buttons.map((button) => button.text())).toEqual(['Test Alert', 'Delete Alert'])

    // We should have a table of monitors using this alert.
    const monitors = wrapper.find('.v-table').findAll('tbody tr')
    expect(monitors).toHaveLength(2)

    // Each monitor using the alert should be displayed here, with a View and Unlink button.
    expect(monitors.map((monitor) => monitor.findAll('td')[0].text())).toEqual([
      'Monitor 1',
      'Monitor 2'
    ])
    expect(
      monitors[0]
        .findAll('td')[1]
        .findAll('.v-btn')
        .map((button) => button.text())
    ).toEqual(['View', 'Unlink'])
    expect(
      monitors[1]
        .findAll('td')[1]
        .findAll('.v-btn')
        .map((button) => button.text())
    ).toEqual(['View', 'Unlink'])
  })

  it('detects newly linked monitors jobs', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountAlertView()

    const numMonitors = wrapper.find('.v-table').find('tbody').findAll('tr').length

    // Link another monitor to the alert.
    repo.addMonitor(
      '547810d4-a636-4c1b-83e6-3e641391c84e',
      '394fa634-48e0-4a04-861d-be4bd354d8ab',
      'New Monitor'
    )

    // Let the AlertView component detect the new monitor.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    wrapper.vm.$nextTick()
    await flushPromises()

    const monitors = wrapper.find('.v-table').find('tbody').findAll('tr')
    expect(monitors).toHaveLength(numMonitors + 1)
    const newMonitor = monitors[monitors.length - 1]
    expect(newMonitor.findAll('td')[0].text()).toBe('New Monitor')

    vi.useRealTimers()
  })

  it('edits monitors as expected', async () => {
    // TODO
  })

  it('deletes alerts as expected', async () => {
    const push = vi.fn()
    const mockUseRouter = useRouter as Mock // We've mocked this above.
    mockUseRouter.mockImplementationOnce(() => ({
      push
    }))

    const { wrapper, repo } = await mountAlertView()

    // Dialog should not be open.
    const dialog = wrapper.findAll('.fake-confirmation-dialog')[1]
    expect(dialog.find('.content').exists()).toBeFalsy()

    // Clicking the Delete button will trigger our test dialog.
    const deleteButton = wrapper
      .find('.v-card')
      .find('[data-test="footer-buttons"]')
      .findAll('.v-btn')[1]
    expect(deleteButton.text()).toBe('Delete Alert')
    await deleteButton.trigger('click')
    await flushPromises()

    // The dialog should now be open.
    const dialogContent = dialog.find('.content')
    expect(dialogContent.exists()).toBeTruthy()

    // Clicking the dialog's button will close the dialog, at which point the
    // AlertView should delete the alert.
    await dialogContent.find('button').trigger('click')
    await flushPromises()

    expect(dialog.find('.content').exists()).toBeFalsy()

    // The alert should have been deleted.
    await expect(
      async () => await repo.getAlertConfig('547810d4-a636-4c1b-83e6-3e641391c84e')
    ).rejects.toThrowError(
      "Failed to find alert config with id '547810d4-a636-4c1b-83e6-3e641391c84e'"
    )

    // We should have been redirected to the Monitors view.
    expect(push).toHaveBeenCalledWith({ name: 'alerts' })
  })

  it('does not delete alerts when delete is aborted', async () => {
    const push = vi.fn()
    const mockUseRouter = useRouter as Mock // We've mocked this above.
    mockUseRouter.mockImplementationOnce(() => ({
      push
    }))

    const { wrapper, repo } = await mountAlertView(false)

    // Clicking the Delete button will trigger our test dialog.
    const deleteButton = wrapper
      .find('.v-card')
      .find('[data-test="footer-buttons"]')
      .findAll('.v-btn')[1]
    expect(deleteButton.text()).toBe('Delete Alert')
    await deleteButton.trigger('click')
    await flushPromises()

    // Give the AlertView a chance to delete the alert if it was going too.
    await flushPromises()

    // The alert should not have been deleted.
    const alert = await repo.getAlertConfig('547810d4-a636-4c1b-83e6-3e641391c84e')
    expect(alert).toBeDefined()

    // We should not have been redirected to the Alerts view.
    expect(push).not.toHaveBeenCalled()
  })

  it('stops syncing when the component is unmounted', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountAlertView()

    const spy = vi.spyOn(repo, 'getAlertConfig')

    // Let the AlertView sync.
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

describe('AlertView listing monitor and its jobs with errors', () => {
  it('does not show an error alert when the alert config repository has no errors', async () => {
    const { wrapper } = await mountAlertView()

    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
  })

  it('shows an error alert when the alert config repository has errors', async () => {
    const { wrapper } = await mountAlertView(true, ['Test error message'])

    const alert = wrapper.find('.v-alert').find('.api-alert-content')
    expect(alert.find('span').text()).toBe('Test error message')

    // The alert should have a Retry button.
    expect(alert.find('.v-btn').text()).toBe('Retry')
  })

  it('clears the error alert when the retry button is clicked', async () => {
    const { wrapper } = await mountAlertView(true, ['Test error message'])

    const alert = wrapper.find('.v-alert')
    await alert.find('.v-btn').trigger('click')

    await flushPromises()

    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
  })

  it('automatically clears the alert when next sync is successful', async () => {
    vi.useFakeTimers()

    const { wrapper } = await mountAlertView(true, ['Test error message'])

    // Ensure the alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeTruthy()

    // Let the AlertView sync again.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Ensure the alert is gone.
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()

    vi.useRealTimers()
  })

  it('shows alert when error happens after successful sync', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountAlertView()

    // Let the AlertView sync.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Ensure no alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()

    // Add an error to the repo.
    repo.addError('Test error message')

    // Let the AlertView sync again.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Ensure the alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeTruthy()

    // Editing, testing and deleting alerts should be disabled whilst we're in a state of error.
    const editButton = wrapper.find('.v-card').find('.v-card-text').find('.v-btn')
    const buttons = wrapper.find('.v-card').find('[data-test="footer-buttons"]').findAll('.v-btn')
    const testButton = buttons.find((button) => button.text() === 'Test Alert')
    const deleteButton = buttons.find((button) => button.text() === 'Delete Alert')
    expect(editButton.attributes('disabled')).toBeDefined()
    expect(testButton?.attributes('disabled')).toBeDefined()
    expect(deleteButton?.attributes('disabled')).toBeDefined()

    vi.useRealTimers()
  })

  it('shows alert when the alert is deleted externally', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountAlertView()

    // Let the AlertView sync.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Ensure no alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()

    // Delete the alert outside of the component.
    await repo.deleteAlertConfig(await repo.getAlertConfig('547810d4-a636-4c1b-83e6-3e641391c84e'))

    // Let the AlertView sync again.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Ensure the alert is visible.
    expect(wrapper.find('.v-alert').exists()).toBeTruthy()

    // Editing, testing and deleting alerts should be disabled whilst we're in a state of error.
    const editButton = wrapper.find('.v-card').find('.v-card-text').find('.v-btn')
    const buttons = wrapper.find('.v-card').find('[data-test="footer-buttons"]').findAll('.v-btn')
    const testButton = buttons.find((button) => button.text() === 'Test Alert')
    const deleteButton = buttons.find((button) => button.text() === 'Delete Alert')
    expect(editButton.attributes('disabled')).toBeDefined()
    expect(testButton?.attributes('disabled')).toBeDefined()
    expect(deleteButton?.attributes('disabled')).toBeDefined()

    vi.useRealTimers()
  })
})

describe('MonitorView editing and deleting monitors with errors', () => {
  it.each([
    // TODO: Uncomment this when the alerts can be edited.
    // {
    //   finder: (wrapper: VueWrapper) =>
    //     return wrapper.find('.v-card').find('.v-card-text').find('.v-btn'),
    //   dialogfinder: (wrapper: VueWrapper) => wrapper.find('.fake-setup-monitor-dialog')
    // },
    {
      buttonFinder: (wrapper: VueWrapper) =>
        wrapper.find('.v-card').find('[data-test="footer-buttons"]').findAll('.v-btn')[1],
      dialogfinder: (wrapper: VueWrapper) => wrapper.findAll('.fake-confirmation-dialog')[1]
    }
  ])(
    'shows an error alert when the alert cannot be editted/ deleted',
    async ({ buttonFinder, dialogfinder }) => {
      const { wrapper, repo } = await mountAlertView()

      repo.addError('Test error message')

      // Trigger an edit or deletion.
      const button = buttonFinder(wrapper)
      await button.trigger('click')
      await flushPromises()
      const dialogButton = dialogfinder(wrapper).find('button')
      await dialogButton.trigger('click')
      await flushPromises()

      const alert = wrapper.find('.v-alert')
      expect(alert.find('.api-alert-content').find('span').text()).toBe('Test error message')

      // The alert shouldn't have a Retry button, just a close button.
      const alertButton = alert.find('.v-btn')
      expect(alertButton.text()).not.toBe('Retry')
      expect(alertButton.find('.mdi').classes()).toContain('mdi-close')

      // Closing the alert should get rid of it, and nothing should be retried.
      repo.addError('We should not see this error message')
      await alertButton.trigger('click')
      await flushPromises()
      expect(wrapper.find('.v-alert').exists()).toBeFalsy()
    }
  )

  it('shows multiple errors if allert cannot be editted, deleted, or resynced', async () => {
    const { wrapper, repo } = await mountAlertView()

    // TODO: Uncomment this when the alerts can be edited.
    // repo.addError('Failed to edit')

    // Trigger an edit.
    // const editButton = wrapper.find('.mdi-pencil')
    // await editButton.trigger('click')
    // await flushPromises()
    // const editDialogButton = wrapper.find('.fake-setup-monitor-dialog').find('button')
    // await editDialogButton.trigger('click')
    // await flushPromises()

    // let alerts = wrapper
    //   .findAll('.v-alert')
    //   .map((alert) => alert.find('.api-alert-content').find('span').text())
    // expect(alerts).toHaveLength(1)
    // expect(alerts).toEqual(['Failed to edit'])

    repo.addError('Failed to delete')

    // Trigger a delete
    const deleteButton = wrapper
      .find('.v-card')
      .find('[data-test="footer-buttons"]')
      .findAll('.v-btn')[1]
    await deleteButton.trigger('click')
    await flushPromises()
    const deleteDialogButton = wrapper.findAll('.fake-confirmation-dialog')[1].find('button')
    await deleteDialogButton.trigger('click')
    await flushPromises()

    // TODO: Uncomment this when the alerts can be edited.
    // alerts = wrapper
    //   .findAll('.v-alert')
    //   .map((alert) => alert.find('.api-alert-content').find('span').text())
    // expect(alerts).toHaveLength(2)
    // expect(alerts).toEqual(['Failed to edit', 'Failed to delete'])

    // TODO: Delete this when allerts can be edited.
    const alerts = wrapper
      .findAll('.v-alert')
      .map((alert) => alert.find('.api-alert-content').find('span').text())
    expect(alerts).toHaveLength(1)
    expect(alerts).toEqual(['Failed to delete'])
  })

  // TODO: Uncomment this when the alerts can be edited.
  // it('allows monitors to be editted after initial sync fails', async () => {
  //   // Regression test for error where the edit monitor dialog was rendered as if creating a new
  //   // monitor, rather than editing an existing one, if the first sync failed. This was caused by
  //   // the `SetupMonitorDialog` component checking if the monitor provided to it is `null` to know
  //   // whether to show the dialog for creating a new monitor or editing an existing one. This is
  //   // fixed by using a `v-if="monitor !== null"` on the `SetupMonitorDialog` component, so that it
  //   // doesn't get injected into the `MonitorView` until the monitor is available, meaning the dialog
  //   // is guaranteed to get a monitor and not `null`.
  //   vi.useFakeTimers()

  //   const { wrapper } = await mountMonitorView(true, ['Test error message'])

  //   // Since the first sync fails, the monitor should be `null` and we shouldn't
  //   // have any dialog at all.
  //   expect(wrapper.find('.fake-setup-monitor-dialog').exists()).toBeFalsy()

  //   // Let the MonitorView component sync again - which will succeed this time.
  //   vi.advanceTimersByTime(1 * 60 * 1000)
  //   await flushPromises()

  //   // Now that we've synced the monitor and it's no longer `null`, we shoud have the
  //   // dialog container again.
  //   const editDialog = wrapper.find('.fake-setup-monitor-dialog')
  //   expect(editDialog.exists()).toBeTruthy()

  //   // Open the edit dialog.
  //   const button = wrapper.find('.mdi-pencil')
  //   await button.trigger('click')
  //   await flushPromises()

  //   // The dialog should contain the monitor ID.
  //   expect(wrapper.find('.fake-setup-monitor-dialog').find('p').text()).toBe(
  //     '547810d4-a636-4c1b-83e6-3e641391c84e'
  //   )

  //   vi.useRealTimers()
  // })
})
