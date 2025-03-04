import ResizeObserver from 'resize-observer-polyfill'
import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import GenerateApiKeyDialog from '../GenerateApiKeyDialog.vue'
import { FakeClipboard } from '@/utils/testing/fake-clipboard'

describe('GenerateApiKeyDialog component', () => {
  const vuetify = createVuetify({ components, directives })
  global.ResizeObserver = ResizeObserver

  it('is not rendered when not active', async () => {
    const wrapper = mount(GenerateApiKeyDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true,
          $clipboard: {},
          $getApiKeyRepo: () => {}
        }
      },
      props: {
        dialogActive: false
      }
    })

    await flushPromises()
    expect(wrapper.html()).toBeFalsy()
  })

  it('is rendered when active', async () => {
    const wrapper = mount(GenerateApiKeyDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true,
          $clipboard: {},
          $getApiKeyRepo: () => {}
        }
      },
      props: {
        dialogActive: true
      }
    })

    await flushPromises()
    expect(wrapper.html()).toBeTruthy()

    // Check the title and icon.
    const title = wrapper.find('.v-card-title')
    expect(title.text()).toBe('Generate New API Key')
    expect(title.attributes('prepend-icon')).toBe('mdi-key-variant')

    // Check the question.
    const textField = wrapper.find('.v-text-field')
    expect(textField.find('.v-label').text()).toBe('Name')
    expect(textField.find('.v-messages').text()).toBe('A name to help you identify this key')

    // Check the buttons.
    const buttons = wrapper.findAll('.v-card-actions > .v-btn')
    expect(buttons).toHaveLength(2)
    const buttonDetails = buttons.map((button) => {
      return {
        text: button.text(),
        icon: button
          .find('.v-icon')
          .classes()
          .find((cls) => cls.startsWith('mdi-'))
      }
    })
    expect(buttonDetails).toEqual([
      { text: 'Cancel', icon: 'mdi-close-circle' },
      { text: 'Generate Key', icon: 'mdi-check-circle' }
    ])
  })

  it.each([
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-card-actions').findAll('.v-btn')[0].trigger('click')
    },
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-dialog').trigger('keyup.esc')
    }
  ])('Aborts the generation when the dialog is aborted', async (action) => {
    const mockGenerateKey = vi.fn().mockResolvedValue('new-key')
    const mockGetRepo = vi.fn().mockReturnValue({
      generateKey: mockGenerateKey
    })

    const wrapper = mount(GenerateApiKeyDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true,
          $clipboard: {},
          $getApiKeyRepo: mockGetRepo
        }
      },
      props: {
        dialogActive: true
      }
    })
    await flushPromises()

    // Set a name for the key.
    await wrapper.find('.v-text-field').find('input').setValue('Test Key')

    await action(wrapper)
    await flushPromises()
    expect(wrapper.emitted('dialog-aborted')).toBeTruthy()

    expect(mockGenerateKey).not.toHaveBeenCalled()

    // Close the dialog then reopen it. The name we set should have now dissappeared.
    await wrapper.setProps({ dialogActive: false })
    await wrapper.setProps({ dialogActive: true })
    await flushPromises()
    expect(wrapper.find('.v-text-field').find('input').text()).toBe('')
  })

  it.each([
    async (wrapper: VueWrapper) => {
      // Click the last button (this will either be the generate key button or the done button).
      const buttons = wrapper.find('.v-card-actions').findAll('.v-btn')
      await buttons[buttons.length - 1].trigger('click')
    },
    async (wrapper: VueWrapper) => {
      await wrapper.find('.v-dialog').trigger('keyup.enter')
    }
  ])(
    'Generates a new API key when the generate button is clicked or enter key pressed',
    async (action) => {
      const mockGenerateKey = vi.fn().mockResolvedValue('new-key')
      const mockGetRepo = vi.fn().mockReturnValue({
        generateKey: mockGenerateKey
      })

      const clipboard = new FakeClipboard()

      const wrapper = mount(GenerateApiKeyDialog, {
        global: {
          plugins: [vuetify],
          provide: {
            noTeleport: true,
            $clipboard: clipboard,
            $getApiKeyRepo: mockGetRepo
          }
        },
        props: {
          dialogActive: true
        }
      })
      await flushPromises()

      // Set a name for the key.
      await wrapper.find('.v-text-field').find('input').setValue('Test Key')

      await action(wrapper)
      await flushPromises()

      expect(mockGenerateKey).toHaveBeenCalledOnce()
      expect(mockGenerateKey).toHaveBeenCalledWith('Test Key')

      // The dialog should now show the generated key.
      const chips = wrapper.find('.v-card-text').findAll('.v-chip')
      expect(chips).toHaveLength(2)
      expect(chips[0].text()).toBe(
        "Please copy this token to a safe place — it won't be shown again!"
      )
      expect(chips[1].text()).toBe('new-key')

      // The key should be copied to the clipboard.
      await chips[1].trigger('click')
      expect(await clipboard.readText()).toBe('new-key')

      // Hitting escape should not close the dialog.
      await wrapper.find('.v-dialog').trigger('keyup.escape')
      await flushPromises()
      expect(wrapper.emitted('dialog-aborted')).toBeFalsy()

      // Hitting enter or clicking done should emit the dialog-complete event.
      await action(wrapper)
      await flushPromises()
      expect(wrapper.emitted('dialog-aborted')).toBeFalsy()
      expect(wrapper.emitted('dialog-complete')).toBeTruthy()
    }
  )

  it('Displays API errors when generating new keys', async () => {
    const mockGenerateKey = vi.fn().mockRejectedValue(new Error('test-error'))
    const mockGetRepo = vi.fn().mockReturnValue({
      generateKey: mockGenerateKey
    })

    const wrapper = mount(GenerateApiKeyDialog, {
      global: {
        plugins: [vuetify],
        provide: {
          noTeleport: true,
          $clipboard: {},
          $getApiKeyRepo: mockGetRepo
        }
      },
      props: {
        dialogActive: true
      }
    })
    await flushPromises()

    // Set a name for the key.
    await wrapper.find('.v-text-field').find('input').setValue('Test Key')

    await wrapper.find('.v-card-actions').findAll('.v-btn')[1].trigger('click')
    await flushPromises()

    expect(mockGenerateKey).toHaveBeenCalledOnce()
    expect(mockGenerateKey).toHaveBeenCalledWith('Test Key')

    // The dialog should now show the error.
    expect(wrapper.find('.v-alert').find('.api-alert-content').text()).toBe(
      'Error generating key: test-error'
    )
  })
})
