import { describe, it, expect } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import ConfirmationDialog from '@/components/ConfirmationDialog.vue'

describe('ConfirmationDialog component', () => {
  const vuetify = createVuetify({ components, directives })
  global.ResizeObserver = require('resize-observer-polyfill')
  it('is not rendered when not active', () => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: false,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?'
      }
    })

    expect(wrapper.html()).toBeFalsy()
  })

  it('is rendered when active', () => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?'
      }
    })

    expect(wrapper.html()).toBeTruthy()

    // Check the title and icon.
    const title = wrapper.find('.v-card-title')
    expect(title.text()).toBe('Foo')
    expect(title.attributes('prepend-icon')).toBe('mdi-alert')

    // Check the question.
    expect(wrapper.find('.v-card-text').text()).toBe('Are you sure?')

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
      { text: 'No', icon: 'mdi-close-circle' },
      { text: 'Yes', icon: 'mdi-check-circle' }
    ])
  })

  it.each([
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-card-actions > .v-btn:last-child').trigger('click')
    },
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-dialog').trigger('keyup.enter')
    }
  ])('emits the correct event when confirmed', async (action) => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?'
      }
    })

    await action(wrapper)

    expect(wrapper.emitted('dialog-complete')).toEqual([[true]])
  })

  it.each([
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-card-actions > .v-btn:first-child').trigger('click')
    },
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-dialog').trigger('keyup.esc')
    }
  ])('emits the correct event when aborted', async (action) => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?'
      }
    })

    await action(wrapper)

    expect(wrapper.emitted('dialog-complete')).toEqual([[false]])
  })

  it('indicates loading when confirmed until dialog is closed', async () => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true
        }
      },
      props: {
        dialogActive: true,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?'
      }
    })

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
      const wrapper = mount(ConfirmationDialog, {
        global: {
          plugins: [vuetify],
          provide: {
            noTeleport: noTeleport
          }
        },
        props: {
          dialogActive: true,
          title: 'Foo',
          icon: 'mdi-alert',
          question: 'Are you sure?'
        }
      })

      expect(wrapper.html()).contains('teleport')
    }
  )
})
