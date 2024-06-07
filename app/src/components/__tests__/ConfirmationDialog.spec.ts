import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import ConfirmationDialog from '@/components/ConfirmationDialog.vue'

const vuetify = createVuetify({ components, directives })
global.ResizeObserver = require('resize-observer-polyfill')

describe('ConfirmationDialog component', () => {
  it('is not rendered when not active', () => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify]
      },
      props: {
        dialogActive: false,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?',
        noTeleport: true
      }
    })

    expect(wrapper.html()).toBeFalsy()
  })

  it('is rendered when active', () => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify]
      },
      props: {
        dialogActive: true,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?',
        noTeleport: true
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
    expect(buttons.map((button) => button.find('.v-btn__content').text())).toEqual(['No', 'Yes'])
    expect(
      buttons.map((button) =>
        button
          .find('.v-icon')
          .classes()
          .find((cls) => cls.startsWith('mdi-'))
      )
    ).toEqual(['mdi-close-circle', 'mdi-check-circle'])
  })

  it.each(['click', 'keyup.enter'])('emits the correct event when confirmed', async (trigger) => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify]
      },
      props: {
        dialogActive: true,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?',
        noTeleport: true
      }
    })

    await wrapper.find('.v-card-actions > .v-btn:last-child').trigger(trigger)

    expect(wrapper.emitted('dialog-complete')).toEqual([[true]])
  })

  it.each(['click', 'keyup.esc'])('emits the correct event when aborted', async (trigger) => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify]
      },
      props: {
        dialogActive: true,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?',
        noTeleport: true
      }
    })

    await wrapper.find('.v-card-actions > .v-btn:first-child').trigger(trigger)

    expect(wrapper.emitted('dialog-complete')).toEqual([[false]])
  })

  it('indicates loading when confirmed until dialog is closed', async () => {
    const wrapper = mount(ConfirmationDialog, {
      global: {
        plugins: [vuetify]
      },
      props: {
        dialogActive: true,
        title: 'Foo',
        icon: 'mdi-alert',
        question: 'Are you sure?',
        noTeleport: true
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
          plugins: [vuetify]
        },
        props: {
          dialogActive: true,
          title: 'Foo',
          icon: 'mdi-alert',
          question: 'Are you sure?',
          noTeleport: noTeleport
        }
      })

      expect(wrapper.html()).contains('teleport')
    }
  )
})
