import ResizeObserver from 'resize-observer-polyfill'
import { describe, it, expect } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import SetupAlertDialog from '../SetupAlertDialog.vue'
import type { BasicAlertConfig } from '@/types/alert-config'

function mountSetupAlertDialog(
  dialogActive: boolean,
  alertConfig: BasicAlertConfig | null = null
): VueWrapper {
  const vuetify = createVuetify({ components, directives })
  global.ResizeObserver = ResizeObserver

  return mount(SetupAlertDialog, {
    global: {
      plugins: [vuetify],
      provide: {
        noTeleport: true
      }
    },
    props: {
      dialogActive,
      alertConfig
    },
    // We need to attach to the document body so we can use document.getElementById.
    attachTo: document.body
  })
}

describe('SetupAlertDialog component', () => {
  //   const vuetify = createVuetify({ components, directives })
  //   global.ResizeObserver = ResizeObserver

  it('is not rendered when not active', () => {
    const wrapper = mountSetupAlertDialog(false)

    expect(wrapper.html()).toBeFalsy()
  })

  it('is rendered when active', () => {
    const wrapper = mountSetupAlertDialog(true)

    expect(wrapper.html()).toBeTruthy()

    // Check the title and icon.
    const title = wrapper.find('.v-card-title')
    expect(title.text()).toBe('Create new Alert')
    expect(title.attributes('prepend-icon')).toBe('mdi-update')

    // We should have a name and an alert type, but there will be other text fields too.
    // The number of these will depend on the alert type though, which we don't know here.
    const textFields = wrapper.findAll('.v-field')
    expect(textFields.length).toBeGreaterThanOrEqual(2)

    const messages = wrapper.findAll('.v-messages > div')
    const fieldValues = textFields.map((field, index) => {
      return {
        label: field.find('.v-label').text(),
        hint: messages[index].text()
      }
    })
    expect(fieldValues.slice(0, 2)).toEqual([
      {
        label: 'Name',
        hint: 'Give your alert a name'
      },
      {
        label: 'Alert type',
        hint: 'How do you want to be alerted?'
      }
    ])

    // We should have 3 checkboxes.
    const checkboxes = wrapper.findAll('.v-checkbox')
    expect(checkboxes).toHaveLength(3)
    const checkboxLabels = checkboxes.map((checkbox) => {
      return {
        label: checkbox.find('.v-label').text(),
        checked: checkbox.find('input').attributes('checked') !== undefined
      }
    })
    expect(checkboxLabels).toEqual([
      { label: 'Active', checked: false },
      { label: 'Alert for lates', checked: false },
      { label: 'Alert for errors', checked: false }
    ])

    // Check the buttons.
    const buttons = wrapper.findAll('.v-card-actions > .v-btn')
    expect(buttons).toHaveLength(2)
    const buttonDetails = buttons.map((button) => {
      return {
        text: button.find('.v-btn__content').text(),
        icon: button
          .find('.v-icon')
          .classes()
          .find((cls) => cls.startsWith('mdi-'))
      }
    })
    expect(buttonDetails).toEqual([
      { text: 'Cancel', icon: 'mdi-close-circle' },
      { text: 'Save', icon: 'mdi-check-circle' }
    ])
  })

  it('renders with existing monitor', () => {
    const wrapper = mountSetupAlertDialog(true, {
      name: 'Test Alert',
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

    expect(wrapper.html()).toBeTruthy()

    // Since we have a monitor to start with, we're editting rather than creating.
    expect(wrapper.find('.v-card-title').text()).toBe('Edit Alert')

    // Only the name should be edittable.
    const textFields = wrapper.findAll('.v-field')
    expect(textFields).toHaveLength(1)

    const nameField = textFields[0]
    expect(nameField.find('.v-label').text()).toBe('Name')
    expect(nameField.find('input').attributes('value')).toBe('Test Alert')

    // The 3 checkboxes should match the AlertConfig we supplied the component with.
    const checkboxes = wrapper.findAll('.v-checkbox')
    expect(checkboxes).toHaveLength(3)
    const checkboxLabels = checkboxes.map((checkbox) => {
      return {
        label: checkbox.find('.v-label').text(),
        checked: checkbox.find('input').attributes('checked') !== undefined
      }
    })
    expect(checkboxLabels).toEqual([
      { label: 'Active', checked: true },
      { label: 'Alert for lates', checked: true },
      { label: 'Alert for errors', checked: false }
    ])

    // There should be a read-only indication of the alert type.
    const indicator = wrapper.find('[data-test="alert-type"]')
    // There's an icon between 'Type:' and 'Slack', but we're using text() to get the
    // text of the whole element to make this simpler.
    expect(indicator.text()).toBe('Type:  Slack')
  })

  it.each([
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-card-actions > .v-btn:first-child').trigger('click')
    },
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-dialog').trigger('keyup.esc')
    }
  ])('emits the correct event when aborted', async (action) => {
    const wrapper = mountSetupAlertDialog(true)

    await action(wrapper)

    expect(wrapper.emitted('dialog-aborted')).toBeTruthy()
  })

  it('only allows setup to be confirmed with all fields supplied', async () => {
    const wrapper = mountSetupAlertDialog(true)

    // Button should be disabled by default.
    const button = wrapper.find('.v-card-actions > .v-btn:last-child')
    expect(button.attributes('disabled')).toBeDefined()

    const fields = wrapper.findAll('.v-field').map((field) => field.find('input'))

    // Button should still be disabled with only the name supplied.
    await fields[0].setValue('Test Monitor')
    expect(button.attributes('disabled')).toBeDefined()

    // The alert type should already be set to Slack, so we need to set the channel
    // and token. Setting just the channel shouldn't enable the button.
    await fields[2].setValue('#alerts')
    expect(button.attributes('disabled')).toBeDefined()

    // Setting the token should enable the button.
    await fields[3].setValue('fake-token')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it.each([
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-card-actions > .v-btn:last-child').trigger('click')
    },
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-dialog').trigger('keyup.enter')
    }
  ])('emits the correct event when confirmed', async (action) => {
    const wrapper = mountSetupAlertDialog(true)

    const fields = wrapper.findAll('.v-field').map((field) => field.find('input'))
    await fields[0].setValue('Test Alert')
    await fields[2].setValue('#alerts')
    await fields[3].setValue('fake-token')

    await action(wrapper)

    expect(wrapper.emitted('dialog-complete')).toEqual([
      [
        {
          name: 'Test Alert',
          active: false,
          on_late: false,
          on_error: false,
          type: {
            slack: {
              channel: '#alerts',
              token: 'fake-token'
            }
          }
        }
      ]
    ])
  })

  it('indicates loading when confirmed until dialog is closed', async () => {
    const wrapper = mountSetupAlertDialog(true)

    const fields = wrapper.findAll('.v-field').map((field) => field.find('input'))
    await fields[0].setValue('Test Alert')
    await fields[2].setValue('#alerts')
    await fields[3].setValue('fake-token')

    const button = wrapper.find('.v-card-actions > .v-btn:last-child')

    // Ensure that a loader is injected when clicking
    expect(button.find('.v-progress-circular').exists()).toBe(false)
    await button.trigger('click')
    expect(button.find('.v-progress-circular').exists()).toBe(true)

    // Close the dialog then reopen it. The loader should now have disappeared.
    await wrapper.setProps({ dialogActive: false })
    await wrapper.setProps({ dialogActive: true })

    expect(
      wrapper.find('.v-card-actions > .v-btn:last-child > .v-progress-circular').exists()
    ).toBe(false)
  })

  it.each([false, undefined])(
    'rendered using teleport when noTeleport is not true',
    (noTeleport) => {
      const vuetify = createVuetify({ components, directives })
      global.ResizeObserver = ResizeObserver
      const wrapper = mount(SetupAlertDialog, {
        global: {
          plugins: [vuetify],
          provide: {
            noTeleport: noTeleport
          }
        },
        props: {
          dialogActive: true
        }
      })

      expect(wrapper.html()).contains('teleport')
    }
  )
})
