/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, vi, type Mock } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { useRouter } from 'vue-router'

import AlertView from '@/views/AlertView.vue'
import { type AlertConfig } from '@/types/alert-config'
import { type AlertConfigRepoInterface } from '@/repos/alert-config-repo'
import { type AlertServiceInterface } from '@/services/alert-service'

import { FakeVueCookies } from '@/utils/testing/fake-vue-cookies'

function getTestAlertConfigData(): AlertConfig {
  return {
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
      slack: {
        token: 'fake-slack',
        channel: '#fake-channel'
      }
    }
  }
}

async function mountAlertView(
  confirm: boolean = true,
  errors: string[] = []
): Promise<{
  wrapper: VueWrapper
  repo: AlertConfigRepoInterface
  service: AlertServiceInterface
}> {
  // The SetupAlertDialog component has its own tests, so we just want to
  // stub it here so we can test how we interact wit it.
  const FakeSetupAlertDialog = defineComponent({
    props: {
      dialogActive: {
        type: Boolean,
        required: true
      },
      alertConfig: {
        type: Object,
        default: () => null
      }
    },
    emits: ['dialog-complete'],
    methods: {
      finish() {
        this.$emit('dialog-complete', {
          name: 'Test Alert with a new name',
          active: true,
          on_late: true,
          on_error: false,
          type: {
            slack: {
              channel: '#alerts',
              token: 'fake-token'
            }
          }
        })
      }
    },
    template: `
      <div class="fake-setup-alert-dialog">
        <div v-if="dialogActive" class="content">
          Test dialog
          <p>{{ alertConfig ? alertConfig.alert_config_id : "" }}</p>
          <button @click="finish" />
        </div>
      </div>`
  })

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

  const testAlertConfigData = getTestAlertConfigData()
  const repo = {
    getAlertConfigs: vi.fn(),
    getAlertConfig: vi.fn().mockImplementation((_) => {
      if (errors.length > 0) {
        return Promise.reject(new Error(errors.shift() as string))
      }
      return Promise.resolve(testAlertConfigData)
    }),
    addAlertConfig: vi.fn(),
    updateAlertConfig: vi.fn().mockImplementation((alertConfig) => alertConfig),
    deleteAlertConfig: vi.fn().mockImplementation((_) => {
      if (errors.length > 0) {
        return Promise.reject(new Error(errors.shift() as string))
      }
      return Promise.resolve(testAlertConfigData)
    })
  }

  const service = {
    sendTestAlert: vi.fn()
  }

  const fakeCookies = new FakeVueCookies()
  const wrapper = mount(AlertView, {
    global: {
      plugins: [createVuetify({ components, directives })],
      provide: {
        $getAlertConfigRepo: () => repo,
        $getAlertConfigService: () => service,
        $cookies: fakeCookies
      },
      mocks: {
        $cookies: fakeCookies
      },
      stubs: {
        // We don't want to test the dialog itself as it has its own tests, just that it is opened.
        ConfirmationDialog: FakeConfirmationDialog,
        SetupAlertDialog: FakeSetupAlertDialog
      }
    }
  })

  await flushPromises()
  return { wrapper, repo, service }
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

    const numMonitors = wrapper.find('table').find('tbody').findAll('tr').length

    // Link another monitor to the alert 'externally'.
    const alertConfig = getTestAlertConfigData()
    alertConfig.monitors.push({
      monitor_id: '394fa634-48e0-4a04-861d-be4bd354d8ab',
      name: 'New Monitor'
    })
    ;(repo.getAlertConfig as Mock).mockResolvedValue(alertConfig)

    const fetchSpy = vi.spyOn(repo, 'getAlertConfig')

    // Let the AlertView component detect the new monitor.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalled()

    const monitors = wrapper.find('table').find('tbody').findAll('tr')
    expect(monitors).toHaveLength(numMonitors + 1)
    const newMonitor = monitors[monitors.length - 1]
    expect(newMonitor.findAll('td')[0].text()).toBe('New Monitor')

    vi.useRealTimers()
  })

  it('detects changes to config', async () => {
    vi.useFakeTimers()

    const { wrapper, repo } = await mountAlertView()

    // Sanity check the active, on-late and on-error chips.
    const configChips = wrapper.find('.v-card').find('.v-card-text').findAll('.v-chip')
    expect(configChips[0].text()).toBe('Active')
    expect(configChips[1].text()).toBe('On late')
    expect(configChips[2].text()).toBe('On error')

    expect(configChips[0].classes()).toContain('v-chip--variant-flat')
    expect(configChips[1].classes()).toContain('v-chip--variant-flat')
    expect(configChips[2].classes()).toContain('v-chip--variant-outlined')

    // Change the alert config 'externally'.
    const alertConfig = getTestAlertConfigData()
    alertConfig.active = false
    alertConfig.on_late = false
    alertConfig.on_error = true
    ;(repo.getAlertConfig as Mock).mockResolvedValue(alertConfig)

    // Let the AlertView component detect the new monitor.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Sanity check the active, on_late and on_error chips.
    const newConfigChips = wrapper.find('.v-card').find('.v-card-text').findAll('.v-chip')
    expect(newConfigChips[0].classes()).toContain('v-chip--variant-outlined')
    expect(newConfigChips[1].classes()).toContain('v-chip--variant-outlined')
    expect(newConfigChips[2].classes()).toContain('v-chip--variant-flat')

    vi.useRealTimers()
  })

  it('navigates to the monitor view when the View button is clicked', async () => {
    const push = vi.fn()
    const mockUseRouter = useRouter as Mock // We've mocked this above.
    mockUseRouter.mockImplementationOnce(() => ({
      push
    }))

    const { wrapper } = await mountAlertView()

    // Clicking the View button should navigate to the monitor view.
    const viewButton = wrapper.find('.v-card').find('tbody').findAll('tr')[0].findAll('.v-btn')[0]
    await viewButton.trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'monitor',
      params: {
        id: '9fcbdeee-416e-427d-8fef-614c4bc52b4a'
      }
    })
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('edits alerts as expected', async () => {
    const { wrapper } = await mountAlertView()

    // Dialog should not be open.
    const dialog = wrapper.find('.fake-setup-alert-dialog')
    expect(dialog.find('.content').exists()).toBeFalsy()

    // Clicking the Edit button will trigger our test dialog.
    const addButton = wrapper.findAll('.v-btn')[0]
    await addButton.trigger('click')
    await flushPromises()

    // The dialog should now be open and should contain the ID of our monitor.
    const dialogContent = dialog.find('.content')
    expect(dialogContent.exists()).toBeTruthy()
    expect(dialogContent.find('p').text()).toBe('547810d4-a636-4c1b-83e6-3e641391c84e')

    // Clicking the dialog's button will close the dialog, at which point the
    // AlertView component will update the monitor.
    await dialogContent.find('button').trigger('click')
    await flushPromises()

    expect(dialog.find('.content').exists()).toBeFalsy()

    // The monitor should have been updated.
    expect(wrapper.find('.v-card-title').text()).toBe('Test Alert with a new name')
  })

  it('tests alerts as expected', async () => {
    const { wrapper, service } = await mountAlertView()

    // Dialog should not be open.
    const dialog = wrapper.findAll('.fake-confirmation-dialog')[0]
    expect(dialog.find('.content').exists()).toBeFalsy()

    // Clicking the Test button should bring up a dialog to confirm
    const testButton = wrapper
      .find('.v-card')
      .find('[data-test="footer-buttons"]')
      .findAll('.v-btn')[0]
    expect(testButton.text()).toBe('Test Alert')
    await testButton.trigger('click')
    await flushPromises()

    // The dialog should now be open.
    const dialogContent = dialog.find('.content')
    expect(dialogContent.exists()).toBeTruthy()

    // Clicking the dialog's button will close the dialog, at which point the
    // AlertView should delete the alert.
    const spy = vi.spyOn(service, 'sendTestAlert')
    await dialogContent.find('button').trigger('click')
    await flushPromises()

    // We should have closed the dialog and sent the test alert.
    expect(dialog.find('.content').exists()).toBeFalsy()
    expect(spy).toHaveBeenCalledWith({
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
        slack: {
          channel: '#fake-channel',
          token: 'fake-slack'
        }
      }
    })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not test alerts when aborted', async () => {
    const { wrapper, service } = await mountAlertView(false)

    const spy = vi.spyOn(service, 'sendTestAlert')

    // Clicking the Test button should bring up a dialog to confirm
    const testButton = wrapper
      .find('.v-card')
      .find('[data-test="footer-buttons"]')
      .findAll('.v-btn')[0]
    expect(testButton.text()).toBe('Test Alert')
    await testButton.trigger('click')
    await flushPromises()

    // Give the AlertView a chance to test the alert if it was going too.
    await flushPromises()

    // The alert should not have been tested.
    expect(spy).not.toHaveBeenCalled()
  })

  it('unlinks monitors as expected', async () => {
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
    const spy = vi.spyOn(repo, 'deleteAlertConfig')
    await dialogContent.find('button').trigger('click')
    await flushPromises()

    expect(dialog.find('.content').exists()).toBeFalsy()
    expect(spy).toHaveBeenCalled()

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

    // Make the repo return an error.
    ;(repo.getAlertConfig as Mock).mockRejectedValue(new Error('Test error message'))

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

    // Delete the alert 'externally'.
    ;(repo.getAlertConfig as Mock).mockRejectedValue(
      new Error("Failed to find alert config with id '547810d4-a636-4c1b-83e6-3e641391c84e'")
    )

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

  it('shows error when test alert fails', async () => {
    const { wrapper, service } = await mountAlertView()

    // Make the service return an error.
    ;(service.sendTestAlert as Mock).mockRejectedValue(new Error('Test error message'))
    const spy = vi.spyOn(service, 'sendTestAlert')

    // Trigger a test alert.
    const testButton = wrapper
      .find('.v-card')
      .find('[data-test="footer-buttons"]')
      .findAll('.v-btn')[0]
    await testButton.trigger('click')
    await flushPromises()

    await wrapper
      .findAll('.fake-confirmation-dialog')[0]
      .find('.content')
      .find('button')
      .trigger('click')
    await flushPromises()

    expect(spy).toHaveBeenCalled()

    // An error should now be displayed.
    const alert = wrapper.find('.v-alert')
    expect(alert.find('.api-alert-content').find('span').text()).toBe('Test error message')

    // The alert shouldn't have a Retry button, just a close button.
    const alertButton = alert.find('.v-btn')
    expect(alertButton.text()).not.toBe('Retry')
    expect(alertButton.find('.mdi').classes()).toContain('mdi-close')

    // Closing the alert should get rid of it, and nothing should be retried.
    const sendSpy = vi.spyOn(service, 'sendTestAlert')
    await alertButton.trigger('click')
    await flushPromises()
    expect(sendSpy).not.toHaveBeenCalled()
    expect(wrapper.find('.v-alert').exists()).toBeFalsy()
  })
})

