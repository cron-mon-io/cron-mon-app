import ResizeObserver from 'resize-observer-polyfill'
import { describe, it, expect } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import SetupMonitorDialog from '@/components/SetupMonitorDialog.vue'

describe('SetupMonitorDialog component', () => {
  const vuetify = createVuetify({ components, directives })
  global.ResizeObserver = ResizeObserver

  it('is not rendered when not active', () => {
    const wrapper = mount(SetupMonitorDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: false
      }
    })

    expect(wrapper.html()).toBeFalsy()
  })

  it('is rendered when active', () => {
    const wrapper = mount(SetupMonitorDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true
      }
    })

    expect(wrapper.html()).toBeTruthy()

    // Check the title and icon.
    const title = wrapper.find('.v-card-title')
    expect(title.text()).toBe('Create new Monitor')
    expect(title.attributes('prepend-icon')).toBe('mdi-update')

    const fields = wrapper.findAll('.v-field')
    expect(fields).toHaveLength(3)

    const messages = wrapper.findAll('.v-messages > div')
    const fieldValues = fields.map((field, index) => {
      return {
        label: field.find('.v-label').text(),
        value: field.find('input').text(),
        hint: messages[index].text()
      }
    })
    expect(fieldValues).toEqual([
      {
        label: 'Name',
        value: '',
        hint: 'Give your monitor a name'
      },
      {
        label: 'Expected duration',
        value: '',
        hint: 'How long do you expect the jobs being monitored to run for?'
      },
      {
        label: 'Grace duration',
        value: '',
        hint: 'How much longer after that should we wait before considering the job late?'
      }
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
    const wrapper = mount(SetupMonitorDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true,
        monitor: {
          name: 'Test Monitor',
          expected_duration: 5430,
          grace_duration: 600
        }
      },
      // We need to attach to the document body so we can use document.getElementById.
      attachTo: document.body
    })

    expect(wrapper.html()).toBeTruthy()

    expect(wrapper.find('.v-card-title').text()).toBe('Edit Monitor')

    const fields = wrapper.findAll('.v-field')
    expect(fields).toHaveLength(3)

    // Since we're using `input` tags, we can't get the value from the `DOMWrapper`.
    // Instead, we take the IDs from the `DOMWrapper`s and get the underlying
    // `HTMLElement`s from the document.
    const fieldIds = fields.map((field) => field.find('input').attributes('id'))
    const fieldValues = fieldIds.map(
      (id) => (<HTMLInputElement>document.getElementById(id as string))?.value
    )
    expect(fieldValues).toEqual(['Test Monitor', '01:30:30', '00:10:00'])
  })

  it.each([
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-card-actions > .v-btn:first-child').trigger('click')
    },
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-dialog').trigger('keyup.esc')
    }
  ])('emits the correct event when aborted', async (action) => {
    const wrapper = mount(SetupMonitorDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true
      }
    })

    await action(wrapper)

    expect(wrapper.emitted('dialog-aborted')).toBeTruthy()
  })

  it('flags up validation errors', async () => {
    const wrapper = mount(SetupMonitorDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true
      }
    })

    // Don't need the name here as the only validation on it is that it's required,
    // and we kind of bypass that by disabled the save button without all values suplied.
    const fields = wrapper
      .findAll('.v-field')
      .slice(1, 3)
      .map((field) => field.find('input'))

    await fields[0].setValue('00:00:00:00')
    await fields[1].setValue('not a number')

    const messages = wrapper
      .findAll('.v-messages')
      .slice(1, 3)
      .map((message) => message.text())

    expect(messages).toEqual(['Invalid duration', 'Invalid seconds'])
  })

  it('only allows setup to be confirmed with all fields supplied', async () => {
    const wrapper = mount(SetupMonitorDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true
      }
    })

    const button = wrapper.find('.v-card-actions > .v-btn:last-child')

    // Button should be disabled by default.
    expect(button.attributes('disabled')).toBeDefined()

    const fields = wrapper.findAll('.v-field').map((field) => field.find('input'))

    // Button should still be disabled with only the name supplied.
    await fields[0].setValue('Test Monitor')
    expect(button.attributes('disabled')).toBeDefined()

    // Button should still be disabled with only the name and expected duration supplied.
    await fields[1].setValue('00:00:01')
    expect(button.attributes('disabled')).toBeDefined()

    // Button should be enabled with all fields supplied.
    await fields[2].setValue('00:00:01')
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
    const wrapper = mount(SetupMonitorDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true
      }
    })

    const fields = wrapper.findAll('.v-field').map((field) => field.find('input'))

    await fields[0].setValue('Test Monitor')
    await fields[1].setValue('00:30:00')
    await fields[2].setValue('00:05:00')

    await action(wrapper)

    expect(wrapper.emitted('dialog-complete')).toEqual([
      [{ name: 'Test Monitor', expected_duration: 1800, grace_duration: 300 }]
    ])
  })

  it('indicates loading when confirmed until dialog is closed', async () => {
    const wrapper = mount(SetupMonitorDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true
      }
    })

    const fields = wrapper.findAll('.v-field').map((field) => field.find('input'))
    await fields[0].setValue('Test Monitor')
    await fields[1].setValue('00:30:00')
    await fields[2].setValue('00:05:00')

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
      const wrapper = mount(SetupMonitorDialog, {
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