describe('AlertView editing and deleting Alerts with errors', () => {
  it.each([
    {
      buttonFinder: (wrapper: VueWrapper) =>
        wrapper.find('.v-card').find('.v-card-text').find('.v-btn'),
      dialogfinder: (wrapper: VueWrapper) => wrapper.find('.fake-setup-alert-dialog')
    },
    {
      buttonFinder: (wrapper: VueWrapper) =>
        wrapper.find('.v-card').find('[data-test="footer-buttons"]').findAll('.v-btn')[1],
      dialogfinder: (wrapper: VueWrapper) => wrapper.findAll('.fake-confirmation-dialog')[1]
    }
  ])(
    'shows an error alert when the alert cannot be editted/ deleted',
    async ({ buttonFinder, dialogfinder }) => {
      const { wrapper, repo } = await mountAlertView()

      // Make the repo return an error.
      ;(repo.updateAlertConfig as Mock).mockRejectedValue(new Error('Test error message'))
      ;(repo.deleteAlertConfig as Mock).mockRejectedValue(new Error('Test error message'))

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
      const updateSpy = vi.spyOn(repo, 'updateAlertConfig')
      const deleteSpy = vi.spyOn(repo, 'deleteAlertConfig')
      await alertButton.trigger('click')
      await flushPromises()
      expect(updateSpy).not.toHaveBeenCalled()
      expect(deleteSpy).not.toHaveBeenCalled()
    }
  )

  it('shows multiple errors if alert cannot be editted or deleted', async () => {
    const { wrapper, repo } = await mountAlertView()
    ;(repo.updateAlertConfig as Mock).mockRejectedValue(new Error('Failed to edit'))

    // Trigger an edit.
    const editButton = wrapper.find('.mdi-pencil')
    await editButton.trigger('click')
    await flushPromises()
    const editDialogButton = wrapper.find('.fake-setup-alert-dialog').find('button')
    await editDialogButton.trigger('click')
    await flushPromises()

    let alerts = wrapper
      .findAll('.v-alert')
      .map((alert) => alert.find('.api-alert-content').find('span').text())
    expect(alerts).toHaveLength(1)
    expect(alerts).toEqual(['Failed to edit'])
    ;(repo.deleteAlertConfig as Mock).mockRejectedValue(new Error('Failed to delete'))

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

    alerts = wrapper
      .findAll('.v-alert')
      .map((alert) => alert.find('.api-alert-content').find('span').text())
    expect(alerts).toHaveLength(2)
    expect(alerts).toEqual(['Failed to edit', 'Failed to delete'])
  })

  it('allows monitors to be editted after initial sync fails', async () => {
    // Regression test for error where the edit monitor dialog was rendered as if creating a new
    // monitor, rather than editing an existing one, if the first sync failed. This was caused by
    // the `SetupAlertDialog` component checking if the monitor provided to it is `null` to know
    // whether to show the dialog for creating a new monitor or editing an existing one. This is
    // fixed by using a `v-if="monitor !== null"` on the `SetupAlertDialog` component, so that it
    // doesn't get injected into the `AlertView` until the monitor is available, meaning the dialog
    // is guaranteed to get a monitor and not `null`.
    vi.useFakeTimers()

    const { wrapper } = await mountAlertView(true, ['Test error message'])

    // Since the first sync fails, the monitor should be `null` and we shouldn't
    // have any dialog at all.
    expect(wrapper.find('.fake-setup-alert-dialog').exists()).toBeFalsy()

    // Let the AlertView component sync again - which will succeed this time.
    vi.advanceTimersByTime(1 * 60 * 1000)
    await flushPromises()

    // Now that we've synced the monitor and it's no longer `null`, we shoud have the
    // dialog container again.
    const editDialog = wrapper.find('.fake-setup-alert-dialog')
    expect(editDialog.exists()).toBeTruthy()

    // Open the edit dialog.
    const button = wrapper.find('.mdi-pencil')
    await button.trigger('click')
    await flushPromises()

    // The dialog should contain the monitor ID.
    expect(wrapper.find('.fake-setup-alert-dialog').find('p').text()).toBe(
      '547810d4-a636-4c1b-83e6-3e641391c84e'
    )

    vi.useRealTimers()
  })
})
